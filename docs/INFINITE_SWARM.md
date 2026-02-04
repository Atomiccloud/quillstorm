# Infinite Swarm Mode - Complete Scaling Reference

## Activation

- **Trigger**: Completing wave 20 (after defeating the 4th boss)
- **Config**: `XP_CONFIG.infiniteSwarmWave = 20`
- **Visual**: Stage switches to **Inferno** (red-tinted arena), wave text replaced with pulsing red **"INFINITE SWARM"**

---

## Formulas

### Spawn Interval Decay (deterministic, framerate-independent)

```
spawnInterval = max(10ms, 600 × 0.9943^t)    where t = seconds elapsed
```

| Parameter | Value |
|-----------|-------|
| Starting spawn interval | 600ms (~1.67 enemies/sec) |
| Decay rate | 0.57% reduction per second (compounding) |
| Minimum spawn interval (floor) | 10ms (~100 enemies/sec theoretical max) |
| Time to hit floor | ~12:00 |

### HP Multiplier (Quadratic)

```
tiers = secondsElapsed / 15
hpMultiplier = 1 + tiers^2
```

One "tier" = 15 seconds of elapsed time. No cap. Enemies become very tanky.

### Damage Multiplier (Square Root)

```
tiers = secondsElapsed / 15
dmgMultiplier = 1 + sqrt(tiers)
```

Damage grows much slower than HP. Per-enemy-type damage caps also apply.

---

## Complete Scaling Table (every 15 seconds)

| Time | HP Mult | DMG Mult | Spawn Interval | Enemies/sec |
|------|---------|----------|----------------|-------------|
| 0:00 | 1.0x | 1.0x | 600ms | 1.7 |
| 0:15 | 2.0x | 2.0x | 551ms | 1.8 |
| 0:30 | 5.0x | 2.4x | 506ms | 2.0 |
| 0:45 | 10.0x | 2.7x | 464ms | 2.2 |
| 1:00 | 17.0x | 3.0x | 426ms | 2.3 |
| 1:15 | 26.0x | 3.2x | 391ms | 2.6 |
| 1:30 | 37.0x | 3.4x | 359ms | 2.8 |
| 1:45 | 50.0x | 3.6x | 329ms | 3.0 |
| 2:00 | 65.0x | 3.8x | 302ms | 3.3 |
| 2:15 | 82.0x | 4.0x | 277ms | 3.6 |
| 2:30 | 101.0x | 4.2x | 255ms | 3.9 |
| 2:45 | 122.0x | 4.3x | 234ms | 4.3 |
| 3:00 | 145.0x | 4.5x | 214ms | 4.7 |
| 3:15 | 170.0x | 4.6x | 197ms | 5.1 |
| 3:30 | 197.0x | 4.7x | 181ms | 5.5 |
| 3:45 | 226.0x | 4.9x | 166ms | 6.0 |
| 4:00 | 257.0x | 5.0x | 152ms | 6.6 |
| 4:15 | 290.0x | 5.1x | 139ms | 7.2 |
| 4:30 | 325.0x | 5.2x | 128ms | 7.8 |
| 4:45 | 362.0x | 5.4x | 117ms | 8.5 |
| 5:00 | 401.0x | 5.5x | 108ms | 9.3 |

### Beyond 5 Minutes

| Time | HP Mult | DMG Mult | Spawn Interval | Enemies/sec |
|------|---------|----------|----------------|-------------|
| 6:00 | 577.0x | 5.9x | 77ms | 13.0 |
| 8:00 | 1025.0x | 6.7x | 39ms | 25.8 |
| 10:00 | 1601.0x | 7.3x | 19ms | 51.3 |
| 12:00 | 2305.0x | 7.9x | 10ms (floor) | 100 |

### Spawn Locations

- Ground enemies spawn at screen edges: x=50 or x=1390, y=710
- Flying enemies (swooper, healer) spawn at screen edges: x=50 or x=1390, y=100
- Ground bosses spawn at edges: x=80 or x=1360, y=660
- Flying bosses spawn at top center: x=620-820, y=100
- Side chosen randomly (50/50 left/right)

### Enemy Type Pool

All 8 regular enemy types are available (wave=20 used internally):
- Scurrier, Spitter, Swooper, Shellback, Burrower, Splitter, Splitling (from Splitter death), Healer
- **Bosses can spawn** at danger level 5+ (see Boss Spawning section below)
- Type selected randomly from weighted pool

---

## What Scales

HP and damage now scale **separately**:

- **Enemy HP** — quadratic multiplier `1 + (t/15)^2` (enemies become very tanky)
- **Enemy Damage** — square root multiplier `1 + sqrt(t/15)` (slow growth, per-type caps)
- **Enemy Speed** — capped at 1.3x max (uses HP multiplier)

### Damage Caps

Each enemy type has a maximum damage value. Caps are applied **before** the elite multiplier, so elite enemies CAN exceed these caps.

| Enemy | Damage Cap |
|-------|-----------|
| Scurrier | 150 |
| Spitter | 200 |
| Swooper | 250 |
| Shellback | 200 |
| Burrower | 250 |
| Splitter | 175 |
| Splitling | 125 |
| Healer | 100 |
| Boss | 400 |
| Flying Boss | 400 |

Caps are only reached at extreme durations (~8-12 min depending on enemy type). For most of the run they serve as safety nets.

---

## Enemy Damage in Infinite Swarm

Enemies spawn with `wave=20`, giving a wave-based damage multiplier of **1.9x**. The square root swarm damage multiplier then compounds on top.

### Damage Formula

```
damage = min(damageCap, floor(baseDamage × 1.9 × dmgMultiplier))
```

For elites, the cap is applied first, then multiplied by 3.0x (elites exceed caps).

### Damage Per Enemy (every 30s up to 4:00)

| Enemy | Base | 0:00 (1.0x) | 0:30 (2.4x) | 1:00 (3.0x) | 1:30 (3.4x) | 2:00 (3.8x) | 2:30 (4.2x) | 3:00 (4.5x) | 3:30 (4.7x) | 4:00 (5.0x) |
|-------|------|-------------|-------------|-------------|------------|------------|------------|------------|------------|------------|
| Scurrier | 10 | 19 | 45 | 57 | 65 | 72 | 79 | 84 | 90 | 95 |
| Spitter | 15 | 28 | 68 | 85 | 97 | 109 | 119 | 127 | 135 | 142 |
| Swooper | 20 | 38 | 91 | 114 | 130 | 145 | 159 | 169 | 180 | 190 |
| Shellback | 15 | 28 | 68 | 85 | 97 | 109 | 119 | 127 | 135 | 142 |
| Shellback (roll) | 20 | 38 | 91 | 114 | 130 | 145 | 159 | 169 | 180 | 190 |
| Burrower | 20 | 38 | 91 | 114 | 130 | 145 | 159 | 169 | 180 | 190 |
| Burrower (surface) | 20 | 38 | 91 | 114 | 130 | 145 | 159 | 169 | 180 | 190 |
| Splitter | 12 | 22 | 54 | 68 | 78 | 87 | 95 | 101 | 108 | 114 |
| Splitling | 8 | 15 | 36 | 45 | 52 | 58 | 63 | 67 | 72 | 76 |
| Healer | 5 | 9 | 22 | 28 | 32 | 36 | 39 | 42 | 44 | 47 |

### Elite Damage (x3 on top of above, caps do NOT apply)

| Enemy | 0:00 | 0:30 | 1:00 | 1:30 | 2:00 | 3:00 | 4:00 |
|-------|------|------|------|------|------|------|------|
| Scurrier | 57 | 135 | 171 | 195 | 216 | 252 | 285 |
| Spitter | 84 | 204 | 255 | 291 | 327 | 381 | 426 |
| Swooper | 114 | 273 | 342 | 390 | 435 | 507 | 570 |
| Shellback | 84 | 204 | 255 | 291 | 327 | 381 | 426 |
| Burrower | 114 | 273 | 342 | 390 | 435 | 507 | 570 |
| Splitter | 66 | 162 | 204 | 234 | 261 | 303 | 342 |

### Survivability vs Old System

With a typical player HP pool of 250-500:

- **At 0:00** — Swooper/Burrower deal 38 dmg. Very survivable.
- **At 1:00** — Swooper/Burrower deal 114. Player can tank several hits.
- **At 2:00** — Swooper/Burrower deal 145. Still 2-3 hits to kill a 250 HP player.
- **At 3:00** — Swooper/Burrower deal 169. Still survivable with upgrades.
- **At 4:00** — Swooper/Burrower deal 190. Getting dangerous but not instant death.
- **Elite at 2:00** — Elite Swooper deals 435. One-shots a 250 HP player (intended).
- **Elite at 4:00** — Elite Swooper deals 570. One-shots any player (intended).

The challenge now comes from enemy **tankiness** and **spawn volume**, not instant-death damage.

---

## Boss Spawning in Infinite Swarm

Bosses can appear during infinite swarm, gated behind danger level.

### Requirements

- **Minimum danger level**: 5 (must opt into danger via upgrades)
- **Boss types**: Ground boss or Flying boss (50/50 random)

### Spawn Chance

```
bossChance = min(8%, 0.5% + (dangerLevel - 5) × 0.5%)
```

### Cooldown (scales with danger)

```
cooldown = max(5000ms, 15000ms - (dangerLevel - 5) × 500ms)
```

| Danger | Chance | Cooldown | Effective min gap |
|--------|--------|----------|-------------------|
| 5 | 0.5% | 15s | ~15s (cooldown dominates) |
| 8 | 2.0% | 13.5s | ~13.5s |
| 10 | 3.0% | 12.5s | ~12.5s |
| 15 | 5.5% | 10s | ~10s |
| 20 | 8.0% (cap) | 7.5s | ~7.5s |
| 25+ | 8.0% (cap) | 5s (min) | ~5s |

### Boss Stats in Infinite Swarm

Bosses receive the same split HP/damage multipliers as regular enemies, plus their tier-3 boss bonus (wave=20). Damage capped at 400.

---

## Danger Level Interaction

Danger Level stacks compound **multiplicatively** with swarm multipliers. HP and damage use separate danger bonuses.

### Danger Stats Per Stack

| Stat | Bonus Per Stack |
|------|-----------------|
| Enemy HP | +12% |
| Enemy Damage | +8% |
| Elite spawn chance | +3% |
| Score multiplier | +15% |
| XP multiplier | +10% |

### Combined Formula

```
finalHP = swarmHPMultiplier × (1 + dangerStacks × 0.12)
finalDMG = swarmDmgMultiplier × (1 + dangerStacks × 0.08)
```

### Example: 5 Danger Stacks at 60 Seconds

- Swarm HP multiplier: 17.0x
- Swarm DMG multiplier: 3.0x
- Danger HP multiplier: 1 + (5 × 0.12) = 1.6x
- Danger Damage multiplier: 1 + (5 × 0.08) = 1.4x
- **Combined HP**: 17.0 × 1.6 = **27.2x**
- **Combined Damage**: 3.0 × 1.4 = **4.2x**

---

## Elite Enemies in Infinite Swarm

### Spawn Chance

```
eliteChance = 0.01 + (dangerLevel × 0.03)
```

| Danger Stacks | Elite Chance |
|---------------|-------------|
| 0 | 1% |
| 1 | 4% |
| 3 | 10% |
| 5 | 16% |
| 10 | 31% |

### Elite Stat Multipliers (on top of everything else)

| Stat | Elite Multiplier |
|------|-----------------|
| HP | 2.0x |
| Damage | 3.0x (bypasses damage caps) |
| Speed | 1.15x |
| Size | 1.15x (visual) |
| Points | 2.5x |
| XP dropped | 3.0x |

### Worst Case Example: Elite Swooper at 2:00 with 5 Danger

- Base: 20 × 1.9 = 38 (wave scaling)
- Swarm DMG mult: 3.83
- Danger DMG mult: 1.4
- Raw damage: floor(38 × 3.83 × 1.4) = floor(203.7) = 203
- Damage cap: min(203, 250) = 203
- Elite ×3: **609 damage** (one-shots any player)

---

## HUD Display

During infinite swarm:
- Wave number is hidden
- **"INFINITE SWARM"** text shown in red (28px), pulsing via sine wave (alpha oscillates 0.6-1.0)
- Enemy counter shows: `HP: x17.0 | DMG: x3.0 | Enemies: 42`
- Both multipliers update every frame

---

## Shield Regeneration

Since there are no wave transitions in infinite swarm, shields cannot reset between waves. Instead, shields regenerate on a timer.

### Config

| Parameter | Value |
|-----------|-------|
| Regen interval | 30,000ms (30 seconds per charge) |
| Config key | `INFINITE_SWARM_CONFIG.shieldRegenInterval` |

### Behavior

- **Full reset on activation** — shields reset to max when infinite swarm begins
- **Time-based regen** — one shield charge regenerates every 30 seconds
- **Reset on hit** — taking a hit (shield absorb) resets the regen timer to 0
- **Capped at max** — charges never exceed the upgrade total

### Example: Fortress (3 charges)

| Event | Charges | Timer |
|-------|---------|-------|
| Swarm starts | 3/3 | 0s |
| Hit at 10s | 2/3 | reset → 0s |
| Hit at 15s | 1/3 | reset → 0s |
| 30s passes | 2/3 | reset → 0s |
| Hit at 5s | 1/3 | reset → 0s |
| 30s passes | 2/3 | reset → 0s |
| 30s passes | 3/3 | paused (full) |

### Visual Indicator

- Cyan diamond icon floats above the porcupine (above hats) when charges > 0
- Charge pips below the icon: filled = active, hollow = depleted (shown when max > 1)
- Icon pulses gently via sine wave animation
- Cyan sparkle effect plays when a charge regenerates

---

## What Does NOT Happen

- **No wave completion triggers** — upgrades are not offered between spawns
- **No platform layout changes** — arena stays fixed
- **No cap on HP multiplier** — grows infinitely as O(t^2)
- **No cap on danger stacks** — can stack as many as offered

---

## Pre-Infinite Swarm Scaling (Waves 1-20, for reference)

During normal waves, enemy stats scale differently:

| Stat | Per 2 Waves | Cap |
|------|------------|-----|
| HP | +15% | 5.0x |
| Damage | +10% | 5.0x |
| Speed | +3% | 1.5x |

Boss HP scales quadratically per tier:
```
bossHP = baseHP × (1 + tier^2 × 0.75)
```

| Wave | Boss Tier | Boss HP (base 300) |
|------|-----------|-------------------|
| 5 | 0 | 300 |
| 10 | 1 | 525 |
| 15 | 2 | 1,200 |
| 20 | 3 | 2,325 |

---

## Summary: The Endurance Curve

The infinite swarm creates an escalating difficulty curve through three compounding systems:

1. **Enemy HP** scales quadratically with 15s tiers — enemies become massive sponges
2. **Spawn rate** decays from 600ms toward 10ms floor at ~12 minutes — enemies gradually flood in
3. **Enemy damage** scales slowly (square root) with per-type caps — survivable without shields for several minutes

Optional **Danger Level** stacks multiply on top of everything and unlock **boss spawning** at level 5+. **Elite enemies** bypass damage caps with their 3x multiplier, making them the primary lethal threat throughout the run.
