# Quillstorm Gameplay

## Player Mechanics

### Movement
- **Speed**: 300 px/sec base (modified by upgrades)
- **Jump Force**: 580 px/sec upward
- **Air Control**: 80% of ground speed while airborne
- **Collision**: Bounded by screen edges

### Quill States

Your quill count determines your state:

| State | Quills | Speed | Damage | Take Damage |
|-------|--------|-------|--------|-------------|
| Full | 70-100% | 100% | 100% | 100% |
| Patchy | 40-70% | 100% | 100% | 100% |
| Sparse | 10-40% | 110% | 85% | 100% |
| Naked | 0-10% | 125% | 0% (can't shoot) | 200% |

### Quill Regeneration
- **Base Rate**: 1 quill/sec
- **Regen Delay**: 800ms pause after shooting
- **Naked Bonus**: 3x regeneration when below 10%

### Shooting
- **Fire Rate**: 3 shots/sec base
- **Projectile Speed**: 800 px/sec
- **Base Damage**: 10
- **Lifetime**: 3 seconds

## Enemies

### Scurrier (Brown)
- **Health**: 30
- **Damage**: 10
- **Speed**: 150
- **Behavior**: Simple chase, runs directly at player

### Spitter (Green)
- **Health**: 25
- **Damage**: 15 (projectile)
- **Speed**: 60
- **Fire Rate**: 1.5 sec
- **Behavior**: Maintains ~250px distance, shoots green projectiles

### Swooper (Purple)
- **Health**: 15
- **Damage**: 20
- **Speed**: 200 (hover), 400 (dive)
- **Behavior**: Hovers 150px above player, then dive-bombs
- **Special**: Ignores platform collision when hovering

### Shellback (Gray)
- **Health**: 80
- **Damage**: 15
- **Speed**: 50
- **Behavior**: Slow steady approach
- **Special**: Blocks 90° frontal arc damage (hit from behind!)

### Boss (Dark Red)
- **Health**: 300
- **Damage**: 25 (contact), 15 (projectile)
- **Speed**: 100
- **Fire Rate**: 0.6 sec (faster)
- **Behavior**: Two-phase fight
  - Phase 1 (>50% HP): Maintains distance, strafes, fires single shots
  - Phase 2 (≤50% HP): More aggressive, fires 3-shot spread, faster strafing
- **Special Attacks**:
  - Charge Attack: Boss glows red and charges at player
  - Jump: Boss can jump to reach players on platforms
- **Appears**: Every 5 waves

## Wave Progression

### Enemy Count
```
count = 5 × (1.2 ^ (wave - 1))
```
Wave 1: 5, Wave 5: 10, Wave 10: 24

### Enemy Unlocking
- Wave 1: Scurrier only
- Wave 2+: Spitter added
- Wave 3+: Swooper added
- Wave 5+: Shellback added
- Every 5 waves: Boss + minions

### Stat Scaling
Per wave, enemies gain:
- **Health**: +8% per wave (capped at 3x)
- **Damage**: +5% per wave (capped at 3x)
- **Speed**: +2% per wave (capped at 1.5x)

## Upgrades

### Rarity Weights
- Common: 60%
- Uncommon: 25%
- Rare: 10%
- Epic: 4%
- Legendary: 1%

### Upgrade Categories

**Damage Upgrades**
- Sharp Quills (+10% damage)
- Razor Quills (+20% damage)
- Lethal Quills (+35% damage)

**Fire Rate**
- Quick Draw (+15% fire rate)
- Rapid Fire (+25% fire rate)

**Quill Count**
- Extra Quills (+5 max)
- Quill Overload (+10 max)
- Endless Quills (+15 max, +30% regen)

**Critical Hits**
- Vital Points (+10% crit chance)
- Deadly Precision (+15% crit, +0.5x crit damage)
- Critical Master (+25% crit, +1.0x crit damage)

**Multi-Shot**
- Double Shot (+1 projectile)
- Triple Shot (+2 projectiles)
- Shotgun Burst (+4 projectiles)

**Piercing**
- Piercing Quills (+1 pierce)
- Impaling Quills (+3 pierce)

**Bouncing**
- Bouncing Quills (+2 bounces)
- Pinball Wizard (+5 bounces, +30% damage)

**Movement**
- Light Feet (+10% speed)
- Strong Legs (+20% jump height)
- Speed Demon (+40% speed, +50% projectile speed)

**Health**
- Thick Hide (+20 max health)
- Armored Porcupine (+50 health, +20 quills)

**Legendary Combos**
- Quill Storm (+100% fire rate, +2 projectiles)
- Sniper Quills (+100% damage, +5 pierce, -30% fire rate)
- Glass God (+150% damage, +30% crit, -50 health)

## Pickups

### Quill Pickup
- **Drop Chance**: 30% on enemy death
- **Effect**: +3 quills
- **Appearance**: Glowing cyan quill shape
- **Duration**: 10 seconds before despawn
- **Physics**: Bounces and lands on platforms
