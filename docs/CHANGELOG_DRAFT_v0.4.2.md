# v0.4.2 Changelog Draft - Elemental Defense Update

## Overview
This update overhauls the armor and evasion defense systems with logarithmic diminishing returns, adds new legendary defense upgrades, and implements anti-cheat validation for defense stats.

---

## Defense System Overhaul

### Armor - Logarithmic Diminishing Returns
**Old system:** Hard cap at 50% damage reduction

**New system:** Logarithmic formula with no cap, infinitely stackable
```
effectiveReduction = ln(1 + rawArmor) / (ln(1 + rawArmor) + 1.5)
```

| Total Armor | Effective Reduction |
|-------------|---------------------|
| 5 | 3.2% |
| 15 | 9.0% |
| 30 | 16.0% |
| 50 | 21.3% |
| 75 | 27.4% |
| 100 | 31.6% |
| 150 | 37.8% |
| 200 | 42.3% |
| 300 | 48.5% |
| 400 | 52.8% |

### Evasion - Logarithmic Diminishing Returns
**Old system:** Hard cap at 40% dodge chance

**New system:** Logarithmic formula with no cap, infinitely stackable (stricter k value)
```
effectiveDodge = ln(1 + rawEvasion) / (ln(1 + rawEvasion) + 2.0)
```

| Total Evasion | Effective Dodge |
|---------------|-----------------|
| 5 | 2.4% |
| 15 | 6.9% |
| 30 | 11.6% |
| 50 | 16.8% |
| 75 | 22.0% |
| 100 | 25.7% |
| 150 | 31.2% |
| 200 | 35.5% |
| 300 | 41.6% |
| 400 | 46.0% |

### Display Change
- Armor and Evasion now display as flat numbers (e.g., "50 Armor") instead of percentages
- Avoids player confusion about diminishing returns

---

## Upgrade Changes

### Armor Upgrades (All Infinitely Stackable)

| Rarity | Name | Old Effect | New Effect |
|--------|------|------------|------------|
| Common | Tough Skin | +5% armor (×3 max) | +5 Armor |
| Uncommon | Iron Quills | +8% armor (×2 max) | +10 Armor |
| Rare | Porcupine Plate | +12% armor, +10 HP (×1) | +15 Armor, +20 HP |
| Epic | Diamond Hide | +15% armor, +10 thorns (×1) | +20 Armor, +10 Thorns |
| **NEW Legendary** | **Living Bastion** | — | +40 Armor, +20 Thorns, +25 HP |

### Evasion Upgrades (All Infinitely Stackable)

| Rarity | Name | Old Effect | New Effect |
|--------|------|------------|------------|
| Common | Quick Reflexes | +4% evasion (×3 max) | +5 Evasion |
| Uncommon | Acrobat | +8% evasion, +5% speed (×1) | +10 Evasion |
| Rare | Shadow Step | +12% evasion (×1) | +15 Evasion, +5% Speed |
| Epic | Phantom Porcupine | +15% evasion, +15% speed (×1) | +20 Evasion, +10% Speed |
| **NEW Legendary** | **Wraith Form** | — | +25 Evasion, +15% Speed |

---

## Thorns Scaling

Thorns damage now scales with the player's damage modifier:
```
thornsDamage = baseThorns × (1 + damageModifier)
```

**Example:** With +100% damage modifier:
- Diamond Hide's 10 thorns → 20 thorns
- Living Bastion's 20 thorns → 40 thorns

This makes thorns builds more viable in late game when combined with damage upgrades.

---

## Anti-Cheat: Defense Stat Validation

### New Tracking
Defense stats (armor/evasion) are now tracked and reported to the server with each wave completion and game over report.

**Obfuscated payload fields:**
- `ds.a` = armor (raw value × 100)
- `ds.e` = evasion (raw value × 100)

### Validation Rules (Waves 1-19 only)
Server validates that defense stats are reasonable for the wave number:

```
maxArmor = 10 + (wave × 20)
maxEvasion = 10 + (wave × 15)
```

| Wave | Max Armor | Max Evasion |
|------|-----------|-------------|
| 1 | 30 | 25 |
| 5 | 110 | 85 |
| 10 | 210 | 160 |
| 19 | 390 | 295 |

**Why only waves 1-19?**
- Logarithmic returns make high defense less impactful late game
- Early game is where cheated defense stats provide the most unfair advantage
- Allows legitimate players to stack defense in infinite swarm without false positives

**What it catches:**
- Memory editing to boost armor/evasion unrealistically early
- Someone giving themselves 500 armor on wave 1

**What it allows:**
- Legitimate lucky runs with multiple legendary drops
- Late game infinite stacking (no validation after wave 19)

---

## Files Modified

### Client-Side
- `src/config.ts` - Updated ARMOR_CONFIG and EVASION_CONFIG with logarithmic formula constants
- `src/entities/Player.ts` - Updated damage calculation to use logarithmic formulas
- `src/data/upgrades.ts` - Updated all armor/evasion upgrades, removed maxStacks, added legendaries
- `src/systems/SessionManager.ts` - Added `_ds` tracking and `setDefenseStats()` method
- `src/scenes/GameScene.ts` - Added defense stat reporting in wave/gameover reports
- `src/ui/StatsPanel.ts` - Display armor/evasion as flat numbers
- `src/systems/UpgradeManager.ts` - Display armor/evasion as flat numbers in summary

### Server-Side
- `api/_lib/session.ts` - Added DefenseStats interface, validateDefenseStats() function
- `api/session/wave.ts` - Accept and validate defense stats
- `api/session/gameover.ts` - Accept and store defense stats

### Documentation
- `docs/GAMEPLAY.md` - Updated defense stats section with new formulas and tables
- `docs/OBFUSCATION_REFERENCE.md` - Added defense stat obfuscation reference

---

## Balance Philosophy

The logarithmic formula was chosen because:

1. **No hard cap frustration** - Players can always improve, even if returns diminish
2. **Weaker early game** - 50% raw armor only gives ~21% reduction (vs 50% with old system)
3. **Stronger late game ceiling** - Can exceed old caps with massive investment
4. **Evasion is stricter** - k=2.0 vs k=1.5 because dodging all damage is more powerful than reducing it
5. **Combined defense** - At 400 armor + 400 evasion, only ~25% of raw damage gets through (still requires huge investment)

---

## Multi-Stage Infinite Swarm

The infinite swarm now progresses through 4 escalating stages:

| Stage | Time | Visual | Changes |
|-------|------|--------|---------|
| Swarm | 0-3 min | Red arena | Gentle warmup scaling |
| Surge | 3-6 min | Orange enemies | 1.5x HP/DMG multiplier, +5% elite chance |
| Frenzy | 6-9 min | Red enemies | 2.5x HP, 2x DMG, +10% elite chance |
| Apocalypse | 9+ min | Purple enemies | 5x base + quadratic explosion, +20% elite chance |

- **Damage is now uncapped** - no more per-enemy damage limits
- **Stage transitions** show brief screen flash and stage name
- **Elite spawn chance** scales with stage (+0%/+5%/+10%/+20%)
- **Spawn rate floors** decrease per stage (200ms → 100ms → 50ms → 10ms)
- Players should expect to survive 7-12 minutes depending on build

---

## Summary for Changelog

**Short version:**
- Armor and Evasion now use logarithmic diminishing returns (infinitely stackable, no hard cap)
- New legendary upgrades: Living Bastion (+40 Armor, +20 Thorns, +25 HP) and Wraith Form (+25 Evasion, +15% Speed)
- Thorns damage now scales with your damage modifier
- Defense stats displayed as flat numbers (e.g., "50 Armor" instead of "50%")
- Anti-cheat validation for defense stats in early waves
- **Multi-stage infinite swarm** with 4 escalating stages (Swarm → Surge → Frenzy → Apocalypse)
- Damage is now fully uncapped in infinite swarm
- Stage transitions with visual feedback and sound
