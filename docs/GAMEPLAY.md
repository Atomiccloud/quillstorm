# Quillstorm Gameplay

## Player Mechanics

### Movement
- **Speed**: 300 px/sec base (modified by upgrades and quill state)
- **Jump Force**: 580 px/sec upward
- **Air Control**: 80% of ground speed while airborne
- **Collision**: Bounded by screen edges

### Health & Defense
- **Max Health**: 100 (can be modified by upgrades)
- **Invincibility**: 1000ms after taking damage
- **Shields**: Absorb hits before taking damage (from upgrades, reset each wave)

### Quill States

Your quill percentage determines your mechanical state (4 states) and visual appearance (5 tiers).

**Mechanical States:**

| State | Quills | Speed | Damage Taken | Notes |
|-------|--------|-------|--------------|-------|
| Full | 70-100% | 100% | 100% | Normal state |
| Patchy | 40-70% | 100% | 100% | Visual change only |
| Sparse | 3-40% | 110% | 100% | Faster movement |
| Naked | 0-3% | 125% | 200% | Can't shoot, very fast, 3x regen |

**Visual Tiers** (rendered progressively):
- 80-100%: Full quills
- 60-80%: Slightly patchy
- 40-60%: Moderate patches
- 20-40%: Sparse coverage
- 0-20%: Nearly naked

### Quill Regeneration
- **Base Rate**: 1.0 quill/sec
- **Regen Delay**: 600ms pause after shooting (scales down with regen rate, min 100ms at 200%+)
- **Naked Bonus**: 3x regeneration when in naked state

### Shooting
- **Fire Rate**: 3 shots/sec base
- **Projectile Speed**: 800 px/sec
- **Base Damage**: 10
- **Lifetime**: 3 seconds
- **Max Quills**: 30 (can be increased with upgrades)

---

## Enemies

### Scurrier (Brown)
- **Health**: 30
- **Damage**: 10
- **Speed**: 120
- **Points**: 10
- **Behavior**: Simple chase - runs directly at player, can jump to reach platforms
- **Unlocked**: Wave 1

### Spitter (Green)
- **Health**: 25
- **Damage**: 15 (projectile)
- **Speed**: 60
- **Projectile Speed**: 250
- **Fire Rate**: 3.0 sec between shots
- **Points**: 20
- **Behavior**:
  - Maintains ~250px preferred distance
  - Backs away if player gets within 150px
  - Strafes side-to-side when at good range
  - Does NOT jump (ground-based ranged unit)
- **Unlocked**: Wave 4

### Swooper (Purple)
- **Health**: 15
- **Damage**: 20
- **Speed**: 200 (hover), 400 (dive)
- **Points**: 25
- **Behavior**:
  - Hovers ~150px above player with wide patrol range (±150px)
  - Dive-bombs at player from various angles, not just directly above
  - Can dive under platforms to reach players below
  - Ignores platform collision when hovering (phases through)
  - Only collides with platforms when diving
  - Recovers upward immediately if hitting a platform during dive
- **Unlocked**: Wave 2

### Shellback (Gray)
- **Health**: 80
- **Damage**: 15 (20 while rolling)
- **Speed**: 50 (100 while rolling)
- **Points**: 40
- **Behavior**:
  - Slow, steady approach toward player
  - Can jump to reach platforms
- **Special**: Blocks 90° frontal arc damage - attack from behind!
- **Roll Attack**: Periodically curls into a ball and rolls toward player
  - Fully invincible during roll
  - Deals 20 damage with strong knockback and screen shake
  - Lasts 2 seconds, 6 second cooldown
  - Triggers at 100-400px range
  - Visual: spinning ball with yellow invincibility glow
- **Unlocked**: Wave 6

### Burrower (Dark Brown)
- **Health**: 38
- **Damage**: 20
- **Speed**: 90
- **Points**: 35
- **Behavior**:
  - Cycles between above-ground and underground phases
  - Above ground: chases player like a scurrier (4 seconds)
  - Burrows underground: nearly invisible (alpha 0.15), immune to damage
  - Moves toward player at 1.5x speed while burrowed (3 seconds)
  - **Warning Phase**: Red exclamation mark + repeating dirt particles appear 900ms before surfacing
  - Surfaces on the player's platform level, offset 50-90px to the left or right
  - Surfaces with AOE damage (60px radius, 20 damage)
  - Visual: dark brown mole with claws, dirt burst on surfacing
- **Unlocked**: Wave 9

### Splitter (Purple)
- **Health**: 60
- **Damage**: 12
- **Speed**: 80
- **Points**: 30
- **Behavior**:
  - Chases player like a slower scurrier
  - On death, splits into 2 **Splitlings**
  - Visual: purple blob with visible center seam and two pairs of eyes
- **Splitlings**:
  - Health: 20, Damage: 8, Speed: 160, Points: 10
  - Faster and more aggressive than parent
  - Do NOT split again
  - Wave doesn't complete until all splitlings are dead
- **Unlocked**: Wave 11

### Healer (Green) — *Removed from spawns in v0.5.2*
- **Health**: 35
- **Damage**: 5
- **Speed**: 70
- **Points**: 50
- **Behavior**:
  - Floats (no gravity, like swooper)
  - Maintains ~350px distance from player
  - Flees at 1.5x speed if player gets within 300px
  - Heals lowest-HP ally within 200px for 12% of their max HP every 3 seconds
  - Does NOT heal bosses
  - Visual: green orb with white cross, pulsing aura, heal beam to target
- **Note**: Replaced by Bomber in v0.5.2. Code remains but no longer spawns.

### Bomber (Dark Navy)
- **Health**: 40
- **Damage**: 8 (contact), 20 (bomb zone)
- **Speed**: 80
- **Points**: 45
- **Behavior**:
  - Floats high above player (~200px above), no gravity
  - Drifts horizontally following player with gentle sine patrol
  - Every 3 seconds, drops a bomb zone at its current position
  - **Warning Phase** (800ms): Pulsing red circle outline on ground below
  - **Active Phase** (1000ms): Filled orange-red danger zone, deals 20 damage once on detonation
  - Forces player to stay mobile and avoid camping platforms
  - Visual: dark crow/raven with orange belly pouch, orange eyes
- **Unlocked**: Wave 15

### Boss (Dark Red)
- **Health**: 300
- **Damage**: 25 (contact)
- **Speed**: 100
- **Projectile Speed**: 400
- **Charge Speed**: 350
- **Points**: 500
- **Appears**: Every 5 waves (5, 10, 15, 20...)

**Three-Phase Fight:**

| Phase | HP | Fire Rate | Behavior |
|-------|-----|-----------|----------|
| Phase 1 | >50% | 1.8 sec | Maintains distance, strafes slowly, fires single shots |
| Phase 2 | 25-50% | 1.2 sec | More aggressive, fires 3-shot spread, faster strafing |
| Phase 3 | ≤25% | 0.6 sec | Enraged! Rapid 3-shot bursts, relentless pursuit, double charge chance |

**Special Attacks:**
- **Charge Attack**: Boss glows red, then charges at high speed (more frequent in Phase 3)
- **Jump**: Can jump to reach players on platforms
- **Projectile Spread**: In phase 2+, fires 3 projectiles in a spread pattern
- **Enrage Glow**: In phase 3, boss pulses with orange/red glow

**Boss Wave Spawning:**
- Wave 5: Ground Boss spawns ALONE (no minions)
- Wave 10: Flying Boss spawns ALONE (no minions)
- Wave 15+: BOTH bosses spawn together with minions

---

### Flying Boss (Purple)
- **Health**: 1,000 (base, scales with boss tier)
- **Damage**: 35 (contact)
- **Speed**: 150
- **Projectile Speed**: 350
- **Dive Speed**: 500
- **Points**: 600
- **Appears**: Wave 10, then every 5 waves (with ground boss from wave 15+)

**Three-Phase Fight:**

| Phase | HP | Fire Rate | Projectiles | Behavior |
|-------|-----|-----------|-------------|----------|
| Phase 1 | >50% | 2.0 sec | 1 | Hovers 180px above player, slow shots |
| Phase 2 | 25-50% | 1.4 sec | 2 | Double shots, more frequent dives |
| Phase 3 | ≤25% | 0.7 sec | 3 | Enraged! Rapid triple shots, relentless dive bombs |

**Special Abilities:**
- **Hovering**: Floats above player, completely ignores all platforms
- **Dive Bomb**: Swoops down at high speed toward player (5 second cooldown, more frequent in later phases)
- **Platform Immunity**: Phases through all platforms - cannot be trapped or blocked
- **Enrage Glow**: In phase 3, pulses with magenta glow

**Visual**: Large bat-like creature with wings, horns, and talons

---

## Elite Enemies

Any non-boss enemy has a chance to spawn as an **Elite** variant — a significantly stronger version with boosted stats and rewards.

### Elite Properties

| Property | Multiplier | Notes |
|----------|------------|-------|
| Health | 2.0x | Twice as tanky |
| Damage | 3.0x | Hit much harder |
| Speed | 1.15x | 15% faster |
| Size | 1.15x | 15% visually larger |
| Score | 2.5x | Better points |
| XP | 3.0x | Triple experience |

### Elite Spawn Chance

- **Base Chance**: 1% per non-boss spawn
- **Danger Bonus**: +3% per danger level stack
- **Visual**: Gold glow aura (0xffd700, 60% alpha)

Elites are high-priority targets — dangerous but rewarding. In later waves or with danger stacks, elite frequency increases significantly.

---

## Danger Level

An opt-in difficulty scaling system. Each **Danger Level** stack makes enemies tougher but increases rewards.

### Effects Per Stack

| Effect | Per Stack | Example at 5 Stacks |
|--------|-----------|---------------------|
| Enemy HP | +12% | +60% |
| Enemy Damage | +8% | +40% |
| Elite Chance | +3% | +15% (16% total) |
| Score Bonus | +15% | +75% |
| XP Bonus | +10% | +50% |

### Danger Upgrades

| Name | Rarity | Stacks | Effects |
|------|--------|--------|---------|
| Tempting Fate | Uncommon | +1 | Basic danger increase |
| Risk Taker | Rare | +2 | Higher risk, higher reward |
| Daredevil | Epic | +3 | Significant danger spike |
| Death Wish | Legendary | +5 | Extreme difficulty, massive rewards |

**Strategy Tips:**
- High danger with good elemental builds can farm massive XP
- Score multiplier stacks multiplicatively with other bonuses
- Elite chance at danger 10+ means frequent elite spawns
- Requires 5 danger to unlock boss spawns in infinite swarm mode

---

## Wave Progression

### Enemy Count Formula
```
count = min(60, 5 × (1.15 ^ (wave - 1)))
```

Capped at 60 enemies per wave to prevent excessively long waves.

| Wave | Enemies | Boss(es) |
|------|---------|----------|
| 1 | 5 | None |
| 5 | 1 | Ground Boss (solo) |
| 10 | 1 | Flying Boss (solo) |
| 15 | 5 | Both + 3 minions |
| 20 | 6 | Both + 4 minions |
| 25+ | 7+ | Both + 5+ minions |

### Spawn Pacing

Enemies spawn slowly at the start of each wave and ramp up to a fast pace:

| Phase | Interval | Notes |
|-------|----------|-------|
| Wave Start | 1200ms between spawns | Slow trickle, time to breathe |
| Wave End | 375ms between spawns | Intense finale |

- Starting interval decreases by 100ms every 2 waves (floor: 500ms)
- Example: Wave 1-2 spawns 1200ms→375ms, Wave 9-10 starts at 800ms→375ms

### Enemy Unlocking (v0.5.2)
- **Wave 1**: Scurrier only
- **Wave 2+**: Swooper added
- **Wave 4+**: Spitter added
- **Wave 6+**: Shellback added (with roll attack)
- **Wave 9+**: Burrower added
- **Wave 11+**: Splitter added
- **Wave 15+**: Bomber added
- **Every 5 waves**: Boss fight

### Spawn Weights

| Type | Weight | Unlock |
|------|--------|--------|
| Scurrier | 30 | Wave 1 |
| Swooper | 12 | Wave 2 |
| Spitter | 18 | Wave 4 |
| Shellback | 12 | Wave 6 |
| Burrower | 10 | Wave 9 |
| Splitter | 8 | Wave 11 |
| Bomber | 7 | Wave 15 |

### Stat Scaling Per Wave
Enemies get stronger every 2 waves (capped at multiplier):

| Stat | Per 2 Waves | Max Cap |
|------|-------------|---------|
| Health | +15% | 5.0x |
| Damage | +10% | 5.0x |
| Speed | +3% | 5.0x |

Note: Stats only increase on waves 3, 5, 7, 9, etc. Spawn pacing also scales every 2 waves.

### Boss HP Scaling

Bosses use **quadratic HP scaling** to stay challenging in later waves:

```
HP = baseHP × (1 + tier² × 0.75)
```

Where `tier = (wave / 5) - 1`:

| Wave | Boss Tier | Ground Boss HP | Flying Boss HP |
|------|-----------|----------------|----------------|
| 5 | 0 | 300 | - |
| 10 | 1 | 525 | 1,750 |
| 15 | 2 | 1,200 | 4,000 |
| 20 | 3 | 2,325 | 7,750 |

Flying Boss has 1,000 base HP (vs 300 for Ground Boss).

---

## Boss Rewards (v0.5.1)

After defeating a boss (waves 5, 10, 15, 20), players make a **blind choice** between two paths:

### Phase 1: The Fork
| Choice | What Happens |
|--------|-------------|
| **Restoration** | Choose from 3 resource recovery options |
| **Power** | Choose from 3 upgrade cards (normal upgrade flow) |

The choice is blind — you commit before seeing what's available.

### Phase 2: Restoration Options
| Option | Effect |
|--------|--------|
| **Full Health** | Restore to 100% max HP |
| **Full Quills** | Restore to 100% max quills |
| **Balance** | Restore 30-60% of both HP and quills (random roll) |

### Wave Clear Bonuses
- Normal waves: +5 quills restored on completion
- Boss waves: No quill bonus (players choose Restoration or Power instead)
- All waves: +20 HP healed between waves (unchanged)

---

## Upgrades

### Rarity System
Upgrades are offered after each wave. Rarity determines power level.

| Rarity | Drop Rate | Color |
|--------|-----------|-------|
| Common | 60% | Gray |
| Uncommon | 25% | Green |
| Rare | 10% | Blue |
| Epic | 4% | Purple |
| Legendary | 1% | Orange |

---

### Mythic Upgrades (4)

| Name | Effect | Max Stacks | Description |
|------|--------|------------|-------------|
| Expanded Options | +1 upgrade choice | 1 | Extra card when choosing upgrades |
| Omega Quills | +200% damage, +100% fire rate, +5 projectiles, -40 HP | 1 | Ultimate glass cannon |
| Fate's Favor | 30% proc reroll chance | 1 | When a proc fails, roll again |
| Quill Apotheosis | Every 5th volley empowered | 1 | Auto-crit + all unlocked elements |

---

### Common Upgrades (9)

| Name | Effect | Description |
|------|--------|-------------|
| Sharp Quills | +10% damage | Basic damage boost |
| Quick Draw | +15% fire rate | Shoot faster |
| Extra Quills | +5 max quills | More ammo capacity |
| Quick Recovery | +20% regen rate | Faster quill regeneration |
| Light Feet | +10% move speed | Move faster |
| Aerodynamic Quills | +20% projectile speed | Quills fly faster |
| Thick Hide | +20 max health | More survivability |
| Thick Quills | +30% projectile size | Larger quills, easier to hit |
| Life Leech | +1 vampirism strength | Chance to heal on hit |
| Tough Skin | +5 Armor | Reduces incoming damage |
| Quick Reflexes | +5 Evasion | Chance to dodge attacks |

---

### Uncommon Upgrades (15)

| Name | Effect | Description |
|------|--------|-------------|
| Razor Quills | +20% damage | Significant damage boost |
| Rapid Fire | +25% fire rate | Much faster shooting |
| Quill Overload | +10 max quills | Large ammo increase |
| Vital Points | +10% crit chance | Chance for critical hits |
| Double Shot | +1 projectile | Fire 2 quills per shot |
| Strong Legs | +20% jump height | Jump higher |
| Combat Training | +10% damage, +10% speed | Balanced boost |
| Explosive Tips | 40px explosion radius | AOE damage on hit |
| Energy Shield | +1 shield charge | Block 1 hit per wave |
| Seeker Quills | +30% homing | Quills track enemies |
| Static Quills | +2 shock strength (17%) | Chance to stun enemies |
| Frost Tips | +2 freeze strength (17%) | Chance to freeze enemies |
| Ember Quills | +2 burn strength (17%, 16 DPS) | Stacking burn DoT |
| Toxic Quills | +2 poison strength (17%, 10% amp) | Stacking damage amplification |
| Iron Quills | +10 Armor | Hardened quill damage resistance |
| Acrobat | +10 Evasion | Agile dodge build |

---

### Rare Upgrades (14)

| Name | Effect | Description |
|------|--------|-------------|
| Piercing Quills | +1 pierce | Pass through 1 enemy |
| Bouncing Quills | +2 bounces | Bounce off walls |
| Deadly Precision | +15% crit, +0.5x crit damage | Better crits |
| Lethal Quills | +35% damage | Major damage boost |
| Triple Shot | +2 projectiles | Fire 3 quills per shot |
| Endless Quills | +15 quills, +30% regen | Sustain build |
| Glass Cannon | +50% damage, -30 health | High risk/reward |
| Cluster Bombs | 60px explosion, +20% damage | Bigger explosions |
| Reinforced Shield | +2 shields, +15 health | Better defense |
| Baby Buddy | +1 companion | Baby porcupine helper |
| Blood Quills | +3 vampirism str, +20% damage | Vampirism + damage |
| Lightning Quills | +3 shock strength (23%) | Better stun procs |
| Icicle Quills | +3 freeze strength (23%) | Longer freeze |
| Flame Quills | +3 burn strength (23%, 24 DPS) | Hotter stacking burns |
| Noxious Spines | +3 poison strength (23%, 15% amp) | Deeper venom stacks |
| Porcupine Plate | +15 Armor, +20 HP | Natural armor plating |
| Shadow Step | +15 Evasion, +5% speed | Phase through attacks |

---

### Epic Upgrades (14)

| Name | Effect | Description |
|------|--------|-------------|
| Impaling Quills | +3 pierce | Pass through many enemies |
| Shotgun Burst | +4 projectiles | Spray of quills |
| Berserker | +50% fire rate, +30% speed, -20% damage | Speed build |
| Critical Master | +25% crit, +1.0x crit damage | Crit build |
| Armored Porcupine | +50 health, +20 quills | Tank build |
| Speed Demon | +40% speed, +50% projectile speed | Speed build |
| Devastation | 100px explosion, +40% damage | Massive AOE |
| Porcupine Pack | +2 companions | Two helpers |
| Fortress | +3 shields, +30 health | Strong defense |
| Smart Missiles | +70% homing, +1 pierce | Tracking quills |
| Thunder Strike | +3 shock strength, +3 chain targets | Lightning arcs to nearby enemies |
| Blizzard Quills | +3 freeze strength, +50% slow aura | Frozen enemies chill nearby foes |
| Inferno Quills | +3 burn strength, +30px fire aura | Burning enemies scorch nearby |
| Plague Bearer | +3 poison strength, spread on death | Poison spreads on death |
| Diamond Hide | +20 Armor, +10 Thorns | Reflects damage to attackers |
| Phantom Porcupine | +20 Evasion, +10% speed | Nearly untouchable |

---

### Legendary Upgrades (15)

| Name | Effect | Max Stacks | Description |
|------|--------|------------|-------------|
| Quill Storm | +100% fire rate, +2 projectiles, -10% damage | 1 | Machine gun mode |
| Sniper Quills | +100% damage, +5 pierce, -30% fire rate, +80% proj speed | 1 | One-shot build |
| Pinball Wizard | +5 bounces, +30% damage, +30% proj speed | 1 | Chaos build |
| Quill Infinity | +50 max quills, +100% regen | 1 | Never run out |
| Glass God | +150% damage, +30% crit, +1.0x crit damage, -50 health | 1 | Ultimate glass cannon |
| Nuclear Quills | 150px explosion, +80% damage, -30% fire rate | 1 | Nuke build |
| Porcupine Army | +4 companions | 1 | Army of helpers |
| Vampire Lord | +5 vampirism str, +50% damage | 1 | Lifesteal build |
| Immortal Fortress | +5 shields, +50 health | 1 | Unkillable defense |
| Living Bastion | +40 Armor, +20 Thorns, +25 HP | ∞ | Unstoppable fortress |
| Wraith Form | +25 Evasion, +15% speed | ∞ | Become intangible |
| Storm Caller | +5 shock strength (33%), +3 chain targets | ∞ | Storm of chain lightning |
| Absolute Zero | +5 freeze strength (33%), +50% shatter | ∞ | Frozen enemies shatter on death |
| Hellfire | +5 burn strength (33%, 40 DPS), +80px explosion | ∞ | Burning enemies explode on death |
| Pandemic | +5 poison strength (33%, 25% amp), +50px cloud | ∞ | Death releases poison cloud |

---

## Elemental Effects

### Overview
Quills can proc elemental status effects on enemies. Each element has a unique identity and **evolves** as strength increases through 4 tiers (at strength 2, 5, 8, 12). Upgrades come as single-element uncommon/rare, dual-element epics, and a universal legendary.

### Strength System
Elemental proc chances use a **diminishing returns formula** for balanced scaling:

```
procChance = (strength × 0.1) / (1 + strength × 0.1)
```

| Strength | Proc Chance | Evolution Tier |
|----------|-------------|----------------|
| 2 | 16.7% | Tier I |
| 3 | 23.1% | Tier I |
| 5 | 33.3% | Tier II |
| 8 | 44.4% | Tier III |
| 10 | 50% | Tier III |
| 12 | 54.5% | Tier IV |
| 15 | 60% | Tier IV |
| 20 | 66.7% | Tier IV |

**Strength per upgrade**: Uncommon +2, Rare +3, Dual-Element Epic +2 each, Convergence Legendary +3 all

### Lightning — Stun + Chain Arcs
- **Identity**: Arcing strikes that chain across the battlefield
- **Visual**: Yellow flash + jagged spark particles + arc lines to targets
- **Tier I** (2+ str): 300ms stun + 1 arc to nearby enemy (30% of hit damage)
- **Tier II** (5+ str): 400ms stun + 2 arcs (40% damage). Arcs have 20% chance to stun
- **Tier III** (8+ str): 500ms stun + 4 arcs (50% damage). Arcs have 30% chance to stun
- **Tier IV** (12+ str): 600ms stun + 6 arcs (60% damage). Arcs stun 50%
- **Arc range**: 150px per jump

### Ice — Slow → Freeze → Shatter
- **Identity**: Locks down and shatters groups
- **Visual**: Light blue tint (chill) or solid blue + crystals (freeze)
- **Tier I** (2+ str): 70% slow (chill) for 1.5s
- **Tier II** (5+ str): Proc directly freezes (0.8s immobilize) instead of chill
- **Tier III** (8+ str): Freeze lasts 1.2s. Frozen enemies radiate frost aura (40% slow, 80px)
- **Tier IV** (12+ str): Frozen enemies shatter on death (25% max HP AoE + chill nearby, 120px)

### Fire — DoT + AoE Spread
- **Identity**: Everything burns, then explodes
- **DPS Formula**: `DPS = burnStrength × 8 × (1 + damageModifier)` (×1.5 at T2+)
- **Duration**: 2s per stack, max 10 stacks
- **Visual**: Orange glow, intensity scales with stack count
- **Tier I** (2+ str): Burn DoT (stacking)
- **Tier II** (5+ str): +50% burn DPS. Dying burning enemies ignite 1 nearby
- **Tier III** (8+ str): Burns slow enemies 20%. Death ignites 3 nearby
- **Tier IV** (12+ str): Burning enemies explode on death (80px base radius + 15% per stack, DPS × stacks × 2 damage)

### Poison — Amplify + Execute
- **Identity**: Weakens enemies, then finishes them off
- **Amp Formula**: `amp = poisonStrength × 25%` per stack (at str 4: 100% amp = crit-equivalent)
- **Duration**: 5s per stack, max 10 stacks
- **Visual**: Green tint + drip particles
- **Tier I** (2+ str): Poison stacks amplify all damage taken
- **Tier II** (5+ str): Stacks grow over time (+1 stack every 2s, up to 2× initial)
- **Tier III** (8+ str): Poisoned enemies that die spread all stacks to 2 nearby (120px)
- **Tier IV** (12+ str): Execute — poisoned enemies below 15% HP die instantly (non-boss). Death creates poison cloud

### Dual-Element Combos (Epic Upgrades)
- **Tempest** (Lightning + Ice): Shocked enemies that get chilled are instantly frozen
- **Wildfire** (Fire + Poison): Burning poisoned enemies gain poison stacks 2× faster
- **Frostfire** (Fire + Ice): Frozen burning enemies release steam AoE on thaw
- **Venomshock** (Lightning + Poison): Chain lightning arcs spread poison stacks to targets

### Elemental Convergence (Legendary)
- +3 to ALL elemental strengths
- Procs have 20% chance to trigger a random second element

---

## Defense Stats

### Armor (Damage Reduction)
- **Base formula**: Exponential saturation — `base = 1 - e^(-raw * 1.2)`
- **Soft cap**: Above 50% effective, returns diminish at 85% rate — max ~92.5%
- `if base > 0.50: effective = 0.50 + (base - 0.50) * 0.85`
- **Display**: Shown as flat "Armor" value (e.g., "50 Armor")
- **Applied**: After shields, before quill state multiplier
- **Infinitely stackable** — soft capped at ~92.5% in deep infinite swarm

| Total Armor | Effective Reduction |
|-------------|---------------------|
| 8 | 9% |
| 24 | 25% |
| 48 | 44% |
| 105 | 68% |
| 200 | 85% |
| 300 | 90% |
| 600+ | ~92.5% (cap) |

### Evasion (Dodge Chance)
- **Base formula**: Exponential saturation — `base = 1 - e^(-raw * 0.9)`
- **Soft cap**: Above 40% effective, returns diminish at 75% rate — max ~85%
- `if base > 0.40: effective = 0.40 + (base - 0.40) * 0.75`
- **Display**: Shown as flat "Evasion" value (e.g., "50 Evasion")
- **Applied**: Before shields — a dodge wastes no shield charges
- **Visual**: "DODGE" floating text when triggered
- **Infinitely stackable** — soft capped at ~85% in deep infinite swarm

| Total Evasion | Effective Dodge |
|---------------|-----------------|
| 8 | 7% |
| 24 | 19% |
| 48 | 35% |
| 88 | 51% |
| 200 | 73% |
| 300 | 80% |
| 600+ | ~85% (cap) |

### Thorns (Damage Reflection)
- **Sources**: Diamond Hide (+10), Living Bastion (+20)
- **Behavior**: When hit, deal thorns damage back to the attacking enemy
- **Scaling**: Thorns damage scales with your damage modifier (`thorns × (1 + damageModifier)`)
- **Applied**: On both regular contact damage and shellback roll attacks

### Critical Hits (v0.5.7 Rebalanced)
- **Base crit chance**: 5% (0.05 raw, ~4.8% effective) — crits happen from the start
- **Formula**: Diminishing returns — `effectiveCrit = rawCrit / (rawCrit + 1)`
- **Display**: Stats panel shows effective crit % and total crit multiplier
- **Base crit damage**: 2.5x
- **Crit damage bonuses**: Add to base (e.g., +1.0x = 3.5x total)

| Raw Crit | Effective Chance |
|----------|------------------|
| 5% (base) | 4.8% |
| 20% (+1 VP) | 16.7% |
| 45% (+VP +DP) | 31.0% |
| 95% (+VP +DP +CM) | 48.7% |
| 195% (all four) | 66.1% |
| 200% | 67% |
| 300% | 75% |

**Crit Upgrades:**
| Name | Rarity | Crit Chance | Crit Damage |
|------|--------|-------------|-------------|
| Vital Points | Common | +10% | - |
| Deadly Precision | Rare | +15% | +0.5x |
| Critical Master | Legendary | +25% | +1.0x |

---

## Special Mechanics

### Shields (v0.5.0 Rebalanced)
- Maximum 10 shield charges (hard cap regardless of upgrades)
- Obtained through upgrades (Reinforced Shield, Fortress, Immortal Fortress)
- Absorb one hit each before breaking
- Reset to full at the start of each wave

**Diminishing Iframes:**
- First hit: 400ms invincibility
- Second hit: 240ms invincibility (×0.6)
- Third hit: 144ms invincibility (×0.6)
- Fourth+ hit: 100ms invincibility (floor)
- Resets to 400ms after 2 seconds without shield breaks

**Shield Upgrades:**
| Upgrade | Rarity | Shields | Bonus |
|---------|--------|---------|-------|
| Reinforced Shield | Rare | +1 | - |
| Fortress | Epic | +2 | +30 HP |
| Immortal Fortress | Legendary | +4 | +100 HP |

- Shield upgrades hidden from pool when at cap
- Cyan diamond icon with charge pips displayed above the porcupine when active
- In infinite swarm: regenerate 1 charge every 30s
- Taking a hit resets the regen timer
- New shield charges from mid-wave upgrades are granted immediately

### Companions (Baby Porcupines)
- Obtained through upgrades (Baby Buddy, Porcupine Pack, Porcupine Army)
- Follow the player in formation
- Range: 600px targeting range
- Companion quills are real Quill objects — they inherit most player abilities at reduced efficiency
- **Efficiency scaling**: 40% base + 3% per companion owned, capped at 70% (e.g. 1=43%, 4=52%, 10+=70%)
- **Inherited abilities** (at efficiency): damage, fire rate, crit, bouncing, homing, projectile speed/size, elemental procs, explosion AOE, elite damage bonus
- **NOT inherited**: knockback, distance damage, piercing, vampirism, Apotheosis empowered volleys
- **Projectile count**: 20% of player's total projectiles per shot (min 1)
- Companion quills are cyan-colored to distinguish from player quills
- Config: `COMPANION_CONFIG` in `src/config.ts`

### Explosion AOE
- Obtained through upgrades (Explosive Tips, Cluster Bombs, Devastation, Nuclear Quills)
- Damages all enemies within radius when quill hits
- AOE damage = 50% of direct hit damage
- AOE kills properly award score, XP, and drops
- Visual feedback: expanding ring effect

### Homing Quills
- Obtained through upgrades (Seeker Quills, Smart Missiles)
- Quills track toward nearest enemy within 300px
- Higher strength = tighter tracking

### Vampirism (Lifesteal)
- Obtained through upgrades (Life Leech +1 str, Blood Quills +3 str, Vampire Lord +5 str)
- Stack-based system similar to elemental effects
- Proc chance: `stacks / (stacks + 20)` — diminishing returns (1 str = 4.8%, 5 = 20%, 10 = 33%)
- Heal amount: `8 + (stacks × 3)` — linear scaling (1 str = 11 HP, 5 = 23 HP, 10 = 38 HP)
- Healing is NOT damage-dependent — flat amount per proc
- Works on player quill hits (companions do NOT proc vampirism)

### Elemental Procs
- Each quill hit rolls independently for each unlocked element
- Proc chances use diminishing returns formula: `chance = (str × 0.1) / (1 + str × 0.1)`
- All elemental upgrades stack infinitely — no caps, just diminishing returns
- Companion quills trigger elemental procs at efficiency-scaled strength
- Fate's Favor mythic gives a 30% reroll chance on failed procs (applies to vampirism too)
- Apotheosis (mythic) makes every 5th volley auto-proc all unlocked elements

### Quill Apotheosis (Empowered Volleys)
- Every 5th shot (trigger pull, not individual quill) is empowered
- All quills in the empowered volley auto-crit and apply all unlocked elements at 100% proc rate
- Visual: rainbow quill effect on empowered volley

---

## Pickups

### Quill Pickup
- **Drop Chance**: 30% on enemy death
- **Effect**: +3 quills
- **Appearance**: Glowing cyan quill shape with pulsing glow
- **Duration**: 10 seconds before despawn (flashes 5 times before disappearing)
- **Physics**: Bounces and lands on platforms

### Pinecones (Currency)

Pinecones are the premium currency used to purchase cosmetics in the shop.

| Source | Drop Amount | Notes |
|--------|-------------|-------|
| Regular Enemies | 1 | 4% base drop chance |
| Bosses | 1-3 | Guaranteed drop |
| Treasure Chests | +1 bonus | Added to upgrade selection |

**Properties:**
- **Magnet Range**: 80px (same as XP orbs)
- **Despawn**: 15 seconds (warning flash at 12s)
- **Prosperity Bonus**: +0.1% drop chance per prosperity point
- **Persistence**: Saved to your account (requires login)

**Shop Uses:**
- Character skins (different porcupine colors/patterns)
- Hat accessories (worn above the porcupine)
- Quill styles (projectile appearance)
- Trail effects (movement particles)

---

## Arena Layouts

The arena changes after boss waves (every 5 waves):

| Waves | Layout | Description |
|-------|--------|-------------|
| 1-5 | Classic | Standard balanced platforms |
| 6-10 | Towers | Vertical stacking on sides |
| 11-15 | Asymmetric | Unbalanced challenging layout |
| 16-20 | Sparse | Fewer, larger platforms |
| 21-25 | Gauntlet | Central corridor with high platforms |
| 26+ | Cycles with variation | Repeats with position jitter |

---

## Progression System

### XP and Leveling

Enemies drop XP orbs on death. Collect them to level up and gain bonus upgrades.

**XP Formula:** `floor(5 × bossMultiplier × (1 + wave × 0.1))`

| XP Source | Base Value | Notes |
|-----------|------------|-------|
| Regular enemy | 5 XP | +10% per wave (wave 10 = 10 XP, wave 20 = 15 XP) |
| Boss | 50 XP | 10x multiplier (+wave bonus: 75 XP at wave 5, 100 at wave 10) |
| Elite enemy | 3x | Triples the regular enemy XP value |
| Danger bonus | +10%/stack | Additive per danger level (danger 5 = +50% XP) |

**XP Orbs:**
- Magnetic attraction within 80px
- Despawn after 15 seconds (warning flash at 12s)
- Color ranges from cyan (small) to gold (high-value, 20+ XP)

**Level Up Formula:** `XP required = 55 × 1.18^(level-1)`

| Level | XP Required |
|-------|-------------|
| 2 | 55 |
| 3 | 65 |
| 5 | 90 |
| 10 | 240 |
| 15 | 530 |
| 20 | 1,159 |

**Early-Game Pacing:**
- Wave 1: ~25 XP (5 enemies × 5 XP)
- Wave 2: ~30 XP (5 enemies × 6 XP) — **first level-up at end of wave 2**
- Wave 3: ~36 XP — second level-up mid wave 3-4
- Wave 5 boss: 75 XP — big XP spike

**Level Up Rewards:**
- Each level up triggers an upgrade selection (separate from wave-end upgrades)
- **+5% damage per level** (passive, stacks additively with upgrade damage)

### Treasure Chests

Rare drops from enemies containing better upgrades.

- **Base Drop Chance**: 1%
- **Despawn**: 15 seconds (warning at 12s)
- **Upgrades**: Never common, higher rare+ rates
- **First 3 chests**: Guaranteed to contain at least one rare+ upgrade

**Chest Rarity (v0.5.0 - Linear scaling with prosperity)**

| Prosperity | Uncommon | Rare | Epic | Legendary | Mythic |
|------------|----------|------|------|-----------|--------|
| 0 | 61% | 30% | 8% | 1% | 0.01% |
| 100 | 51% | 36% | 10% | 3% | 0.1% |
| 200 | 40% | 42% | 13% | 5% | 0.2% |
| 300 | 30% | 48% | 15% | 6% | 0.3% |
| 500 | 10% | 60% | 20% | 10% | 0.5% |

### Prosperity (v0.5.0 Rebalanced)

A luck stat that affects **chest drops** and **upgrade rarity**. Crit bonus was removed in v0.5.0 to prevent stacking exploits.

**v0.5.0 Changes:**
- Chest drop curve now uses logarithmic formula (caps at 14%)
- Crit bonus removed from prosperity
- Level-up rarity uses two-phase system
- Chest rarity uses linear scaling

**Chest Drop Formula:**
```
bonus = 0.13 × (1 - e^(-prosperity/161))
```

| Prosperity | Chest Drop |
|------------|------------|
| 0 | 1% |
| 100 | 7% |
| 200 | 10% |
| 500 | 13% |
| ∞ | 14% (cap) |

---

#### Level-Up Rarity (Two-Phase System)

**Base weights:** Common 65%, Uncommon 25%, Rare 6%, Epic 3.5%, Legendary 0.49%, Mythic 0.01%

Phase 1 (0-100 prosperity): Common transfers to Uncommon
Phase 2 (100-500 prosperity): Both transfer to higher rarities

| Prosperity | Common | Uncommon | Rare | Epic | Legend | Mythic |
|------------|--------|----------|------|------|--------|--------|
| 0 | 65% | 25% | 6% | 3.5% | 0.49% | 0.01% |
| 100 | 25% | 60% | 10% | 4% | 0.8% | 0.02% |
| 200 | 19% | 55% | 20% | 6% | 1% | 0.03% |
| 300 | 13% | 50% | 29% | 7% | 1.1% | 0.04% |
| 500 | 1% | 39% | 48% | 11% | 1.5% | 0.05% |

---

**Prosperity Upgrades:**
| Name | Rarity | Prosperity | Other Effects |
|------|--------|------------|---------------|
| Lucky Find | Common | +5 | - |
| Fortune Seeker | Uncommon | +10 | - |
| Treasure Hunter | Rare | +15 | +5% damage |
| Golden Touch | Epic | +25 | +10 max health |
| Midas | Legendary | +40 | +15% damage |

**Strategy Tips:**
- Prosperity stacks infinitely - no cap!
- Early prosperity snowballs into better upgrades later
- High prosperity makes chest drops much more rewarding
- At 100 prosperity, uncommon upgrades dominate level-ups (60%)
- At 500 prosperity, rare upgrades dominate level-ups (48%)

### Infinite Swarm Mode

After defeating the wave 20 boss (4th boss), the game transitions to endless mode with 4 escalating stages.

- **Trigger**: Completing wave 20 activates infinite swarm
- **No Wave Breaks**: Continuous spawning, no wave-end upgrades
- **Upgrades**: Only from level-ups and treasure chests
- **Damage**: Fully uncapped - scales naturally with multipliers

**4-Stage System:**

| Stage | Time | Name | Visual | HP Mult | DMG Mult | Spawn Floor |
|-------|------|------|--------|---------|----------|-------------|
| 1 | 0-3 min | Swarm | Red arena | 1.0x | 1.0x | 200ms |
| 2 | 3-6 min | Surge | Orange enemies | 1.5x | 1.5x | 100ms |
| 3 | 6-9 min | Frenzy | Red enemies | 2.5x | 2.0x | 50ms |
| 4 | 9+ min | Apocalypse | Purple enemies | 5.0x+ | 3.0x+ | 10ms |

Stage transitions trigger a screen flash and display the stage name. Stage 4 includes additional quadratic explosion terms that make damage scale out of control.

See [INFINITE_SWARM.md](INFINITE_SWARM.md) for complete scaling tables.

---

## Controls

| Action | Keys |
|--------|------|
| Move Left | A / Left Arrow |
| Move Right | D / Right Arrow |
| Jump | W / Up Arrow / Space |
| Shoot | Left Mouse (hold for continuous) |
| Aim | Mouse cursor |
| Pause | Escape |
| Mute/Unmute | M |
| Quick Restart | R |
| Stats Panel | Tab |

---

## Leaderboard

### Score Submission
After a game over, players can submit their score to the online leaderboard:
1. First time: prompted to enter a name (3-20 chars, alphanumeric + spaces)
2. Name is saved locally for future submissions
3. Score is submitted automatically with the saved name
4. Global and weekly ranks are displayed if the player makes the top 100

### Leaderboard Types

| Type | Description | Reset |
|------|-------------|-------|
| Global | Top 100 all-time scores | Never |
| Weekly | Top 100 scores this week | Monday 00:00 UTC |

### Offline Support
If the submission fails (network error), the score is queued locally and retried on the next session. Pending submissions expire after 7 days.
