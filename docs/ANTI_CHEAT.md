# Anti-Cheat System

This document explains how Quillstorm's anti-cheat system validates leaderboard submissions. The system uses a layered approach: client-side checksums, server-side session tracking, rate limiting, and a shadow leaderboard honeypot.

---

## Architecture Overview

```
Game Start                Upgrade Picked             Wave Complete              Player Dies               Score Submit
    |                         |                          |                         |                         |
    v                         v                          v                         v                         v
POST /api/session/start   POST /api/session/upgrade  POST /api/session/wave     POST /api/session/gameover  POST /api/leaderboard/submit
    |                         |                          |                         |                         |
    v                         v                          v                         v                         v
Create session in Redis   Append to upgrade ledger   Append wave record         Mark session gameOver=true  1. Checksum validation
Return token              Validate upgrade ID        Validate kill counts       Record final score/wave     2. Timestamp window check
                                                     Validate score growth                                  3. Rate limit check
                                                     Validate modifier snapshot                              4. Session validation
                                                     Run behavioral heuristics                               5. Modifier/heuristic check
                                                                                                            6. Save to real or shadow LB
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

During gameplay, every enemy kill calls `SessionManager._rk(enemyType, isElite)`. Kill counts accumulate per-wave. All client-side SessionManager methods use obfuscated `_xx` names — see `docs/OBFUSCATION_REFERENCE.md` (gitignored) for the full mapping.

```typescript
// Example after killing some enemies in a wave
{ scurrier: 15, spitter: 7, swooper: 5, splitter: 4, burrower: 3 }
```

Kills are recorded in two places in GameScene: player quill kills and companion quill kills.

### Upgrade Tracking (v0.5.1)

When the player selects an upgrade (from wave completion, chest, or level-up), `SessionManager._rp(upgradeId, source)` sends the pick to the server:

- **Client sends**: `{ token, upgradeId: "sharp_quills", source: "wave", wave: 5 }`
- **Server** (`api/session/upgrade.ts`) appends to `session.upgradeLedger`:
  ```typescript
  { id: "sharp_quills", source: "wave", wave: 5, known: true }
  ```
- The `known` flag indicates whether the upgrade ID exists in the server's lookup table (`api/_lib/upgrades.ts`)
- Unknown upgrade IDs are still recorded (flagged during validation later)

### Wave Completion Reports

When a wave ends, `SessionManager._rw(wave, score)` sends the accumulated kills plus additional telemetry to the server:

- **Client sends**:
  ```json
  {
    "token": "2kt2lacvfzyFBgPc0C31Z02J",
    "wave": 19,
    "kills": { "splitter": 4, "splitling": 6, "scurrier": 15 },
    "eliteKills": { "scurrier": 1 },
    "dangerLevel": 3,
    "score": 10145,
    "pm": { "d": 45, "t": 3, "b": 1 },
    "sm": { "m": 200, "c": 50, "p": 75 },
    "ds": { "a": 50, "e": 30 },
    "um": { "d": 350, "fr": 200, "rr": 100, "mh": 40000, ... },
    "qf": 127,
    "wt": 28500
  }
  ```
- **Server** (`api/session/wave.ts`) validates:
  1. Wave is sequential (must be `session.waves.length + 1`)
  2. Score increased from previous wave
  3. Score increase is reasonable relative to kills reported (within tolerance)
  4. **Modifier snapshot** matches expected values from upgrade ledger (v0.5.1)
  5. **Behavioral heuristics**: quill efficiency, wave timing, damage patterns (v0.5.1)
- **Server** appends a `WaveRecord` to the session's `waves` array
- **Client** resets kill counts and per-wave metrics for the next wave

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

When the player dies, `SessionManager._rg(finalWave, finalScore)` is called:

- **Client sends**: `{ token, finalWave: 20, finalScore: 35775, kills: {...}, eliteKills: {...}, dangerLevel: 3, pm: {...}, sm: {...}, ds: {...}, um: {...}, qf: 45, wt: 12000 }`
- The `kills` field contains all unreported kills since the last wave report (current wave + infinite swarm)
- The `um`, `qf`, `wt` fields contain the final wave's modifier snapshot, quills fired, and wave duration
- **Server** (`api/session/gameover.ts`) marks the session:
  ```typescript
  session.gameOver = true;
  session.finalScore = 35775;
  session.finalWave = 20;
  session.finalKills = { scurrier: 12, ... };
  session.finalUm = { d: 350, fr: 200, ... };  // Final modifier snapshot
  session.finalQf = 45;                         // Quills fired in final wave
  session.finalWt = 12000;                      // Final wave duration
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
4. Check modifiersFlagged (Layer 8)
5. Run original perf check (35k+/wave 20) and enhanced perf check (25k+/wave 15+)
6. Delete session (one-time use)
```

If any validation fails, the score goes to the **shadow leaderboard** (see Layer 5).

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

### Diagnostic Records

When a score is shadow-routed, a diagnostic record is stored at `shadow:diagnostic:<id>` with a 7-day TTL. The `<id>` matches the first field in the shadow member string.

The record captures:
- Which specific validation checks failed (`failureReasons` array)
- Session metadata (stage, mutators, perks, score multiplier)
- All heuristic flags accumulated during the session
- Last modifier snapshot vs expected values from the upgrade ledger
- Wave-by-wave score progression
- Full upgrade ledger

See `docs/LEADERBOARD_ADMIN.md` for commands to query diagnostic records.

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
| `score` | 0 or greater (no upper cap since v0.5.0) |
| `wave` | 1 or greater (infinite swarm goes beyond 20) |
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

2. Player picks upgrade after wave 1
   Client: POST /api/session/upgrade { token, upgradeId: "sharp_quills", source: "wave", wave: 1 }
   Server: Appends to session.upgradeLedger

3. Wave 1 Complete
   Client: POST /api/session/wave { token, wave: 1, kills: {...}, score: 1250,
     pm: {...}, sm: {...}, ds: {...}, um: {...}, qf: 45, wt: 25000 }
   Server: Validates sequential wave, reasonable score, modifier snapshot,
     behavioral heuristics, appends to session

4. ... (waves 2-20, with upgrade reports between waves)

5. Player Dies
   Client: POST /api/session/gameover { token, finalWave: 20, finalScore: 35775,
     kills: {...}, um: {...}, qf: 30, wt: 15000 }
   Server: Marks session gameOver=true, stores final data, reduces TTL to 5 minutes

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
     e. Check modifiersFlagged (upgrade ledger mismatch)
     f. Run enhanced perf check (25k+/wave 15+)
     g. Save to REAL leaderboard (or shadow if any check failed)
     h. Delete session (one-time use)
     i. Return rank
```

### Cheater Flow

```
1. Attacker modifies damage in DevTools and plays normally
   → Upgrade ledger records only legitimate upgrade picks
   → Modifier snapshot shows inflated damage (e.g., 5000 vs expected 300)
   → Server reconstructs expected damage from ledger: mismatch detected
   → modifiersFlagged = true → Shadow leaderboard

2. Attacker submits fabricated score directly
   Client: POST /api/leaderboard/submit { score: 999999, ... }

   Possible outcomes:
   a. Invalid checksum → 400 error (doesn't know the salt)
   b. No session token → Shadow leaderboard (fake success)
   c. Session exists but score doesn't match history → Shadow leaderboard
   d. Session exists but game over not reported → Shadow leaderboard
   e. Session exists but modifiers don't match upgrade ledger → Shadow leaderboard
   f. Session exists but enhanced perf check fails → Shadow leaderboard

3. Attacker tries to spoof all data consistently
   → Must fake upgrade reports matching desired modifier values
   → Must fake modifier snapshot matching faked upgrade reports
   → Must fake quill efficiency consistent with kill counts
   → Must fake wave timing consistent with enemy spawn rates
   → Must fake damage taken patterns consistent with no invincibility
   → Exponentially harder to spoof all layers consistently

4. Attacker sees "success" with ranks
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

**Original check**: wave >= 20 AND score >= 35,000.

**Enhanced check (v0.5.1)**: wave >= 15 AND score >= 25,000. This catches cheaters who inflate scores at lower wave thresholds. Both checks must pass for submission to the real leaderboard.

Old clients that don't send `pm` data pass (backwards compatibility).

### Detection Logic

- **Fail if** every single wave shows zero engagement (no damage taken, no hits, no shield blocks)
- Any wave with at least one hit, damage, or shield break counts as engagement and passes validation
- Shield blocks count as engagement (legitimate defensive play)

### Integration

Failed validation routes to the shadow leaderboard via the existing honeypot mechanism.

---

## Layer 8: Upgrade Ledger & Modifier Snapshot Validation (v0.5.1)

Detects modifier tampering (damage, fire rate, regen, etc.) by cross-referencing the player's actual upgrade picks with their reported modifier values.

### Upgrade Ledger

Every upgrade pick is reported to the server via `POST /api/session/upgrade`. The server maintains a ledger of all picks in the session:

```typescript
session.upgradeLedger = [
  { id: "sharp_quills", source: "wave", wave: 1, known: true },
  { id: "rapid_fire", source: "wave", wave: 2, known: true },
  { id: "golden_touch", source: "chest", wave: 3, known: true },
  // ...
];
```

### Server-Side Upgrade Lookup

`api/_lib/upgrades.ts` contains a lookup table mapping all 82 upgrade IDs to their effects:

```typescript
UPGRADE_LOOKUP["sharp_quills"] = {
  effects: { damage: 0.15 },
  maxStacks: undefined  // no limit
};
```

This is the server's authoritative source for what each upgrade does.

### Modifier Reconstruction

When the client reports a modifier snapshot (`um` field), the server **reconstructs** expected modifiers from the upgrade ledger:

```typescript
// Server-side reconstruction
const expected = reconstructModifiers(session.upgradeLedger);
// expected.damage = 0.15 + 0.15 = 0.30  (two sharp_quills picks)

// Client reported
const reported = um.d / 1000;  // um.d = 300 → 0.30

// Compare with tolerance: ±5% or ±1 absolute (whichever is larger)
```

### Validation Rules

- Each modifier key is compared against its expected value from the ledger
- **Tolerance**: `max(expected * 0.05, 0.001)` — accounts for float rounding
- **Minor flag**: reported value exceeds expected + tolerance
- **Major flag**: reported value exceeds expected × 2 (double the expected value)
- **Hard reject**: 3 or more major flags → session is blocked from real leaderboard
- **Soft flag**: fewer than 3 major flags → `session.modifiersFlagged = true`

### What This Replaces

Previously (pre-v0.5.72), a separate "Stat Metrics Validation" layer used crude wave-based bounds to check HP, quills, prosperity, armor, and evasion (e.g., `maxHP = 100 + wave * 25`). This was removed because the upgrade ledger provides **exact** expected values for all these stats. The wave-based bounds caused false positives for legitimate infinite swarm runs where players accumulate hundreds of upgrades on wave 20.

### Why This Is Hard to Spoof

A cheater who modifies `upgradeManager.modifiers.set('damage', 5.0)` in DevTools will:
1. Have their actual damage modifier reported as `5000` in the `um.d` field
2. But the server knows they only picked upgrades worth `0.30` total damage
3. The mismatch is flagged → shadow leaderboard

To spoof successfully, the cheater would need to:
- Intercept and modify the `um` field in every wave report
- Know the exact expected values from their upgrade picks
- Also spoof consistent quill efficiency and wave timing (Layer 9)

### Modifier Snapshot Keys

All values are transmitted as integers (raw value × 1000):

| Key | Modifier |
|-----|----------|
| `d` | damage |
| `fr` | fireRate |
| `rr` | regenRate |
| `ps` | projectileSpeed |
| `pc` | projectileCount |
| `mh` | maxHealth |
| `mq` | maxQuills |
| `pr` | prosperity |
| `dl` | dangerLevel |
| `cc` | critChance |
| `ar` | armor |
| `ev` | evasion |
| `vs` | vampirismStrength |
| `sc` | shieldCharges |
| `pi` | piercing |
| `bo` | bouncing |

---

## Layer 9: Behavioral Heuristics (v0.5.1)

Detects stat manipulation indirectly by analyzing gameplay patterns. These heuristics flag suspicious behavior but do **not** reject submissions outright — they add flags to `session.heuristicFlags[]` for use in future analysis.

### Quill Efficiency

Checks whether the kills-per-quill ratio is impossibly high:

- Calculates total kills from kill counts
- Compares against quills fired (`qf` field)
- Accounts for piercing and projectile count from the modifier snapshot
- **Flag if**: `kills / adjustedQuills > 0.95` (nearly every quill kills an enemy with no multi-hit upgrades)

### Wave Timing

Checks whether waves are completed impossibly fast:

- **Minimum wave time (early waves 1-5)**: 2000ms
- **Minimum wave time (later waves 6+)**: 4000ms
- **Flag if**: wave completed faster than the minimum with a significant kill count

### Damage Patterns

Cross-references damage taken with defensive stats:

- **Flag if**: player takes zero damage in waves 8+ with no armor and no evasion upgrades (enemies should be hitting by then)
- **Flag if**: 3+ consecutive waves of zero damage with no defenses (across session history)

### Integration

- Heuristic flags are stored in `session.heuristicFlags[]`
- Currently used for analysis/monitoring only — not blocking submissions
- Future: flag accumulation threshold could trigger shadow leaderboard routing

---

## Known Limitations

1. **Canvas fingerprint is weak** - Can be spoofed by matching browser/GPU. Provides basic deterrence, not strong identification.
2. **Kill counts are self-reported** - The server validates they're reasonable but can't verify exact kills happened.
3. **Score tolerance is generous** - 2.6x multiplier on expected points leaves room for inflated scores within bounds.
4. **Timestamp relies on client clock** - If client clock is >3s off from server, legitimate submissions fail.
5. **Salt is in the client bundle** - Determined attackers can extract it from the JS bundle. The checksum is a speed bump, not a wall. The session validation is the stronger layer.
6. **Survivability telemetry is self-reported** - A sophisticated cheater who discovers the `pm` field could spoof realistic values. However, they'd need to reverse-engineer both the obfuscated names and the server-side thresholds.
7. **Modifier snapshot is self-reported** - The `um` field could be spoofed, but the cheater would need to fake values consistent with their upgrade ledger AND behavioral heuristics. Spoofing one layer is easy; spoofing all layers consistently is exponentially harder.
8. **Upgrade ledger relies on client reporting** - A cheater could skip sending upgrade reports, but the server would then have an empty ledger with non-zero modifiers, which is an obvious mismatch.
9. **Behavioral heuristics are passive** - Currently only flag, don't reject. A future update could use flag accumulation as a rejection trigger.

---

## Client-Side Obfuscation

All SessionManager methods use obfuscated `_xx` names in the client code to make it harder for cheaters to understand what's being tracked. No anti-cheat comments exist in client `src/` code. See `docs/OBFUSCATION_REFERENCE.md` (gitignored) for the full mapping.

---

## Files Reference

| File | Role |
|------|------|
| `src/systems/SessionManager.ts` | Client session tracking (obfuscated method names) |
| `src/systems/LeaderboardManager.ts` | Client score submission + checksum |
| `src/scenes/UpgradeScene.ts` | Reports upgrade picks via `SessionManager._rp()` |
| `src/systems/QuillManager.ts` | Tracks quills fired via `SessionManager._rf()` |
| `src/scenes/GameScene.ts` | Sends modifier snapshots, wave timing, and performance data |
| `api/session/start.ts` | Create session endpoint |
| `api/session/wave.ts` | Wave completion endpoint (validates modifiers + heuristics) |
| `api/session/gameover.ts` | Game over endpoint |
| `api/session/upgrade.ts` | Upgrade pick recording endpoint (v0.5.1) |
| `api/_lib/session.ts` | Session types, all validation logic, point values |
| `api/_lib/upgrades.ts` | Server-side upgrade ID → effects lookup table (v0.5.1) |
| `api/leaderboard/submit.ts` | Score submission + shadow honeypot |
| `api/leaderboard/global.ts` | Global leaderboard + shadow merge |
| `api/leaderboard/weekly.ts` | Weekly leaderboard + shadow merge |
| `api/_lib/validation.ts` | Checksum generation/validation, input validation |
| `api/_lib/ratelimit.ts` | Rate limiting + submission cooldown |
| `docs/OBFUSCATION_REFERENCE.md` | Obfuscated name mapping (gitignored, local only) |
