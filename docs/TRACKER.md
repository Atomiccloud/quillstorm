# Quillstorm Feature Tracker

Single source of truth for all completed and planned work.

---

## Completed

### Core Gameplay
- [x] Player movement, jumping, quill shooting
- [x] Quill state system (full/patchy/sparse/naked) + regeneration
- [x] 8 enemy types with unique AI (scurrier, spitter, swooper, shellback, burrower, splitter, bomber + splitlings)
- [x] Wave-based progression (20 waves)
- [x] Boss waves every 5 waves (ground boss + flying boss)
- [x] Boss health phases (3-phase fire rate escalation)
- [x] Enemy stat scaling per wave
- [x] Spawn pacing (ramps slow to fast within each wave)
- [x] Enemy cap at 60 per wave
- [x] 46 upgrades across 5 rarities (common/uncommon/rare/epic/legendary)
- [x] Companion system (baby porcupine helper)
- [x] Procedural level layouts with rotation after boss waves

### Progression System (Phase 11)
- [x] Stats panel (Tab key toggle) — `src/ui/StatsPanel.ts`
- [x] Treasure chests (rare enemy drops, rigged first 3, no-common rarity) — `src/entities/TreasureChest.ts`
- [x] Prosperity system (luck-like stat: chest drops, rarity shift, crit bonus) — config + upgrades
- [x] XP system (orbs, magnetic collection, level-up upgrades) — `src/entities/XPOrb.ts`, `src/systems/ProgressionManager.ts`
- [x] Infinite swarm mode (endless at level 20, continuous spawns) — `src/systems/WaveManager.ts`
- [x] Shield visual indicator (cyan diamond + charge pips above porcupine) — `src/entities/Player.ts`
- [x] Infinite swarm shield regen (time-based, 1 charge per 30s) — `src/entities/Player.ts`, `src/config.ts`
- [x] Pinecone currency drops from enemies — `src/entities/Pinecone.ts`

### Shop & Cosmetics
- [x] Cosmetic shop with categories (skins, hats, quills, trails) — `src/scenes/ShopScene.ts`
- [x] Cosmetic data definitions with pricing — `src/data/cosmetics.ts`
- [x] Cosmetic manager (local state, purchase, equip) — `src/systems/CosmeticManager.ts`
- [x] Porcupine animations (walk, idle, jump, fall) — `src/entities/Player.ts`

### Account System
- [x] Firebase Auth with Google Sign-In — `src/systems/AuthManager.ts`
- [x] Login scene with sign-in/sign-out UI — `src/scenes/LoginScene.ts`
- [x] Player data sync API (server-authoritative pinecones) — `api/player/sync.ts`
- [x] Server-side purchase validation API — `api/player/purchase.ts`
- [x] PlayerDataManager (sync, offline queue, optimistic purchases) — `src/systems/PlayerDataManager.ts`
- [x] **Wire up PlayerDataManager** (v0.3.4, in progress) — MenuScene init, ShopScene purchases, GameOverScene sync

### Leaderboard & Anti-Cheat
- [x] Online leaderboards (global + weekly) — `src/systems/LeaderboardManager.ts`
- [x] Vercel KV (Upstash Redis) backend
- [x] Anti-cheat session tracking (wave-by-wave kill validation) — `src/systems/SessionManager.ts`
- [x] Checksum validation (salt + timestamp window + fingerprint)
- [x] Shadow leaderboard honeypot for cheaters
- [x] Rate limiting + submission cooldown — `api/_lib/ratelimit.ts`
- [x] Fingerprint collision fix (persistent UUID) — v0.3.4, merged

### Infrastructure
- [x] Phaser 3.80.1 with Arcade Physics
- [x] Vite + TypeScript build
- [x] Vercel auto-deploy on merge to master
- [x] Procedural audio (Web Audio API, no files) — `src/systems/AudioManager.ts`
- [x] All procedural graphics (no image assets)
- [x] LocalStorage saves + Vercel KV for leaderboards
- [x] Changelog modal — `src/ui/ChangelogModal.ts`
- [x] Version tracking — `src/data/version.ts`

---

## Completed (v0.4.0)

- [x] Fingerprint collision fix (PR #26, merged)
- [x] PlayerDataManager wiring
- [x] Elite enemies (1% base spawn, gold glow, 2x HP, 3x damage, 15% faster, 2.5x points, 3x XP)
- [x] Danger Level system (opt-in difficulty upgrades, uncapped stacks, scales enemy stats + rewards)
- [x] Elite damage upgrade cards (Elite Hunter, Elite Slayer)
- [x] Mythic rarity tier (0.05 weight, red color)
- [x] Expanded Options upgrade (extra card slot, mythic rarity)
- [x] Anti-cheat: elite kill tracking by type + danger level in wave reports
- [x] HUD danger level indicator
- [x] Elite kill sound effect
- [x] Game over kill screen: elite kills in breakdown panel
- [x] Version bump to 0.4.0 + changelog entry

---

## Completed (v0.5.0 - Elemental, Defense & Balance Overhaul)

See [V0.5.0_BALANCE_PLAN.md](V0.5.0_BALANCE_PLAN.md) for balance specifications.

### Elemental Status Effects
- [x] Enemy status effect system (shock, freeze, burn stacking, poison stacking) — `src/entities/Enemy.ts`
- [x] Lightning (shock): stun, chain lightning arcs to nearby enemies
- [x] Ice (freeze): immobilize, frost slow aura, shatter AOE on death
- [x] Fire (burn): stacking DoT, fire aura, fire explosion on death
- [x] Poison (venom): stacking damage amplification, poison spread/cloud on death
- [x] Quill on-hit elemental proc rolls with Fate's Favor reroll — `src/scenes/GameScene.ts`
- [x] On-death effects: fire explosion, poison cloud/spread, ice shatter, chain lightning — `src/scenes/GameScene.ts`
- [x] 16 elemental upgrades (4 per element, uncommon through legendary) — `src/data/upgrades.ts`
- [x] Status effect visual overlays on enemies (color tints, particles) — `src/entities/Enemy.ts`
- [x] All elemental effects respect effects opacity slider

### Defense System
- [x] Armor stat: logarithmic diminishing returns — `src/entities/Player.ts`
- [x] Evasion stat: logarithmic diminishing returns, "DODGE" floating text — `src/entities/Player.ts`
- [x] Thorns: damage reflection to attacking enemies — `src/scenes/GameScene.ts`
- [x] 8 defense upgrades (4 armor + 4 evasion) — `src/data/upgrades.ts`

### New Mythic Upgrades
- [x] Fate's Favor: 30% chance to reroll failed procs — `src/scenes/GameScene.ts`
- [x] Quill Apotheosis: every 5th volley auto-crits with all unlocked elements — `src/systems/QuillManager.ts`, `src/entities/Quill.ts`

### Shield System Overhaul
- [x] Shield cap at 10 charges — `src/config.ts` SHIELD_CONFIG
- [x] Diminishing iframes (400ms→240ms→144ms→100ms floor, 2s reset) — `src/entities/Player.ts`
- [x] Remove `energy_shield` upgrade (uncommon) — `src/data/upgrades.ts`
- [x] Restructure shield upgrades: Rare +1, Epic +2 +30HP, Legendary +4 +100HP
- [x] Hide shield upgrades when at cap — `src/data/upgrades.ts`

### Prosperity System Overhaul
- [x] Remove crit bonus from prosperity — `src/systems/ProgressionManager.ts`
- [x] Logarithmic chest drop curve (7% at 100, caps at 14%)
- [x] Two-phase level-up rarity system (uncommon peaks at 60% at 100 prosperity)
- [x] Linear chest rarity system (rare peaks at 60% at 500 prosperity)

### Crit System
- [x] Diminishing returns formula: effectiveCrit = raw/(raw+1) — `src/entities/Quill.ts`
- [x] Display as flat number "+100 Crit (50%)" — `src/ui/StatsPanel.ts`

### Gameplay Caps
- [x] Movement speed cap at 600 px/sec — `src/config.ts`, `src/entities/Player.ts`
- [x] Stats panel shows capped speed value instead of raw modifier — `src/ui/StatsPanel.ts`
- [x] Explosion radius cap at 400px — `src/config.ts`, `src/scenes/GameScene.ts`
- [x] Remove score submission cap (was 2,999,999) — `api/_lib/validation.ts`

### UI Updates
- [x] Scrollable Stats Panel for large stat lists — `src/ui/StatsPanel.ts`

### Config & Infrastructure
- [x] `STATUS_EFFECT_CONFIG` — status effect durations, colors, ranges, max stacks
- [x] `ARMOR_CONFIG` — armor logarithmic diminishing returns (k=0.5)
- [x] `EVASION_CONFIG` — evasion logarithmic diminishing returns (k=0.7)
- [x] `SHIELD_CONFIG` — shield cap and iframe diminishing settings
- [x] 26 new upgrades total (82 total upgrades)
- [x] Version bump to 0.5.0 + changelog entry

---

## Completed (v0.5.1 - Boss Rewards, Vampirism Rework & Anti-Cheat)

- [x] Boss reward choice: Restoration vs Power after boss waves — `src/scenes/BossRewardScene.ts`
- [x] Vampirism rework: stack-based proc chance and healing — `src/config.ts`, `src/scenes/GameScene.ts`
- [x] +5 quills restored on normal wave completion — `src/scenes/GameScene.ts`
- [x] +5% damage per level (passive scaling) — `src/config.ts`, `src/systems/UpgradeManager.ts`

### Enhanced Anti-Cheat (v0.5.1)
- [x] Upgrade ledger: server tracks every upgrade picked — `api/session/upgrade.ts`, `api/_lib/upgrades.ts`
- [x] Modifier snapshot validation: server reconstructs expected modifiers from ledger — `api/_lib/session.ts`
- [x] Quill efficiency heuristic: validates kills vs quills fired ratio — `api/_lib/session.ts`
- [x] Wave timing heuristic: flags impossibly fast wave completions — `api/_lib/session.ts`
- [x] Damage pattern heuristic: flags zero-damage runs with no defenses — `api/_lib/session.ts`
- [x] Enhanced perf check: lowered threshold to 25k+ at wave 15+ — `api/_lib/session.ts`
- [x] Defense stat validation extended to all waves (was only 1-19) — `api/_lib/session.ts`
- [x] `modifiersFlagged` check in submission validation — `api/leaderboard/submit.ts`
- [x] Client: report upgrade picks from UpgradeScene — `src/scenes/UpgradeScene.ts`
- [x] Client: send modifier snapshot + quills fired + wave time per wave — `src/systems/SessionManager.ts`
- [x] Client: track quills fired in QuillManager — `src/systems/QuillManager.ts`

---

## Completed (v0.5.2 - Wave Balance & Bomber Enemy)

### Spawn Order Rebalance
- [x] Reordered enemy introductions: Swooper wave 2, Spitter wave 4, Shellback wave 6, Burrower wave 9, Splitter wave 11
- [x] Adjusted spawn weights for smoother difficulty curve
- [x] New Bomber enemy replaces Healer at wave 15

### Burrower Improvements
- [x] Reduced burrower HP from 50 → 38 (compensates for underground invulnerability)
- [x] Extended warning phase from 600ms → 900ms with repeating dirt particle pulses
- [x] Added red exclamation mark above emerge position during warning phase

### Spawn Pacing
- [x] Increased within-wave spawn interval floor from 300 → 375ms (end of wave)
- [x] Raised late-wave start interval floor from 400 → 500ms (wave 17+)

### New Enemy: Bomber
- [x] Flying crow/raven enemy that hovers high above player
- [x] Drops bomb zones every 3 seconds creating ground danger areas
- [x] Warning phase (800ms red pulsing circle) → Active phase (1000ms, 20 damage)
- [x] Area denial mechanic forces player movement

### Upgrade Balance Pass
- [x] **Thick Quills** buffed: projSize 0.3→0.5, added knockback +1, damage +5%
- [x] **Quick Draw → Swift Quills**: merged with Aerodynamic Quills, now fireRate +10%, projSpeed +15%, distanceDamage +25%
- [x] **Aerodynamic Quills** removed (merged into Swift Quills) — total upgrades: 76→75
- [x] **Armor chain**: all 5 tiers now include thorns (2/4/6/12/24), armor values bumped
- [x] **Evasion chain**: all 5 tiers bumped, now unlocks dodge counter mechanic

### New Mechanics
- [x] **Knockback**: quills push enemies on hit (force = modifier × 200 px/s, 150ms). Also applies in explosions. Immune: bosses, stunned, frozen, burrowed, rolling
- [x] **Distance Damage**: quills deal bonus damage based on travel distance (up to +25% at 400px). Applied before crit for multiplicative scaling
- [x] **Dodge Counter**: on successful evasion, chance to execute attacker based on highest evasion tier picked (30%/40%/60%/80%/90%). Normal enemies: instant kill. Elites/bosses: 25% max HP chunk (scales with damage modifier)
- [x] Extracted `handleEnemyKill()` in GameScene for reuse by dodge counter
- [x] Anti-cheat: added kb/dd to modifier snapshots and server-side validation
- [x] Updated all documentation (UPGRADES.md, upgrade-reference.html, CLAUDE.md)

---

## Done: Achievement System (v0.6.0)

Achievement system with 18 achievements across 4 categories (combat, survival, score, style).

**Files created:**
- `src/systems/AchievementManager.ts` — Tracks cumulative + per-run stats, evaluates conditions, persists to localStorage + server sync
- `src/data/achievements.ts` — Achievement definitions with declarative condition checking

**Features:**
- Cumulative stats tracked: totalKills, totalBossKills, totalEliteKills, totalRuns, totalWavesSurvived, totalPerfectWaves
- Per-run stats: score, wave, kills, upgrade count, infinite swarm survival, elemental strength, flags (perfect wave, no armor, frenzy)
- Wave-timing achievements (e.g., perfect_wave) checked mid-run with in-game notification
- Run-end achievements checked at game over with display on GameOverScene
- Cosmetic rewards auto-unlock via existing `CosmeticManager.unlockByAchievement()`
- Server sync via `api/player/sync.ts` with max-merge for cumulative stats and union-merge for earned achievements
- Achievement counter shown on game over screen

**Cosmetic-linked achievements:**
- Spectral skin — `survive_50_waves` (50 total waves survived)
- Inferno skin — `defeat_100_bosses` (100 boss kills)
- Party hat — `complete_10_runs` (10 runs)
- Halo hat — `perfect_wave` (complete any wave damageless)

**Additional achievements:** Bronze/Silver/Gold/Diamond Quill (score thresholds), Exterminator (10k kills), Elite Slayer (100 elite kills), Full Clear (wave 20), Infinite Warrior (enter swarm), Endurance (5min swarm), Into the Frenzy (reach Frenzy stage), Minimalist (wave 20 with <8 upgrades), Glass Cannon (wave 20 with no armor)

## Completed (v0.5.5 - Death Tracking & QoL)

### Death Tracking
- [x] "Killed By" banner on game over screen — shows exact enemy and attack type
- [x] Death recap panel — last 5 hits with wave number, damage, and timing (killing blow highlighted red)
- [x] Run duration (TIME) added to game over THIS RUN panel
- [x] Hit logging in GameScene — ring buffer of last 5 `player._uf()` hits with source categorization

### Infinite Swarm Timer
- [x] Live survival timer during infinite swarm — `mm:ss` counter in HUD
- [x] Timer color shifts through all 4 stages: white (Swarm) → orange (Surge) → red (Frenzy) → purple (Apocalypse)

### Flying Enemy Spawn Spread
- [x] Swoopers and bombers now spawn across the full top of the screen (was edge-only)
- [x] ~200px center exclusion zone prevents spawns directly above where player is focused

### Lodestone Upgrade & Balance
- [x] New legendary upgrade: Lodestone — magnetic pulse every 12s pulls all pickups toward player, passive chest magnet at 120px
- [x] Treasure chest despawn time increased (9s → 15s, warning at 12s)
- [x] Pinecone despawn time increased (12s → 15s)
- [x] Armor diminishing returns rescaled (k: 1.5 → 0.5) — single pick ~13%, heavy investment ~69%
- [x] Evasion diminishing returns rescaled (k: 2.0 → 0.7) — single pick ~10%, heavy investment ~61%

## Completed (v0.5.71 - Effects Opacity Split)

- [x] Split single effects opacity slider into 4 independent sliders: Combat Text, Particles, Elemental VFX, Status Overlays — `src/ui/SettingsModal.ts`, `src/systems/SaveManager.ts`
- [x] SaveManager migration: existing effectsOpacity value auto-copies to all 4 new fields
- [x] GameScene, Player, Enemy updated to use per-category opacity values

---

## In Progress: Stage System (Phase 2)

Full design doc: [docs/META_PROGRESSION.md](META_PROGRESSION.md)

### Phase 2 Scope
- [ ] Stage data config (`src/data/stages.ts`) — stage definitions, unlock conditions, enemy modifiers
- [ ] Stage progress persistence (`src/systems/StageManager.ts`) — unlocked stages, per-stage best scores, mastery progress
- [ ] Stage Select scene (`src/scenes/StageSelectScene.ts`) — replace PLAY button with stage select, locked/unlocked states
- [ ] 3 new arena layouts for Stage 2: The Canopy (Canopy, Treetops, Hollow)
- [ ] Enemy modifier system — stage-based HP/speed/damage multipliers applied in WaveManager
- [ ] Wind gust mechanic for Stage 2 (periodic quill drift)
- [ ] Mastery track for Stage 2 (5 levels with per-stage buffs)
- [ ] Wire stage selection through to GameScene
- [ ] Per-stage stats in SaveManager (best score, highest wave per stage)

### Future Phases
- **Phase 3: Mutators** — Toggleable gameplay modifiers with score multipliers. Unlocked via achievements.
- **Phase 4: Starting Loadouts** — Lateral perk choices unlocked through cross-stage milestones.
- **Phase 5: Stages 3-5** — Additional arena layouts, unique mechanics (darkness, wind, crumbling platforms).

## Planned: Challenges

### Challenge Packs (Purchasable with Pinecones)

| Pack | Cost | Challenges |
|------|------|------------|
| Boss Hunter | 200 | Defeat 5/10 bosses in one run, defeat boss without taking damage |
| Survivalist | 200 | Survive 5 waves without damage, complete run with <5 upgrades |
| Collector | 150 | Collect 500 XP in one run, open 10 chests, collect 100 pinecones |
| Speedrunner | 250 | Reach wave 10 in under 3 min, kill 100 enemies in 60 seconds |

**Files to create:**
- `src/data/challenges.ts` — Challenge definitions
- `src/scenes/ChallengesScene.ts` — UI for viewing/purchasing challenges

### Leaderboard Titles

| Title | Requirement |
|-------|-------------|
| Newcomer | Default |
| Quill Master | 1,000 total kills |
| Survivor | Reach wave 30 |
| Boss Slayer | Kill 50 bosses |
| Infinite Warrior | Enter infinite swarm |
| Legend | Top 10 global leaderboard |

---

## Planned: Visual Polish

- [ ] Screen flash on damage
- [ ] Particle trails on fast-moving quills
- [ ] Better enemy death explosions
- [ ] Damage numbers (floating text)
- [ ] Cosmetic preview in shop
- [ ] "New" badges on unlocked items
- [ ] Sound effects for purchases/unlocks
- [ ] Leaderboard integration (show equipped titles)

---

## Planned: Audio

- [ ] Background music (procedural or looping)
- [ ] Ambient sounds

---

## Planned: Quality of Life

- [x] Run statistics on game over (v0.5.5 — death tracking, killed by, run duration)
- [ ] Tutorial/help overlay

---

## Backlog (Long Term)

**New Content**
- [x] More upgrade varieties (v0.4.2 — elemental, defense, mythics)
- [ ] Additional arena layouts
- [ ] Multiple boss types with different attacks
- [ ] Boss-specific arenas
- [ ] Starting bonuses based on high scores

**Procedural Generation**
- [ ] Fully procedural level layouts
- [ ] Constraint-based platform placement
- [ ] Difficulty-adjusted generation

**Multiplayer**
- [ ] Local co-op (same screen)
- [ ] Daily challenge seeds

**Platform Support**
- [ ] Mobile touch controls
- [ ] Gamepad support
- [ ] Fullscreen toggle
- [ ] Resolution options

---

## Not Planned

- Save mid-run (conflicts with roguelike design)
- ~~Difficulty settings~~ — Added as opt-in Danger Level system in v0.4.0
- Inventory/equipment system (keep it simple)

---

## Known Issues

- Pickups can sometimes spawn in unreachable locations
- Quill regeneration visual could be clearer
- Some upgrade descriptions could be more specific
