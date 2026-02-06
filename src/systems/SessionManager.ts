import { UpgradeManager } from './UpgradeManager';

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
  private static _ab = '/api/session';
  private static currentToken: string | null = null;
  private static fingerprint: string = getBrowserFingerprint();
  private static _wk: KillCounts = {};
  private static _ek: KillCounts = {};
  private static _dg: number = 0;
  private static _wpm = { d: 0, t: 0, b: 0 };
  private static _sm = { m: 0, c: 0, p: 0 };
  private static _ds = { a: 0, e: 0 };
  private static _um: Record<string, number> | null = null;
  private static _qf: number = 0;
  private static _wst: number = 0;
  private static _cw: number = 0;

  static async startSession(): Promise<boolean> {
    this._rst();
    this._qf = 0;
    this._wst = Date.now();
    this._cw = 0;
    this._um = null;

    try {
      const response = await fetch(`${this._ab}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: this.fingerprint }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.token) {
        this.currentToken = data.token;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  static _sp(data: { d: number; t: number; b: number }): void {
    this._wpm = { ...data };
  }

  static _dl(level: number): void {
    this._dg = level;
  }

  static _ss(a: number, b: number, c: number): void {
    this._sm = { m: a, c: b, p: c };
  }

  static _dd(a: number, b: number): void {
    this._ds = { a: Math.round(a * 100), e: Math.round(b * 100) };
  }

  static _ms(um: UpgradeManager): void {
    this._um = {
      d: Math.round(um.getRawModifier('damage') * 1000),
      fr: Math.round(um.getRawModifier('fireRate') * 1000),
      rr: Math.round(um.getRawModifier('regenRate') * 1000),
      ps: Math.round(um.getRawModifier('projectileSpeed') * 1000),
      pc: Math.round(um.getRawModifier('projectileCount') * 1000),
      mh: Math.round(um.getRawModifier('maxHealth') * 1000),
      mq: Math.round(um.getRawModifier('maxQuills') * 1000),
      pr: Math.round(um.getRawModifier('prosperity') * 1000),
      dl: Math.round(um.getRawModifier('dangerLevel') * 1000),
      cc: Math.round(um.getRawModifier('critChance') * 1000),
      ar: Math.round(um.getRawModifier('armor') * 1000),
      ev: Math.round(um.getRawModifier('evasion') * 1000),
      vs: Math.round(um.getRawModifier('vampirismStrength') * 1000),
      sc: Math.round(um.getRawModifier('shieldCharges') * 1000),
      pi: Math.round(um.getRawModifier('piercing') * 1000),
      bo: Math.round(um.getRawModifier('bouncing') * 1000),
    };
  }

  static _rf(): void {
    this._qf++;
  }

  static _mw(): void {
    this._wst = Date.now();
  }

  static _sw(w: number): void {
    this._cw = w;
  }

  static async _rp(id: string, s: string): Promise<void> {
    if (!this.currentToken) return;

    try {
      await fetch(`${this._ab}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.currentToken,
          upgradeId: id,
          source: s,
          wave: this._cw,
        }),
      });
    } catch {
      // silent
    }
  }

  static _rk(t: string, e: boolean = false): void {
    const key = t as keyof KillCounts;
    if (e) {
      this._ek[key] = (this._ek[key] || 0) + 1;
    } else {
      this._wk[key] = (this._wk[key] || 0) + 1;
    }
  }

  static async _rw(wave: number, score: number): Promise<boolean> {
    if (!this.currentToken) return false;

    const wt = this._wst > 0 ? Date.now() - this._wst : undefined;

    try {
      const response = await fetch(`${this._ab}/wave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.currentToken,
          wave,
          kills: { ...this._wk },
          eliteKills: { ...this._ek },
          dangerLevel: this._dg,
          score,
          pm: { ...this._wpm },
          sm: { ...this._sm },
          ds: { ...this._ds },
          ...(this._um ? { um: { ...this._um } } : {}),
          qf: this._qf,
          ...(wt !== undefined ? { wt } : {}),
        }),
      });

      this._rst();

      if (!response.ok) return false;

      return true;
    } catch {
      this._rst();
      return false;
    }
  }

  static async _rg(finalWave: number, finalScore: number): Promise<boolean> {
    if (!this.currentToken) return false;

    const wt = this._wst > 0 ? Date.now() - this._wst : undefined;

    try {
      const response = await fetch(`${this._ab}/gameover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.currentToken,
          finalWave,
          finalScore,
          kills: { ...this._wk },
          eliteKills: { ...this._ek },
          dangerLevel: this._dg,
          pm: { ...this._wpm },
          sm: { ...this._sm },
          ds: { ...this._ds },
          ...(this._um ? { um: { ...this._um } } : {}),
          qf: this._qf,
          ...(wt !== undefined ? { wt } : {}),
        }),
      });

      if (!response.ok) return false;

      return true;
    } catch {
      return false;
    }
  }

  static getToken(): string | null {
    return this.currentToken;
  }

  static getFingerprint(): string {
    return this.fingerprint;
  }

  static clearSession(): void {
    this.currentToken = null;
    this._rst();
    this._sm = { m: 0, c: 0, p: 0 };
    this._ds = { a: 0, e: 0 };
    this._um = null;
    this._cw = 0;
  }

  private static _rst(): void {
    this._wk = {};
    this._ek = {};
    this._wpm = { d: 0, t: 0, b: 0 };
    this._qf = 0;
    this._um = null;
  }

  static hasActiveSession(): boolean {
    return this.currentToken !== null;
  }
}
