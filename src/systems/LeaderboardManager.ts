// Client-side leaderboard manager
// Handles API calls, offline queueing, and checksum generation

// Salt is injected at build time via Vite env variables
const SALT = import.meta.env.VITE_CHECKSUM_SALT || '';

// Cached fingerprint for consistent usage across requests
let cachedFingerprint: string | null = null;

// Generate a simple browser fingerprint (canvas-based)
// This makes curl requests harder as they'd need to fake this value
function getBrowserFingerprint(): string {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    canvas.width = 200;
    canvas.height = 50;

    // Draw some text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Quillstorm', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Quillstorm', 4, 17);

    // Get a hash of the canvas data
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    cachedFingerprint = Math.abs(hash).toString(36);
    return cachedFingerprint;
  } catch {
    cachedFingerprint = 'error';
    return cachedFingerprint;
  }
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
}

export interface SubmissionResult {
  success: boolean;
  globalRank?: number | null;
  weeklyRank?: number | null;
  error?: string;
}

export interface GlobalLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export interface WeeklyLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  weekStart: string;
  weekEnd: string;
  resetsIn: number;
}

interface PendingSubmission {
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
}

const STORAGE_KEY = 'quillstorm_pending_submissions';

export class LeaderboardManager {
  private static API_BASE = '/api/leaderboard';

  // SHA256 implementation for browser using Web Crypto API
  private static async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Submit score to leaderboard
  static async submitScore(
    playerName: string,
    score: number,
    wave: number,
    sessionToken?: string | null
  ): Promise<SubmissionResult> {
    // Generate timestamp and fingerprint for anti-cheat
    const timestamp = Date.now();
    const fingerprint = getBrowserFingerprint();

    // Generate checksum with timestamp and fingerprint (3 second validity window)
    const checksum = await this.sha256(`${score}:${wave}:${timestamp}:${fingerprint}:${SALT}`).then(h => h.slice(0, 16));

    try {
      const response = await fetch(`${this.API_BASE}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          score,
          wave,
          timestamp,
          fingerprint,
          checksum,
          sessionToken: sessionToken || undefined,
        }),
      });

      if (!response.ok) {
        // Handle non-JSON error responses (like 404 from missing API routes)
        let errorMessage = 'API unavailable';
        try {
          const error = await response.json();
          errorMessage = error.error || 'Submission failed';
        } catch {
          // Response wasn't JSON
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Leaderboard submission failed:', error);

      // Queue for later submission
      this.queueSubmission({ playerName, score, wave, timestamp: Date.now() });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error - score saved locally',
      };
    }
  }

  // Fetch global leaderboard
  static async getGlobalLeaderboard(limit = 100, offset = 0): Promise<GlobalLeaderboardResponse> {
    try {
      const fp = getBrowserFingerprint();
      const response = await fetch(
        `${this.API_BASE}/global?limit=${limit}&offset=${offset}&fp=${encodeURIComponent(fp)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch global leaderboard:', error);
      return { entries: [], total: 0 };
    }
  }

  // Fetch weekly leaderboard
  static async getWeeklyLeaderboard(limit = 100, offset = 0): Promise<WeeklyLeaderboardResponse> {
    try {
      const fp = getBrowserFingerprint();
      const response = await fetch(
        `${this.API_BASE}/weekly?limit=${limit}&offset=${offset}&fp=${encodeURIComponent(fp)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weekly leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch weekly leaderboard:', error);
      return {
        entries: [],
        total: 0,
        weekStart: '',
        weekEnd: '',
        resetsIn: 0,
      };
    }
  }

  // Queue submission for later retry
  private static queueSubmission(submission: PendingSubmission): void {
    const pending = this.getPendingSubmissions();
    pending.push(submission);

    // Keep only last 10 pending submissions
    while (pending.length > 10) {
      pending.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  }

  // Get pending submissions
  static getPendingSubmissions(): PendingSubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Check if there are pending submissions
  static hasPendingSubmissions(): boolean {
    return this.getPendingSubmissions().length > 0;
  }

  // Retry all pending submissions
  static async retryPendingSubmissions(): Promise<void> {
    const pending = this.getPendingSubmissions();
    if (pending.length === 0) return;

    const remaining: PendingSubmission[] = [];
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const submission of pending) {
      // Skip submissions older than a week
      if (submission.timestamp < oneWeekAgo) continue;

      const result = await this.submitScore(
        submission.playerName,
        submission.score,
        submission.wave
      );

      if (!result.success) {
        // Keep for next retry (but don't re-queue, it's already there)
        remaining.push(submission);
      }
    }

    // Update storage with remaining submissions
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  }

  // Clear pending submissions (for testing)
  static clearPendingSubmissions(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Format time remaining for weekly reset
  static formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'Resetting...';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

    return parts.join(' ');
  }
}
