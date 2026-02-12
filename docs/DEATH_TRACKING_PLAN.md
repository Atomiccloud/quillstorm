# Death Tracking & Gameplay Summary

## Context

Players in chaotic late-game waves often die without understanding what killed them. Discord feedback: *"maybe an explosion on the screen + missed an evasion roll; not sure"*. Research across 10 roguelike survivors shows "what killed me?" is the #1 most requested feature when absent (Enter the Gungeon is the gold standard with an explicit "Killed By" field). Richer end-of-run stats are also highly valued — Brotato's lack of stats is one of its most common complaints.

## What Changes

### 1. "Killed By" Banner
Prominent red text below the title: `Killed by: Shellback (Rolling Attack)` or `Killed by: Bomber Zone`. Hidden on victory.

### 2. Death Recap Log (Last 5 Hits)
New panel on the left (below kills panel) showing the last 5 hits before death — source name, damage amount, wave number, and time before death. The killing blow is highlighted in red. Toggled with TAB alongside existing panels.

### 3. Enhanced "THIS RUN" Stats
Add a third row to the existing center panel:
- **DEALT** — total damage dealt by the player (green)
- **TIME** — run duration in mm:ss format (blue)

### 4. Per-Element Damage Breakdown
New section showing damage dealt by element: Physical, Fire, Ice, Lightning, Poison. Helps players evaluate their elemental build choices.

### 5. Damage Sources Panel
Section at the bottom of the kills panel showing which enemy types/attacks hurt the player most, sorted by total damage.

---

## Files to Modify

### `src/scenes/GameScene.ts` — Core tracking logic

**New class fields:**
- `runStartTime: number` — set in `create()`
- `totalDamageDealt: number` — accumulated across all damage sources
- `damageByElement: Record<string, number>` — `{ physical, fire, ice, lightning, poison }`
- `damageTakenBySource: Record<string, number>` — keyed by `"category:enemyType"`
- `hitLog: DamageHitRecord[]` — ring buffer of last 5 hits
- `lastHitSource` — the most recent hit that dealt damage (becomes "killed by")

**New method — `recordPlayerHit(source, enemyType, damage, wasTaken, wave)`:**
- Only logs if `wasTaken === true` (skip dodges/shields)
- Appends to ring buffer (max 5), updates `damageTakenBySource`, updates `lastHitSource`
- Stores `wave` (from `waveManager.currentWave`) on each record
- Marks `wasLethal` if `player.isDead()` after the hit

**Modify 5 `player._uf()` call sites** to capture return value and call `recordPlayerHit()`:

| Line | Source | Category | Enemy Type |
|------|--------|----------|------------|
| ~904 | Direct contact | `contact` | `enemy.enemyType` |
| ~887 | Rolling Shellback | `rolling` | `enemy.enemyType` |
| ~503 | Burrower surface | `burrower` | `enemy.enemyType` |
| ~694 | Bomber zone | `bomberZone` | `null` |
| ~967 | Spitter projectile | `projectile` | `'spitter'` |

**Track damage dealt by element** — at each site where `enemy._uf()` is called by player systems, increment the appropriate element counter:

| Call Site | Element | Notes |
|-----------|---------|-------|
| `onQuillHitEnemy()` ~751 | `physical` | Base quill damage |
| Explosion AOE ~785 | `physical` | 50% damage AOE |
| `applyThorns()` ~2236 | `physical` | Thorns reflection |
| Dodge counter ~927/934 | `physical` | Counter/execute damage |
| Lightning chain arcs ~1884 | `lightning` | Chain arc damage |
| Ice shatter ~2080 | `ice` | Shatter AoE |
| Fire explosion on death ~2024 | `fire` | Death explosion |

**Burn DoT tracking** — wire up a callback through WaveManager:
- WaveManager gets `onBurnDamage?: (damage: number) => void`
- In `spawnEnemy()` / `spawnInfiniteEnemy()` / `spawnSplitlings()`, set `enemy.onBurnDamage` callback that proxies to WaveManager's callback
- GameScene sets `waveManager.onBurnDamage = (d) => this.damageByElement.fire += d`
- Poison execute similarly: `onPoisonExecute?: (damage: number) => void` for T4 kill tracking

**Extend `onPlayerDeath()`** — pass new fields in `sessionStats`:
```
totalDamageDealt, runDurationMs, damageByElement, damageTakenBySource, hitLog, killedBy
```

### `src/entities/Enemy.ts` — Burn DoT callback

**Add callback field:**
```typescript
public onBurnDamage?: (damage: number) => void;
public onPoisonExecute?: (remainingHp: number) => void;
```

**In burn tick** (~line 1349, inside `updateStatusEffects`):
```typescript
this.health -= burnDamage;
this.onBurnDamage?.(burnDamage);  // NEW — fire element tracking
```

**In poison execute** (~line 1385):
```typescript
if (!this.isBoss() && this.health / this.maxHealth <= this._poisonExecuteThreshold) {
  this.onPoisonExecute?.(this.health);  // NEW — poison element tracking
  this.health = 0;
}
```

### `src/systems/WaveManager.ts` — Callback proxy

**Add callback fields:**
```typescript
public onBurnDamage?: (damage: number) => void;
public onPoisonExecute?: (damage: number) => void;
```

**In all enemy creation points** (`spawnEnemy()`, `spawnInfiniteEnemy()`, `spawnSplitlings()`), after creating the enemy:
```typescript
enemy.onBurnDamage = (d) => this.onBurnDamage?.(d);
enemy.onPoisonExecute = (d) => this.onPoisonExecute?.(d);
```

### `src/scenes/GameOverScene.ts` — UI rendering

**New types (at top of file):**
```typescript
type DamageSourceCategory = 'contact' | 'rolling' | 'burrower' | 'bomberZone' | 'projectile';

interface DamageHitRecord {
  source: DamageSourceCategory;
  enemyType: string | null;
  damage: number;        // Pre-armor amount
  timestamp: number;
  wave: number;          // Wave number when hit occurred
  wasLethal: boolean;
}
```

**Extend `SessionStats` interface** with:
- `totalDamageDealt: number`
- `runDurationMs: number`
- `damageByElement: Record<string, number>`
- `damageTakenBySource: Record<string, number>`
- `hitLog: DamageHitRecord[]`
- `killedBy: { source: DamageSourceCategory; enemyType: string | null; damage: number } | null`

**UI additions in `create()`:**
1. "Killed By" text between title and THIS RUN panel — red, 20px bold
2. Extend THIS RUN panel height from 145px to ~220px, add DEALT (green) + TIME (blue) row
3. Per-element damage breakdown — small colored bar or text row below DEALT showing fire/ice/lightning/poison proportions
4. New `createDeathRecapPanel()` — renders last 5 hits with wave number, below kills panel
5. "Damage Sources" section at bottom of kills panel
6. Wire `deathRecapPanel` to TAB toggle alongside existing panels

**New helper methods:** `formatKilledBy()`, `formatHitSource()`

**New class field:** `deathRecapPanel: Phaser.GameObjects.Container | null`

**Update `cleanup()`** to destroy `deathRecapPanel`

### Files NOT Modified
- `src/entities/Player.ts` — `_uf()` already returns the boolean we need
- `src/config.ts` — no new config constants needed

---

## Design Notes

- **Pre-armor damage in hit log**: Shows raw damage (what the enemy intended), not post-armor. More intuitive: "Shellback hit for 25" vs "18.7 after armor"
- **Wave number on hits**: Each `DamageHitRecord` stores `wave` from `waveManager.currentWave` so the recap shows "Wave 12" etc.
- **Phaser time pauses during upgrades**: `this.time.now` pauses when scene is paused, so run duration = actual gameplay time
- **Ring buffer**: Hit log capped at 5 entries — negligible memory/perf
- **Victory path**: `killedBy` is `null`, banner hidden, stats still display
- **Bomber zones**: No enemy reference (bomber may have moved/died), displayed as "Bomber Zone"
- **Poison amplification**: Poison amp makes all damage sources deal more — tracked implicitly via higher numbers on other elements. Poison execute damage tracked separately via callback.
- **Burn DoT callback**: Minimal change to Enemy.ts — just call optional callback when burn ticks. WaveManager proxies it to GameScene.

---

## Layout Sketch (1440x810 canvas)

```
                    GAME OVER
                  NEW HIGH SCORE!                      (if applicable)
              Killed by: Shellback (Rolling)           ← NEW

              ┌──────── THIS RUN ────────┐
              │  WAVE          SCORE     │
              │   12          48,230     │
              │─────────────────────────│
              │  KILLS      DMG/SHIELDS  │
              │   347        126 / 3     │
              │─────────────────────────│
              │  DEALT         TIME      │  ← NEW
              │  52,410       4:32       │  ← NEW
              │  ■■■■■■■□□□□            │  ← NEW (element bar)
              │  Phys Fire Ice Ltn Psn   │
              └─────────────────────────┘

┌─ KILLS ──────┐                          ┌─ STATS PANEL ─┐
│ Scurrier  142│                          │ (existing)     │
│ Swooper    87│                          │                │
│ ...         │                          │                │
│─────────────│                          │                │
│ ELITES ★   │                          │                │
│ ...         │                          │                │
│─────────────│                          │                │
│ DMG SOURCES │  ← NEW                   │                │
│ Shellback 45│                          │                │
│ Scurrier  32│                          │                │
└─────────────┘                          └────────────────┘

┌─ LAST HITS ──────────────────┐  ← NEW
│ W12 Shellback (Rolling) -25   now    │  ← killing blow (red)
│ W12 Scurrier            -12   2s ago │
│ W11 Bomber Zone         -20   4s ago │
│ W11 Spitter (Proj)      -15   6s ago │
│ W10 Swooper             -10   8s ago │
└──────────────────────────────┘

         [RETRY]    [RANKS]    [MENU]
         R: Restart  |  TAB: Toggle Panels
```

---

## Implementation Order

1. Define types (`DamageSourceCategory`, `DamageHitRecord`) and extend `SessionStats` in GameOverScene.ts
2. Add `onBurnDamage` / `onPoisonExecute` callbacks to Enemy.ts (2 lines + 2 calls)
3. Add callback proxying in WaveManager.ts (field + set in 3 spawn methods)
4. Add tracking fields and `recordPlayerHit()` to GameScene.ts
5. Initialize `runStartTime` and wire WaveManager callbacks in `create()`
6. Modify 5 `player._uf()` call sites to capture return and call `recordPlayerHit()`
7. Add `damageByElement` tracking at all `enemy._uf()` call sites
8. Extend `onPlayerDeath()` to pass new data
9. Implement "Killed By" banner in GameOverScene
10. Extend THIS RUN panel with DEALT + TIME + element bar
11. Implement `createDeathRecapPanel()` with wave numbers
12. Add damage sources section to kills panel
13. Wire new panels to TAB toggle and cleanup

## Verification

1. Play and die to each damage source — verify "Killed By" is correct
2. Check death recap shows last 5 hits with wave numbers and timing
3. Check per-element breakdown reflects the build (fire build → more fire damage)
4. Verify damage dealt total is reasonable relative to kill count
5. Verify run duration pauses during upgrade selection
6. TAB toggle shows/hides all panels including new ones
7. Victory screen hides "Killed By", still shows stats
8. `isReturn` from leaderboard re-renders all panels
9. `npm run build` — no type errors

## Research References

### Games Studied
- **Enter the Gungeon** — gold standard "Killed By: [Enemy Name]" field, Ammonomicon book animation
- **Vampire Survivors** — best-in-class per-weapon DPS breakdown, SI unit prefixes for large numbers
- **Hades** — narrative-first death, highlight 5 boons for social sharing
- **Risk of Rain 2** — weighted scoring categories, humorous random death messages, run history
- **Slay the Spire** — achievement-style scoring bonuses (Highlander, Overkill, etc.)
- **Brotato** — minimal stats = most common community complaint; AdvancedStatistics mod fills gap
- **Nova Drift** — no death cause = major complaint; community requests replay of final moments
- **Deep Rock Galactic: Survivor** — "Employee Review Score" thematic framing
- **20 Minutes Till Dawn** — basic stats screen
- **Halls of Torment** — quest progress integration makes every death feel productive
