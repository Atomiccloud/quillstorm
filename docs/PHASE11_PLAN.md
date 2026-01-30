# Phase 11: Progression Overhaul

## Overview

Major expansion inspired by [Vampire Survivors' luck mechanics](https://vampire.survivors.wiki/w/Luck) and [Hades' progression design](https://gameeconomistconsulting.com/in-round-progression-is-the-biggest-game-design-innovation-in-a-decade/).

### Features
1. **Stats Panel** - Tab key shows accumulated modifiers
2. **Treasure Chests** - Rare enemy drops with better upgrade rarity
3. **Prosperity System** - Luck-like stat affecting drops, rarity, AND crit
4. **XP System** - Enemies drop XP orbs, level ups grant extra upgrades
5. **Infinite Swarm** - Endless mode at level 20

### Design Principles
- **Vampire Survivors**: Luck affects multiple systems. High luck can guarantee outcomes. Early chests are "rigged" to feel good.
- **Hades/Dead Cells**: In-round + meta progression. Simple but intuitive systems.
- **Key Principle**: Player skill > randomness. Prosperity should feel impactful but not mandatory.

---

## 11.1 Stats Panel (Tab Key)

**New File:** `src/ui/StatsPanel.ts`

Press Tab during gameplay to show/hide a panel displaying current stat bonuses.

**Visual Design:**
- Semi-transparent dark panel (right side of screen)
- Title: "STATS" in gold
- Two-column layout: stat name (left), value (right)
- Green for positive, red for negative values
- Grouped by category (Combat, Defense, Movement, Special)

**Display Format:**
```
STATS
─────────────────
COMBAT
  Damage        +45%
  Fire Rate     +30%
  Crit Chance   +15%
  Crit Damage   +0.5x

DEFENSE
  Max Health    +40
  Shield        2 charges

MOVEMENT
  Speed         +20%
  Jump          +10%

SPECIAL
  Prosperity    +25
  Vampirism     +5%
```

---

## 11.2 Treasure Chests

**New File:** `src/entities/TreasureChest.ts`

**Drop Mechanics:**
- Base drop chance: 1% (independent of quill pickup roll)
- Affected by Prosperity: `1% + (prosperity × 0.5%)` (max ~26% at 50 prosperity)
- **First 3 chests are "rigged"**: Always drop at least 1 rare+ upgrade

**Chest Properties:**
- Despawn: 7 seconds (with warning flash at 5s)
- Visual: Golden chest with pulsing glow, bobbing animation
- Size: 32×24 pixels

**Upgrade Selection (from chest):**
- Opens UpgradeScene with special "chest" mode
- **Never rolls Common** (0 weight)
- Modified rarity weights: Uncommon 30%, Rare 40%, Epic 20%, Legendary 10%

---

## 11.3 Prosperity System

**New Modifier Type:** Add `prosperity` to UpgradeEffects and UpgradeManager.

**Effects (like Vampire Survivors' Luck):**

| Prosperity | Chest Drop | Rarity Shift | Crit Bonus |
|------------|------------|--------------|------------|
| 0 | 1% | Base weights | +0% |
| 10 | 6% | +10% rare+ | +5% crit |
| 25 | 13.5% | +25% rare+ | +12.5% crit |
| 50 (cap) | 26% | +50% rare+ | +25% crit |

**Crit Bonus:** `+0.5% crit chance per prosperity point`

**New Prosperity Upgrades:**

| Name | Rarity | Prosperity | Other Effects |
|------|--------|------------|---------------|
| Lucky Find | Common | +5 | - |
| Fortune Seeker | Uncommon | +10 | - |
| Treasure Hunter | Rare | +15 | +5% damage |
| Golden Touch | Epic | +25 | +10 max health |
| Midas | Legendary | +40 | +15% damage, maxStacks: 1 |

---

## 11.4 XP System

**New Files:**
- `src/systems/ProgressionManager.ts` - XP and level tracking
- `src/entities/XPOrb.ts` - Collectible orb

**XP Orbs:**
- Dropped by all enemies on death
- Visual: Small glowing orb, color varies by value (cyan→gold)
- Magnetic attraction: Auto-collects when player within 80px
- Despawn: 15 seconds

**XP Values:**
```
Base XP = 5
Boss multiplier = 10x
Wave bonus = 1 + (wave × 0.1)
```

**Level Up Formula:**
```
XP required = 100 × 1.15^(level-1)

Level 2: 100 XP
Level 5: 152 XP
Level 10: 352 XP
Level 15: 813 XP
Level 20: 1,878 XP
```

**Level Up Rewards:**
- Each level up triggers UpgradeScene (separate from wave-end upgrades)
- Shows "LEVEL UP!" animation with triumphant fanfare

---

## 11.5 Infinite Swarm Mode

At player level 20, the game transitions to endless mode.

**Trigger:**
- When player reaches level 20, current wave completes normally
- Wave counter changes to "INFINITE SWARM" in red, pulsing

**Mechanics:**
- Enemies spawn continuously (no wave breaks)
- Spawn interval: starts at 800ms, decays by 0.5%/sec (floor: 200ms)
- Enemy stats scale: +0.1% per second
- No more wave-end upgrades (only level-up and chest upgrades)
- Game continues until player dies

---

## 11.6 Configuration

```typescript
export const XP_CONFIG = {
  baseXPToLevel: 100,
  xpScalingFactor: 1.15,
  xpDropBase: 5,
  xpDropBossMultiplier: 10,
  xpOrbMagnetRange: 80,
  xpOrbDespawnTime: 15000,
  infiniteSwarmLevel: 20,
};

export const CHEST_CONFIG = {
  baseDropChance: 0.01,
  despawnTime: 7000,
  warningTime: 5000,
  riggedChestCount: 3,
  rarityWeights: {
    common: 0,
    uncommon: 30,
    rare: 40,
    epic: 20,
    legendary: 10,
  },
};

export const PROSPERITY_CONFIG = {
  chestDropBonusPerPoint: 0.005,
  rarityShiftPerPoint: 0.01,
  critBonusPerPoint: 0.005,
  maxProsperity: 50,
};

export const INFINITE_SWARM_CONFIG = {
  baseSpawnInterval: 800,
  spawnIntervalDecayRate: 0.995,
  minSpawnInterval: 200,
  statScaleRate: 0.001,
};
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/ui/StatsPanel.ts` | Tab-toggleable stats display |
| `src/entities/TreasureChest.ts` | Collectible chest entity |
| `src/entities/XPOrb.ts` | XP collectible entity |
| `src/systems/ProgressionManager.ts` | XP, levels, infinite swarm state |

## Files to Modify

| File | Changes |
|------|---------|
| `src/config.ts` | Add XP_CONFIG, CHEST_CONFIG, PROSPERITY_CONFIG, INFINITE_SWARM_CONFIG |
| `src/data/upgrades.ts` | Add prosperity to UpgradeEffects, add 5 prosperity upgrades, modify getRandomUpgrades() |
| `src/systems/UpgradeManager.ts` | Add prosperity modifier type |
| `src/scenes/GameScene.ts` | Stats panel, chest spawning, XP orbs, infinite swarm integration |
| `src/scenes/UpgradeScene.ts` | Accept source parameter (wave/chest/levelup), custom rarity weights |
| `src/ui/HUD.ts` | XP bar, level display, infinite swarm indicator |
| `src/systems/WaveManager.ts` | Infinite swarm mode (continuous spawning) |
| `src/systems/AudioManager.ts` | New sounds: chest open, XP collect, level up, infinite swarm start |

---

## Implementation Order

**Phase A: Foundation**
1. Config additions (all new constants)
2. Prosperity modifier in UpgradeManager
3. Prosperity upgrades in upgrades.ts

**Phase B: Stats Panel**
4. Create StatsPanel.ts
5. GameScene: Tab key toggle

**Phase C: Progression System**
6. Create ProgressionManager.ts
7. Create XPOrb.ts
8. HUD: XP bar, level display
9. GameScene: XP spawn, collection, level up trigger
10. UpgradeScene: source parameter support

**Phase D: Treasure Chests**
11. Create TreasureChest.ts
12. Modify getRandomUpgrades() for custom weights
13. GameScene: chest spawning, collection

**Phase E: Infinite Swarm**
14. WaveManager: infinite mode logic
15. GameScene: activation at level 20
16. HUD: infinite swarm indicator

**Phase F: Audio & Polish**
17. AudioManager: new sounds
18. Visual polish (particles, animations)

---

## Verification Checklist

- [ ] Tab key toggles stats panel showing all current modifiers
- [ ] Stats panel updates when upgrades are selected
- [ ] Enemies have 1% base chance to drop treasure chests
- [ ] First 3 chests always contain at least one rare+ upgrade
- [ ] Chest upgrades never include common rarity
- [ ] Prosperity increases chest drop rate
- [ ] Prosperity shifts upgrade rarity toward rare/epic/legendary
- [ ] Prosperity gives +0.5% crit per point
- [ ] All enemies drop XP orbs on death
- [ ] XP orbs magnetically attract to player within 80px
- [ ] Level up triggers upgrade selection
- [ ] HUD shows current level and XP progress
- [ ] At level 20, infinite swarm mode activates
- [ ] Infinite swarm: enemies spawn continuously with increasing speed
- [ ] Infinite swarm: no wave-end upgrades (only level/chest)
- [ ] Difficulty multiplier displayed during infinite swarm
- [ ] All new sounds play correctly
- [ ] Build passes with no errors
