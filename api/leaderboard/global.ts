import { kv } from '@vercel/kv';
import { parseMember } from '../_lib/validation';

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

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
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
    // Get entries with scores (returns array of [member, score, member, score, ...])
    const results = await kv.zrange('leaderboard:global', offset, offset + limit - 1, {
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

    const total = await kv.zcard('leaderboard:global');

    const response: LeaderboardResponse = {
      entries,
      total,
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
    console.error('Leaderboard fetch error:', error);
    return new Response(JSON.stringify({ error: 'Server error', entries: [], total: 0 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
