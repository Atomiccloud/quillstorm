# Leaderboard Admin Guide

Instructions for managing leaderboard scores via the Upstash Redis REST API.

## Connection Details

- **API URL**: Stored in `.env.local` as `KV_REST_API_URL`
- **Auth Token**: Stored in `.env.local` as `KV_REST_API_TOKEN`

## Redis Keys

| Key | Type | Description |
|-----|------|-------------|
| `leaderboard:global` | Sorted Set | All-time top 100 scores |
| `leaderboard:weekly:<year>:<week>` | Sorted Set | Weekly top 100 scores |
| `shadow:leaderboard:global` | Sorted Set | Honeypot (failed validation scores) |
| `shadow:leaderboard:weekly:<year>:<week>` | Sorted Set | Honeypot weekly |
| `shadow:diagnostic:<id>` | String (JSON) | Why a shadow score was flagged (7-day TTL) |

### Weekly Key Format

The week number uses ISO week calculation. To get the current week key:

```bash
node -e "
const d = new Date();
const dayNum = d.getUTCDay() || 7;
d.setUTCDate(d.getUTCDate() + 4 - dayNum);
const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
console.log('leaderboard:weekly:' + d.getUTCFullYear() + ':' + week);
"
```

## Member Format

Each sorted set member is a pipe-delimited string:

```
<id>|<playerName>|<wave>|<timestamp>
```

Example: `aBc123xYz456|PlayerName|20|1704067200000`

The score (integer) is the Redis sorted set score.

## Common Operations

All commands use the Upstash REST API via curl. Replace `$URL` and `$TOKEN` with values from `.env.local`.

### List Top 10 Scores (Global)

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZRANGE", "leaderboard:global", "0", "9", "REV", "WITHSCORES"]'
```

### List Top 10 Scores (Weekly)

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZRANGE", "leaderboard:weekly:YEAR:WEEK", "0", "9", "REV", "WITHSCORES"]'
```

### Find a Player's Entries

Search by player name in the member string. First list all entries, then filter:

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZRANGE", "leaderboard:global", "0", "99", "REV", "WITHSCORES"]' | node -e "
const data = require('fs').readFileSync('/dev/stdin','utf8');
const r = JSON.parse(data).result;
const name = process.argv[1];
for (let i = 0; i < r.length; i += 2) {
  if (r[i].toLowerCase().includes(name.toLowerCase())) {
    console.log('Member:', r[i], '| Score:', r[i+1]);
  }
}
" "PLAYER_NAME"
```

### Remove a Score (by exact member string)

You must use the EXACT member string from the list command.

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZREM", "leaderboard:global", "EXACT_MEMBER_STRING"]'
```

Returns `{"result":1}` on success, `{"result":0}` if not found.

**Remember to remove from BOTH global AND weekly:**

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZREM", "leaderboard:global", "EXACT_MEMBER_STRING"]'

curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZREM", "leaderboard:weekly:YEAR:WEEK", "EXACT_MEMBER_STRING"]'
```

### Get Total Entry Count

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZCARD", "leaderboard:global"]'
```

## Step-by-Step: Remove a Cheated Score

1. **List the leaderboard** to find the exact member string
2. **Calculate the current weekly key** using the node script above
3. **Run ZREM** on `leaderboard:global` with the exact member string
4. **Run ZREM** on `leaderboard:weekly:YEAR:WEEK` with the exact member string
5. **Verify** by listing the leaderboard again

## Shadow Leaderboard

The shadow leaderboard stores scores that failed server-side validation. These are shown only to the cheater (matched by fingerprint). You generally don't need to clean these, but if needed:

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZRANGE", "shadow:leaderboard:global", "0", "99", "REV", "WITHSCORES"]'
```

## Investigating Flagged Scores

Every shadow-routed score stores a diagnostic record at `shadow:diagnostic:<id>` with a 7-day TTL. The `<id>` is the first pipe-delimited field in the shadow member string.

### Get Diagnostic for a Shadow Entry

Extract the ID from the shadow member string (first field before `|`), then:

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["GET", "shadow:diagnostic:ENTRY_ID"]' | node -e "
const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).result;
if (!r) { console.log('No diagnostic found (expired after 7 days)'); process.exit(); }
const d = JSON.parse(r);
console.log('Player:', d.playerName, '| Score:', d.score, '| Wave:', d.wave);
console.log('Reasons:', d.failureReasons.join(', '));
if (d.session) {
  console.log('Waves recorded:', d.session.waveCount, '| Upgrades:', d.session.upgradeLedgerCount);
  console.log('Modifiers flagged:', d.session.modifiersFlagged);
  if (d.session.heuristicFlags.length) console.log('Heuristic flags:', d.session.heuristicFlags.join(', '));
  if (d.session.lastModifierSnapshot && d.session.expectedModifiers) {
    console.log('\\nModifier comparison (reported vs expected):');
    const keyMap = {d:'damage',fr:'fireRate',ps:'projSpeed',pc:'projCount',mh:'maxHP',mq:'maxQuills',
      pr:'prosperity',cc:'critChance',ar:'armor',ev:'evasion',pi:'piercing',bo:'bouncing',kb:'knockback',dd:'distDmg'};
    const um = d.session.lastModifierSnapshot;
    const ex = d.session.expectedModifiers;
    for (const [k,name] of Object.entries(keyMap)) {
      const reported = (um[k] || 0) / 1000;
      const expected = ex[name] || 0;
      if (reported !== 0 || expected !== 0) {
        const match = Math.abs(reported - expected) < 0.06 ? '' : ' *** MISMATCH';
        console.log('  ' + name + ': ' + reported.toFixed(3) + ' vs ' + expected.toFixed(3) + match);
      }
    }
  }
}
"
```

### Quick Triage: List Shadow Entries with IDs

```bash
curl -s -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -d '["ZRANGE", "shadow:leaderboard:global", "0", "19", "REV", "WITHSCORES"]' | node -e "
const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).result;
for (let i = 0; i < r.length; i += 2) {
  const p = r[i].split('|');
  console.log('#' + (i/2+1) + ' | ID: ' + p[0] + ' | ' + p[1] + ' | score:' + r[i+1] + ' | wave:' + p[2]);
}
"
```

### Failure Reason Codes

| Code | Meaning |
|------|---------|
| `no_session_token` | No anti-cheat token provided |
| `session_not_found` | Session expired or token invalid |
| `fingerprint_mismatch` | Browser fingerprint changed mid-game |
| `session_validation_failed` | Wave/score consistency check failed |
| `perf_check_failed` | Zero engagement in waves 18-20 (40k+ score) |
| `perf_enhanced_failed` | Zero engagement in waves 15-20 (25k+ score) |
| `modifiers_flagged` | Modifier snapshot didn't match upgrade ledger |
