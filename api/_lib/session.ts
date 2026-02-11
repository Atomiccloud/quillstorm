// Session management for anti-cheat validation
// Tracks game progress server-side to validate score submissions

import { nanoid } from 'nanoid';
import { reconstructModifiers, UPGRADE_LOOKUP } from './upgrades';

// Elite and danger constants - must match client config
export const ELITE_POINTS_MULTIPLIER = 2.5;
export const DANGER_SCORE_MULTIPLIER_PER_STACK = 0.15;

// Enemy point values - must match client config
export const ENEMY_POINTS: Record<string, number> = {
  scurrier: 10,
  spitter: 20,
  swooper: 25,
  splitter: 30,
  burrower: 35,
  shellback: 40,
  healer: 50,
  splitling: 10,
  boss: 500,
  flyingBoss: 600,
};

// Kill counts by enemy type
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

// Performance metrics per wave
export interface PerfMetrics {
  d: number;
  t: number;
  b: number;
}

// Stat metrics for anti-cheat (obfuscated: m=maxHealth, c=maxQuills, p=prosperity)
export interface StatMetrics {
  m: number;
  c: number;
  p: number;
}

// Defense stats (armor/evasion) - values are raw * 100 for integer transmission
export interface DefenseStats {
  a: number; // armor (e.g., 50 = 0.50 raw = 50 armor displayed)
  e: number; // evasion (e.g., 40 = 0.40 raw = 40 evasion displayed)
}

// Modifier snapshot for anti-cheat (obfuscated keys, values * 1000 for integer transmission)
export interface ModifierSnapshot {
  d: number;   // damage
  fr: number;  // fireRate
  rr: number;  // regenRate
  ps: number;  // projectileSpeed
  pc: number;  // projectileCount
  mh: number;  // maxHealth
  mq: number;  // maxQuills
  pr: number;  // prosperity
  dl: number;  // dangerLevel
  cc: number;  // critChance
  ar: number;  // armor
  ev: number;  // evasion
  vs: number;  // vampirismStrength
  sc: number;  // shieldCharges
  pi: number;  // piercing
  bo: number;  // bouncing
  kb: number;  // knockback
  dd: number;  // distanceDamage
}

// Upgrade ledger entry
export interface UpgradeLedgerEntry {
  id: string;
  source: string;
  wave: number;
  known: boolean;
}

// Wave data recorded during gameplay
export interface WaveRecord {
  wave: number;
  kills: KillCounts;
  eliteKills?: KillCounts;
  dangerLevel?: number;
  score: number;          // Total score at end of wave
  timestamp: number;
  pm?: PerfMetrics;
  sm?: StatMetrics;
  ds?: DefenseStats;      // Defense stats at end of wave
  um?: ModifierSnapshot;  // Modifier snapshot at end of wave
  qf?: number;            // Quills fired this wave
  wt?: number;            // Wave duration in milliseconds
}

// Full session data stored in Redis
export interface GameSession {
  token: string;
  fingerprint: string;
  startTime: number;
  waves: WaveRecord[];
  gameOver: boolean;
  finalScore?: number;
  finalWave?: number;
  finalKills?: KillCounts;
  finalEliteKills?: KillCounts;
  finalDangerLevel?: number;
  finalPm?: PerfMetrics;
  finalSm?: StatMetrics;
  statsFlagged?: boolean;    // True if HP/quills/prosperity values were suspicious
  finalDs?: DefenseStats;
  // v0.5.1: Enhanced anti-cheat
  upgradeLedger?: UpgradeLedgerEntry[];  // Server-side record of all upgrade picks
  modifiersFlagged?: boolean;  // True if modifier snapshot didn't match upgrade ledger
  heuristicFlags?: string[];   // List of triggered heuristic checks
}

// Session validation result
export interface SessionValidation {
  valid: boolean;
  error?: string;
  session?: GameSession;
}

// Calculate expected points from kill counts (regular + elite + danger multiplier)
export function calculatePointsFromKills(
  kills: KillCounts,
  eliteKills?: KillCounts,
  dangerLevel?: number
): number {
  let points = 0;
  // Regular kills
  for (const [enemyType, count] of Object.entries(kills)) {
    if (count && ENEMY_POINTS[enemyType]) {
      points += count * ENEMY_POINTS[enemyType];
    }
  }
  // Elite kills (separate tracking, higher point value)
  if (eliteKills) {
    for (const [enemyType, count] of Object.entries(eliteKills)) {
      if (count && ENEMY_POINTS[enemyType]) {
        points += count * ENEMY_POINTS[enemyType] * ELITE_POINTS_MULTIPLIER;
      }
    }
  }
  // Apply danger score multiplier
  if (dangerLevel && dangerLevel > 0) {
    points *= (1 + dangerLevel * DANGER_SCORE_MULTIPLIER_PER_STACK);
  }
  return points;
}

// Generate a new session token
export function generateSessionToken(): string {
  return nanoid(24);
}

// Get Redis key for a session
export function getSessionKey(token: string): string {
  return `session:${token}`;
}

// Session TTL - 1 hour (plenty of time for a game)
export const SESSION_TTL_SECONDS = 3600;

// Validation constants
export const MAX_SCORE_TOLERANCE = 1.3;  // Allow 30% over expected (splitlings add kills not in the parent count)
export const MIN_SCORE_TOLERANCE = 0.7;  // Score shouldn't be way below expected kills
export const MAX_WAVE_SCORE_INCREASE = 4000;  // Max reasonable score per wave (60 enemies + boss)

// Validate a wave report against the session
export function validateWaveReport(
  session: GameSession,
  wave: number,
  kills: KillCounts,
  reportedScore: number,
  eliteKills?: KillCounts,
  dangerLevel?: number
): { valid: boolean; error?: string } {
  // Check wave is sequential
  const expectedWave = session.waves.length + 1;
  if (wave !== expectedWave) {
    return { valid: false, error: 'Invalid request' };
  }

  // Calculate expected points from this wave's kills (including elites + danger)
  const expectedPointsThisWave = calculatePointsFromKills(kills, eliteKills, dangerLevel);

  // Get previous score (0 if first wave)
  const previousScore = session.waves.length > 0
    ? session.waves[session.waves.length - 1].score
    : 0;

  // Score should have increased
  if (reportedScore < previousScore) {
    return { valid: false, error: 'Invalid request' };
  }

  // Check score increase is reasonable
  const scoreIncrease = reportedScore - previousScore;

  // Allow some tolerance for XP orbs, prosperity bonuses, etc.
  const minExpected = expectedPointsThisWave * MIN_SCORE_TOLERANCE;
  const maxExpected = Math.max(expectedPointsThisWave * MAX_SCORE_TOLERANCE, MAX_WAVE_SCORE_INCREASE);

  if (scoreIncrease < minExpected * 0.5) {
    // Score increased way less than kills would suggest - suspicious but might be edge case
    // We'll log but not reject (player might have gotten unlucky with spawns)
  }

  if (scoreIncrease > maxExpected * 2) {
    return { valid: false, error: 'Invalid request' };
  }

  return { valid: true };
}

// Validate final submission against session
export function validateSubmission(
  session: GameSession,
  finalWave: number,
  finalScore: number
): { valid: boolean; error?: string } {
  // Must have called gameover
  if (!session.gameOver) {
    return { valid: false, error: 'Invalid session' };
  }

  // Wave must match last recorded wave (or be close - might die mid-wave)
  const lastRecordedWave = session.waves.length > 0
    ? session.waves[session.waves.length - 1].wave
    : 0;

  // Allow submitting the wave you died on (might not have completed it)
  if (finalWave < lastRecordedWave || finalWave > lastRecordedWave + 1) {
    return { valid: false, error: 'Invalid session' };
  }

  // Score should be close to last recorded + points from unreported kills
  const lastRecordedScore = session.waves.length > 0
    ? session.waves[session.waves.length - 1].score
    : 0;

  // Calculate expected points from unreported kills (current wave / infinite swarm)
  const unreportedKillPoints = session.finalKills
    ? calculatePointsFromKills(session.finalKills, session.finalEliteKills, session.finalDangerLevel)
    : 0;

  // Max allowed = last recorded score + unreported kill points (with tolerance) + one wave buffer
  const maxAllowedScore = lastRecordedScore
    + Math.max(unreportedKillPoints * MAX_SCORE_TOLERANCE, MAX_WAVE_SCORE_INCREASE);

  if (finalScore > maxAllowedScore) {
    return { valid: false, error: 'Invalid session' };
  }

  // Score shouldn't be significantly less than recorded
  if (finalScore < lastRecordedScore * 0.9) {
    return { valid: false, error: 'Invalid session' };
  }

  return { valid: true };
}

// Validate performance metrics across session waves
export function validatePerf(
  session: GameSession,
  score: number,
  wave: number
): { valid: boolean; error?: string } {
  // Only check high scores at wave 20+ with 40k+ points
  if (wave < 20 || score < 40000) {
    return { valid: true };
  }

  // Only check waves 18-20 for survivability (earlier waves don't matter)
  const lateWavesWithPm = session.waves.filter(w => w.wave >= 18 && w.wave <= 20 && w.pm);

  // No data for late waves (old client or didn't reach wave 18) — pass
  if (lateWavesWithPm.length === 0) {
    return { valid: true };
  }

  // Fail if waves 18-20 all show zero engagement (no damage, no hits, no shield blocks)
  // Getting to 40k+ score without taking any damage in waves 18-20 is suspicious
  const allZero = lateWavesWithPm.every(w => {
    const pm = w.pm!;
    return pm.d === 0 && pm.t === 0 && pm.b === 0;
  });

  if (allZero) {
    return { valid: false, error: 'Invalid session' };
  }

  return { valid: true };
}

// Stat validation constants (generous bounds based on max possible upgrades per wave)
// Base stats: HP=100, Quills=30, Prosperity=0
// Formula allows for multiple legendary upgrades per wave (very generous)
const BASE_HP = 100;
const BASE_QUILLS = 30;
const HP_PER_WAVE = 25;      // ~1 legendary HP upgrade worth per wave
const QUILLS_PER_WAVE = 20;  // ~1 epic quills upgrade worth per wave
const PROSPERITY_PER_WAVE = 25; // ~1 epic prosperity upgrade worth per wave

// Validate stat metrics (HP, quills, prosperity) against wave
export function validateStatMetrics(
  wave: number,
  sm?: StatMetrics
): { valid: boolean } {
  // No stats provided = old client, skip validation
  if (!sm) {
    return { valid: true };
  }

  // Calculate max allowed values (very generous)
  const maxHP = BASE_HP + wave * HP_PER_WAVE;
  const maxQuills = BASE_QUILLS + wave * QUILLS_PER_WAVE;
  const maxProsperity = wave * PROSPERITY_PER_WAVE;

  // Check if any stat exceeds the generous maximum
  if (sm.m > maxHP || sm.c > maxQuills || sm.p > maxProsperity) {
    return { valid: false };
  }

  return { valid: true };
}

// Defense stat validation constants
// Max armor = wave * 20 (generous: allows multiple legendaries per wave somehow)
// Max evasion = wave * 15 (slightly stricter since evasion is stronger early)
export const MAX_ARMOR_PER_WAVE = 20;   // Max 20 armor per wave
export const MAX_EVASION_PER_WAVE = 15; // Max 15 evasion per wave

// Validate defense stats for all waves (anti-cheat)
// Returns invalid if armor/evasion values are impossibly high for the wave number
export function validateDefenseStats(
  session: GameSession,
  wave: number
): { valid: boolean; error?: string } {

  // Get the most recent wave record with defense stats
  const lastWaveWithDs = [...session.waves].reverse().find(w => w.ds);
  if (!lastWaveWithDs || !lastWaveWithDs.ds) {
    // No defense stats reported (old client) - pass
    return { valid: true };
  }

  const { a: armor, e: evasion } = lastWaveWithDs.ds;
  const waveNum = lastWaveWithDs.wave;

  // Calculate max allowed based on wave number
  // Adding a base buffer of 10 for wave 1 edge cases
  const maxArmor = 10 + (waveNum * MAX_ARMOR_PER_WAVE);
  const maxEvasion = 10 + (waveNum * MAX_EVASION_PER_WAVE);

  if (armor > maxArmor) {
    return { valid: false, error: 'Invalid session' };
  }

  if (evasion > maxEvasion) {
    return { valid: false, error: 'Invalid session' };
  }

  return { valid: true };
}

// ===== v0.5.1: Enhanced Anti-Cheat Validation =====

// Modifier key mapping: snapshot key → upgrade effect key
const MODIFIER_KEY_MAP: Record<string, string> = {
  d: 'damage', fr: 'fireRate', rr: 'regenRate', ps: 'projectileSpeed',
  pc: 'projectileCount', mh: 'maxHealth', mq: 'maxQuills', pr: 'prosperity',
  dl: 'dangerLevel', cc: 'critChance', ar: 'armor', ev: 'evasion',
  vs: 'vampirismStrength', sc: 'shieldCharges', pi: 'piercing', bo: 'bouncing',
  kb: 'knockback', dd: 'distanceDamage',
};

// Validate modifier snapshot against upgrade ledger
// Returns flagged=true if modifiers don't match expected values from upgrades picked
export function validateModifierSnapshot(
  session: GameSession,
  um?: ModifierSnapshot
): { valid: boolean; flagged: boolean; flags: string[] } {
  if (!um || !session.upgradeLedger || session.upgradeLedger.length === 0) {
    return { valid: true, flagged: false, flags: [] };
  }

  const expected = reconstructModifiers(session.upgradeLedger);
  const flags: string[] = [];

  for (const [snapshotKey, effectKey] of Object.entries(MODIFIER_KEY_MAP)) {
    const reportedRaw = (um as unknown as Record<string, number>)[snapshotKey];
    if (reportedRaw === undefined) continue;

    // Reported values are * 1000 for integer transmission
    const reported = reportedRaw / 1000;
    const expectedVal = expected[effectKey] || 0;

    // Tolerance: ±5% of expected value or ±0.05 absolute, whichever is larger
    const tolerance = Math.max(Math.abs(expectedVal) * 0.05, 0.05);
    const diff = reported - expectedVal;

    if (Math.abs(diff) > tolerance) {
      // Modifier doesn't match upgrade ledger
      if (Math.abs(diff) > Math.max(Math.abs(expectedVal) * 1.0, 1.0)) {
        // >2x expected or >1 absolute difference: hard flag
        flags.push(`${effectKey}:${reported.toFixed(2)}vs${expectedVal.toFixed(2)}`);
      } else {
        // Moderate mismatch: soft flag
        flags.push(`~${effectKey}`);
      }
    }
  }

  // Hard reject if 3+ major flags (clear tampering across multiple modifiers)
  const majorFlags = flags.filter(f => !f.startsWith('~'));
  if (majorFlags.length >= 3) {
    return { valid: false, flagged: true, flags };
  }

  return { valid: true, flagged: flags.length > 0, flags };
}

// Validate quill efficiency: kills vs quills fired
// Detects impossibly high damage (many kills with very few quills)
export function validateQuillEfficiency(
  kills: KillCounts,
  eliteKills: KillCounts | undefined,
  quillsFired: number | undefined,
  um: ModifierSnapshot | undefined
): { flags: string[] } {
  const flags: string[] = [];

  if (quillsFired === undefined || quillsFired <= 0) {
    return { flags };
  }

  // Count total kills
  let totalKills = 0;
  for (const count of Object.values(kills)) {
    if (count) totalKills += count;
  }
  if (eliteKills) {
    for (const count of Object.values(eliteKills)) {
      if (count) totalKills += count;
    }
  }

  if (totalKills === 0) return { flags };

  // Get piercing and projectile count from snapshot (if available)
  const piercing = um ? (um.pi / 1000) : 0;
  const projCount = um ? Math.max(1, 1 + Math.floor(um.pc / 1000)) : 1;

  // Each shot fires projCount quills, each can hit (1 + piercing) enemies
  // So max kills per quill fired = projCount * (1 + piercing) / projCount = 1 + piercing
  // But also factor in bouncing, AOE, companions, etc. - be generous
  const maxKillsPerQuill = (1 + piercing) * 3; // 3x multiplier for AOE/bouncing/companions
  const maxPossibleKills = quillsFired * maxKillsPerQuill;

  if (totalKills > maxPossibleKills && totalKills > 10) {
    flags.push(`quillEff:${totalKills}k/${quillsFired}q`);
  }

  return { flags };
}

// Validate wave timing: waves shouldn't complete impossibly fast
export function validateWaveTiming(
  wave: number,
  waveTime: number | undefined
): { flags: string[] } {
  const flags: string[] = [];

  if (waveTime === undefined || waveTime <= 0) {
    return { flags };
  }

  // Minimum wave time: enemies need to spawn and be killed
  // Even with insane builds, first enemies spawn at ~600ms intervals
  // Wave 1 has ~8 enemies, later waves have 20+
  const minTime = wave <= 3 ? 2000 : 4000; // 2s early, 4s later

  if (waveTime < minTime) {
    flags.push(`waveTime:${wave}w/${Math.round(waveTime)}ms`);
  }

  return { flags };
}

// Validate damage patterns: detect reduced enemy stats
// If player has no armor/evasion/shields but takes zero damage in mid-late waves, suspicious
export function validateDamagePatterns(
  session: GameSession,
  wave: number,
  pm: PerfMetrics | undefined,
  um: ModifierSnapshot | undefined
): { flags: string[] } {
  const flags: string[] = [];

  if (!pm || wave < 8) {
    return { flags };
  }

  // Check if player has no defensive stats but takes zero damage
  const hasDefense = um && (
    um.ar > 50 ||  // >0.05 armor
    um.ev > 50 ||  // >0.05 evasion
    um.sc > 0      // has shields
  );

  if (!hasDefense && pm.d === 0 && pm.t === 0 && pm.b === 0) {
    // No armor, no evasion, no shields, and took zero damage in wave 8+
    // Check if this is a consistent pattern (3+ consecutive zero-damage waves)
    const recentWaves = session.waves.slice(-3);
    const allZero = recentWaves.length >= 3 && recentWaves.every(w =>
      w.pm && w.pm.d === 0 && w.pm.t === 0 && w.pm.b === 0
    );

    if (allZero) {
      flags.push(`zeroDmg:${wave}w/noDef`);
    }
  }

  return { flags };
}

// ===== Shadow Leaderboard Diagnostics =====

// Diagnostic record stored when a score is shadow-routed
export interface ShadowDiagnostic {
  id: string;
  fingerprint: string;
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
  failureReasons: string[];
  session?: {
    startTime: number;
    stageId?: string;
    activeMutators?: string[];
    activePerks?: Record<string, string>;
    statsFlagged: boolean;
    modifiersFlagged: boolean;
    heuristicFlags: string[];
    waveCount: number;
    upgradeLedgerCount: number;
    finalScore?: number;
    finalWave?: number;
    gameOver: boolean;
    lastModifierSnapshot?: ModifierSnapshot;
    expectedModifiers?: Record<string, number>;
    waveSummary: Array<{ w: number; s: number }>;
    upgradeLedger?: UpgradeLedgerEntry[];
  };
}

// Build a diagnostic record from session data and failure reasons
export function buildShadowDiagnostic(
  id: string,
  fingerprint: string,
  playerName: string,
  score: number,
  wave: number,
  failureReasons: string[],
  session: GameSession | null
): ShadowDiagnostic {
  const diagnostic: ShadowDiagnostic = {
    id,
    fingerprint,
    playerName,
    score,
    wave,
    timestamp: Date.now(),
    failureReasons,
  };

  if (session) {
    // Access extra fields that may exist on the session object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = session as any;

    // Find the last modifier snapshot (from final data or most recent wave)
    const lastWaveWithUm = [...session.waves].reverse().find(w => w.um);
    const lastUm: ModifierSnapshot | undefined = s.finalUm || lastWaveWithUm?.um;

    // Reconstruct expected modifiers from upgrade ledger
    let expectedMods: Record<string, number> | undefined;
    if (session.upgradeLedger && session.upgradeLedger.length > 0) {
      expectedMods = reconstructModifiers(session.upgradeLedger);
    }

    diagnostic.session = {
      startTime: session.startTime,
      stageId: s.stageId,
      activeMutators: s.activeMutators,
      activePerks: s.activePerks,
      statsFlagged: !!session.statsFlagged,
      modifiersFlagged: !!session.modifiersFlagged,
      heuristicFlags: session.heuristicFlags || [],
      waveCount: session.waves.length,
      upgradeLedgerCount: session.upgradeLedger?.length || 0,
      finalScore: session.finalScore,
      finalWave: session.finalWave,
      gameOver: !!session.gameOver,
      lastModifierSnapshot: lastUm,
      expectedModifiers: expectedMods,
      waveSummary: session.waves.map(w => ({ w: w.wave, s: w.score })),
      upgradeLedger: session.upgradeLedger,
    };
  }

  return diagnostic;
}

// Enhanced performance validation with lower thresholds
export function validatePerfEnhanced(
  session: GameSession,
  score: number,
  wave: number
): { valid: boolean; error?: string } {
  // Lower threshold: 25k+ at wave 15+
  if (wave < 15 || score < 25000) {
    return { valid: true };
  }

  // Check waves 15-20 for engagement (broader range than before)
  const checkWaves = session.waves.filter(w => w.wave >= 15 && w.wave <= 20 && w.pm);

  if (checkWaves.length === 0) {
    return { valid: true };
  }

  // All checked waves show zero engagement = suspicious
  const allZero = checkWaves.every(w => {
    const pm = w.pm!;
    return pm.d === 0 && pm.t === 0 && pm.b === 0;
  });

  if (allZero) {
    return { valid: false, error: 'Invalid session' };
  }

  return { valid: true };
}
