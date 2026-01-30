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

Your quill percentage determines your state:

| State | Quills | Speed | Damage | Take Damage | Notes |
|-------|--------|-------|--------|-------------|-------|
| Full | 70-100% | 100% | 100% | 100% | Normal state |
| Patchy | 40-70% | 100% | 100% | 100% | Visual change only |
| Sparse | 3-40% | 110% | 85% | 100% | Faster but weaker |
| Naked | 0-3% | 125% | 0% | 200% | Can't shoot, very fast |

### Quill Regeneration
- **Base Rate**: 1.0 quill/sec
- **Regen Delay**: 800ms pause after shooting
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
- **Health**: 300 base (scales with waves and tier bonus - see Boss HP Scaling)
- **Damage**: 30 (contact)
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
- **Health**: 250 base (scales with waves and tier bonus - see Boss HP Scaling)
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

## Wave Progression

### Enemy Count Formula
```
count = min(60, 5 × (1.15 ^ (wave - 1)))
```

Capped at 60 enemies per wave to prevent marathon waves.

| Wave | Enemies | Boss(es) |
|------|---------|----------|
| 1 | 5 | None |
| 5 | 1 | Ground Boss (solo) |
| 10 | 1 | Flying Boss (solo) |
| 15 | 5 | Both + minions |
| 20 | 6 | Both + minions |
| 25+ | 7+ | Both + minions |

### Spawn Pacing

Enemies spawn slowly at the start of each wave and ramp up to a fast pace:

| Phase | Interval | Notes |
|-------|----------|-------|
| Wave Start | 1200ms between spawns | Opening pace |
| Wave End | 300ms between spawns | Intense finale |

- Starting interval decreases by 100ms every 2 waves (floor: 400ms)
- Example: Wave 1-2 starts at 1200ms, Wave 9-10 starts at 800ms

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

### Stat Scaling Per Wave (Quadratic)

Enemies scale with a **quadratic formula** to match player power growth:

```
healthMult = 1 + steps × 0.15 + steps² × 0.02
damageMult = 1 + steps × 0.10 + steps² × 0.01
speedMult = 1 + steps × 0.03 (capped at 1.5x)
```

Where `steps = floor((wave - 1) / 2)`. Max multiplier: 15x.

**Example: Scurrier HP by Wave**

| Wave | Steps | Multiplier | HP | Notes |
|------|-------|------------|-----|-------|
| 1-2 | 0 | 1.0x | 30 | Base |
| 3-4 | 1 | 1.17x | 35 | |
| 5-6 | 2 | 1.38x | 41 | 1st boss |
| 9-10 | 4 | 1.92x | 58 | 2nd boss |
| 15-16 | 7 | 3.03x | 91 | 3rd boss |
| 19-20 | 9 | 3.97x | 119 | Final wave |

Note: After wave 20, infinite swarm takes over with its own scaling.

### Boss HP Scaling

Bosses have base HP (300 ground, 250 flying) plus:
1. **Wave scaling** - Same quadratic formula as other enemies
2. **Tier bonus** - +50% per boss tier after the first

| Wave | Boss Tier | Wave Mult | Tier Bonus | Ground Boss HP | Flying Boss HP |
|------|-----------|-----------|------------|----------------|----------------|
| 5 | 0 | 1.38x | 1.0x | 414 | - |
| 10 | 1 | 1.92x | 1.5x | 864 | 720 |
| 15 | 2 | 3.03x | 2.0x | 1,818 | 1,515 |
| 20 | 3 | 3.97x | 2.5x | 2,978 | 2,481 |

---

## Upgrades

### Rarity System
Upgrades are offered after each wave. Rarity determines power level.

**Base Rarity Weights:**
| Rarity | Weight | Probability | Color |
|--------|--------|-------------|-------|
| Common | 60 | 60% | Gray |
| Uncommon | 25 | 25% | Green |
| Rare | 10 | 10% | Blue |
| Epic | 4 | 4% | Purple |
| Legendary | 1 | 1% | Orange |

**Formula:** Roll random 0-100, select rarity based on cumulative weights.

**Upgrade Selection Rules:**
1. Roll rarity based on weights
2. Filter to upgrades of that rarity not at max stacks
3. Pick randomly from filtered list
4. Repeat for each choice (3 choices per wave)

---

### Common Upgrades (7)

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

---

### Uncommon Upgrades (9)

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

---

### Rare Upgrades (9)

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

---

### Epic Upgrades (10)

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

---

### Legendary Upgrades (9)

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

---

## Special Mechanics

### Shields
- Obtained through upgrades (Energy Shield, Reinforced Shield, Fortress, Immortal Fortress)
- Absorb one hit each before breaking
- Reset to full at the start of each wave
- Brief invincibility (500ms) when shield breaks

### Companions (Baby Porcupines)
- Obtained through upgrades (Baby Buddy, Porcupine Pack, Porcupine Army)
- Follow the player in formation
- Auto-shoot at nearest enemy every 2 seconds
- Deal base 10 damage (scales with 50% of damage upgrades)
- Range: 800px targeting range (most of screen)
- Spawn immediately when upgrade is selected (from any source)

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

---

## Pickups

### Quill Pickup
- **Drop Chance**: 30% on enemy death
- **Effect**: +3 quills
- **Appearance**: Glowing cyan quill shape with pulsing glow
- **Duration**: 10 seconds before despawn (flashes 5 times before disappearing)
- **Physics**: Bounces and lands on platforms

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
| Uncommon | 30% |
| Rare | 40% |
| Epic | 20% |
| Legendary | 10% |

### Prosperity

A luck-like stat that affects chest drops and critical chance.

| Prosperity | Chest Drop Chance | Crit Bonus |
|------------|-------------------|------------|
| 0 | 1% | +0% |
| 10 | 6% | +5% |
| 25 | 13.5% | +12.5% |
| 50 (cap) | 26% | +25% |

**Formula:**
- Chest drop: `1% + (prosperity × 0.5%)`
- Crit bonus: `prosperity × 0.5%`

*Note: A rarity shift system is defined but not currently active. Upgrade rarity uses base weights.*

**Prosperity Upgrades:**
| Name | Rarity | Prosperity | Other Effects |
|------|--------|------------|---------------|
| Lucky Find | Common | +5 | - |
| Fortune Seeker | Uncommon | +10 | - |
| Treasure Hunter | Rare | +15 | +5% damage |
| Golden Touch | Epic | +25 | +10 max health |
| Midas | Legendary | +40 | +15% damage |

### Infinite Swarm Mode

After completing wave 20 (the 4th boss fight), the game transitions to endless mode with **tier-based quadratic scaling**.

- **Trigger**: Completing wave 20 activates infinite swarm
- **No Wave Breaks**: Continuous spawning, no wave-end upgrades
- **Upgrades**: Only from level-ups and treasure chests
- **Goal**: Survive as long as possible until overwhelmed

**Tier-Based Scaling:**

Every 5 seconds, difficulty increases to a new tier. Each tier adds more than the previous:

```
Tier bonus = tier × 15% + tier × (tier-1) × 2.5%
Spawn interval = max(100ms, 600ms - tier × 30ms)
```

| Time | Tier | Stat Bonus | Spawn Rate | Notes |
|------|------|------------|------------|-------|
| 0-5s | 0 | +0% | 600ms | Base difficulty |
| 5-10s | 1 | +15% | 570ms | First step up |
| 10-15s | 2 | +35% | 540ms | Accelerating |
| 15-20s | 3 | +60% | 510ms | |
| 20-25s | 4 | +90% | 480ms | |
| 25-30s | 5 | +125% | 450ms | Getting hard |
| 30-35s | 6 | +165% | 420ms | |
| 45-50s | 9 | +315% | 330ms | Very hard |
| 60s+ | 12+ | +510%+ | 240ms | Overwhelming |
| 90s+ | 18+ | +1080%+ | 100ms | Nearly impossible |

The quadratic acceleration means difficulty ramps slowly at first but becomes overwhelming quickly.

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
