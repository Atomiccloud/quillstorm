import { nanoid } from 'nanoid';
import { validateSubmission, getISOWeek, getNextMondayTimestamp } from '../_lib/validation';
import { checkRateLimit, checkSubmissionCooldown, getClientIP } from '../_lib/ratelimit';
import { getSessionKey, GameSession, validateSubmission as validateSessionSubmission } from '../_lib/session';

export const config = {
  runtime: 'edge',
};

interface SubmitRequest {
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
  fingerprint: string;
  checksum: string;
  sessionToken?: string;
}

interface SubmitResponse {
  success: boolean;
  globalRank?: number | null;
  weeklyRank?: number | null;
  error?: string;
}

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Save to shadow leaderboard and return fake success (honeypot for cheaters)
async function shadowSubmit(
  kv: any,
  playerName: string,
  score: number,
  wave: number,
  fingerprint: string
): Promise<Response> {
  const id = nanoid(12);
  const timestamp = Date.now();
  // Include fingerprint in member so we can filter by it later
  const member = `${id}|${playerName}|${wave}|${timestamp}|${fingerprint}`;

  // Add to shadow leaderboards
  await kv.zadd('shadow:leaderboard:global', { score, member });

  const { year, week } = getISOWeek();
  const shadowWeeklyKey = `shadow:leaderboard:weekly:${year}:${week}`;
  await kv.zadd(shadowWeeklyKey, { score, member });

  // Set TTL on shadow weekly (same as real)
  const ttl = await kv.ttl(shadowWeeklyKey);
  if (ttl === -1 || ttl === -2) {
    await kv.expireat(shadowWeeklyKey, getNextMondayTimestamp());
  }

  // Trim shadow leaderboards (keep more entries since they're per-fingerprint)
  const shadowGlobalCount = await kv.zcard('shadow:leaderboard:global');
  if (shadowGlobalCount > 500) {
    await kv.zremrangebyrank('shadow:leaderboard:global', 0, shadowGlobalCount - 501);
  }

  // Calculate fake ranks (their position in shadow + offset to look real)
  const shadowGlobalRank = await kv.zrevrank('shadow:leaderboard:global', member);
  const shadowWeeklyRank = await kv.zrevrank(shadowWeeklyKey, member);

  // Return fake success - cheater thinks they made it!
  const response: SubmitResponse = {
    success: true,
    globalRank: shadowGlobalRank !== null ? Math.min(shadowGlobalRank + 1, 50) : null,
    weeklyRank: shadowWeeklyRank !== null ? Math.min(shadowWeeklyRank + 1, 30) : null,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return success but with null ranks if KV isn't configured
  if (!isKVConfigured()) {
    return new Response(JSON.stringify({
      success: true,
      globalRank: null,
      weeklyRank: null,
      message: 'Leaderboard not configured yet - score not saved',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const ip = getClientIP(req);

  // Rate limiting
  if (!await checkRateLimit(ip)) {
    return new Response(JSON.stringify({ success: false, error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Submission cooldown
  if (!await checkSubmissionCooldown(ip)) {
    return new Response(JSON.stringify({ success: false, error: 'Please wait before submitting again' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SubmitRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate input (checksum, timestamp window, etc.)
  const validation = await validateSubmission(body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ success: false, error: validation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const playerName = validation.sanitizedName!;
  const { score, wave, fingerprint } = body;

  try {
    const { kv } = await import('@vercel/kv');

    // Session validation - REQUIRED for real leaderboard
    let isValidSession = false;

    if (body.sessionToken && body.sessionToken !== 'dev-mode-no-validation') {
      const sessionKey = getSessionKey(body.sessionToken);
      const sessionData = await kv.get<string>(sessionKey);

      if (sessionData) {
        const session: GameSession = typeof sessionData === 'string'
          ? JSON.parse(sessionData)
          : sessionData;

        // Check fingerprint matches
        if (session.fingerprint === fingerprint) {
          // Validate submission against session history
          const sessionValidation = validateSessionSubmission(session, wave, score);
          if (sessionValidation.valid) {
            isValidSession = true;
            // Delete session after successful validation (one-time use)
            await kv.del(sessionKey);
          }
        }
      }
    }

    // If session validation failed, save to shadow leaderboard instead
    if (!isValidSession) {
      return await shadowSubmit(kv, playerName, score, wave, fingerprint);
    }

    // === VALID SUBMISSION - Save to real leaderboard ===

    const id = nanoid(12);
    const timestamp = Date.now();
    const member = `${id}|${playerName}|${wave}|${timestamp}`;

    // Add to global leaderboard
    await kv.zadd('leaderboard:global', { score, member });

    // Trim to top 100
    const globalCount = await kv.zcard('leaderboard:global');
    if (globalCount > 100) {
      await kv.zremrangebyrank('leaderboard:global', 0, globalCount - 101);
    }

    // Add to weekly leaderboard
    const { year, week } = getISOWeek();
    const weeklyKey = `leaderboard:weekly:${year}:${week}`;
    await kv.zadd(weeklyKey, { score, member });

    // Trim weekly to top 100
    const weeklyCount = await kv.zcard(weeklyKey);
    if (weeklyCount > 100) {
      await kv.zremrangebyrank(weeklyKey, 0, weeklyCount - 101);
    }

    // Set TTL if new week
    const ttl = await kv.ttl(weeklyKey);
    if (ttl === -1 || ttl === -2) {
      await kv.expireat(weeklyKey, getNextMondayTimestamp());
    }

    // Get ranks
    const globalRank = await kv.zrevrank('leaderboard:global', member);
    const weeklyRank = await kv.zrevrank(weeklyKey, member);

    const response: SubmitResponse = {
      success: true,
      globalRank: globalRank !== null ? globalRank + 1 : null,
      weeklyRank: weeklyRank !== null ? weeklyRank + 1 : null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Leaderboard submission error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error - score saved locally' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
