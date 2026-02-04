# Quillstorm Feature Tracker

Single source of truth for all completed and planned work.

---

## Completed

### Core Gameplay
- [x] Player movement, jumping, quill shooting
- [x] Quill state system (full/patchy/sparse/naked) + regeneration
- [x] 8 enemy types with unique AI (scurrier, spitter, swooper, shellback, burrower, splitter, healer + splitlings)
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

## In Progress (v0.4.0)

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
- [ ] Achievements & challenges (see below)

---

## Planned: Achievements & Challenges

### Achievement System
Track milestones during natural play, award exclusive cosmetics on completion.

**Files to create:**
- `src/systems/AchievementManager.ts` — Track and persist achievements
- `src/data/achievements.ts` — Achievement definitions

**Achievement cosmetics already defined in `cosmetics.ts`:**
- Spectral skin — `survive_50_waves`
- Inferno skin — `defeat_100_bosses`
- Warrior hat — `complete_10_runs`
- Champion crown — `perfect_wave`

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

- [ ] Run statistics on game over
- [ ] Tutorial/help overlay

---

## Backlog (Long Term)

**New Content**
- [ ] More upgrade varieties
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
