# Anti-Cheat System

This document explains how Quillstorm's anti-cheat system validates leaderboard submissions. The system uses a layered approach: client-side checksums, server-side session tracking, rate limiting, and a shadow leaderboard honeypot.

---

## Architecture Overview

```
Game Start                Wave Complete              Player Dies               Score Submit
    |                         |                          |                         |
    v                         v                          v                         v
POST /api/session/start   POST /api/session/wave     POST /api/session/gameover  POST /api/leaderboard/submit
    |                         |                          |                         |
    v                         v                          v                         v
Create session in Redis   Append wave record         Mark session gameOver=true  1. Checksum validation
Return token              Validate kill counts       Record final score/wave     2. Timestamp window check
                          Validate score growth                                  3. Rate limit check
                                                                                4. Session validation
                                                                                5. Save to real or shadow LB
```

---

## Layer 1: Session Tracking

### Starting a Session

When GameScene loads, the client calls `SessionManager.startSession()`:

- **Client** sends: `{ fingerprint: "<canvas-hash>" }`
- **Server** (`api/session/start.ts`) creates a `GameSession` in Redis:
  ```typescript
  {
    token: "random-24-char-id",
    fingerprint: "x63j6u",        // Browser canvas fingerprint
    startTime: 1770134100000,
    waves: [],                     // Filled as waves complete
    gameOver: false
  }
  ```
- **Redis key**: `session:<token>` with 1-hour TTL
- **Client** stores the token in `SessionManager.currentToken`

### Recording Kills

During gameplay, every enemy kill calls `SessionManager.recordKill(enemyType)`. Kill counts accumulate per-wave in `SessionManager.waveKills`:

```typescript
// Example after killing some enemies in a wave
{ scurrier: 15, spitter: 7, swooper: 5, splitter: 4, burrower: 3 }
```

Kills are recorded in two places in GameScene:
- Line 581: Player quill kills
- Line 1199: Companion quill kills

### Wave Completion Reports

When a wave ends, `SessionManager.reportWaveComplete(wave, score)` sends the accumulated kills to the server:

- **Client sends**:
  ```json
  {
    "token": "2kt2lacvfzyFBgPc0C31Z02J",
    "wave": 19,
    "kills": { "splitter": 4, "splitling": 6, "scurrier": 15, ... },
    "score": 10145
  }
  ```
- **Server** (`api/session/wave.ts`) validates:
  1. Wave is sequential (must be `session.waves.length + 1`)
  2. Score increased from previous wave
  3. Score increase is reasonable relative to kills reported (within tolerance)
- **Server** appends a `WaveRecord` to the session's `waves` array
- **Client** resets kill counts for the next wave

### Wave Score Validation

The server calculates expected points from the reported kills using known point values:

```typescript
// Enemy point values (must match client config)
scurrier: 10,  spitter: 20,   swooper: 25,
splitter: 30,  burrower: 35,  shellback: 40,
healer: 50,    splitling: 10, boss: 500,
flyingBoss: 600
```

Validation rules:
- Score increase must not exceed `expectedPoints * 1.3 * 2` (2.6x tolerance, accounts for splitlings and rounding)
- Score increase below `expectedPoints * 0.7 * 0.5` is noted but not rejected (edge cases)
- Maximum allowed increase per wave: 4000 points (60 enemies + boss ceiling)

### Game Over Report

When the player dies, `SessionManager.reportGameOver(wave, score)` is called:

- **Client sends**: `{ token, finalWave: 20, finalScore: 35775, kills: { scurrier: 12, ... } }`
- The `kills` field contains all unreported kills since the last wave report (current wave + infinite swarm)
- **Server** (`api/session/gameover.ts`) marks the session:
  ```typescript
  session.gameOver = true;
  session.finalScore = 35775;
  session.finalWave = 20;
  session.finalKills = { scurrier: 12, ... };
  ```
- Session TTL is reduced to 5 minutes (just enough time for the player to submit)

---

## Layer 2: Checksum Validation

When submitting a score to the leaderboard, the client generates a checksum:

```typescript
// Client-side (LeaderboardManager.ts)
const timestamp = Date.now();
const fingerprint = getBrowserFingerprint();  // Canvas-based hash
const data = `${score}:${wave}:${timestamp}:${fingerprint}:${SALT}`;
const checksum = sha256(data).slice(0, 16);   // First 16 hex chars
```

The server recomputes the same checksum and compares:

```typescript
// Server-side (api/_lib/validation.ts)
const expectedChecksum = await generateChecksum(score, wave, timestamp, fingerprint);
if (data.checksum !== expectedChecksum) {
  return { valid: false, error: 'Invalid checksum' };
}
```

### Salt Configuration

- **Client** reads: `import.meta.env.VITE_CHECKSUM_SALT` (baked into the Vite build)
- **Server** reads: `process.env.VITE_CHECKSUM_SALT` (from Vercel env vars at runtime)
- Both must be the same value for checksums to match
- Fallback: empty string (env var must be set for checksums to work)

### Timestamp Window

The submission timestamp must be within **3 seconds** of the server's time:

```typescript
const timeDiff = Math.abs(serverTime - data.timestamp);
if (timeDiff > 3000) {
  return { valid: false, error: 'Request expired' };
}
```

This prevents replay attacks (resubmitting captured requests later).

### Browser Fingerprint

A canvas-based fingerprint is generated by:
1. Creating a 200x50 canvas
2. Drawing "Quillstorm" text with specific fonts and colors
3. Getting the canvas `toDataURL()`
4. Hashing the data URL to a base-36 string

This fingerprint is:
- Sent when starting a session (bound to the session)
- Included in the checksum computation
- Verified to match between session start and score submission
- Used to filter shadow leaderboard entries for per-user display

---

## Layer 3: Session-Based Submission Validation

When submitting to `/api/leaderboard/submit`, the server validates the score against the full session history:

```typescript
// submit.ts - Session validation flow
1. Look up session by token
2. Verify fingerprint matches session fingerprint
3. Validate submission against session history:
   a. Session must have gameOver = true
   b. Wave must match last recorded wave (or +1 for partial wave)
   c. Score validated against kill data:
      - Sum all wave-reported kill points (waves 1-20)
      - Add unreported kill points from gameover (current wave + infinite swarm)
      - Final score must not exceed total expected + 30% tolerance
   d. Score must not be below 90% of last recorded score
4. Delete session (one-time use)
```

If session validation fails, the score goes to the **shadow leaderboard** (see Layer 5).

---

## Layer 4: Rate Limiting

Two rate limiting mechanisms protect against abuse:

### Request Rate Limit
- **Window**: 60 seconds
- **Max requests**: 6 per window
- **Key**: `ratelimit:<client-ip>`
- **Behavior**: Returns 429 "Too many requests"

### Submission Cooldown
- **Cooldown**: 10 seconds between submissions
- **Key**: `submission:<client-ip>`
- **Behavior**: Returns 429 "Please wait before submitting again"

Both use Redis with automatic expiry. If Redis fails, the system fails open (allows the request).

---

## Layer 5: Shadow Leaderboard (Honeypot)

Failed session validation doesn't return an error -- it silently redirects to a shadow leaderboard:

```typescript
// If session validation failed, save to shadow leaderboard instead
if (!isValidSession) {
  return await shadowSubmit(kv, playerName, score, wave, fingerprint);
}
```

### How It Works

1. The shadow submit saves to `shadow:leaderboard:global` and `shadow:leaderboard:weekly:<year>:<week>`
2. Returns a **fake success response** with plausible-looking ranks:
   ```json
   { "success": true, "globalRank": 12, "weeklyRank": 5 }
   ```
3. The cheater thinks their score was accepted

### Shadow Entry Format

Shadow entries include the fingerprint for per-user filtering:
```
<id>|<name>|<wave>|<timestamp>|<fingerprint>
```

Regular entries don't include fingerprint:
```
<id>|<name>|<wave>|<timestamp>
```

### Personalized Leaderboard Display

When a player views the leaderboard, their fingerprint is sent as a query parameter (`?fp=x63j6u`). The server:

1. Fetches the real leaderboard entries
2. Fetches shadow entries matching that fingerprint
3. Merges them together, sorted by score
4. Returns the combined list

This means cheaters see their own fake scores mixed in with real scores, but no one else sees them. Legitimate players see only real entries.

### Shadow Leaderboard Limits

- Max 500 entries in shadow global (vs 100 in real)
- Same weekly TTL as real weekly leaderboard
- Excess entries pruned by lowest score

---

## Layer 6: Input Validation

Basic server-side validation on all submissions:

| Field | Validation |
|-------|-----------|
| `playerName` | 3-20 chars, alphanumeric + spaces only |
| `score` | 0 to 2,999,999 |
| `wave` | 1 to 20 |
| `timestamp` | Must be a number |
| `fingerprint` | Must be a non-empty string |
| `checksum` | Must match server computation |

---

## Complete Request Flow

### Normal Game Session

```
1. Game Start
   Client: POST /api/session/start { fingerprint }
   Server: Creates session, returns token

2. Wave 1 Complete
   Client: POST /api/session/wave { token, wave: 1, kills: {...}, score: 1250 }
   Server: Validates sequential wave, reasonable score, appends to session

3. Wave 2 Complete
   Client: POST /api/session/wave { token, wave: 2, kills: {...}, score: 2800 }
   Server: Same validation

4. ... (waves 3-20)

5. Player Dies
   Client: POST /api/session/gameover { token, finalWave: 20, finalScore: 35775, kills: {...} }
   Server: Marks session gameOver=true, stores unreported kills, reduces TTL to 5 minutes

6. Score Submission
   Client: POST /api/leaderboard/submit {
     playerName, score: 35775, wave: 20,
     timestamp, fingerprint, checksum, sessionToken
   }
   Server:
     a. Validate checksum (salt + score + wave + timestamp + fingerprint)
     b. Validate timestamp within 3s window
     c. Check rate limits
     d. Validate session (gameOver=true, score matches, wave matches)
     e. Save to REAL leaderboard
     f. Delete session (one-time use)
     g. Return rank
```

### Cheater Flow

```
1. Attacker submits fabricated score
   Client: POST /api/leaderboard/submit { score: 999999, ... }

   Possible outcomes:
   a. Invalid checksum → 400 error (doesn't know the salt)
   b. No session token → Shadow leaderboard (fake success)
   c. Session exists but score doesn't match history → Shadow leaderboard
   d. Session exists but game over not reported → Shadow leaderboard

2. Attacker sees "success" with ranks
   → They think they made the leaderboard
   → Only they can see their score (filtered by fingerprint)
   → Real players never see the fake score
```

---

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `VITE_CHECKSUM_SALT` | Client (build-time) + Server (runtime) | Shared secret for checksum |
| `KV_REST_API_URL` | Server | Upstash Redis connection |
| `KV_REST_API_TOKEN` | Server | Upstash Redis auth |

---

## Layer 7: Survivability Validation

Detects invincibility cheats by tracking per-wave damage metrics. The client reports obfuscated telemetry with each wave and game-over report. The server validates this data at submission time.

### What's Tracked

Each wave report includes an optional `pm` field with obfuscated sub-fields. See `docs/OBFUSCATION_REFERENCE.md` (gitignored) for the full mapping of obfuscated names to their real meaning.

### When Validation Runs

Only for high scores: **wave >= 20 AND score >= 35,000**. Lower scores are not checked. Old clients that don't send `pm` data also pass (backwards compatibility).

### Detection Logic

- **Fail if** every single wave shows zero engagement (no damage taken, no hits, no shield blocks)
- Any wave with at least one hit, damage, or shield break counts as engagement and passes validation
- Shield blocks count as engagement (legitimate defensive play)

### Integration

Failed validation routes to the shadow leaderboard via the existing honeypot mechanism.

---

## Layer 8: Stat Metrics Validation

Detects players who modify their HP, quill count, or prosperity values via console/memory hacking. The client reports these stats (obfuscated) with each wave and game-over report.

### What's Tracked

Each wave report includes an optional `sm` field with obfuscated sub-fields:
- `m` - Max health
- `c` - Max quills (capacity)
- `p` - Prosperity

### Validation Rules

The server calculates maximum allowed values based on the wave number:
- **Max HP** = `100 + (wave * 25)` (base 100 + ~1 legendary upgrade per wave)
- **Max Quills** = `30 + (wave * 20)` (base 30 + ~1 epic upgrade per wave)
- **Max Prosperity** = `wave * 25` (base 0 + ~1 epic upgrade per wave)

These bounds are intentionally generous to avoid false positives.

| Wave | Max HP | Max Quills | Max Prosperity |
|------|--------|------------|----------------|
| 1    | 125    | 50         | 25             |
| 10   | 350    | 230        | 250            |
| 20   | 600    | 430        | 500            |

### Detection Logic

If any reported stat exceeds its wave-based maximum, the session is flagged with `statsFlagged: true`. This flag persists through the session and causes the final score submission to route to the shadow leaderboard.

### Integration

- Flag is set silently (request still returns success)
- Flag is checked at score submission time alongside other validations
- Flagged sessions go to shadow leaderboard via existing honeypot

---

## Known Limitations

1. **Canvas fingerprint is weak** - Can be spoofed by matching browser/GPU. Provides basic deterrence, not strong identification.
2. **Kill counts are self-reported** - The server validates they're reasonable but can't verify exact kills happened.
3. **Score tolerance is generous** - 2.6x multiplier on expected points leaves room for inflated scores within bounds.
4. **Timestamp relies on client clock** - If client clock is >3s off from server, legitimate submissions fail.
5. **Salt is in the client bundle** - Determined attackers can extract it from the JS bundle. The checksum is a speed bump, not a wall. The session validation is the stronger layer.
6. **Survivability telemetry is self-reported** - A sophisticated cheater who discovers the `pm` field could spoof realistic values. However, they'd need to reverse-engineer both the obfuscated names and the server-side thresholds.
7. **Stat metrics are self-reported** - Similar to survivability, the `sm` field could be spoofed by someone who reverse-engineers the obfuscated names and validation bounds.

---

## Files Reference

| File | Role |
|------|------|
| `src/systems/SessionManager.ts` | Client session tracking |
| `src/systems/LeaderboardManager.ts` | Client score submission + checksum |
| `api/session/start.ts` | Create session endpoint |
| `api/session/wave.ts` | Wave completion endpoint |
| `api/session/gameover.ts` | Game over endpoint |
| `api/leaderboard/submit.ts` | Score submission + shadow honeypot |
| `api/leaderboard/global.ts` | Global leaderboard + shadow merge |
| `api/leaderboard/weekly.ts` | Weekly leaderboard + shadow merge |
| `api/_lib/session.ts` | Session types, validation logic, point values |
| `api/_lib/validation.ts` | Checksum generation/validation, input validation |
| `api/_lib/ratelimit.ts` | Rate limiting + submission cooldown |
