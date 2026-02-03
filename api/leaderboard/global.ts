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

// Parse shadow member (has fingerprint as 5th field)
function parseShadowMember(member: string): {
  id: string;
  playerName: string;
  wave: number;
  timestamp: number;
  fingerprint: string;
} | null {
  const parts = member.split('|');
  if (parts.length !== 5) return null;

  return {
    id: parts[0],
    playerName: parts[1],
    wave: parseInt(parts[2], 10),
    timestamp: parseInt(parts[3], 10),
    fingerprint: parts[4],
  };
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
  const fingerprint = url.searchParams.get('fp') || null;  // For shadow merging

  try {
    const { kv } = await import('@vercel/kv');

    // Get real entries
    const results = await kv.zrange('leaderboard:global', offset, offset + limit - 1, {
      rev: true,
      withScores: true,
    });

    const entries: LeaderboardEntry[] = [];

    // Parse real results
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

    // If fingerprint provided, merge their shadow entries (honeypot display)
    if (fingerprint) {
      const shadowResults = await kv.zrange('shadow:leaderboard:global', 0, 99, {
        rev: true,
        withScores: true,
      });

      // Find shadow entries matching this fingerprint
      const shadowEntries: { score: number; entry: LeaderboardEntry }[] = [];
      for (let i = 0; i < shadowResults.length; i += 2) {
        const member = shadowResults[i] as string;
        const score = shadowResults[i + 1] as number;
        const parsed = parseShadowMember(member);

        if (parsed && parsed.fingerprint === fingerprint) {
          shadowEntries.push({
            score,
            entry: {
              rank: 0, // Will be recalculated
              playerName: parsed.playerName,
              score,
              wave: parsed.wave,
              timestamp: parsed.timestamp,
            },
          });
        }
      }

      // Merge shadow entries into the list and re-sort
      if (shadowEntries.length > 0) {
        // Add shadow entries
        for (const shadow of shadowEntries) {
          entries.push(shadow.entry);
        }

        // Sort by score descending
        entries.sort((a, b) => b.score - a.score);

        // Trim to limit and recalculate ranks
        entries.splice(limit);
        entries.forEach((e, idx) => {
          e.rank = offset + idx + 1;
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
        'Cache-Control': fingerprint ? 'no-cache' : 'public, s-maxage=30, stale-while-revalidate=60',
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
