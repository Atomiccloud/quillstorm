// Using Web Crypto API (Edge-compatible, no Node.js crypto)

const SALT = process.env.VITE_CHECKSUM_SALT || process.env.CHECKSUM_SALT || '';
const MAX_SCORE = 999999;
const MAX_WAVE = 20; // Waves cap at 20 (infinite swarm doesn't increment)
const MAX_POINTS_PER_WAVE = 5000; // Generous estimate including infinite swarm scaling
const TIMESTAMP_WINDOW_MS = 3000; // 3 second validity window for submissions

export interface SubmissionData {
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
  fingerprint: string;
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

  // Timestamp validation (must be within 3 seconds of server time)
  if (typeof data.timestamp !== 'number') {
    return { valid: false, error: 'Invalid timestamp' };
  }

  const serverTime = Date.now();
  const timeDiff = Math.abs(serverTime - data.timestamp);
  if (timeDiff > TIMESTAMP_WINDOW_MS) {
    return { valid: false, error: 'Request expired' };
  }

  // Fingerprint validation (must be present)
  if (!data.fingerprint || typeof data.fingerprint !== 'string') {
    return { valid: false, error: 'Invalid fingerprint' };
  }

  // Checksum validation (includes timestamp and fingerprint)
  const expectedChecksum = await generateChecksum(data.score, data.wave, data.timestamp, data.fingerprint);
  if (data.checksum !== expectedChecksum) {
    return { valid: false, error: 'Invalid checksum' };
  }

  return { valid: true, sanitizedName: trimmedName };
}

export async function generateChecksum(score: number, wave: number, timestamp: number, fingerprint: string): Promise<string> {
  const data = `${score}:${wave}:${timestamp}:${fingerprint}:${SALT}`;
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
