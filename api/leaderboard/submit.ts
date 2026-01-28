import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { validateSubmission, getISOWeek, getNextMondayTimestamp } from '../_lib/validation';
import { checkRateLimit, checkSubmissionCooldown, getClientIP } from '../_lib/ratelimit';

export const config = {
  runtime: 'edge',
};

interface SubmitRequest {
  playerName: string;
  score: number;
  wave: number;
  checksum: string;
}

interface SubmitResponse {
  success: boolean;
  globalRank?: number | null;
  weeklyRank?: number | null;
  error?: string;
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
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

  // Validate input
  const validation = validateSubmission(body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ success: false, error: validation.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const playerName = validation.sanitizedName!;
  const { score, wave } = body;

  try {
    // Create unique entry
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

    // Set TTL if new week (expire next Monday)
    const ttl = await kv.ttl(weeklyKey);
    if (ttl === -1 || ttl === -2) {
      await kv.expireat(weeklyKey, getNextMondayTimestamp());
    }

    // Get ranks (0-indexed from top, so we add 1)
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
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
