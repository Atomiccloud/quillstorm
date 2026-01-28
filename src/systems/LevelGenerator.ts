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

// Platform templates - designed for 1440x810 canvas
// Ground is at y=780, player max jump ~140px
// Platforms spaced max 130px vertically for reliable jumps
const LEVEL_TEMPLATES: LevelTemplate[] = [
  {
    // Classic layout - balanced for new players
    name: 'classic',
    platforms: [
      // Lower tier (~140px above ground, easy to reach)
      { x: 225, y: 640, width: 200 },
      { x: 720, y: 640, width: 200 },
      { x: 1215, y: 640, width: 200 },
      // Mid tier (~130px above lower)
      { x: 450, y: 510, width: 180 },
      { x: 990, y: 510, width: 180 },
      // Upper tier (~120px above mid)
      { x: 720, y: 390, width: 220 },
      { x: 170, y: 440, width: 140 },
      { x: 1270, y: 440, width: 140 },
    ],
  },
  {
    // Towers - vertical stacking on sides, open middle
    name: 'towers',
    platforms: [
      // Left tower
      { x: 200, y: 640, width: 160 },
      { x: 200, y: 510, width: 140 },
      { x: 200, y: 380, width: 120 },
      // Right tower
      { x: 1240, y: 640, width: 160 },
      { x: 1240, y: 510, width: 140 },
      { x: 1240, y: 380, width: 120 },
      // Center bridge
      { x: 720, y: 570, width: 280 },
      { x: 720, y: 410, width: 200 },
    ],
  },
  {
    // Asymmetric - unbalanced, challenging positioning
    name: 'asymmetric',
    platforms: [
      { x: 170, y: 590, width: 180 },
      { x: 475, y: 670, width: 220 },
      { x: 845, y: 550, width: 160 },
      { x: 1125, y: 620, width: 200 },
      { x: 315, y: 430, width: 200 },
      { x: 655, y: 370, width: 180 },
      { x: 1015, y: 450, width: 180 },
      { x: 1290, y: 370, width: 140 },
    ],
  },
  {
    // Sparse - fewer, larger platforms, more ground combat
    name: 'sparse',
    platforms: [
      { x: 225, y: 590, width: 280 },
      { x: 720, y: 650, width: 320 },
      { x: 1215, y: 590, width: 280 },
      { x: 450, y: 430, width: 220 },
      { x: 990, y: 430, width: 220 },
      { x: 720, y: 290, width: 200 },
    ],
  },
  {
    // Gauntlet - central corridor with high platforms, flanked sides
    name: 'gauntlet',
    platforms: [
      // Central corridor
      { x: 720, y: 640, width: 400 },
      { x: 720, y: 490, width: 300 },
      { x: 720, y: 340, width: 200 },
      // Flanking platforms
      { x: 170, y: 570, width: 160 },
      { x: 170, y: 410, width: 140 },
      { x: 1270, y: 570, width: 160 },
      { x: 1270, y: 410, width: 140 },
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
