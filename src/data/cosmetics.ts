// Cosmetic item definitions for the shop

export type CosmeticCategory = 'skin' | 'hat' | 'quillStyle' | 'trail';

export type UnlockMethod =
  | { type: 'default' }
  | { type: 'purchase'; cost: number }
  | { type: 'achievement'; achievementId: string; description: string };

export interface Cosmetic {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  unlock: UnlockMethod;
  // Visual properties vary by category
  colors?: {
    primary: number;
    secondary?: number;
    glow?: number;
  };
  // For rendering
  renderData?: Record<string, unknown>;
}

// ============ SKINS ============
export const skins: Cosmetic[] = [
  {
    id: 'skin_classic',
    name: 'Classic Brown',
    description: 'The original porcupine look.',
    category: 'skin',
    unlock: { type: 'default' },
    colors: {
      primary: 0x8b7355,
      secondary: 0xa08060,
    },
  },
  {
    id: 'skin_arctic',
    name: 'Arctic White',
    description: 'Adapted for snowy climates.',
    category: 'skin',
    unlock: { type: 'purchase', cost: 500 },
    colors: {
      primary: 0xe8e8e8,
      secondary: 0xf5f5f5,
    },
  },
  {
    id: 'skin_shadow',
    name: 'Shadow',
    description: 'Dark and mysterious with a purple glow.',
    category: 'skin',
    unlock: { type: 'purchase', cost: 1000 },
    colors: {
      primary: 0x2d1b4e,
      secondary: 0x4a2d7a,
      glow: 0x8844ff,
    },
  },
  {
    id: 'skin_golden',
    name: 'Golden',
    description: 'Shimmering with prosperity.',
    category: 'skin',
    unlock: { type: 'purchase', cost: 2000 },
    colors: {
      primary: 0xffd700,
      secondary: 0xffec8b,
      glow: 0xffaa00,
    },
  },
  {
    id: 'skin_spectral',
    name: 'Spectral',
    description: 'A ghostly, ethereal appearance.',
    category: 'skin',
    unlock: {
      type: 'achievement',
      achievementId: 'survive_50_waves',
      description: 'Survive 50 waves total'
    },
    colors: {
      primary: 0x88ccff,
      secondary: 0xaaddff,
      glow: 0x44aaff,
    },
    renderData: { opacity: 0.7, pulseEffect: true },
  },
  {
    id: 'skin_inferno',
    name: 'Inferno',
    description: 'Burning with fiery intensity.',
    category: 'skin',
    unlock: {
      type: 'achievement',
      achievementId: 'defeat_100_bosses',
      description: 'Defeat 100 bosses total'
    },
    colors: {
      primary: 0xff4400,
      secondary: 0xff8800,
      glow: 0xff2200,
    },
    renderData: { flameEffect: true },
  },
];

// ============ HATS ============
export const hats: Cosmetic[] = [
  {
    id: 'hat_none',
    name: 'No Hat',
    description: 'Going au naturel.',
    category: 'hat',
    unlock: { type: 'default' },
  },
  {
    id: 'hat_crown',
    name: 'Crown',
    description: 'Royalty among rodents.',
    category: 'hat',
    unlock: { type: 'purchase', cost: 800 },
    colors: {
      primary: 0xffd700,
      secondary: 0xff4444,
    },
  },
  {
    id: 'hat_wizard',
    name: 'Wizard Hat',
    description: 'Magical mysteries await.',
    category: 'hat',
    unlock: { type: 'purchase', cost: 600 },
    colors: {
      primary: 0x6644aa,
      secondary: 0xffdd44,
    },
  },
  {
    id: 'hat_viking',
    name: 'Viking Helmet',
    description: 'Ready for battle!',
    category: 'hat',
    unlock: { type: 'purchase', cost: 750 },
    colors: {
      primary: 0x888888,
      secondary: 0xcccc99,
    },
  },
  {
    id: 'hat_party',
    name: 'Party Hat',
    description: 'Celebration time!',
    category: 'hat',
    unlock: {
      type: 'achievement',
      achievementId: 'complete_10_runs',
      description: 'Complete 10 runs'
    },
    colors: {
      primary: 0xff44aa,
      secondary: 0x44ffaa,
    },
  },
  {
    id: 'hat_chef',
    name: 'Chef Hat',
    description: 'Cooking up a storm.',
    category: 'hat',
    unlock: { type: 'purchase', cost: 400 },
    colors: {
      primary: 0xffffff,
    },
  },
  {
    id: 'hat_halo',
    name: 'Halo',
    description: 'Angelic presence.',
    category: 'hat',
    unlock: {
      type: 'achievement',
      achievementId: 'perfect_wave',
      description: 'Complete a wave without taking damage'
    },
    colors: {
      primary: 0xffff88,
      glow: 0xffffcc,
    },
  },
];

// ============ QUILL STYLES ============
export const quillStyles: Cosmetic[] = [
  {
    id: 'quill_classic',
    name: 'Classic Cyan',
    description: 'The standard quill appearance.',
    category: 'quillStyle',
    unlock: { type: 'default' },
    colors: {
      primary: 0x00ffff,
    },
  },
  {
    id: 'quill_fire',
    name: 'Fire Quills',
    description: 'Blazing projectiles with a trail.',
    category: 'quillStyle',
    unlock: { type: 'purchase', cost: 400 },
    colors: {
      primary: 0xff4400,
      secondary: 0xff8800,
    },
    renderData: { trail: true, trailColor: 0xff2200 },
  },
  {
    id: 'quill_ice',
    name: 'Ice Quills',
    description: 'Crystalline frost projectiles.',
    category: 'quillStyle',
    unlock: { type: 'purchase', cost: 400 },
    colors: {
      primary: 0x88ddff,
      secondary: 0xaaeeff,
    },
    renderData: { sparkle: true },
  },
  {
    id: 'quill_void',
    name: 'Void Quills',
    description: 'Dark energy projectiles.',
    category: 'quillStyle',
    unlock: { type: 'purchase', cost: 600 },
    colors: {
      primary: 0x8844ff,
      secondary: 0x4422aa,
    },
    renderData: { distortion: true },
  },
  {
    id: 'quill_rainbow',
    name: 'Rainbow Quills',
    description: 'Color-cycling projectiles.',
    category: 'quillStyle',
    unlock: { type: 'purchase', cost: 1000 },
    colors: {
      primary: 0xff0000, // Will cycle
    },
    renderData: { rainbow: true },
  },
];

// ============ TRAILS ============
export const trails: Cosmetic[] = [
  {
    id: 'trail_none',
    name: 'No Trail',
    description: 'Leave no trace.',
    category: 'trail',
    unlock: { type: 'default' },
  },
  {
    id: 'trail_sparkles',
    name: 'Sparkles',
    description: 'Glittering particles follow you.',
    category: 'trail',
    unlock: { type: 'purchase', cost: 500 },
    colors: {
      primary: 0xffff88,
      secondary: 0xffffff,
    },
  },
  {
    id: 'trail_leaves',
    name: 'Autumn Leaves',
    description: 'A shower of falling leaves.',
    category: 'trail',
    unlock: { type: 'purchase', cost: 400 },
    colors: {
      primary: 0xcc6600,
      secondary: 0xff8800,
    },
  },
  {
    id: 'trail_stars',
    name: 'Starry Trail',
    description: 'Leave a trail of stars.',
    category: 'trail',
    unlock: { type: 'purchase', cost: 700 },
    colors: {
      primary: 0xffffcc,
      secondary: 0xaaddff,
    },
  },
  {
    id: 'trail_fire',
    name: 'Fire Trail',
    description: 'Flames in your wake.',
    category: 'trail',
    unlock: { type: 'purchase', cost: 800 },
    colors: {
      primary: 0xff4400,
      secondary: 0xff8800,
    },
  },
];

// ============ HELPER FUNCTIONS ============

export function getAllCosmetics(): Cosmetic[] {
  return [...skins, ...hats, ...quillStyles, ...trails];
}

export function getCosmeticsByCategory(category: CosmeticCategory): Cosmetic[] {
  return getAllCosmetics().filter(c => c.category === category);
}

export function getCosmeticById(id: string): Cosmetic | undefined {
  return getAllCosmetics().find(c => c.id === id);
}

export function getDefaultCosmetics(): Record<CosmeticCategory, string> {
  return {
    skin: 'skin_classic',
    hat: 'hat_none',
    quillStyle: 'quill_classic',
    trail: 'trail_none',
  };
}

export function getCosmeticCost(cosmetic: Cosmetic): number {
  if (cosmetic.unlock.type === 'purchase') {
    return cosmetic.unlock.cost;
  }
  return 0;
}

export function isPurchasable(cosmetic: Cosmetic): boolean {
  return cosmetic.unlock.type === 'purchase';
}

export function isAchievementUnlock(cosmetic: Cosmetic): boolean {
  return cosmetic.unlock.type === 'achievement';
}
