const STORAGE_KEY = 'quillstorm_save';

interface SaveData {
  highScore: number;
  highestWave: number;
  totalRuns: number;
}

const defaultSave: SaveData = {
  highScore: 0,
  highestWave: 0,
  totalRuns: 0,
};

export class SaveManager {
  private static data: SaveData = { ...defaultSave };

  static load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.data = { ...defaultSave, ...JSON.parse(saved) };
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
