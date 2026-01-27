# Quillstorm Architecture

## Overview

Quillstorm is built with Phaser 3 using TypeScript and Vite. The architecture follows a scene-based pattern with entity classes and manager systems.

## Project Structure

```
src/
├── main.ts                 # Game initialization, Phaser config
├── config.ts               # All balance constants and configuration
├── entities/
│   ├── Player.ts           # Porcupine player character
│   ├── Enemy.ts            # All enemy types (5 types)
│   └── Quill.ts            # Projectile/quill entity
├── systems/
│   ├── QuillManager.ts     # Shooting, quill pool, regeneration
│   ├── WaveManager.ts      # Enemy spawning, wave progression
│   ├── UpgradeManager.ts   # Modifier tracking, upgrade application
│   ├── SaveManager.ts      # LocalStorage persistence
│   ├── AudioManager.ts     # Procedural Web Audio sounds
│   └── LevelGenerator.ts   # Platform layout templates
├── scenes/
│   ├── BootScene.ts        # Loading screen
│   ├── MenuScene.ts        # Main menu
│   ├── GameScene.ts        # Core gameplay loop
│   ├── UpgradeScene.ts     # Upgrade selection UI
│   ├── PauseScene.ts       # Pause menu
│   └── GameOverScene.ts    # End screen
├── ui/
│   └── HUD.ts              # Health bar, quill bar, score, wave info
└── data/
    └── upgrades.ts         # 30+ upgrade definitions
```

## Scene Flow

```
BootScene → MenuScene → GameScene ←→ UpgradeScene
                ↓           ↓           ↓
                ↑      PauseScene  GameOverScene
                └──────────────────────┘
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

LocalStorage via SaveManager:
- High score
- Highest wave reached
- Total runs
