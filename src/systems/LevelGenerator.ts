import { GAME_CONFIG } from '../config';

export interface PlatformData {
  x: number;
  y: number;
  width: number;
}

interface LevelTemplate {
  name: string;
  platforms: PlatformData[];
}

// Platform templates - each offers different gameplay dynamics
const LEVEL_TEMPLATES: LevelTemplate[] = [
  {
    // Classic layout - the original design, balanced for new players
    name: 'classic',
    platforms: [
      // Lower tier (easy to reach from ground)
      { x: 200, y: 550, width: 200 },
      { x: 640, y: 550, width: 200 },
      { x: 1080, y: 550, width: 200 },
      // Mid tier (reachable from lower tier)
      { x: 400, y: 420, width: 180 },
      { x: 880, y: 420, width: 180 },
      // Upper tier (reachable from mid tier)
      { x: 640, y: 300, width: 220 },
      { x: 150, y: 350, width: 140 },
      { x: 1130, y: 350, width: 140 },
    ],
  },
  {
    // Towers - vertical stacking on sides, open middle
    name: 'towers',
    platforms: [
      // Left tower
      { x: 180, y: 550, width: 160 },
      { x: 180, y: 420, width: 140 },
      { x: 180, y: 290, width: 120 },
      // Right tower
      { x: 1100, y: 550, width: 160 },
      { x: 1100, y: 420, width: 140 },
      { x: 1100, y: 290, width: 120 },
      // Center bridge
      { x: 640, y: 480, width: 280 },
      { x: 640, y: 320, width: 200 },
    ],
  },
  {
    // Asymmetric - unbalanced, challenging positioning
    name: 'asymmetric',
    platforms: [
      { x: 150, y: 500, width: 180 },
      { x: 420, y: 580, width: 220 },
      { x: 750, y: 460, width: 160 },
      { x: 1000, y: 530, width: 200 },
      { x: 280, y: 340, width: 200 },
      { x: 580, y: 280, width: 180 },
      { x: 900, y: 360, width: 180 },
      { x: 1150, y: 280, width: 140 },
    ],
  },
  {
    // Sparse - fewer, larger platforms, more ground combat
    name: 'sparse',
    platforms: [
      { x: 200, y: 500, width: 280 },
      { x: 640, y: 560, width: 320 },
      { x: 1080, y: 500, width: 280 },
      { x: 400, y: 340, width: 220 },
      { x: 880, y: 340, width: 220 },
      { x: 640, y: 200, width: 200 },
    ],
  },
  {
    // Gauntlet - central corridor with high platforms, flanked sides
    name: 'gauntlet',
    platforms: [
      // Central corridor
      { x: 640, y: 550, width: 400 },
      { x: 640, y: 400, width: 300 },
      { x: 640, y: 250, width: 200 },
      // Flanking platforms
      { x: 150, y: 480, width: 160 },
      { x: 150, y: 320, width: 140 },
      { x: 1130, y: 480, width: 160 },
      { x: 1130, y: 320, width: 140 },
    ],
  },
];

export class LevelGenerator {
  /**
   * Get platforms for a given wave.
   * Layout changes after each boss wave (every 5 waves).
   * Applies minor position jitter for variety.
   */
  static getPlatformsForWave(wave: number): PlatformData[] {
    // Determine which template based on boss waves completed
    // Wave 1-5: template 0 (classic)
    // Wave 6-10: template 1 (towers)
    // etc., cycling back after all templates used
    const bossesDefeated = Math.floor((wave - 1) / 5);
    const templateIndex = bossesDefeated % LEVEL_TEMPLATES.length;
    const template = LEVEL_TEMPLATES[templateIndex];

    // Apply minor randomization for variety (+/-20px horizontal, +/-10px vertical)
    return template.platforms.map(p => ({
      x: Math.max(100, Math.min(GAME_CONFIG.width - 100, p.x + (Math.random() - 0.5) * 40)),
      y: Math.max(200, Math.min(GAME_CONFIG.height - 100, p.y + (Math.random() - 0.5) * 20)),
      width: Math.max(100, p.width + (Math.random() - 0.5) * 20),
    }));
  }

  /**
   * Get the name of the current layout template.
   */
  static getLayoutName(wave: number): string {
    const bossesDefeated = Math.floor((wave - 1) / 5);
    const templateIndex = bossesDefeated % LEVEL_TEMPLATES.length;
    return LEVEL_TEMPLATES[templateIndex].name;
  }

  /**
   * Check if the layout should change after the given wave.
   * Returns true after boss waves (5, 10, 15, etc.)
   */
  static shouldChangeLayout(wave: number): boolean {
    return wave > 0 && wave % 5 === 0;
  }

  /**
   * Get valid spawn points (above platforms) for power-ups or special enemies.
   */
  static getSpawnPoints(platforms: PlatformData[]): { x: number; y: number }[] {
    return platforms.map(p => ({
      x: p.x,
      y: p.y - 40,
    }));
  }
}
