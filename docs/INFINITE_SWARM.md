# Infinite Swarm Mode - Complete Scaling Reference

## Activation

- **Trigger**: Completing wave 20 (after defeating the 4th boss)
- **Config**: `XP_CONFIG.infiniteSwarmWave = 20`
- **Visual**: Stage switches to **Inferno** (red-tinted arena), wave text replaced with pulsing red **"INFINITE SWARM"**

---

## 4-Stage System

The infinite swarm progresses through 4 escalating stages, each with increasing difficulty:

| Stage | Time | Name | Visual | HP Mult | DMG Mult | Spawn Floor | Elite Bonus |
|-------|------|------|--------|---------|----------|-------------|-------------|
| 1 | 0:00-3:00 | Swarm | Red arena | 1.0x | 1.0x | 200ms | +0% |
| 2 | 3:00-6:00 | Surge | Orange enemies | 1.5x | 1.5x | 100ms | +5% |
| 3 | 6:00-9:00 | Frenzy | Deep red enemies | 2.5x | 2.0x | 50ms | +10% |
| 4 | 9:00+ | Apocalypse | Purple enemies | 5.0x + quadratic | 3.0x + quadratic | 10ms | +20% |

### Stage Transitions

When a stage changes:
- Brief screen flash in the stage color
- Stage name displayed briefly (e.g., "SURGE")
- Sound effect plays
- Enemies spawned after transition have colored tint overlay

---

## Formulas

### Base Scaling (applied at all stages)

```
tiers = secondsElapsed / 15
baseHP = 1 + tiers^2
baseDMG = 1 + sqrt(tiers)
```

### Stage Multipliers

```
finalHP = baseHP × stage.hpMult
finalDMG = baseDMG × stage.dmgMult
```

### Stage 4 (Apocalypse) Quadratic Explosion

```
stageTime = secondsElapsed - 540  // Time since stage 4 started
explosionHP = (stageTime / 20)^2.5 × 500
explosionDMG = (stageTime / 30)^2

finalHP = baseHP × 5.0 + explosionHP
finalDMG = baseDMG × 3.0 + explosionDMG
```

### Spawn Interval Decay

```
decayedInterval = 600 × 0.9943^totalSeconds
spawnInterval = max(stage.spawnFloor, decayedInterval)
```

**Damage is fully uncapped** - scales naturally with swarm multipliers. No per-enemy damage caps.

---

## Complete Scaling Tables

**Note:** Total multipliers include wave 20 base scaling (HP: 2.35x, DMG: 1.9x) compounded with swarm and stage multipliers.

### Stage 1 - Swarm (0:00 - 3:00)

| Time | Total HP Mult | Total DMG Mult | Scurrier HP | Swooper DMG | w/ 40% Armor | Spawn | Elite Bonus |
|------|---------------|----------------|-------------|-------------|--------------|-------|-------------|
| 0:00 | 2.35x | 1.9x | 70 | 38 | 23 | 600ms | +0% |
| 0:30 | 11.8x | 4.6x | 353 | 91 | 55 | 500ms | +0% |
| 1:00 | 40.0x | 5.7x | 1,199 | 114 | 68 | 420ms | +0% |
| 1:30 | 87.0x | 6.6x | 2,609 | 133 | 80 | 350ms | +0% |
| 2:00 | 153x | 7.2x | 4,589 | 144 | 86 | 290ms | +0% |
| 2:30 | 237x | 7.9x | 7,122 | 159 | 95 | 245ms | +0% |
| 3:00 | 341x | 8.5x | 10,221 | 171 | 103 | 200ms | +0% |

### Stage 2 - Surge (3:00 - 6:00)

| Time | Total HP Mult | Total DMG Mult | Scurrier HP | Swooper DMG | w/ 40% Armor | Spawn | Elite Bonus |
|------|---------------|----------------|-------------|-------------|--------------|-------|-------------|
| 3:00 | 511x | 12.8x | 15,332 | 256 | 154 | 200ms | +5% |
| 3:30 | 695x | 13.4x | 20,850 | 268 | 161 | 150ms | +5% |
| 4:00 | 906x | 14.3x | 27,172 | 286 | 172 | 120ms | +5% |
| 4:30 | 1,145x | 14.8x | 34,347 | 296 | 178 | 100ms | +5% |
| 5:00 | 1,413x | 15.6x | 42,375 | 312 | 187 | 100ms | +5% |
| 5:30 | 1,708x | 16.2x | 51,256 | 324 | 194 | 100ms | +5% |
| 6:00 | 2,033x | 16.9x | 60,991 | 338 | 203 | 100ms | +5% |

### Stage 3 - Frenzy (6:00 - 9:00)

| Time | Total HP Mult | Total DMG Mult | Scurrier HP | Swooper DMG | w/ 40% Armor | Spawn | Elite Bonus |
|------|---------------|----------------|-------------|-------------|--------------|-------|-------------|
| 6:00 | 3,389x | 22.4x | 101,652 | 448 | 269 | 100ms | +10% |
| 6:30 | 3,977x | 23.1x | 119,316 | 462 | 277 | 75ms | +10% |
| 7:00 | 4,612x | 23.9x | 138,359 | 478 | 287 | 60ms | +10% |
| 7:30 | 5,293x | 24.7x | 158,781 | 494 | 296 | 50ms | +10% |
| 8:00 | 6,020x | 25.4x | 180,583 | 508 | 305 | 50ms | +10% |
| 8:30 | 6,793x | 26.1x | 203,764 | 522 | 313 | 50ms | +10% |
| 9:00 | 7,612x | 26.6x | 228,324 | 532 | 319 | 50ms | +10% |

### Stage 4 - Apocalypse (9:00+)

| Time | Total HP Mult | Total DMG Mult | Scurrier HP | Swooper DMG | w/ 40% Armor | Spawn | Elite Bonus |
|------|---------------|----------------|-------------|-------------|--------------|-------|-------------|
| 9:00 | 15,224x | 39.9x | 456,648 | 798 | 479 | 50ms | +20% |
| 9:30 | 18,153x | 45.6x | 544,599 | 912 | 547 | 35ms | +20% |
| 10:00 | 23,512x | 53.2x | 705,360 | 1,064 | 638 | 25ms | +20% |
| 10:30 | 31,314x | 62.7x | 939,408 | 1,254 | 752 | 20ms | +20% |
| 11:00 | 41,560x | 74.1x | 1,246,791 | 1,482 | 889 | 15ms | +20% |
| 11:30 | 54,250x | 87.4x | 1,627,500 | 1,748 | 1,049 | 12ms | +20% |
| 12:00 | 69,384x | 102.6x | 2,081,520 | 2,052 | 1,231 | 10ms | +20% |
| 15:00 | 211,512x | 313.5x | 6,345,360 | 6,270 | 3,762 | 10ms | +20% |

### Lethality Summary

| Stage | Time | Swooper Hits to Kill 500 HP (40% armor) | Feel |
|-------|------|-----------------------------------------|------|
| 1 | 0-3 min | 5-22 hits | Warmup |
| 2 | 3-6 min | 2-3 hits | Getting dangerous |
| 3 | 6-9 min | 1-2 hits | Very lethal |
| 4 | 9+ min | **1 hit** | Apocalyptic |

With uncapped damage, Stage 2-3 are noticeably harder. Players must play carefully from 3 minutes onward.

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

HP and damage scale **separately** with stage multipliers applied on top:

- **Enemy HP** — `(1 + (t/15)^2) × stageMult` — quadratic base with stage multiplier (1x → 1.5x → 2.5x → 5x+)
- **Enemy Damage** — `(1 + sqrt(t/15)) × stageMult` — square root base with stage multiplier (1x → 1.5x → 2x → 3x+)
- **Enemy Speed** — capped at 1.3x max
- **Damage is fully uncapped** — scales naturally with multipliers, no per-enemy limits

---

## Enemy Damage in Infinite Swarm

Enemies spawn with `wave=20`, giving a wave-based damage multiplier of **1.9x**. The swarm damage multiplier and stage multiplier compound on top.

### Damage Formula

```
damage = floor(baseDamage × 1.9 × swarmDmgMult × stageDmgMult)
```

For elites, damage is then multiplied by 3.0x.

### Survivability Summary

With a typical player HP pool of 400-600 and 40% armor:

- **Stage 1 (0-3 min)** — Swooper deals 38-171 damage (23-103 after armor). 5-22 hits to kill.
- **Stage 2 (3-6 min)** — Swooper deals 256-338 damage (154-203 after armor). 2-3 hits to kill.
- **Stage 3 (6-9 min)** — Swooper deals 448-532 damage (269-319 after armor). 1-2 hits to kill.
- **Stage 4 (9+ min)** — Swooper deals 798+ damage (479+ after armor). **One-shot territory**.

Elite enemies deal 3x damage on top of the above values. Elite Swoopers one-shot players from Stage 2 onwards.

The challenge comes from **escalating damage across stages**, **enemy tankiness**, and **spawn volume**.

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
| Regen interval | 5,000ms (5 seconds per charge) |
| Config key | `INFINITE_SWARM_CONFIG._sri` (obfuscated) |

### Behavior

- **Full reset on activation** — shields reset to max when infinite swarm begins
- **Time-based regen** — one shield charge regenerates every 5 seconds
- **Reset on hit** — taking a hit (shield absorb) resets the regen timer to 0
- **Capped at max** — charges never exceed the upgrade total

### Example: Fortress (3 charges)

| Event | Charges | Timer |
|-------|---------|-------|
| Swarm starts | 3/3 | 0s |
| Hit at 2s | 2/3 | reset → 0s |
| Hit at 3s | 1/3 | reset → 0s |
| 5s passes | 2/3 | reset → 0s |
| Hit at 2s | 1/3 | reset → 0s |
| 5s passes | 2/3 | reset → 0s |
| 5s passes | 3/3 | paused (full) |

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

## Elemental Effects in Infinite Swarm

Elemental status effects remain useful throughout infinite swarm but their relative value shifts:

### Lightning (Shock/Stun)
- **Stays strong**: Stun duration is fixed (not reduced by HP scaling), so crowd control remains effective
- **Chain lightning** becomes more valuable as spawn density increases — more nearby targets to arc to
- **Diminishing return**: At very high spawn rates, stunned enemies are quickly replaced by new spawns

### Ice (Freeze)
- **Stays strong**: Freeze duration is fixed, providing reliable CC even on tanky enemies
- **Shatter AOE** scales with enemy max HP (deals % of max HP), so it actually gets *stronger* as enemies scale
- **Frost slow** aura helps manage the increasing spawn volume

### Fire (Burn)
- **Scales partially**: Burn DPS scales with the player's damage modifier, so damage upgrades boost burn too
- **Still falls off late**: Even with scaling, flat DPS struggles against quadratically scaling HP in deep runs
- **Fire explosion** on death remains useful for softening nearby enemies and spreading burn
- **Fire aura** from burning enemies provides area denial in crowded fights
- **Best use**: Combo with poison — burn for AOE spread + scaled DPS, poison for multiplicative damage amplification

### Poison (Venom)
- **Stays strong**: Damage amplification is percentage-based, so it scales with ALL damage sources
- **Example**: At 3:00 with 3 poison stacks (+150% amp), your 100 DPS quills effectively deal 250 DPS
- **Poison spread** and **poison cloud** on death become very powerful as enemies cluster together
- **Best late-game element** due to multiplicative scaling

### Defense Stats
- **Armor**: Percentage reduction stays relevant at all HP levels — 50% armor always halves incoming damage
- **Evasion**: Dodge chance becomes more valuable as individual hits grow larger
- **Thorns**: Flat damage reflection falls off against scaling HP but provides free chip damage

### Proc Reroll (Fate's Favor)
- 30% reroll chance applies to ALL procs, making it increasingly valuable as you stack more elemental upgrades
- Effectively a ~30% increase in proc frequency across the board

---

## Summary: The Endurance Curve

The infinite swarm creates an escalating difficulty curve through three compounding systems:

1. **Enemy HP** scales quadratically with 15s tiers — enemies become massive sponges
2. **Spawn rate** decays from 600ms toward 10ms floor at ~12 minutes — enemies gradually flood in
3. **Enemy damage** scales slowly (square root) with per-type caps — survivable without shields for several minutes

Optional **Danger Level** stacks multiply on top of everything and unlock **boss spawning** at level 5+. **Elite enemies** bypass damage caps with their 3x multiplier, making them the primary lethal threat throughout the run.
