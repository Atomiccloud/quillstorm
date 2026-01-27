# Quillstorm

A roguelike action game where you play as a porcupine who shoots quills to survive waves of enemies.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository (if applicable)
git clone <repository-url>
cd quillstorm

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

The game will be available at `http://localhost:5173` (or the port shown in terminal).

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

The built files will be in the `dist/` folder, ready for deployment to any static hosting service.

### Deployment

The game auto-deploys to **[playquillstorm.com](https://playquillstorm.com)** via Vercel when changes are merged to `master`.

- PRs automatically get preview deployments
- Merging to `master` triggers production deployment
- Configuration is in `vercel.json`

## Controls

| Action | Keys |
|--------|------|
| Move Left | A or Left Arrow |
| Move Right | D or Right Arrow |
| Jump | W, Up Arrow, or Space |
| Shoot | Left Mouse Click (hold for continuous fire) |
| Aim | Mouse cursor position |
| Pause | Escape |
| Mute/Unmute | M |

## Gameplay

- **Survive waves** of increasingly difficult enemies
- **Manage your quills** - shooting depletes them, they regenerate over time
- **Quill states**: Full (100-70%), Patchy (70-40%), Sparse (40-10%), Naked (below 10%)
- **Naked state**: Cannot shoot, take 2x damage, but move 25% faster and regenerate quills 3x faster
- **Collect pickups** dropped by enemies to restore quills
- **Choose upgrades** between waves to power up
- **Boss waves** every 5 waves with new arena layouts

## Enemy Types

- **Scurrier** - Basic melee enemy, charges at you
- **Spitter** - Ranged enemy, keeps distance and shoots projectiles
- **Swooper** - Flying enemy, hovers above then dive-bombs
- **Shellback** - Tanky enemy, blocks frontal attacks with shell
- **Boss** - Large enemy with ranged attacks, appears every 5 waves

## Project Structure

```
quillstorm/
├── src/
│   ├── main.ts              # Game initialization
│   ├── config.ts            # Balance constants
│   ├── entities/            # Player, Enemy, Quill classes
│   ├── systems/             # Game systems (managers)
│   ├── scenes/              # Phaser scenes
│   ├── ui/                  # HUD components
│   └── data/                # Upgrade definitions
├── docs/                    # Detailed documentation
├── index.html               # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Documentation

See the `docs/` folder for detailed documentation:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System overview and code structure
- [GAMEPLAY.md](docs/GAMEPLAY.md) - Game mechanics and balance
- [LEVEL_DESIGN.md](docs/LEVEL_DESIGN.md) - Arena layouts and spawn logic
- [AUDIO.md](docs/AUDIO.md) - Sound system reference
- [ROADMAP.md](docs/ROADMAP.md) - Future improvements

## Tech Stack

- **Phaser 3.80** - Game framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Web Audio API** - Procedural sound generation

## License

MIT
