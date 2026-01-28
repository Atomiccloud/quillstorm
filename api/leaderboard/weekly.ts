import { kv } from '@vercel/kv';
import { parseMember, getISOWeek, getNextMondayTimestamp } from '../_lib/validation';

export const config = {
  runtime: 'edge',
};

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  wave: number;
  timestamp: number;
}

interface WeeklyLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  weekStart: string;
  weekEnd: string;
  resetsIn: number; // seconds until reset
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    const { year, week } = getISOWeek();
    const weeklyKey = `leaderboard:weekly:${year}:${week}`;

    // Get entries with scores
    const results = await kv.zrange(weeklyKey, offset, offset + limit - 1, {
      rev: true,
      withScores: true,
    });

    const entries: LeaderboardEntry[] = [];

    // Parse results (alternating member/score pairs)
    for (let i = 0; i < results.length; i += 2) {
      const member = results[i] as string;
      const score = results[i + 1] as number;
      const parsed = parseMember(member);

      if (parsed) {
        entries.push({
          rank: offset + (i / 2) + 1,
          playerName: parsed.playerName,
          score,
          wave: parsed.wave,
          timestamp: parsed.timestamp,
        });
      }
    }

    const total = await kv.zcard(weeklyKey) || 0;

    // Calculate week boundaries
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const nextMonday = getNextMondayTimestamp();
    const resetsIn = nextMonday - Math.floor(Date.now() / 1000);

    const response: WeeklyLeaderboardResponse = {
      entries,
      total,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      resetsIn: Math.max(0, resetsIn),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Weekly leaderboard fetch error:', error);
    return new Response(JSON.stringify({
      error: 'Server error',
      entries: [],
      total: 0,
      weekStart: '',
      weekEnd: '',
      resetsIn: 0,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
