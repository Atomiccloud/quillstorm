const STORAGE_KEY = 'quillstorm_save';

interface SaveData {
  highScore: number;
  highestWave: number;
  totalRuns: number;
  playerName: string;
  effectsOpacity: number;
  combatTextOpacity: number;
  particleOpacity: number;
  elementalOpacity: number;
  statusOverlayOpacity: number;
}

const defaultSave: SaveData = {
  highScore: 0,
  highestWave: 0,
  totalRuns: 0,
  playerName: '',
  effectsOpacity: 1.0,
  combatTextOpacity: 1.0,
  particleOpacity: 1.0,
  elementalOpacity: 1.0,
  statusOverlayOpacity: 1.0,
};

export class SaveManager {
  private static data: SaveData = { ...defaultSave };

  static load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...defaultSave, ...parsed };

        // Migration: copy old single effectsOpacity to all 4 new fields
        if (parsed.effectsOpacity !== undefined && parsed.combatTextOpacity === undefined) {
          this.data.combatTextOpacity = parsed.effectsOpacity;
          this.data.particleOpacity = parsed.effectsOpacity;
          this.data.elementalOpacity = parsed.effectsOpacity;
          this.data.statusOverlayOpacity = parsed.effectsOpacity;
          this.save();
        }
      }
    } catch {
      this.data = { ...defaultSave };
    }
  }

  static save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage not available
    }
  }

  static getHighScore(): number {
    return this.data.highScore;
  }

  static getHighestWave(): number {
    return this.data.highestWave;
  }

  static getTotalRuns(): number {
    return this.data.totalRuns;
  }

  static getPlayerName(): string {
    return this.data.playerName;
  }

  static setPlayerName(name: string): void {
    this.data.playerName = name.trim();
    this.save();
  }

  static hasPlayerName(): boolean {
    return this.data.playerName.length >= 3;
  }

  static getEffectsOpacity(): number {
    return this.data.effectsOpacity;
  }

  static setEffectsOpacity(value: number): void {
    this.data.effectsOpacity = Math.max(0, Math.min(1, value));
    this.save();
  }

  static getCombatTextOpacity(): number {
    return this.data.combatTextOpacity;
  }

  static setCombatTextOpacity(value: number): void {
    this.data.combatTextOpacity = Math.max(0, Math.min(1, value));
    this.save();
  }

  static getParticleOpacity(): number {
    return this.data.particleOpacity;
  }

  static setParticleOpacity(value: number): void {
    this.data.particleOpacity = Math.max(0, Math.min(1, value));
    this.save();
  }

  static getElementalOpacity(): number {
    return this.data.elementalOpacity;
  }

  static setElementalOpacity(value: number): void {
    this.data.elementalOpacity = Math.max(0, Math.min(1, value));
    this.save();
  }

  static getStatusOverlayOpacity(): number {
    return this.data.statusOverlayOpacity;
  }

  static setStatusOverlayOpacity(value: number): void {
    this.data.statusOverlayOpacity = Math.max(0, Math.min(1, value));
    this.save();
  }

  static submitRun(score: number, wave: number): boolean {
    this.data.totalRuns++;

    let newHighScore = false;
    if (score > this.data.highScore) {
      this.data.highScore = score;
      newHighScore = true;
    }

    if (wave > this.data.highestWave) {
      this.data.highestWave = wave;
    }

    this.save();
    return newHighScore;
  }

  static reset(): void {
    this.data = { ...defaultSave };
    this.save();
  }
}

// Load on import
SaveManager.load();
