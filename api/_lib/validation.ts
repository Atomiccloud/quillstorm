// Using Web Crypto API (Edge-compatible, no Node.js crypto)

const SALT = process.env.CHECKSUM_SALT || 'quillstorm-default-salt-change-in-prod';
const MAX_SCORE = 50000;
const MAX_WAVE = 100;
const MAX_POINTS_PER_WAVE = 1500; // Generous estimate including boss waves

export interface SubmissionData {
  playerName: string;
  score: number;
  wave: number;
  checksum: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

// SHA256 using Web Crypto API (available in Edge runtime)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function validateSubmission(data: SubmissionData): Promise<ValidationResult> {
  // Name validation
  if (!data.playerName || typeof data.playerName !== 'string') {
    return { valid: false, error: 'Invalid player name' };
  }

  const trimmedName = data.playerName.trim();
  if (trimmedName.length < 3 || trimmedName.length > 20) {
    return { valid: false, error: 'Name must be 3-20 characters' };
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, numbers, and spaces' };
  }

  // Score/wave validation
  if (typeof data.score !== 'number' || data.score < 0 || data.score > MAX_SCORE) {
    return { valid: false, error: 'Invalid score' };
  }

  if (typeof data.wave !== 'number' || data.wave < 1 || data.wave > MAX_WAVE) {
    return { valid: false, error: 'Invalid wave' };
  }

  // Sanity check: score should be roughly proportional to wave
  const maxPossibleScore = data.wave * MAX_POINTS_PER_WAVE;
  if (data.score > maxPossibleScore * 1.5) {
    return { valid: false, error: 'Score anomaly detected' };
  }

  // Checksum validation
  const expectedChecksum = await generateChecksum(data.score, data.wave);
  if (data.checksum !== expectedChecksum) {
    return { valid: false, error: 'Invalid checksum' };
  }

  return { valid: true, sanitizedName: trimmedName };
}

export async function generateChecksum(score: number, wave: number): Promise<string> {
  const data = `${score}:${wave}:${SALT}`;
  const hash = await sha256(data);
  return hash.slice(0, 16);
}

// Helper to get ISO week number
export function getISOWeek(): { year: number; week: number } {
  const date = new Date();
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

// Get timestamp for next Monday 00:00 UTC
export function getNextMondayTimestamp(): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

  const nextMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilMonday,
    0, 0, 0, 0
  ));

  return Math.floor(nextMonday.getTime() / 1000);
}

// Parse leaderboard member string
export function parseMember(member: string): {
  id: string;
  playerName: string;
  wave: number;
  timestamp: number;
} | null {
  const parts = member.split('|');
  if (parts.length !== 4) return null;

  return {
    id: parts[0],
    playerName: parts[1],
    wave: parseInt(parts[2], 10),
    timestamp: parseInt(parts[3], 10),
  };
}
