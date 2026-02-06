# Elemental System Overhaul (v0.5.2)

## Change Summary

Complete overhaul: unique element identities, evolution tiers at strength thresholds, dual-element epic combos, universal legendary.

---

## Element Roles

| Element | Role | Key Mechanic |
|---------|------|-------------|
| Fire | DoT + AoE spread | Stacking burns → spread on death → explosion |
| Lightning | Stun + burst chain | 300ms stun + arcing damage to nearby enemies |
| Ice | Crowd control pipeline | 70% slow → freeze → frost aura → shatter |
| Poison | Damage amp + execute | str×25% amp/stack, execute at ≤15% HP (non-boss) |

---

## Evolution Tiers (Strength: 2 / 5 / 8 / 12)

### Lightning
- **T1 (2+)**: 300ms stun + 1 arc (30% hit damage)
- **T2 (5+)**: 400ms stun + 2 arcs (40% dmg), arcs 20% stun chance
- **T3 (8+)**: 500ms stun + 4 arcs (50% dmg), arcs 30% stun chance
- **T4 (12+)**: 600ms stun + 6 arcs (60% dmg), arcs 50% stun chance

### Ice
- **T1 (2+)**: 70% slow for 1.5s (chill)
- **T2 (5+)**: Direct freeze (0.8s immobilize)
- **T3 (8+)**: Freeze 1.2s + frost aura (40% slow to nearby in 80px)
- **T4 (12+)**: Frozen enemies shatter on death (25% max HP AoE, applies chill)

### Fire
- **T1 (2+)**: Burns (stacking DoT, str×8×damageMult DPS/stack)
- **T2 (5+)**: +50% burn DPS, death ignites 1 nearby
- **T3 (8+)**: Burns slow 20%, death ignites 3 nearby
- **T4 (12+)**: Burning enemies explode on death (AoE scales with stacks)

### Poison
- **T1 (2+)**: Amp per stack = str×25%, 5s duration
- **T2 (5+)**: Stacks grow (+1 every 2s, capped at maxStacks)
- **T3 (8+)**: Death spreads all stacks to 2 nearby
- **T4 (12+)**: Execute at ≤15% HP (regular+elite only), death cloud

---

## Upgrade Changes

### Kept (8)
- Uncommon: Ember Quills, Static Quills, Frost Tips, Toxic Quills
- Rare: Flame Quills, Lightning Quills, Icicle Quills, Noxious Spines

### New Epics (4 dual-element)
| ID | Name | Elements | Effects | Combo |
|----|------|----------|---------|-------|
| tempest | Tempest | Lightning+Ice | +2 shock, +2 freeze | Shocked→chilled = instant freeze |
| wildfire | Wildfire | Fire+Poison | +2 burn, +2 poison | Burning+poisoned = 2× poison growth |
| frostfire | Frostfire | Fire+Ice | +2 burn, +2 freeze | Frozen+burning = steam AoE on thaw |
| venomshock | Venomshock | Lightning+Poison | +2 shock, +2 poison | Lightning arcs spread poison |

### New Legendary (1 universal)
| ID | Name | Effects | Special |
|----|------|---------|---------|
| elemental_convergence | Elemental Convergence | +3 all elements | 20% secondary random proc |

### Removed (8)
- Epics: thunder_strike, blizzard_quills, inferno_quills, plague_bearer
- Legendaries: storm_caller, absolute_zero, hellfire, pandemic

### Total: 76 → 73 upgrades

---

## Files Checklist

- [ ] `src/config.ts` — ELEMENTAL_EVOLUTION_CONFIG, STATUS_EFFECT_CONFIG updates
- [ ] `src/data/upgrades.ts` — Remove 8 old, add 5 new
- [ ] `src/systems/UpgradeManager.ts` — Remove old modifiers, add getElementalTier()
- [ ] `src/entities/Enemy.ts` — Chill status, poison execute, stack growth, visuals
- [ ] `src/scenes/GameScene.ts` — Rewrite applyElementalProcs(), handleElementalOnDeath()
- [ ] `src/systems/CompanionUpgradeProxy.ts` — Update for removed modifiers
- [ ] `api/_lib/upgrades.ts` — Server-side lookup updates
- [ ] `api/session/wave.ts` — Snapshot validation updates
- [ ] `src/ui/StatsPanel.ts` — Evolution tier display
- [ ] `docs/UPGRADES.md` — Full elemental section rewrite
- [ ] `docs/GAMEPLAY.md` — Elemental effects section
- [ ] `public/upgrade-reference.html` — Update elemental upgrades
- [ ] `src/data/version.ts` — Changelog
