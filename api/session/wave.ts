// Record wave completion for anti-cheat tracking

import {
  getSessionKey,
  SESSION_TTL_SECONDS,
  GameSession,
  KillCounts,
  WaveRecord,
  StatMetrics,
  validateWaveReport,
  validateStatMetrics,
} from '../_lib/session';

export const config = {
  runtime: 'edge',
};

interface WaveRequest {
  token: string;
  wave: number;
  kills: KillCounts;
  eliteKills?: KillCounts;
  dangerLevel?: number;
  score: number;
  pm?: { d: number; t: number; b: number };
  sm?: StatMetrics;
}

interface WaveResponse {
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

  let body: WaveRequest;
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

  if (typeof body.wave !== 'number' || body.wave < 1) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid wave' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof body.score !== 'number' || body.score < 0) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid score' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.kills || typeof body.kills !== 'object') {
    return new Response(JSON.stringify({ success: false, error: 'Invalid kills' }), {
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

    // Check if game already ended
    if (session.gameOver) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate wave report (include elite kills + danger for accurate score calculation)
    const validation = validateWaveReport(session, body.wave, body.kills, body.score, body.eliteKills, body.dangerLevel);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate stat metrics (HP/quills/prosperity) - silently flag if suspicious
    const statValidation = validateStatMetrics(body.wave, body.sm);
    if (!statValidation.valid) {
      session.statsFlagged = true;
    }

    // Add wave record
    const waveRecord: WaveRecord = {
      wave: body.wave,
      kills: body.kills,
      ...(body.eliteKills && typeof body.eliteKills === 'object' ? { eliteKills: body.eliteKills } : {}),
      ...(typeof body.dangerLevel === 'number' ? { dangerLevel: body.dangerLevel } : {}),
      score: body.score,
      timestamp: Date.now(),
      ...(body.pm && typeof body.pm === 'object' ? { pm: body.pm } : {}),
      ...(body.sm && typeof body.sm === 'object' ? { sm: body.sm } : {}),
    };
    session.waves.push(waveRecord);

    // Update session in Redis
    await kv.set(sessionKey, JSON.stringify(session), { ex: SESSION_TTL_SECONDS });

    const response: WaveResponse = { success: true };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Wave record error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
