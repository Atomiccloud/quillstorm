// Client-side leaderboard manager
// Handles API calls, offline queueing, and checksum generation

const SALT = 'quillstorm-default-salt-change-in-prod';

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
    wave: number
  ): Promise<SubmissionResult> {
    // Generate checksum async
    const checksum = await this.sha256(`${score}:${wave}:${SALT}`).then(h => h.slice(0, 16));

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
          checksum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
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
      const response = await fetch(
        `${this.API_BASE}/global?limit=${limit}&offset=${offset}`
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
      const response = await fetch(
        `${this.API_BASE}/weekly?limit=${limit}&offset=${offset}`
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
