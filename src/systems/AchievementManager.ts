import {
  Achievement,
  AchievementCheck,
  CumulativeStat,
  RunNumericStat,
  RunBoolStat,
  achievements,
} from '../data/achievements';
import { getCosmeticManager } from './CosmeticManager';

const STORAGE_KEY = 'quillstorm_achievements';

export interface CumulativeStats {
  totalKills: number;
  totalBossKills: number;
  totalEliteKills: number;
  totalRuns: number;
  totalWavesSurvived: number;
  totalPerfectWaves: number;
}

export interface RunStats {
  score: number;
  wave: number;
  kills: number;
  bossKills: number;
  eliteKills: number;
  upgradeCount: number;
  perfectWavesThisRun: number;
  infiniteSwarmSurvivalSeconds: number;
  maxElementalStrength: number;
  reachedInfiniteSwarm: boolean;
  reachedFrenzy: boolean;
  hadPerfectWave: boolean;
  noArmorUpgrades: boolean;
}

interface AchievementState {
  earned: string[];
  cumulative: CumulativeStats;
}

const defaultCumulative: CumulativeStats = {
  totalKills: 0,
  totalBossKills: 0,
  totalEliteKills: 0,
  totalRuns: 0,
  totalWavesSurvived: 0,
  totalPerfectWaves: 0,
};

function defaultRunStats(): RunStats {
  return {
    score: 0,
    wave: 0,
    kills: 0,
    bossKills: 0,
    eliteKills: 0,
    upgradeCount: 0,
    perfectWavesThisRun: 0,
    infiniteSwarmSurvivalSeconds: 0,
    maxElementalStrength: 0,
    reachedInfiniteSwarm: false,
    reachedFrenzy: false,
    hadPerfectWave: false,
    noArmorUpgrades: true,
  };
}

export class AchievementManager {
  private static state: AchievementState = {
    earned: [],
    cumulative: { ...defaultCumulative },
  };
  private static run: RunStats = defaultRunStats();
  private static infiniteSwarmStartTime: number = 0;

  static load(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        AchievementManager.state = {
          earned: parsed.earned || [],
          cumulative: { ...defaultCumulative, ...parsed.cumulative },
        };
      }
    } catch {
      AchievementManager.state = {
        earned: [],
        cumulative: { ...defaultCumulative },
      };
    }
  }

  private static save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(AchievementManager.state));
    } catch {
      // Storage not available
    }
  }

  // === Run lifecycle ===

  static startRun(): void {
    AchievementManager.run = defaultRunStats();
    AchievementManager.infiniteSwarmStartTime = 0;
  }

  static recordKill(isBoss: boolean, isElite: boolean): void {
    AchievementManager.run.kills++;
    if (isBoss) AchievementManager.run.bossKills++;
    if (isElite) AchievementManager.run.eliteKills++;
  }

  /** Set final upgrade stats from UpgradeManager data at game over. */
  static setFinalUpgradeStats(totalCount: number, hasArmorUpgrade: boolean): void {
    AchievementManager.run.upgradeCount = totalCount;
    if (hasArmorUpgrade) {
      AchievementManager.run.noArmorUpgrades = false;
    }
  }

  static onInfiniteSwarmStart(): void {
    AchievementManager.run.reachedInfiniteSwarm = true;
    AchievementManager.infiniteSwarmStartTime = Date.now();
  }

  static onFrenzyReached(): void {
    AchievementManager.run.reachedFrenzy = true;
  }

  static setMaxElementalStrength(strength: number): void {
    if (strength > AchievementManager.run.maxElementalStrength) {
      AchievementManager.run.maxElementalStrength = strength;
    }
  }

  /** Called after each wave completes. Returns newly earned wave-timing achievements. */
  static onWaveComplete(waveDamageTaken: number, waveNumber: number): Achievement[] {
    AchievementManager.run.wave = waveNumber;

    if (waveDamageTaken === 0) {
      AchievementManager.run.perfectWavesThisRun++;
      AchievementManager.run.hadPerfectWave = true;
    }

    return AchievementManager.checkAchievements('wave');
  }

  /** Called at game over. Updates cumulative stats and returns newly earned achievements. */
  static onGameOver(score: number, wave: number): Achievement[] {
    AchievementManager.run.score = score;
    AchievementManager.run.wave = wave;

    // Calculate infinite swarm survival
    if (AchievementManager.infiniteSwarmStartTime > 0) {
      AchievementManager.run.infiniteSwarmSurvivalSeconds =
        (Date.now() - AchievementManager.infiniteSwarmStartTime) / 1000;
    }

    // Update cumulative stats
    const c = AchievementManager.state.cumulative;
    c.totalKills += AchievementManager.run.kills;
    c.totalBossKills += AchievementManager.run.bossKills;
    c.totalEliteKills += AchievementManager.run.eliteKills;
    c.totalRuns++;
    c.totalWavesSurvived += wave;
    c.totalPerfectWaves += AchievementManager.run.perfectWavesThisRun;

    const newlyEarned = AchievementManager.checkAchievements('run');

    AchievementManager.save();
    return newlyEarned;
  }

  // === Achievement checking ===

  private static checkAchievements(timing: 'wave' | 'run'): Achievement[] {
    const newlyEarned: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.timing !== timing) continue;
      if (AchievementManager.state.earned.includes(achievement.id)) continue;

      if (AchievementManager.evaluateCheck(achievement.check)) {
        AchievementManager.state.earned.push(achievement.id);
        newlyEarned.push(achievement);

        // Award cosmetic rewards
        if (achievement.cosmeticReward) {
          getCosmeticManager().unlockByAchievement(achievement.id);
        }
      }
    }

    if (newlyEarned.length > 0) {
      AchievementManager.save();
    }

    return newlyEarned;
  }

  private static evaluateCheck(check: AchievementCheck): boolean {
    switch (check.type) {
      case 'cumulative_gte':
        return AchievementManager.getCumulativeValue(check.stat) >= check.value;
      case 'run_gte':
        return AchievementManager.getRunNumericValue(check.stat) >= check.value;
      case 'run_lte':
        return AchievementManager.getRunNumericValue(check.stat) <= check.value;
      case 'run_flag':
        return AchievementManager.getRunBoolValue(check.stat);
      case 'compound':
        return check.checks.every(c => AchievementManager.evaluateCheck(c));
    }
  }

  private static getCumulativeValue(stat: CumulativeStat): number {
    return AchievementManager.state.cumulative[stat];
  }

  private static getRunNumericValue(stat: RunNumericStat): number {
    return AchievementManager.run[stat] as number;
  }

  private static getRunBoolValue(stat: RunBoolStat): boolean {
    return AchievementManager.run[stat] as boolean;
  }

  // === Query API ===

  static isEarned(achievementId: string): boolean {
    return AchievementManager.state.earned.includes(achievementId);
  }

  static getEarnedIds(): string[] {
    return [...AchievementManager.state.earned];
  }

  static getEarnedCount(): number {
    return AchievementManager.state.earned.length;
  }

  static getTotalCount(): number {
    return achievements.length;
  }

  static getCumulativeStats(): CumulativeStats {
    return { ...AchievementManager.state.cumulative };
  }

  static getRunStats(): RunStats {
    return { ...AchievementManager.run };
  }

  /** Returns cumulative stats suitable for server sync (max-merge compatible). */
  static getStatsForSync(): {
    totalKills: number;
    totalBossKills: number;
    totalEliteKills: number;
    totalRuns: number;
    totalWavesSurvived: number;
    totalPerfectWaves: number;
    earnedAchievements: string[];
  } {
    return {
      ...AchievementManager.state.cumulative,
      earnedAchievements: [...AchievementManager.state.earned],
    };
  }

  /** Merge server data into local state (union for earned, max for stats). */
  static mergeServerData(serverData: {
    totalKills?: number;
    totalBossKills?: number;
    totalEliteKills?: number;
    totalRuns?: number;
    totalWavesSurvived?: number;
    totalPerfectWaves?: number;
    earnedAchievements?: string[];
  }): void {
    const c = AchievementManager.state.cumulative;
    if (serverData.totalKills !== undefined) c.totalKills = Math.max(c.totalKills, serverData.totalKills);
    if (serverData.totalBossKills !== undefined) c.totalBossKills = Math.max(c.totalBossKills, serverData.totalBossKills);
    if (serverData.totalEliteKills !== undefined) c.totalEliteKills = Math.max(c.totalEliteKills, serverData.totalEliteKills);
    if (serverData.totalRuns !== undefined) c.totalRuns = Math.max(c.totalRuns, serverData.totalRuns);
    if (serverData.totalWavesSurvived !== undefined) c.totalWavesSurvived = Math.max(c.totalWavesSurvived, serverData.totalWavesSurvived);
    if (serverData.totalPerfectWaves !== undefined) c.totalPerfectWaves = Math.max(c.totalPerfectWaves, serverData.totalPerfectWaves);

    // Union earned achievements
    if (serverData.earnedAchievements) {
      const merged = new Set([...AchievementManager.state.earned, ...serverData.earnedAchievements]);
      AchievementManager.state.earned = Array.from(merged);
    }

    AchievementManager.save();
  }

  static reset(): void {
    AchievementManager.state = {
      earned: [],
      cumulative: { ...defaultCumulative },
    };
    AchievementManager.run = defaultRunStats();
    AchievementManager.save();
  }
}

// Load on import
AchievementManager.load();
