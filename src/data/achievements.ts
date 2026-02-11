// Achievement definitions for meta-progression system

export type AchievementCategory = 'combat' | 'survival' | 'score' | 'style';

export type CumulativeStat =
  | 'totalKills'
  | 'totalBossKills'
  | 'totalEliteKills'
  | 'totalRuns'
  | 'totalWavesSurvived'
  | 'totalPerfectWaves';

export type RunNumericStat =
  | 'score'
  | 'wave'
  | 'kills'
  | 'bossKills'
  | 'eliteKills'
  | 'upgradeCount'
  | 'perfectWavesThisRun'
  | 'infiniteSwarmSurvivalSeconds'
  | 'maxElementalStrength';

export type RunBoolStat =
  | 'reachedInfiniteSwarm'
  | 'reachedFrenzy'
  | 'hadPerfectWave'
  | 'noArmorUpgrades';

export type AchievementCheck =
  | { type: 'cumulative_gte'; stat: CumulativeStat; value: number }
  | { type: 'run_gte'; stat: RunNumericStat; value: number }
  | { type: 'run_lte'; stat: RunNumericStat; value: number }
  | { type: 'run_flag'; stat: RunBoolStat }
  | { type: 'compound'; checks: AchievementCheck[] };

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  check: AchievementCheck;
  /** 'wave' = checked after each wave, 'run' = checked at game over */
  timing: 'wave' | 'run';
  /** If true, calls CosmeticManager.unlockByAchievement(id) on earn */
  cosmeticReward?: boolean;
}

export const achievements: Achievement[] = [
  // === COSMETIC-LINKED (match achievementIds in cosmetics.ts) ===
  {
    id: 'survive_50_waves',
    name: 'Seasoned Survivor',
    description: 'Survive 50 waves total across all runs',
    category: 'survival',
    check: { type: 'cumulative_gte', stat: 'totalWavesSurvived', value: 50 },
    timing: 'run',
    cosmeticReward: true,
  },
  {
    id: 'defeat_100_bosses',
    name: 'Boss Hunter',
    description: 'Defeat 100 bosses across all runs',
    category: 'combat',
    check: { type: 'cumulative_gte', stat: 'totalBossKills', value: 100 },
    timing: 'run',
    cosmeticReward: true,
  },
  {
    id: 'complete_10_runs',
    name: 'Veteran',
    description: 'Complete 10 runs',
    category: 'survival',
    check: { type: 'cumulative_gte', stat: 'totalRuns', value: 10 },
    timing: 'run',
    cosmeticReward: true,
  },
  {
    id: 'perfect_wave',
    name: 'Untouchable',
    description: 'Complete a wave without taking any damage',
    category: 'survival',
    check: { type: 'run_flag', stat: 'hadPerfectWave' },
    timing: 'wave',
    cosmeticReward: true,
  },

  // === SCORE ACHIEVEMENTS ===
  {
    id: 'score_10k',
    name: 'Bronze Quill',
    description: 'Score 10,000 points in a single run',
    category: 'score',
    check: { type: 'run_gte', stat: 'score', value: 10000 },
    timing: 'run',
  },
  {
    id: 'score_25k',
    name: 'Silver Quill',
    description: 'Score 25,000 points in a single run',
    category: 'score',
    check: { type: 'run_gte', stat: 'score', value: 25000 },
    timing: 'run',
  },
  {
    id: 'score_50k',
    name: 'Gold Quill',
    description: 'Score 50,000 points in a single run',
    category: 'score',
    check: { type: 'run_gte', stat: 'score', value: 50000 },
    timing: 'run',
  },
  {
    id: 'score_100k',
    name: 'Diamond Quill',
    description: 'Score 100,000 points in a single run',
    category: 'score',
    check: { type: 'run_gte', stat: 'score', value: 100000 },
    timing: 'run',
  },

  // === COMBAT ACHIEVEMENTS ===
  {
    id: 'kill_10000',
    name: 'Exterminator',
    description: 'Kill 10,000 enemies across all runs',
    category: 'combat',
    check: { type: 'cumulative_gte', stat: 'totalKills', value: 10000 },
    timing: 'run',
  },
  {
    id: 'kill_100_elites',
    name: 'Elite Slayer',
    description: 'Kill 100 elite enemies across all runs',
    category: 'combat',
    check: { type: 'cumulative_gte', stat: 'totalEliteKills', value: 100 },
    timing: 'run',
  },

  // === SURVIVAL / PROGRESSION ===
  {
    id: 'beat_wave_20',
    name: 'Full Clear',
    description: 'Complete wave 20',
    category: 'survival',
    check: { type: 'run_gte', stat: 'wave', value: 20 },
    timing: 'run',
  },
  {
    id: 'reach_infinite_swarm',
    name: 'Infinite Warrior',
    description: 'Enter the Infinite Swarm',
    category: 'survival',
    check: { type: 'run_flag', stat: 'reachedInfiniteSwarm' },
    timing: 'run',
  },
  {
    id: 'survive_5min_swarm',
    name: 'Endurance',
    description: 'Survive 5 minutes in the Infinite Swarm',
    category: 'survival',
    check: { type: 'run_gte', stat: 'infiniteSwarmSurvivalSeconds', value: 300 },
    timing: 'run',
  },
  {
    id: 'reach_frenzy',
    name: 'Into the Frenzy',
    description: 'Reach the Frenzy stage in Infinite Swarm',
    category: 'survival',
    check: { type: 'run_flag', stat: 'reachedFrenzy' },
    timing: 'run',
  },

  // === STYLE ACHIEVEMENTS ===
  {
    id: 'minimalist_run',
    name: 'Minimalist',
    description: 'Complete wave 20 with fewer than 8 upgrades',
    category: 'style',
    check: {
      type: 'compound',
      checks: [
        { type: 'run_gte', stat: 'wave', value: 20 },
        { type: 'run_lte', stat: 'upgradeCount', value: 7 },
      ],
    },
    timing: 'run',
  },
  {
    id: 'no_armor_clear',
    name: 'Glass Cannon',
    description: 'Complete wave 20 without picking any armor upgrades',
    category: 'style',
    check: {
      type: 'compound',
      checks: [
        { type: 'run_gte', stat: 'wave', value: 20 },
        { type: 'run_flag', stat: 'noArmorUpgrades' },
      ],
    },
    timing: 'run',
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return achievements.filter(a => a.category === category);
}
