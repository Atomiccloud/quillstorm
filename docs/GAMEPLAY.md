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
  - Hovers ~150px above player
  - Dive-bombs at player periodically
  - Ignores platform collision when hovering (phases through)
  - Only collides with platforms when diving
- **Unlocked**: Wave 3

### Shellback (Gray)
- **Health**: 80
- **Damage**: 15
- **Speed**: 50
- **Points**: 40
- **Behavior**:
  - Slow, steady approach toward player
  - Can jump to reach platforms
- **Special**: Blocks 90° frontal arc damage - attack from behind!
- **Unlocked**: Wave 5

### Boss (Dark Red)
- **Health**: 300
- **Damage**: 25 (contact)
- **Speed**: 100
- **Projectile Speed**: 400
- **Fire Rate**: 0.6 sec between shots
- **Charge Speed**: 350
- **Points**: 500
- **Appears**: Every 5 waves (5, 10, 15, 20...)

**Two-Phase Fight:**

| Phase | HP | Behavior |
|-------|-----|----------|
| Phase 1 | >50% | Maintains distance, strafes, fires single shots |
| Phase 2 | ≤50% | More aggressive, fires 3-shot spread, faster strafing |

**Special Attacks:**
- **Charge Attack**: Boss glows red, then charges at high speed
- **Jump**: Can jump to reach players on platforms
- **Projectile Spread**: In phase 2, fires 3 projectiles in a spread pattern

**Boss Wave Spawning:**
- Wave 5: Boss spawns ALONE (no minions)
- Wave 10+: Boss spawns with minions (wave/5 minions)

---

## Wave Progression

### Enemy Count Formula
```
count = 5 × (1.2 ^ (wave - 1))
```

| Wave | Enemies |
|------|---------|
| 1 | 5 |
| 5 | 10 (Boss solo) |
| 10 | 24 (Boss + 2 minions) |
| 15 | 48 (Boss + 3 minions) |
| 20 | 95 (Boss + 4 minions) |

### Enemy Unlocking
- **Wave 1**: Scurrier only
- **Wave 2+**: Spitter added
- **Wave 3+**: Swooper added
- **Wave 5+**: Shellback added
- **Every 5 waves**: Boss fight

### Stat Scaling Per Wave
Enemies get stronger each wave (capped at multiplier):

| Stat | Per Wave | Max Cap |
|------|----------|---------|
| Health | +8% | 3.0x |
| Damage | +5% | 3.0x |
| Speed | +2% | 3.0x |

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
