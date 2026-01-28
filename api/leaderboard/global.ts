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

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow GET
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return empty results if KV isn't configured
  if (!isKVConfigured()) {
    return new Response(JSON.stringify({
      entries: [],
      total: 0,
      message: 'Leaderboard not configured yet',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    // Dynamic import to avoid errors when KV isn't configured
    const { kv } = await import('@vercel/kv');

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

    const total = await kv.zcard('leaderboard:global') || 0;

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
    return new Response(JSON.stringify({ entries: [], total: 0 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
