// Record upgrade selection for anti-cheat tracking
// Builds a server-side ledger of all upgrades picked during a session

import {
  getSessionKey,
  SESSION_TTL_SECONDS,
  GameSession,
} from '../_lib/session';
import { UPGRADE_LOOKUP } from '../_lib/upgrades';

export const config = {
  runtime: 'edge',
};

interface UpgradeRequest {
  token: string;
  upgradeId: string;
  source: string; // 'wave' | 'chest' | 'levelup' | 'bossReward'
  wave: number;
}

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isKVConfigured()) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let body: UpgradeRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate required fields
  if (!body.token || typeof body.token !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.upgradeId || typeof body.upgradeId !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Invalid upgrade' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body.wave !== 'number' || body.wave < 1) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid wave' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { kv } = await import('@vercel/kv');

    const sessionKey = getSessionKey(body.token);
    const sessionData = await kv.get<string>(sessionKey);

    if (!sessionData) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const session: GameSession = typeof sessionData === 'string'
      ? JSON.parse(sessionData)
      : sessionData;

    if (session.gameOver) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate upgrade ID exists in our lookup
    const isKnownUpgrade = !!UPGRADE_LOOKUP[body.upgradeId];

    // Initialize ledger if needed
    if (!session.upgradeLedger) {
      session.upgradeLedger = [];
    }

    // Record the upgrade pick (even if unknown - we'll flag it during validation)
    session.upgradeLedger.push({
      id: body.upgradeId,
      source: body.source || 'wave',
      wave: body.wave,
      known: isKnownUpgrade,
    });

    await kv.set(sessionKey, JSON.stringify(session), { ex: SESSION_TTL_SECONDS });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Upgrade record error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
