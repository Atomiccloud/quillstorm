# Quillstorm - Claude Reference

Quick reference for AI assistants working on this codebase.

## Project Tracker

**All planned and completed work is tracked in [docs/TRACKER.md](docs/TRACKER.md).** This is the single source of truth for features, bugs, and roadmap items. Check it before starting new work.

When completing features, check off items in TRACKER.md and update this file if new configs or systems are added.

## Quick Links by Topic

### Bugs and Issues
- **Enemy AI problems** → See [docs/GAMEPLAY.md#enemies](docs/GAMEPLAY.md#enemies)
- **Collision issues** → Check `src/scenes/GameScene.ts` setupCollisions()
- **Physics problems** → Review Phaser Arcade physics setup in `src/main.ts`

### Adding Features
- **New upgrades** → See [docs/GAMEPLAY.md#upgrades](docs/GAMEPLAY.md#upgrades), add to `src/data/upgrades.ts`
- **New enemy types** → Add to `src/config.ts` ENEMY_CONFIG, implement in `src/entities/Enemy.ts`
- **New sounds** → See [docs/AUDIO.md](docs/AUDIO.md), add to `src/systems/AudioManager.ts`
- **New level layouts** → See [docs/LEVEL_DESIGN.md](docs/LEVEL_DESIGN.md), edit `src/systems/LevelGenerator.ts`
- **Leaderboard changes** → API in `api/leaderboard/`, client in `src/systems/LeaderboardManager.ts`
- **Progression/XP changes** → `src/systems/ProgressionManager.ts`, `src/config.ts` XP_CONFIG
- **Elite enemies** → `src/config.ts` ELITE_CONFIG, applied in `src/entities/Enemy.ts`
- **Danger system** → `src/config.ts` DANGER_CONFIG, upgrades in `src/data/upgrades.ts`
- **Obfuscated variable names** → See `docs/OBFUSCATION_REFERENCE.md` for mapping (gitignored, local only)

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
| API: player sync | `api/player/sync.ts` |
| API: purchases | `api/player/purchase.ts` |

## Common Tasks

### Adjusting Game Balance
Edit `src/config.ts`:
- `PLAYER_CONFIG` - Movement speed, jump force, health
- `QUILL_CONFIG` - Fire rate, damage, regeneration
- `ENEMY_CONFIG` - Stats for each enemy type
- `ENEMY_SCALING` - How stats increase per wave
- `WAVE_CONFIG` - Enemy count scaling, boss intervals
- `UPGRADE_CONFIG` - Rarity weights
- `XP_CONFIG` - XP requirements, level scaling, infinite swarm trigger
- `CHEST_CONFIG` - Chest drop rates, despawn time, rarity weights
- `PROSPERITY_CONFIG` - Prosperity effects on drops/rarity/crit
- `INFINITE_SWARM_CONFIG` - Endless mode spawn/difficulty scaling
- `ELITE_CONFIG` - Elite enemy stat multipliers, spawn chance, glow color
- `DANGER_CONFIG` - Danger level scaling per stack (HP, damage, elite chance, score, XP)

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

### Adding a New Sound
1. Add static method to `AudioManager` class
2. Use `playTone()` for melodic sounds, `playNoise()` for percussive
3. Call from appropriate location (GameScene, HUD, Player, etc.)

### Adding a New Level Layout
1. Add template to `LEVEL_TEMPLATES` in `src/systems/LevelGenerator.ts`
2. Ensure platforms are reachable (max jump ~150px vertical)
3. Keep platforms within bounds (100px from edges)

## Architecture Overview

```
Scenes (Phaser.Scene)
├── BootScene           # Loading
├── MenuScene           # Main menu
├── LoginScene          # Google sign-in / account
├── GameScene           # Main gameplay
├── UpgradeScene        # Upgrade selection overlay
├── PauseScene          # Pause menu overlay
├── GameOverScene       # End screen + score submission
├── LeaderboardScene    # Global/weekly leaderboard view
└── ShopScene           # Cosmetic shop (skins, hats, quills, trails)

Entities (Phaser.GameObjects.Container)
├── Player              # Porcupine character
├── Enemy               # 8 enemy types + 2 boss types
├── Quill               # Projectile
├── Companion           # Baby porcupine helper
├── XPOrb               # Collectible XP drop
├── TreasureChest       # Rare upgrade chest
└── Pinecone            # Currency drop

UI Components
├── HUD                 # Health bar, quill bar, XP bar, wave info
├── StatsPanel          # Tab-toggleable modifier display
├── LeaderboardPanel    # Scrollable leaderboard table
├── NameInputModal      # DOM-based name input
└── ChangelogModal      # Version changelog popup

Systems (Singleton/Manager classes)
├── QuillManager        # Shooting, regeneration
├── WaveManager         # Spawning, wave progression, infinite swarm
├── UpgradeManager      # Modifier tracking
├── ProgressionManager  # XP, levels, prosperity, infinite swarm
├── CosmeticManager     # Cosmetic state, purchases, equip
├── PlayerDataManager   # Server sync, offline queue, auth-gated persistence
├── AuthManager         # Firebase Auth, Google Sign-In
├── SessionManager      # Anti-cheat session tracking (wave-by-wave kills)
├── SaveManager         # High score + player name persistence
├── AudioManager        # Procedural sounds
├── LevelGenerator      # Platform layouts
└── LeaderboardManager  # API client, offline queue

API (Vercel Edge Functions)
├── api/leaderboard/submit.ts   # Score submission + shadow honeypot
├── api/leaderboard/global.ts   # Global top 100 + shadow merge
├── api/leaderboard/weekly.ts   # Weekly top 100 + shadow merge
├── api/session/start.ts        # Anti-cheat session creation
├── api/session/wave.ts         # Wave kill report validation
├── api/session/gameover.ts     # Game over report
├── api/player/sync.ts          # Player data sync (pinecones, cosmetics)
├── api/player/purchase.ts      # Server-side purchase validation
├── api/_lib/validation.ts      # Checksum + input validation
├── api/_lib/session.ts         # Session types + kill validation
└── api/_lib/ratelimit.ts       # Rate limiting
```

## Tech Notes

- **Framework**: Phaser 3.80.1 with Arcade Physics
- **Build**: Vite + TypeScript
- **Hosting**: Vercel (auto-deploys on merge to master)
- **Backend**: Vercel Edge Functions + Vercel KV (Upstash Redis)
- **Audio**: Web Audio API (procedural, no files)
- **Graphics**: All procedural (no image assets)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Storage**: LocalStorage for saves/cosmetics, Vercel KV for leaderboards + player data

## Running the Game

```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build
```
