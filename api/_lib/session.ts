// Session management for anti-cheat validation
// Tracks game progress server-side to validate score submissions

import { nanoid } from 'nanoid';

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

// Wave data recorded during gameplay
export interface WaveRecord {
  wave: number;
  kills: KillCounts;
  score: number;          // Total score at end of wave
  timestamp: number;
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
}

// Session validation result
export interface SessionValidation {
  valid: boolean;
  error?: string;
  session?: GameSession;
}

// Calculate expected points from kill counts
export function calculatePointsFromKills(kills: KillCounts): number {
  let points = 0;
  for (const [enemyType, count] of Object.entries(kills)) {
    if (count && ENEMY_POINTS[enemyType]) {
      points += count * ENEMY_POINTS[enemyType];
    }
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
export const MAX_SCORE_TOLERANCE = 1.3;  // Allow 30% variance for XP bonuses, etc.
export const MIN_SCORE_TOLERANCE = 0.7;  // Score shouldn't be way below expected
export const MAX_WAVE_SCORE_INCREASE = 3000;  // Max reasonable score per wave (boss waves)

// Validate a wave report against the session
export function validateWaveReport(
  session: GameSession,
  wave: number,
  kills: KillCounts,
  reportedScore: number
): { valid: boolean; error?: string } {
  // Check wave is sequential
  const expectedWave = session.waves.length + 1;
  if (wave !== expectedWave) {
    return { valid: false, error: 'Invalid request' };
  }

  // Calculate expected points from this wave's kills
  const expectedPointsThisWave = calculatePointsFromKills(kills);

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

  // Score should be close to last recorded (plus maybe some points from partial wave)
  const lastRecordedScore = session.waves.length > 0
    ? session.waves[session.waves.length - 1].score
    : 0;

  // Allow up to MAX_WAVE_SCORE_INCREASE more than recorded (for partial wave progress)
  if (finalScore > lastRecordedScore + MAX_WAVE_SCORE_INCREASE) {
    return { valid: false, error: 'Invalid session' };
  }

  // Score shouldn't be significantly less than recorded
  if (finalScore < lastRecordedScore * 0.9) {
    return { valid: false, error: 'Invalid session' };
  }

  return { valid: true };
}
