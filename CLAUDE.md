# Quillstorm - Claude Reference

Quick reference for AI assistants working on this codebase.

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

### Understanding Systems
- **Overall architecture** → See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Game balance** → All constants in `src/config.ts`
- **Wave/progression** → `src/systems/WaveManager.ts`

## Key Files

| Purpose | File |
|---------|------|
| Game configuration | `src/config.ts` |
| Main game loop | `src/scenes/GameScene.ts` |
| Player mechanics | `src/entities/Player.ts` |
| Enemy AI & types | `src/entities/Enemy.ts` |
| Projectile logic | `src/entities/Quill.ts` |
| Upgrade definitions | `src/data/upgrades.ts` |
| Wave spawning | `src/systems/WaveManager.ts` |
| Quill management | `src/systems/QuillManager.ts` |
| Audio system | `src/systems/AudioManager.ts` |
| Level layouts | `src/systems/LevelGenerator.ts` |
| HUD rendering | `src/ui/HUD.ts` |

## Common Tasks

### Adjusting Game Balance
Edit `src/config.ts`:
- `PLAYER_CONFIG` - Movement speed, jump force, health
- `QUILL_CONFIG` - Fire rate, damage, regeneration
- `ENEMY_CONFIG` - Stats for each enemy type
- `ENEMY_SCALING` - How stats increase per wave
- `WAVE_CONFIG` - Enemy count scaling, boss intervals
- `UPGRADE_CONFIG` - Rarity weights

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
├── BootScene        # Loading
├── MenuScene        # Main menu
├── GameScene        # Main gameplay
├── UpgradeScene     # Upgrade selection overlay
├── PauseScene       # Pause menu overlay
└── GameOverScene    # End screen

Entities (Phaser.GameObjects.Container)
├── Player           # Porcupine character
├── Enemy            # 5 enemy types
└── Quill            # Projectile

Systems (Singleton/Manager classes)
├── QuillManager     # Shooting, regeneration
├── WaveManager      # Spawning, wave progression
├── UpgradeManager   # Modifier tracking
├── SaveManager      # High score persistence
├── AudioManager     # Procedural sounds
└── LevelGenerator   # Platform layouts
```

## Tech Notes

- **Framework**: Phaser 3.80.1 with Arcade Physics
- **Build**: Vite + TypeScript
- **Audio**: Web Audio API (procedural, no files)
- **Graphics**: All procedural (no image assets)
- **Storage**: LocalStorage for saves

## Running the Game

```bash
npm install    # Install dependencies
npm run dev    # Start dev server
npm run build  # Production build
```
