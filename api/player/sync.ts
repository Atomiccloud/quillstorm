export const config = {
  runtime: 'edge',
};

interface CosmeticState {
  unlockedIds: string[];
  equipped: Record<string, string>;
  pinecones: number;
  totalPineconesEarned: number;
}

interface PlayerStats {
  highScore: number;
  highestWave: number;
  totalRuns: number;
  totalKills: number;
  totalBossKills: number;
}

interface PlayerData {
  uid: string;
  displayName: string;
  pinecones: number;
  totalPineconesEarned: number;
  unlockedIds: string[];
  equipped: Record<string, string>;
  stats: PlayerStats;
  lastSyncAt: number;
  createdAt: number;
}

interface SyncRequest {
  localState: CosmeticState;
  localStats: PlayerStats;
  lastSyncAt: number;
}

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Verify Firebase ID token (simplified - in production, use Firebase Admin SDK)
async function verifyToken(token: string): Promise<{ uid: string; name?: string; email?: string } | null> {
  try {
    // Decode the JWT to get the payload (without full verification for edge runtime)
    // In production, you'd use Firebase Admin SDK with a Node.js runtime
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Basic validation
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;

    // Check issuer matches Firebase project
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'quillstorm-dbc45';
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

    return {
      uid: payload.sub,
      name: payload.name,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check KV configuration
  if (!isKVConfigured()) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Storage not configured',
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Verify auth token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.substring(7);
  const user = await verifyToken(token);

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: SyncRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { kv } = await import('@vercel/kv');
    const playerKey = `player:${user.uid}`;

    // Get existing player data
    const existingData = await kv.get<PlayerData>(playerKey);

    const now = Date.now();
    let mergedData: PlayerData;
    let merged = false;

    if (existingData) {
      // Merge local and server data
      // Pinecones: use higher value (prevents exploits while allowing offline progress)
      // Unlocks: union of both (can't lose unlocks)
      // Stats: use max of each

      const mergedUnlocks = Array.from(
        new Set([...existingData.unlockedIds, ...body.localState.unlockedIds])
      );

      mergedData = {
        uid: user.uid,
        displayName: user.name || existingData.displayName || 'Player',
        pinecones: Math.max(existingData.pinecones, body.localState.pinecones),
        totalPineconesEarned: Math.max(
          existingData.totalPineconesEarned,
          body.localState.totalPineconesEarned
        ),
        unlockedIds: mergedUnlocks,
        equipped: body.localState.equipped, // Always use latest equipped
        stats: {
          highScore: Math.max(existingData.stats.highScore, body.localStats.highScore),
          highestWave: Math.max(existingData.stats.highestWave, body.localStats.highestWave),
          totalRuns: Math.max(existingData.stats.totalRuns, body.localStats.totalRuns),
          totalKills: Math.max(existingData.stats.totalKills, body.localStats.totalKills),
          totalBossKills: Math.max(existingData.stats.totalBossKills, body.localStats.totalBossKills),
        },
        lastSyncAt: now,
        createdAt: existingData.createdAt,
      };

      merged = true;
    } else {
      // New player - create from local state
      mergedData = {
        uid: user.uid,
        displayName: user.name || 'Player',
        pinecones: body.localState.pinecones,
        totalPineconesEarned: body.localState.totalPineconesEarned,
        unlockedIds: body.localState.unlockedIds,
        equipped: body.localState.equipped,
        stats: body.localStats,
        lastSyncAt: now,
        createdAt: now,
      };
    }

    // Save merged data
    await kv.set(playerKey, mergedData);

    return new Response(JSON.stringify({
      success: true,
      data: mergedData,
      merged,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
