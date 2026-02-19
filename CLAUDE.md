# Quillstorm - Claude Reference

Quick reference for AI assistants working on this codebase.

## Project Tracker

**All planned and completed work is tracked in [docs/TRACKER.md](docs/TRACKER.md).** This is the single source of truth for features, bugs, and roadmap items. Check it before starting new work.

When completing features, check off items in TRACKER.md, update the in-game changelog in `src/data/version.ts`, and update this file if new configs or systems are added.

## Quick Links by Topic

### Bugs and Issues
- **Enemy AI problems** → See [docs/GAMEPLAY.md#enemies](docs/GAMEPLAY.md#enemies)
- **Collision issues** → Check `src/scenes/GameScene.ts` setupCollisions()
- **Physics problems** → Review Phaser Arcade physics setup in `src/main.ts`

### Adding Features
- **New upgrades** → See [docs/GAMEPLAY.md#upgrades](docs/GAMEPLAY.md#upgrades), add to `src/data/upgrades.ts`
- **Upgrade reference & balance** → See [docs/UPGRADES.md](docs/UPGRADES.md) for all 74 upgrades, mechanics, formulas, and tier ratings
- **New enemy types** → Add to `src/config.ts` ENEMY_CONFIG, implement in `src/entities/Enemy.ts`
- **New sounds** → See [docs/AUDIO.md](docs/AUDIO.md), add to `src/systems/AudioManager.ts`
- **New level layouts** → See [docs/LEVEL_DESIGN.md](docs/LEVEL_DESIGN.md), edit `src/systems/LevelGenerator.ts`
- **Leaderboard changes** → API in `api/leaderboard/`, client in `src/systems/LeaderboardManager.ts`
- **Removing cheated scores** → See [docs/LEADERBOARD_ADMIN.md](docs/LEADERBOARD_ADMIN.md) — use the CLI commands there, do NOT just give instructions
- **Progression/XP changes** → `src/systems/ProgressionManager.ts`, `src/config.ts` XP_CONFIG
- **Elite enemies** → `src/config.ts` ELITE_CONFIG, applied in `src/entities/Enemy.ts`
- **Danger system** → `src/config.ts` DANGER_CONFIG, upgrades in `src/data/upgrades.ts`
- **Elemental effects** → See [docs/GAMEPLAY.md#elemental-effects](docs/GAMEPLAY.md#elemental-effects), evolution tiers in `src/config.ts` ELEMENTAL_EVOLUTION_CONFIG, status system in `src/entities/Enemy.ts`, proc logic in `src/scenes/GameScene.ts`
- **Defense stats (armor/evasion)** → See [docs/GAMEPLAY.md#defense-stats](docs/GAMEPLAY.md#defense-stats), applied in `src/entities/Player.ts`
- **Knockback system** → `src/config.ts` KNOCKBACK_CONFIG, applied in `src/entities/Enemy.ts` applyKnockback(), triggered in `src/scenes/GameScene.ts`
- **Distance damage** → `src/config.ts` DISTANCE_DAMAGE_CONFIG, calculated in `src/entities/Quill.ts` onHitEnemy()
- **Dodge counter** → `src/config.ts` DODGE_COUNTER_CONFIG, tier lookup in `src/systems/UpgradeManager.ts` getHighestEvasionTier(), handled in `src/scenes/GameScene.ts` handleDodgeCounter()
- **Infinite swarm balance** → See [docs/INFINITE_SWARM.md](docs/INFINITE_SWARM.md) for full scaling reference
- **Boss rewards** → See [docs/GAMEPLAY.md#boss-rewards](docs/GAMEPLAY.md#boss-rewards), `src/scenes/BossRewardScene.ts`
- **Vampirism balance** → See [docs/GAMEPLAY.md#vampirism](docs/GAMEPLAY.md#vampirism), config in `src/config.ts` VAMPIRISM_CONFIG
- **Level scaling (per-level bonuses)** → `src/config.ts` LEVEL_SCALING_CONFIG, applied in `src/systems/UpgradeManager.ts`
- **Companion system** → `src/config.ts` COMPANION_CONFIG, entity in `src/entities/Companion.ts`, proxy in `src/systems/CompanionUpgradeProxy.ts`, shooting in `src/scenes/GameScene.ts` companionShoot()
- **Bomber enemy / bomb zones** → `src/config.ts` ENEMY_CONFIG.bomber, AI in `src/entities/Enemy.ts`, zone rendering in `src/scenes/GameScene.ts`
- **Obfuscated variable names** → See `docs/OBFUSCATION_REFERENCE.md` for mapping (gitignored, local only)
- **Anti-cheat system** → See [docs/ANTI_CHEAT.md](docs/ANTI_CHEAT.md) for full architecture. Server: `api/_lib/session.ts`, Client: `src/systems/SessionManager.ts`, Upgrade lookup: `api/_lib/upgrades.ts`
- **Anti-cheat upgrade ledger** → `api/session/upgrade.ts` (endpoint), tracks all upgrade picks server-side for modifier reconstruction
- **Achievement system** → Definitions in `src/data/achievements.ts`, tracking in `src/systems/AchievementManager.ts`, synced via `api/player/sync.ts`
- **Death tracking** → Hit logging + "Killed By" display: tracking in `src/scenes/GameScene.ts` recordPlayerHit(), display in `src/scenes/GameOverScene.ts` (banner, death recap panel, TIME row)
- **Infinite swarm timer** → Live survival timer in `src/ui/HUD.ts` swarmTimerText, uses `ProgressionManager.getSwarmDuration()` and `getStageTint()` for 4-stage color
- **Meta-progression (planned)** → Stages, mutators, and perk slots tracked in `docs/TRACKER.md` and plan file
- **Mobile support** → See [docs/MOBILE.md](docs/MOBILE.md), detection in `src/systems/MobileDetector.ts`, joystick in `src/ui/VirtualJoystick.ts`
- **PWA config** → `public/manifest.json`, `public/sw.js`, `public/icons/`
- **Desktop app (Electron)** → `electron/main.cjs` (main process), `electron/preload.cjs`, `electron-builder.yml` (build config)
- **Desktop CI** → `.github/workflows/build-desktop.yml` — builds on `v*` tag push, publishes to GitHub Releases
- **Homepage** → `public/home.html` (landing page at `/`), game moved to `/play`
- **Changelog page** → `public/changelog.html` — update alongside `src/data/version.ts`

### Understanding Systems
- **Overall architecture** → See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Game balance** → All constants in `src/config.ts`
- **Wave/progression** → `src/systems/WaveManager.ts`
- **XP/Leveling** → See [docs/GAMEPLAY.md#progression-system](docs/GAMEPLAY.md#progression-system)

## Key Files

| Purpose | File |
|---------|------|
| Game configuration | `src/config.ts` |
| Main game loop | `src/scenes/GameScene.ts` |
| Player mechanics | `src/entities/Player.ts` |
| Enemy AI & types | `src/entities/Enemy.ts` |
| Projectile logic | `src/entities/Quill.ts` |
| XP orb collectible | `src/entities/XPOrb.ts` |
| Treasure chest | `src/entities/TreasureChest.ts` |
| Boss reward choice | `src/scenes/BossRewardScene.ts` |
| Upgrade definitions | `src/data/upgrades.ts` |
| Wave spawning | `src/systems/WaveManager.ts` |
| Quill management | `src/systems/QuillManager.ts` |
| XP/Levels/Prosperity | `src/systems/ProgressionManager.ts` |
| Audio system | `src/systems/AudioManager.ts` |
| Level layouts | `src/systems/LevelGenerator.ts` |
| Leaderboard client | `src/systems/LeaderboardManager.ts` |
| Leaderboard scene | `src/scenes/LeaderboardScene.ts` |
| Name input UI | `src/ui/NameInputModal.ts` |
| HUD rendering | `src/ui/HUD.ts` |
| Stats panel (Tab) | `src/ui/StatsPanel.ts` |
| Pinecone collectible | `src/entities/Pinecone.ts` |
| Companion helper | `src/entities/Companion.ts` |
| Companion modifier proxy | `src/systems/CompanionUpgradeProxy.ts` |
| Achievement definitions | `src/data/achievements.ts` |
| Achievement tracking | `src/systems/AchievementManager.ts` |
| Cosmetic definitions | `src/data/cosmetics.ts` |
| Cosmetic state | `src/systems/CosmeticManager.ts` |
| Player data sync | `src/systems/PlayerDataManager.ts` |
| Firebase auth | `src/systems/AuthManager.ts` |
| Anti-cheat sessions | `src/systems/SessionManager.ts` |
| Shop scene | `src/scenes/ShopScene.ts` |
| Login scene | `src/scenes/LoginScene.ts` |
| API: submit score | `api/leaderboard/submit.ts` |
| API: global scores | `api/leaderboard/global.ts` |
| API: weekly scores | `api/leaderboard/weekly.ts` |
| API: validation | `api/_lib/validation.ts` |
| API: rate limiting | `api/_lib/ratelimit.ts` |
| API: session tracking | `api/session/start.ts`, `wave.ts`, `gameover.ts` |
| API: upgrade ledger | `api/session/upgrade.ts` |
| API: upgrade lookup | `api/_lib/upgrades.ts` |
| API: player sync | `api/player/sync.ts` |
| API: purchases | `api/player/purchase.ts` |
| Mobile detection | `src/systems/MobileDetector.ts` |
| Virtual joystick | `src/ui/VirtualJoystick.ts` |
| PWA manifest | `public/manifest.json` |
| Homepage (landing) | `public/home.html` |
| Changelog page | `public/changelog.html` |
| Electron main process | `electron/main.cjs` |
| Electron build config | `electron-builder.yml` |
| Desktop CI workflow | `.github/workflows/build-desktop.yml` |

## Common Tasks

### Adjusting Game Balance
All balance constants live in `src/config.ts` — search for the relevant `*_CONFIG` export. See Quick Links above for specific systems.

**When changing upgrade values:** Always update `docs/UPGRADES.md`, `public/upgrade-reference.html`, and `api/_lib/upgrades.ts` to stay in sync.

**When releasing a new version:** Update `src/data/version.ts`, `public/changelog.html`, and bump version in `package.json` if releasing a desktop update.

### Adding a New Enemy Type
1. Add config to `ENEMY_CONFIG` in `src/config.ts`
2. Add type to `EnemyType` union in `src/entities/Enemy.ts`
3. Implement `update[EnemyName]()` AI method
4. Implement `draw[EnemyName]()` render method
5. Add to spawn weights in `src/systems/WaveManager.ts`

### Adding a New Upgrade
1. Add to `upgrades` array in `src/data/upgrades.ts`
2. Ensure effect keys match `ModifierType` in `src/systems/UpgradeManager.ts`
3. Set appropriate rarity, maxStacks, and effects
4. **Always** update `docs/UPGRADES.md` and `public/upgrade-reference.html` to match
5. If the upgrade has server-side validation, update `api/_lib/upgrades.ts`

### Adding a New Sound
1. Add static method to `AudioManager` class
2. Use `playTone()` for melodic sounds, `playNoise()` for percussive
3. Call from appropriate location (GameScene, HUD, Player, etc.)

### Adding a New Level Layout
1. Add template to `LEVEL_TEMPLATES` in `src/systems/LevelGenerator.ts`
2. Ensure platforms are reachable (max jump ~150px vertical)
3. Keep platforms within bounds (100px from edges)

## Architecture Overview

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full project structure, system descriptions, and backend schema.

## Running the Game

```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build
```

### Desktop App (Electron)

```bash
npm run electron:dev          # Launch Electron (loads localhost:3003, run npm run dev first)
npm run electron:build:win    # Build Windows installer
npm run electron:build:mac    # Build Mac DMG
npm run electron:build:linux  # Build Linux AppImage
npm run electron:build        # Build all platforms
```

**Releasing a desktop update:** Bump version in `package.json`, commit, then push a git tag:
```bash
git tag v0.6.1 && git push --tags
```
GitHub Actions will build all platforms and publish to GitHub Releases. The Electron auto-updater checks GitHub Releases on launch.

**Architecture:** The Electron app loads the game from `https://playquillstorm.com/play` (not local files). Game updates happen via normal Vercel deploy. The auto-updater only handles Electron shell updates.

**Routing:** Homepage at `/` (`public/home.html`), game at `/play` (`index.html`), changelog at `/changelog` (`public/changelog.html`).
