// Client-side session manager for anti-cheat tracking
// Tracks game progress and sends updates to server

// Kill counts by enemy type - must match server expectations
export interface KillCounts {
  scurrier?: number;
  spitter?: number;
  swooper?: number;
  splitter?: number;
  burrower?: number;
  shellback?: number;
  healer?: number;
  splitling?: number;
  boss?: number;
  flyingBoss?: number;
}

// Get or create a persistent unique ID per browser profile
function getPersistentId(): string {
  try {
    let pid = localStorage.getItem('quillstorm_fp_id');
    if (!pid) {
      pid = crypto.randomUUID?.() || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem('quillstorm_fp_id', pid);
    }
    return pid;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

// Generate browser fingerprint combining canvas hash + persistent ID (same as LeaderboardManager)
function getBrowserFingerprint(): string {
  const pid = getPersistentId();

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return pid;

    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Quillstorm', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Quillstorm', 4, 17);

    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36) + '-' + pid;
  } catch {
    return pid;
  }
}

export class SessionManager {
  private static API_BASE = '/api/session';
  private static currentToken: string | null = null;
  private static fingerprint: string = getBrowserFingerprint();
  private static waveKills: KillCounts = {};
  private static _wpm = { d: 0, t: 0, b: 0 };

  // Start a new game session
  static async startSession(): Promise<boolean> {
    this.resetKills();

    try {
      const response = await fetch(`${this.API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: this.fingerprint }),
      });

      if (!response.ok) {
        console.error('Failed to start session');
        return false;
      }

      const data = await response.json();
      if (data.success && data.token) {
        this.currentToken = data.token;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session start error:', error);
      // Don't block gameplay if session fails
      return false;
    }
  }

  static setPerf(data: { d: number; t: number; b: number }): void {
    this._wpm = { ...data };
  }

  // Record an enemy kill (accumulates until wave ends)
  static recordKill(enemyType: string): void {
    const key = enemyType as keyof KillCounts;
    this.waveKills[key] = (this.waveKills[key] || 0) + 1;
  }

  // Report wave completion to server
  static async reportWaveComplete(wave: number, score: number): Promise<boolean> {
    if (!this.currentToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE}/wave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.currentToken,
          wave,
          kills: { ...this.waveKills },
          score,
          pm: { ...this._wpm },
        }),
      });

      // Reset kills for next wave regardless of response
      this.resetKills();

      if (!response.ok) {
        const data = await response.json();
        console.error('Wave report failed:', data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Wave report error:', error);
      this.resetKills();
      return false;
    }
  }

  // Report game over to server (includes any unreported kills from current wave)
  static async reportGameOver(finalWave: number, finalScore: number): Promise<boolean> {
    if (!this.currentToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE}/gameover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.currentToken,
          finalWave,
          finalScore,
          kills: { ...this.waveKills },
          pm: { ...this._wpm },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Game over report failed:', data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Game over report error:', error);
      return false;
    }
  }

  // Get current session token (for score submission)
  static getToken(): string | null {
    return this.currentToken;
  }

  // Get fingerprint (for score submission)
  static getFingerprint(): string {
    return this.fingerprint;
  }

  // Clear session (on game restart or menu)
  static clearSession(): void {
    this.currentToken = null;
    this.resetKills();
  }

  // Reset kill counts for new wave
  private static resetKills(): void {
    this.waveKills = {};
    this._wpm = { d: 0, t: 0, b: 0 };
  }

  // Check if session is active
  static hasActiveSession(): boolean {
    return this.currentToken !== null;
  }
}
