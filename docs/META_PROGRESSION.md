# Meta-Progression: Stages, Mutators & Loadouts

## Context
Quillstorm currently plays the same way every run — same 20 waves, same 5 rotating arenas, same upgrade pool. The only between-run progression is cosmetic purchases and Prosperity. The goal is to make each run feel different and give players long-term goals, while keeping the core game skill-pure.

**Core design principle:** The base game never gets easier through meta-progression. Instead, players unlock *new, harder stages* with their own arenas and progression systems. Power growth only exists within those unlocked stages.

---

## System 1: Stage Progression

### Concept
The game has multiple **Stages** (think Dead Cells biomes or Slay the Spire Ascensions). Each stage is a distinct run experience with its own arena pool, enemy modifiers, and unlock tree. You progress through stages by achieving milestones in the previous one.

### Stage Definitions

| Stage | Name | Unlock Condition | Arena Pool | Enemy Modifier | Unique Mechanic |
|-------|------|-----------------|------------|----------------|-----------------|
| 1 | **The Thicket** | Default (current game) | Classic, Towers, Asymmetric, Sparse, Gauntlet | None (baseline) | — |
| 2 | **The Canopy** | Beat wave 20 in Stage 1 | Canopy, Treetops, Hollow | +20% HP, +10% speed | Wind gusts push quills sideways periodically |
| 3 | **The Depths** | Beat wave 20 in Stage 2 | Burrow, Cavern, Chasm | +40% HP, +20% speed, +15% damage | Darkness — limited visibility radius around player |
| 4 | **The Stormfront** | Score 50,000+ in Stage 3 | Stormfront, Thunderpeak, Skybridge | +60% HP, +30% speed, +25% damage | Lightning strikes random platforms, moving platforms |
| 5 | **The Void** | Reach Infinite Swarm Frenzy stage in Stage 4 | Void, Fracture, Abyss | +100% HP, +40% speed, +35% damage | Platforms crumble after standing on them too long |

### Stage Selection
- Pre-run stage select screen (only unlocked stages available)
- Each stage shows: best score, highest wave, completion status
- Infinite Swarm is available in ALL stages (harder in later stages due to enemy modifiers)
- Leaderboard has per-stage filtering (already have weekly/global — add stage filter)

### Stage-Specific Progression (Power Growth)
Each stage has its own **Mastery Track** — small permanent buffs that ONLY apply when playing that stage. This means:
- Stage 1 always plays the same (pure skill, no meta-buffs)
- Stage 2+ has mastery buffs that help you tackle the harder content
- You never trivialize earlier stages

**Mastery rewards** are earned by completing runs in that stage (score thresholds, wave milestones, or achievement-style tasks within the stage).

Example Stage 2 Mastery Track:
| Level | Requirement | Reward |
|-------|------------|--------|
| 1 | Reach wave 10 | +5% damage (Stage 2 only) |
| 2 | Reach wave 15 | +1 starting shield |
| 3 | Beat wave 20 | Start with 1 random uncommon upgrade |
| 4 | Score 20,000 | +10% Prosperity |
| 5 | Reach Infinite Swarm | Choose 1 starting rare upgrade |

### New Arena Layouts (2-3 per stage)

**Stage 2: The Canopy**
- *Canopy* — Dense platforms at multiple heights, emphasis on vertical combat
- *Treetops* — High platforms with large gaps, risky traversal
- *Hollow* — Central hollow tree trunk with wraparound platforms

**Stage 3: The Depths**
- *Burrow* — Low ceilings, tight corridors, claustrophobic spacing
- *Cavern* — Large open cave with stalactite platforms
- *Chasm* — Deep vertical shaft with platforms on walls

**Stage 4: The Stormfront**
- *Stormfront* — Moving platforms, wind effects on projectiles
- *Thunderpeak* — High elevation, lightning strike zones
- *Skybridge* — Long horizontal bridges with gaps

**Stage 5: The Void**
- *Void* — Floating islands, no ground level
- *Fracture* — Crumbling platforms that regenerate
- *Abyss* — Minimal platforms, everything is temporary

---

## System 2: Mutators

### Concept
Toggleable gameplay modifiers unlocked by achievements across any stage. Can be used in any stage. Active mutators apply a **score multiplier** (shown on leaderboard).

### Mutator List

| Mutator | Unlock Condition | Effect | Score Mult |
|---------|-----------------|--------|------------|
| **Glass Cannon** | Complete a run with 0 armor upgrades | +50% damage, -50% max HP | 1.3x |
| **Swarm Tide** | Kill 10,000 enemies (cumulative) | 2x enemy count, 0.6x enemy HP | 1.2x |
| **Elite Legion** | Kill 100 elite enemies (cumulative) | All enemies spawn as elites | 1.5x |
| **Minimalist** | Beat wave 20 with fewer than 8 upgrades | Max 5 upgrade slots, upgrades are +1 rarity tier | 1.4x |
| **Speedrun** | Reach wave 10 in under 3 minutes | Wave timer: 90 seconds max per wave | 1.25x |
| **Elemental Fury** | Reach elemental strength 8+ in any element | Enemies have 50% elemental resistance, procs deal 2x | 1.15x |
| **Iron Porcupine** | Complete 3 waves without firing (thorns only) | No quill firing, thorns deal 5x, +200% armor | 2.0x |
| **Companion Army** | Have 5+ companions in a single run | Start with 3 companions, no more spawn, companions are 2x stronger | 1.1x |

### Mutator Rules
- Multiple mutators can stack (multipliers multiply)
- Score multiplier shown on HUD and leaderboard entry
- Some mutators are incompatible (Glass Cannon + Iron Porcupine)
- Leaderboard shows which mutators were active (as icons/badges)

### Implementation Approach
- Mutators are config overrides applied at run start (multiply existing constants)
- `MutatorManager` stores active mutators, applies modifiers to relevant configs
- Anti-cheat: session start reports active mutators, server validates score multiplier
- Minimal code changes — each mutator is a set of config multipliers

---

## System 3: Starting Loadouts (Perk Slots)

### Concept
Unlock perk slots through cross-stage milestones. Each slot has 2-3 mutually exclusive choices. Perks apply to ALL stages (they're lateral choices, not power increases).

### Perk Slots

| Slot | Unlock | Option A | Option B | Option C |
|------|--------|----------|----------|----------|
| 1 | Complete 10 total runs | **Steady Aim**: +10% quill accuracy (less spread) | **Quick Feet**: +15% move speed | **Tough Hide**: +1 starting shield |
| 2 | Beat wave 20 in Stage 2 | **Scavenger**: +50% pinecone drop rate | **Prospector**: +25 starting Prosperity | **Hoarder**: +1 upgrade choice per level-up |
| 3 | Score 50,000 in any stage | **Reroll**: 1 reroll per upgrade screen | **Elemental Attunement**: Start with strength 1 in a chosen element | **Early Bird**: Start at wave 3 (keep XP) |
| 4 | Beat wave 20 in Stage 4 | **Arsenal**: Start with 1 random rare upgrade | **Battalion**: Start with 2 companions | **Fortification**: Start with armor 0.15 |

### Design Notes
- Perks are **lateral** — each has a clear tradeoff vs alternatives
- "Hoarder" gives more choices but doesn't guarantee quality
- "Early Bird" skips easy waves but misses their XP/drops
- Perks apply equally in all stages (don't make hard stages easier relative to their mastery)

---

## Achievement System (Foundation) — DONE (v0.6.0)

Achievement system implemented with 18 achievements across 4 categories. See `src/data/achievements.ts` and `src/systems/AchievementManager.ts`.

---

## Implementation Priority

### Phase 1: Achievement Foundation — DONE
Built `AchievementManager`, wired up stat tracking, persisted to server.

### Phase 2: Stage System (Current)
Stage select screen, 2-3 new arena layouts for Stage 2, enemy modifiers, mastery track for Stage 2. Ship with just 2 stages to validate the system.

### Phase 3: Mutators
4-5 mutators to start, score multiplier integration, leaderboard badges. Config-driven so easy to add more later.

### Phase 4: Starting Loadouts
Perk slot UI, 2 slots initially, expand as more stages launch.

### Phase 5: Stages 3-5
Additional arena layouts, unique mechanics (darkness, wind, crumbling platforms), mastery tracks.

---

## Anti-Cheat Considerations
- Session start must report: active stage, active mutators, active perks
- Server validates score multiplier matches reported mutators
- Stage mastery buffs are server-reconstructable from achievement progress
- Per-stage leaderboards prevent cross-stage score comparison exploits
- Mutator incompatibility enforced server-side
