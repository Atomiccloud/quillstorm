# Quillstorm Architecture

## Overview

Quillstorm is built with Phaser 3 using TypeScript and Vite. The architecture follows a scene-based pattern with entity classes and manager systems.

## Project Structure

```
src/
├── main.ts                    # Game initialization, Phaser config
├── config.ts                  # All balance constants and configuration
├── entities/
│   ├── Player.ts              # Porcupine player character
│   ├── Enemy.ts               # All enemy types (8 regular + 2 boss)
│   ├── Quill.ts               # Projectile/quill entity
│   ├── Companion.ts           # Baby porcupine companion
│   ├── XPOrb.ts               # XP collectible drop
│   └── TreasureChest.ts       # Rare upgrade chest
├── systems/
│   ├── QuillManager.ts        # Shooting, quill pool, regeneration
│   ├── WaveManager.ts         # Enemy spawning, wave progression, infinite swarm
│   ├── UpgradeManager.ts      # Modifier tracking, upgrade application
│   ├── ProgressionManager.ts  # XP, levels, prosperity, chests, infinite swarm
│   ├── SaveManager.ts         # LocalStorage persistence (scores + player name)
│   ├── AudioManager.ts        # Procedural Web Audio sounds
│   ├── LevelGenerator.ts      # Platform layout templates
│   └── LeaderboardManager.ts  # API client, offline queue, checksum
├── scenes/
│   ├── BootScene.ts           # Loading screen
│   ├── MenuScene.ts           # Main menu
│   ├── GameScene.ts           # Core gameplay loop
│   ├── UpgradeScene.ts        # Upgrade selection UI
│   ├── PauseScene.ts          # Pause menu
│   ├── GameOverScene.ts       # End screen + score submission
│   └── LeaderboardScene.ts    # Global/weekly leaderboard view
├── ui/
│   ├── HUD.ts                 # Health bar, quill bar, XP bar, wave info
│   ├── StatsPanel.ts          # Tab-toggleable stats display
│   ├── LeaderboardPanel.ts    # Scrollable leaderboard table
│   └── NameInputModal.ts      # DOM-based name input for leaderboard
└── data/
    └── upgrades.ts            # 46 upgrade definitions

api/
├── leaderboard/
│   ├── submit.ts              # POST - Score submission (Edge Function)
│   ├── global.ts              # GET - Global top 100 (Edge Function)
│   └── weekly.ts              # GET - Weekly top 100 (Edge Function)
└── _lib/
    ├── validation.ts          # Checksum, input validation, helpers
    └── ratelimit.ts           # Rate limiting + submission cooldown
```

## Scene Flow

```
BootScene → MenuScene → GameScene ←→ UpgradeScene
               ↓  ↓         ↓           ↓
               ↓  ↓    PauseScene  GameOverScene
               ↓  ↓                     ↓
               ↓  └── LeaderboardScene ←─┘
               └─────────────────────────┘
```

## Core Systems

### GameScene
The main gameplay scene that orchestrates all systems:
- Creates and manages platforms via LevelGenerator
- Spawns and updates Player entity
- Manages WaveManager for enemy spawning
- Handles collision detection
- Processes input for shooting
- Triggers upgrade selection between waves

### Entity System
All game entities extend `Phaser.GameObjects.Container`:

**Player** (`src/entities/Player.ts`)
- Movement with WASD/arrows
- Quill state system (full/patchy/sparse/naked)
- Visual rendering based on state
- Damage and invincibility frames

**Enemy** (`src/entities/Enemy.ts`)
- 5 types: scurrier, spitter, swooper, shellback, boss
- Individual AI update methods
- Wave-based stat scaling
- Shellback frontal blocking

**Quill** (`src/entities/Quill.ts`)
- Projectile physics
- Pierce and bounce mechanics
- Critical hit system
- Lifetime management

### Manager Systems

**QuillManager** - Handles shooting mechanics:
- Fire rate limiting
- Projectile spawning
- Quill regeneration
- Max quill tracking

**WaveManager** - Controls wave progression:
- Enemy spawn queues
- Wave generation based on wave number
- Enemy type unlocking
- Boss wave detection

**UpgradeManager** - Tracks all modifiers:
- Accumulates upgrade effects
- Provides modifier getters for other systems
- Recalculates on upgrade selection

**AudioManager** - Procedural sound:
- Web Audio API oscillators
- No external audio files
- Static methods for easy access

**LevelGenerator** - Platform layouts:
- 5 arena templates
- Changes after boss waves
- Minor position jitter for variety

**LeaderboardManager** - Online leaderboards:
- Submits scores to Vercel Edge Functions
- Generates SHA256 checksum for validation
- Offline queue with localStorage (retries on next session)
- Fetches global and weekly top 100

**ProgressionManager** - XP and leveling system:
- Tracks XP and player level
- Calculates XP requirements (exponential scaling)
- Manages prosperity effects on drop rates/rarity
- Controls infinite swarm mode activation
- Tracks treasure chest collection and rigged chests

### UI Components

**HUD** - In-game information display:
- Health bar, quill bar, XP bar
- Wave/level display
- Score and combo tracking
- Infinite swarm indicator

**StatsPanel** - Tab-toggleable modifier display:
- Shows all accumulated upgrade bonuses
- Organized by category (Combat, Defense, Movement, Special)
- Green/red coloring for positive/negative values

### Entities

**XPOrb** - Collectible XP drop:
- Magnetic attraction to player
- Visual: cyan-to-gold based on value
- Physics with platform collision

**TreasureChest** - Rare upgrade drop:
- 7-second despawn with warning
- Golden pulsing glow effect
- Triggers upgrade selection on collection

## Leaderboard Backend

Vercel Edge Functions backed by Vercel KV (Upstash Redis):

**Storage Schema:**
- `leaderboard:global` - Sorted set, top 100 all-time scores
- `leaderboard:weekly:<year>:<week>` - Sorted set with TTL, resets Monday UTC
- `ratelimit:<ip>` - Request counter with 60s TTL
- `submission:<ip>` - Cooldown flag with 10s TTL

**Security layers:**
- Checksum validation (SHA256 of score:wave:salt)
- Rate limiting (6 requests/60s per IP)
- Submission cooldown (10s between submissions)
- Score/wave bounds and proportionality check
- Name sanitization (alphanumeric + spaces only)

**Graceful degradation:**
- All endpoints check `isKVConfigured()` before using KV
- Dynamic `import('@vercel/kv')` prevents module-load errors
- Returns empty results with 200 status when KV unavailable

## Physics

Uses Phaser Arcade Physics:
- Gravity: 1200 pixels/sec²
- World bounds collision for player and ground enemies
- Platform collision with process callback for swooper exception
- Overlap detection for damage

## Configuration

All balance values in `src/config.ts`:
- `GAME_CONFIG` - Screen dimensions
- `PLAYER_CONFIG` - Movement, health, invincibility
- `QUILL_CONFIG` - Fire rate, damage, states
- `ENEMY_CONFIG` - Stats for each enemy type
- `ENEMY_SCALING` - Per-wave stat increases
- `WAVE_CONFIG` - Spawning parameters
- `UPGRADE_CONFIG` - Rarity weights
- `COLORS` - Visual color palette

## Rendering

All graphics are procedural using Phaser Graphics:
- No image assets
- Shapes drawn per-frame
- Color-coded by state/type
- Health bars on enemies
- Aim line and crosshair

## Data Persistence

**LocalStorage** via SaveManager:
- High score
- Highest wave reached
- Total runs
- Player name (for leaderboard)
- Pending leaderboard submissions (offline queue)

**Vercel KV** (Upstash Redis) via LeaderboardManager:
- Global leaderboard (top 100 all-time)
- Weekly leaderboard (top 100, resets Monday UTC)
- Rate limiting counters

## Deployment

- **Hosting**: Vercel (auto-deploys on merge to master)
- **Preview**: PR branches get preview deployment URLs
- **Database**: Vercel KV (Upstash Redis) - connected via Vercel dashboard
- **Environment variables**: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (set automatically by Vercel KV integration)
