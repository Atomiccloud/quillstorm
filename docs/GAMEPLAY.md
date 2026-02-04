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
- **Unlocked**: Wave 2

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
- **Unlocked**: Wave 3

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
- **Unlocked**: Wave 5

### Burrower (Dark Brown)
- **Health**: 50
- **Damage**: 20
- **Speed**: 90
- **Points**: 35
- **Behavior**:
  - Cycles between above-ground and underground phases
  - Above ground: chases player like a scurrier (4 seconds)
  - Burrows underground: nearly invisible (alpha 0.15), immune to damage
  - Moves toward player at 1.5x speed while burrowed (3 seconds)
  - **Warning Phase**: Dirt particles and ground rumble appear 600ms before surfacing
  - Surfaces on the player's platform level, offset 50-90px to the left or right
  - Surfaces with AOE damage (60px radius, 20 damage)
  - Visual: dark brown mole with claws, dirt burst on surfacing
- **Unlocked**: Wave 8

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
- **Unlocked**: Wave 12

### Healer (Green)
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
  - Priority target due to healing ability (high points)
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
| Wave Start | 2000ms between spawns | Slow trickle, time to breathe |
| Wave End | 500ms between spawns | Intense finale |

- Starting interval decreases by 50ms every 2 waves (floor: 800ms)
- Example: Wave 1-2 spawns 2000ms→500ms, Wave 9-10 starts at 1800ms→500ms

### Enemy Unlocking
- **Wave 1**: Scurrier only
- **Wave 2+**: Spitter added
- **Wave 3+**: Swooper added
- **Wave 5+**: Shellback added (with roll attack)
- **Wave 8+**: Burrower added
- **Wave 12+**: Splitter added
- **Wave 15+**: Healer added
- **Every 5 waves**: Boss fight

### Spawn Weights

| Type | Weight | Unlock |
|------|--------|--------|
| Scurrier | 30 | Wave 1 |
| Spitter | 20 | Wave 2 |
| Swooper | 15 | Wave 3 |
| Shellback | 12 | Wave 5 |
| Burrower | 10 | Wave 8 |
| Splitter | 8 | Wave 12 |
| Healer | 5 | Wave 15 |

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
| Life Leech | +5% vampirism | Heal when dealing damage |
| Tough Skin | +5% armor (×3) | Reduces all incoming damage |
| Quick Reflexes | +4% evasion (×3) | Small chance to dodge attacks |

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
| Static Quills | 8% shock, 500ms stun | Chance to stun enemies |
| Frost Tips | 10% freeze, 600ms | Chance to freeze enemies |
| Ember Quills | 12% burn, 8 DPS (scales w/ dmg) | Stacking burn DoT |
| Toxic Quills | 12% poison, 15% amp | Stacking damage amplification |
| Iron Quills | +8% armor (×2) | Hardened quill damage resistance |
| Acrobat | +8% evasion, +5% speed | Agile dodge build |

---

### Rare Upgrades (13)

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
| Lightning Quills | +12% shock, +300ms stun | Better stun procs |
| Icicle Quills | +12% freeze, +400ms | Longer freeze |
| Flame Quills | +10% burn, +8 DPS (scales w/ dmg) | Hotter stacking burns |
| Noxious Spines | +10% poison, +10% amp | Deeper venom stacks |
| Porcupine Plate | +12% armor, +10 HP | Natural armor plating |
| Shadow Step | +12% evasion | Phase through attacks |

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
| Thunder Strike | +10% shock, +200ms, chain to 2 | Lightning arcs to nearby enemies |
| Blizzard Quills | +8% freeze, +500ms, 50% slow | Frozen enemies chill nearby foes |
| Inferno Quills | +8% burn, +8 DPS, 30px aura | Burning enemies scorch nearby |
| Plague Bearer | +8% poison, +10% amp, spread | Poison spreads on death |
| Diamond Hide | +15% armor, 10 thorns | Reflects damage to attackers |
| Phantom Porcupine | +15% evasion, +15% speed | Nearly untouchable |

---

### Legendary Upgrades (13)

| Name | Effect | Max Stacks | Description |
|------|--------|------------|-------------|
| Quill Storm | +100% fire rate, +2 projectiles, -10% damage | 1 | Machine gun mode |
| Sniper Quills | +100% damage, +5 pierce, -30% fire rate, +80% proj speed | 1 | One-shot build |
| Pinball Wizard | +5 bounces, +30% damage, +30% proj speed | 1 | Chaos build |
| Quill Infinity | +50 max quills, +100% regen | 1 | Never run out |
| Glass God | +150% damage, +30% crit, +1.0x crit damage, -50 health | 1 | Ultimate glass cannon |
| Nuclear Quills | 150px explosion, +80% damage, -30% fire rate | 1 | Nuke build |
| Porcupine Army | +4 companions | 1 | Army of helpers |
| Vampire Lord | +15% vampirism, +30% damage | 1 | Lifesteal build |
| Immortal Fortress | +5 shields, +50 health | 1 | Unkillable defense |
| Storm Caller | +10% shock, +200ms, chain to +3 | 1 | Storm of chain lightning |
| Absolute Zero | +10% freeze, +500ms, 50% shatter | 1 | Frozen enemies shatter on death |
| Hellfire | +10% burn, +8 DPS, 80px explosion | 1 | Burning enemies explode on death |
| Pandemic | +10% poison, +15% amp, 50px cloud | 1 | Death releases poison cloud |

---

## Elemental Effects

### Overview
Quills can proc elemental status effects on enemies. Each element has 4 upgrade tiers (uncommon → legendary). Fire and Poison **stack** on enemies (multiple independent stacks), while Lightning and Ice are **single instance** (new procs refresh duration).

### Lightning (Shock) — Crowd Control
- **Behavior**: Stuns enemy, stopping all movement and attacks (including spitter projectiles)
- **Stacking**: Single instance — new shock refreshes duration if longer
- **Visual**: Yellow flash + jagged spark particles
- **Chain Lightning** (Thunder Strike+): Arcs to nearby enemies on shock proc, range 150px
- **Full stack**: 40% shock chance, 1200ms stun, chains to 5 enemies

### Ice (Freeze) — Immobilize
- **Behavior**: Freezes enemy solid, stopping all movement and attacks
- **Stacking**: Single instance — new freeze refreshes duration if longer
- **Visual**: Blue tint + ice crystal outline
- **Frost Slow** (Blizzard Quills): Frozen enemies chill nearby foes, slowing them 50%
- **Shatter** (Absolute Zero): Frozen enemies that die deal 50% of max HP as AOE damage (100px range)
- **Full stack**: 40% freeze chance, 2000ms freeze, slow aura, shatter AOE on kill

### Fire (Burn) — Stacking DoT
- **Behavior**: Each proc adds an independent burn stack. Each stack ticks DPS independently.
- **DPS Scaling**: Burn DPS scales with the player's damage modifier (e.g., +100% damage = double burn DPS)
- **Duration**: Fixed 2s per stack (from `STATUS_EFFECT_CONFIG.burn.defaultDuration`)
- **Stacking**: Up to 10 independent burn stacks per enemy
- **Visual**: Orange glow, intensity scales with stack count, flicker ring at 2+ stacks
- **Fire Aura** (Inferno Quills): Burning enemies scorch nearby foes (30px radius)
- **Fire Explosion** (Hellfire): Burning enemies explode on death — radius scales with stacks, spreads burn
- **Full stack**: 40% burn chance, 32 base DPS per stack for 2s (scales with damage), fire aura + death explosion
- **Example**: With +50% damage, 3 burn stacks = 3 × (32 × 1.5) = 144 DPS total

### Poison (Venom) — Stacking Damage Amplifier
- **Behavior**: Each proc adds an independent poison stack. Damage amplification sums across all stacks.
- **Duration**: Fixed 3s per stack (from `STATUS_EFFECT_CONFIG.poison.defaultDuration`)
- **Stacking**: Up to 10 independent poison stacks per enemy
- **Visual**: Green tint + drip particles, intensity scales with stack count
- **Poison Spread** (Plague Bearer): Poison spreads to nearby enemies when a poisoned foe dies (100px range)
- **Poison Cloud** (Pandemic): Death releases a lingering poison cloud (50px, 3s duration, ticks every 500ms)
- **Full stack**: 40% poison chance, +50% damage amp per stack, death cloud + spread
- **Example**: Enemy with 3 poison stacks takes 150% bonus damage

---

## Defense Stats

### Armor (Damage Reduction)
- **Formula**: `actualDamage = rawDamage × (1 - armor)`
- **Cap**: 50% maximum (`ARMOR_CONFIG.maxArmor`)
- **Applied**: After shields, before quill state multiplier
- **Max possible**: 5%×3 + 8%×2 + 12% + 15% = 58% → capped at 50%

### Evasion (Dodge Chance)
- **Formula**: Roll `Math.random() < evasion` before all other damage processing
- **Cap**: 40% maximum (`EVASION_CONFIG.maxEvasion`)
- **Applied**: Before shields — a dodge wastes no shield charges
- **Visual**: "DODGE" floating text when triggered
- **Max possible**: 4%×3 + 8% + 12% + 15% = 47% → capped at 40%

### Thorns (Damage Reflection)
- **Source**: Diamond Hide epic upgrade (+10 flat thorns)
- **Behavior**: When hit, deal flat thorns damage back to the attacking enemy
- **Applied**: On both regular contact damage and shellback roll attacks

---

## Special Mechanics

### Shields
- Obtained through upgrades (Energy Shield, Reinforced Shield, Fortress, Immortal Fortress)
- Absorb one hit each before breaking
- Reset to full at the start of each wave
- Brief invincibility (500ms) when shield breaks
- Cyan diamond icon with charge pips displayed above the porcupine when active
- In infinite swarm: regenerate 1 charge every 30s (configurable via `INFINITE_SWARM_CONFIG.shieldRegenInterval`)
- Taking a hit resets the regen timer
- New shield charges from mid-wave upgrades are granted immediately

### Companions (Baby Porcupines)
- Obtained through upgrades (Baby Buddy, Porcupine Pack, Porcupine Army)
- Follow the player in formation
- Auto-shoot at nearest enemy every 2 seconds
- Deal base 10 damage (scales with 50% of damage upgrades)
- Range: 400px targeting range

### Explosion AOE
- Obtained through upgrades (Explosive Tips, Cluster Bombs, Devastation, Nuclear Quills)
- Damages all enemies within radius when quill hits
- AOE damage = 50% of direct hit damage
- Visual feedback: expanding ring effect

### Homing Quills
- Obtained through upgrades (Seeker Quills, Smart Missiles)
- Quills track toward nearest enemy within 300px
- Higher strength = tighter tracking

### Vampirism (Lifesteal)
- Obtained through upgrades (Life Leech, Vampire Lord)
- Heal percentage of damage dealt
- Works on all damage including AOE

### Elemental Procs
- Each quill hit rolls independently for each unlocked element
- Proc chances are additive across upgrade tiers (e.g., 8% + 12% = 20% shock chance)
- Companion quills also trigger elemental procs
- Fate's Favor mythic gives a 30% reroll chance on failed procs (applies to vampirism too)

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
- **Despawn**: 12 seconds (warning flash at 9s)
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

| XP Source | Base Value | Notes |
|-----------|------------|-------|
| Regular enemies | 5 XP | +10% per wave |
| Boss | 50 XP | 10x multiplier |

**XP Orbs:**
- Magnetic attraction within 80px
- Despawn after 15 seconds (warning flash at 12s)
- Color ranges from cyan (small) to gold (large)

**Level Up Formula:** `XP required = 100 × 1.15^(level-1)`

| Level | XP Required |
|-------|-------------|
| 2 | 100 |
| 5 | 152 |
| 10 | 352 |
| 15 | 813 |
| 20 | 1,878 |

**Level Up Rewards:** Each level up triggers an upgrade selection (separate from wave-end upgrades).

### Treasure Chests

Rare drops from enemies containing better upgrades.

- **Base Drop Chance**: 1%
- **Despawn**: 7 seconds (warning at 5s)
- **Upgrades**: Never common, higher rare+ rates
- **First 3 chests**: Guaranteed to contain at least one rare+ upgrade

**Chest Rarity Weights:**
| Rarity | Weight |
|--------|--------|
| Common | 0% |
| Uncommon | 45% |
| Rare | 35% |
| Epic | 15% |
| Legendary | 5% |

### Prosperity

A luck-like stat (inspired by Vampire Survivors) that affects **everything**: chest drops, critical chance, AND upgrade rarity. Stacks infinitely with diminishing returns per point.

**Core Formulas:**
- Chest drop: `1% + (prosperity × 0.2%)`
- Crit bonus: `prosperity × 0.2%`
- Rarity shift: `prosperity × 0.5%` transferred to rare+

**Summary Table:**

| Prosperity | Chest Drop | Crit Bonus | Rarity Shift |
|------------|------------|------------|--------------|
| 0 | 1% | +0% | None |
| 25 | 6% | +5% | 12.5% |
| 50 | 11% | +10% | 25% |
| 100 | 21% | +20% | 50% |
| 150 | 31% | +30% | 75% |

---

#### Rarity Shift Formula

Prosperity shifts weight from lower rarities to higher ones:

```
shift = prosperity × 0.5%

Common loses: common_weight × shift × 50%
Uncommon loses: uncommon_weight × shift × 30%
Total transferred = common loss + uncommon loss

Rare gains: transferred × 50%
Epic gains: transferred × 30%
Legendary gains: transferred × 20%
```

**Example: Wave-End Upgrades (base 60/25/10/4/1)**

| Prosperity | Common | Uncommon | Rare | Epic | Legendary |
|------------|--------|----------|------|------|-----------|
| 0 | 60% | 25% | 10% | 4% | 1% |
| 50 | 52.5% | 23.1% | 12.3% | 5.5% | 1.6% |
| 100 | 45% | 21.3% | 14.5% | 7% | 2.2% |
| 150 | 37.5% | 19.4% | 16.8% | 8.4% | 2.9% |

At 150 prosperity, you have **~3x** the legendary chance!

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
- Combined with crit bonuses, prosperity is a powerful scaling stat

### Infinite Swarm Mode

After defeating the wave 20 boss (4th boss), the game transitions to endless mode.

- **Trigger**: Completing wave 20 activates infinite swarm (max wave is 20)
- **Spawn Rate**: Starts at 600ms, decays by 1% per second (floor: 10ms)
- **Difficulty**: Quadratic scaling - `multiplier = 1 + (seconds/30)²`
- **No Wave Breaks**: Continuous spawning, no wave-end upgrades
- **Upgrades**: Only from level-ups and treasure chests

**Difficulty Curve:**

| Time | Stat Multiplier | Spawn Interval |
|------|-----------------|----------------|
| 0s | 1.0x | 600ms |
| 30s | 2.0x | ~360ms |
| 60s | 5.0x | ~215ms |
| 90s | 10.0x | ~130ms |
| 2min | 17.0x | ~75ms |

The quadratic scaling makes late-game survival increasingly challenging without sudden difficulty spikes.

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
