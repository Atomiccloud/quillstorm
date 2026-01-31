export const config = {
  runtime: 'edge',
};

interface PlayerData {
  uid: string;
  displayName: string;
  pinecones: number;
  totalPineconesEarned: number;
  unlockedIds: string[];
  equipped: Record<string, string>;
  stats: {
    highScore: number;
    highestWave: number;
    totalRuns: number;
    totalKills: number;
    totalBossKills: number;
  };
  lastSyncAt: number;
  createdAt: number;
}

interface PurchaseRequest {
  cosmeticId: string;
}

// Server-side cosmetic costs (authoritative)
// Must match client-side cosmetics.ts prices
const COSMETIC_COSTS: Record<string, number> = {
  // Skins
  skin_arctic: 500,
  skin_shadow: 1000,
  skin_golden: 2000,
  // Hats
  hat_crown: 800,
  hat_wizard: 600,
  hat_viking: 750,
  hat_chef: 400,
  // Quill Styles
  quill_fire: 400,
  quill_ice: 400,
  quill_void: 600,
  quill_rainbow: 1000,
  // Trails
  trail_sparkles: 500,
  trail_leaves: 400,
  trail_stars: 700,
  trail_fire: 800,
};

// Non-purchasable items (default or achievement-locked)
const NON_PURCHASABLE = new Set([
  'skin_classic',
  'skin_spectral',
  'skin_inferno',
  'hat_none',
  'hat_party',
  'hat_halo',
  'quill_classic',
  'trail_none',
]);

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Verify Firebase ID token (simplified for edge runtime)
async function verifyToken(token: string): Promise<{ uid: string; name?: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    if (!payload.sub || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;

    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'quillstorm-dbc45';
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;

    return {
      uid: payload.sub,
      name: payload.name,
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

  let body: PurchaseRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { cosmeticId } = body;

  // Validate cosmetic ID
  if (!cosmeticId || typeof cosmeticId !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Invalid cosmetic ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if item is purchasable
  if (NON_PURCHASABLE.has(cosmeticId)) {
    return new Response(JSON.stringify({ success: false, error: 'Item not purchasable' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cost = COSMETIC_COSTS[cosmeticId];
  if (cost === undefined) {
    return new Response(JSON.stringify({ success: false, error: 'Unknown cosmetic' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { kv } = await import('@vercel/kv');
    const playerKey = `player:${user.uid}`;

    // Get player data
    const playerData = await kv.get<PlayerData>(playerKey);

    if (!playerData) {
      return new Response(JSON.stringify({ success: false, error: 'Player data not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already owned
    if (playerData.unlockedIds.includes(cosmeticId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Already owned',
        newBalance: playerData.pinecones,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if can afford
    if (playerData.pinecones < cost) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient pinecones',
        newBalance: playerData.pinecones,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Perform purchase
    const updatedData: PlayerData = {
      ...playerData,
      pinecones: playerData.pinecones - cost,
      unlockedIds: [...playerData.unlockedIds, cosmeticId],
      lastSyncAt: Date.now(),
    };

    await kv.set(playerKey, updatedData);

    return new Response(JSON.stringify({
      success: true,
      newBalance: updatedData.pinecones,
      unlockedId: cosmeticId,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
