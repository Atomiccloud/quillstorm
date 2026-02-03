// Record game over for anti-cheat tracking

import {
  getSessionKey,
  SESSION_TTL_SECONDS,
  GameSession,
} from '../_lib/session';

export const config = {
  runtime: 'edge',
};

interface GameOverRequest {
  token: string;
  finalWave: number;
  finalScore: number;
}

interface GameOverResponse {
  success: boolean;
  error?: string;
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

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Skip validation if KV isn't configured
  if (!isKVConfigured()) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let body: GameOverRequest;
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

  if (typeof body.finalWave !== 'number' || body.finalWave < 1) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid wave' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body.finalScore !== 'number' || body.finalScore < 0) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid score' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { kv } = await import('@vercel/kv');

    // Get existing session
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

    // Check if already ended
    if (session.gameOver) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Mark game as over
    session.gameOver = true;
    session.finalWave = body.finalWave;
    session.finalScore = body.finalScore;

    // Update session in Redis (shorter TTL since game is over)
    await kv.set(sessionKey, JSON.stringify(session), { ex: 300 }); // 5 minutes to submit

    const response: GameOverResponse = { success: true };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Game over record error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
