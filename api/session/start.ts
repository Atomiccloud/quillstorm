// Start a new game session for anti-cheat tracking

import {
  generateSessionToken,
  getSessionKey,
  SESSION_TTL_SECONDS,
  GameSession,
} from '../_lib/session';

export const config = {
  runtime: 'edge',
};

interface StartRequest {
  fingerprint: string;
}

interface StartResponse {
  success: boolean;
  token?: string;
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

  // Return a dummy token if KV isn't configured (development mode)
  if (!isKVConfigured()) {
    return new Response(JSON.stringify({
      success: true,
      token: 'dev-mode-no-validation',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let body: StartRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate fingerprint
  if (!body.fingerprint || typeof body.fingerprint !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'Invalid fingerprint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { kv } = await import('@vercel/kv');

    // Generate session
    const token = generateSessionToken();
    const session: GameSession = {
      token,
      fingerprint: body.fingerprint,
      startTime: Date.now(),
      waves: [],
      gameOver: false,
    };

    // Store in Redis with TTL
    await kv.set(getSessionKey(token), JSON.stringify(session), { ex: SESSION_TTL_SECONDS });

    const response: StartResponse = {
      success: true,
      token,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Session start error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
