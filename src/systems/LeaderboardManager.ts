const _k0 = import.meta.env.VITE_CHECKSUM_SALT || '';

let _cf: string | null = null;

function _gp(): string {
  try {
    let v = localStorage.getItem('quillstorm_fp_id');
    if (!v) {
      v = crypto.randomUUID?.() || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem('quillstorm_fp_id', v);
    }
    return v;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

function _gf(): string {
  if (_cf) return _cf;

  const p = _gp();

  try {
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    if (!x) {
      _cf = p;
      return _cf;
    }

    c.width = 200;
    c.height = 50;

    x.textBaseline = 'top';
    x.font = '14px Arial';
    x.fillStyle = '#f60';
    x.fillRect(125, 1, 62, 20);
    x.fillStyle = '#069';
    x.fillText('Quillstorm', 2, 15);
    x.fillStyle = 'rgba(102, 204, 0, 0.7)';
    x.fillText('Quillstorm', 4, 17);

    const d = c.toDataURL();
    let h = 0;
    for (let i = 0; i < d.length; i++) {
      const ch = d.charCodeAt(i);
      h = ((h << 5) - h) + ch;
      h = h & h;
    }
    _cf = Math.abs(h).toString(36) + '-' + p;
    return _cf;
  } catch {
    _cf = p;
    return _cf;
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

const _sk = 'quillstorm_pending_submissions';

export class LeaderboardManager {
  private static _ab = '/api/leaderboard';

  private static async _h(m: string): Promise<string> {
    const b = new TextEncoder().encode(m);
    const r = await crypto.subtle.digest('SHA-256', b);
    const a = Array.from(new Uint8Array(r));
    return a.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  static async submitScore(
    playerName: string,
    score: number,
    wave: number,
    sessionToken?: string | null
  ): Promise<SubmissionResult> {
    const ts = Date.now();
    const fp = _gf();

    const ck = await this._h(`${score}:${wave}:${ts}:${fp}:${_k0}`).then(v => v.slice(0, 16));

    try {
      const response = await fetch(`${this._ab}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          score,
          wave,
          timestamp: ts,
          fingerprint: fp,
          checksum: ck,
          sessionToken: sessionToken || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'API unavailable';
        try {
          const error = await response.json();
          errorMessage = error.error || 'Submission failed';
        } catch {
          // noop
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Leaderboard submission failed:', error);

      this._qs({ playerName, score, wave, timestamp: Date.now() });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error - score saved locally',
      };
    }
  }

  static async getGlobalLeaderboard(limit = 100, offset = 0): Promise<GlobalLeaderboardResponse> {
    try {
      const fp = _gf();
      const response = await fetch(
        `${this._ab}/global?limit=${limit}&offset=${offset}&fp=${encodeURIComponent(fp)}`
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

  static async getWeeklyLeaderboard(limit = 100, offset = 0): Promise<WeeklyLeaderboardResponse> {
    try {
      const fp = _gf();
      const response = await fetch(
        `${this._ab}/weekly?limit=${limit}&offset=${offset}&fp=${encodeURIComponent(fp)}`
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

  private static _qs(submission: PendingSubmission): void {
    const pending = this.getPendingSubmissions();
    pending.push(submission);

    while (pending.length > 10) {
      pending.shift();
    }

    localStorage.setItem(_sk, JSON.stringify(pending));
  }

  static getPendingSubmissions(): PendingSubmission[] {
    try {
      const data = localStorage.getItem(_sk);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static hasPendingSubmissions(): boolean {
    return this.getPendingSubmissions().length > 0;
  }

  static async retryPendingSubmissions(): Promise<void> {
    const pending = this.getPendingSubmissions();
    if (pending.length === 0) return;

    const remaining: PendingSubmission[] = [];
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const submission of pending) {
      if (submission.timestamp < cutoff) continue;

      const result = await this.submitScore(
        submission.playerName,
        submission.score,
        submission.wave
      );

      if (!result.success) {
        remaining.push(submission);
      }
    }

    localStorage.setItem(_sk, JSON.stringify(remaining));
  }

  static clearPendingSubmissions(): void {
    localStorage.removeItem(_sk);
  }

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
