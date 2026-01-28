const RATE_LIMIT_WINDOW = 60; // seconds
const MAX_REQUESTS = 6; // requests per window
const SUBMISSION_COOLDOWN = 10; // seconds between submissions

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  // Skip rate limiting if KV isn't configured
  if (!isKVConfigured()) {
    return true;
  }

  const key = `ratelimit:${ip}`;

  try {
    const { kv } = await import('@vercel/kv');
    const current = await kv.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await kv.expire(key, RATE_LIMIT_WINDOW);
    }

    return current <= MAX_REQUESTS;
  } catch (error) {
    // If KV fails, allow the request (fail open)
    console.error('Rate limit check failed:', error);
    return true;
  }
}

export async function checkSubmissionCooldown(ip: string): Promise<boolean> {
  // Skip cooldown if KV isn't configured
  if (!isKVConfigured()) {
    return true;
  }

  const key = `submission:${ip}`;

  try {
    const { kv } = await import('@vercel/kv');
    const existing = await kv.get(key);

    if (existing) {
      return false; // Still in cooldown
    }

    // Set cooldown
    await kv.set(key, Date.now(), { ex: SUBMISSION_COOLDOWN });
    return true;
  } catch (error) {
    console.error('Submission cooldown check failed:', error);
    return true;
  }
}

export function getClientIP(req: Request): string {
  // Vercel provides the real IP in x-forwarded-for
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}
