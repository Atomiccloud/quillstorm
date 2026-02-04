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
