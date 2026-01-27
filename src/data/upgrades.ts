import { UPGRADE_CONFIG } from '../config';
import { UpgradeManager } from '../systems/UpgradeManager';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface UpgradeEffects {
  damage?: number;           // Multiplier (0.1 = +10%)
  fireRate?: number;         // Multiplier
  maxQuills?: number;        // Flat addition
  regenRate?: number;        // Multiplier
  moveSpeed?: number;        // Multiplier
  jumpHeight?: number;       // Multiplier
  projectileCount?: number;  // Flat addition
  projectileSpeed?: number;  // Multiplier
  critChance?: number;       // Flat (0.1 = 10%)
  critDamage?: number;       // Multiplier added to base 2x
  piercing?: number;         // Flat addition
  bouncing?: number;         // Flat addition
  aoeRadius?: number;        // Flat addition in pixels
  maxHealth?: number;        // Flat addition
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effects: UpgradeEffects;
  maxStacks?: number;        // Unlimited if not specified
}

export const UPGRADES: Upgrade[] = [
  // ===== COMMON UPGRADES =====
  {
    id: 'damage_1',
    name: 'Sharp Quills',
    description: 'Your quills deal more damage.',
    rarity: 'common',
    effects: { damage: 0.1 },
  },
  {
    id: 'fire_rate_1',
    name: 'Quick Draw',
    description: 'Shoot quills faster.',
    rarity: 'common',
    effects: { fireRate: 0.15 },
  },
  {
    id: 'max_quills_1',
    name: 'Extra Quills',
    description: 'Grow more quills on your back.',
    rarity: 'common',
    effects: { maxQuills: 5 },
  },
  {
    id: 'regen_1',
    name: 'Quick Recovery',
    description: 'Regenerate quills faster.',
    rarity: 'common',
    effects: { regenRate: 0.2 },
  },
  {
    id: 'speed_1',
    name: 'Light Feet',
    description: 'Move faster.',
    rarity: 'common',
    effects: { moveSpeed: 0.1 },
  },
  {
    id: 'projectile_speed_1',
    name: 'Aerodynamic Quills',
    description: 'Quills fly faster.',
    rarity: 'common',
    effects: { projectileSpeed: 0.2 },
  },
  {
    id: 'health_1',
    name: 'Thick Hide',
    description: 'Increase your maximum health.',
    rarity: 'common',
    effects: { maxHealth: 20 },
  },

  // ===== UNCOMMON UPGRADES =====
  {
    id: 'damage_2',
    name: 'Razor Quills',
    description: 'Significantly sharper quills.',
    rarity: 'uncommon',
    effects: { damage: 0.2 },
  },
  {
    id: 'fire_rate_2',
    name: 'Rapid Fire',
    description: 'Greatly increased fire rate.',
    rarity: 'uncommon',
    effects: { fireRate: 0.25 },
  },
  {
    id: 'max_quills_2',
    name: 'Quill Overload',
    description: 'Grow many more quills.',
    rarity: 'uncommon',
    effects: { maxQuills: 10 },
  },
  {
    id: 'crit_1',
    name: 'Vital Points',
    description: 'Chance to deal critical damage.',
    rarity: 'uncommon',
    effects: { critChance: 0.1 },
  },
  {
    id: 'multi_1',
    name: 'Double Shot',
    description: 'Fire an additional quill per shot.',
    rarity: 'uncommon',
    effects: { projectileCount: 1 },
    maxStacks: 4,
  },
  {
    id: 'jump_1',
    name: 'Strong Legs',
    description: 'Jump higher.',
    rarity: 'uncommon',
    effects: { jumpHeight: 0.2 },
  },
  {
    id: 'combo_damage_speed',
    name: 'Combat Training',
    description: 'Balanced improvement to damage and speed.',
    rarity: 'uncommon',
    effects: { damage: 0.1, moveSpeed: 0.1 },
  },

  // ===== RARE UPGRADES =====
  {
    id: 'pierce_1',
    name: 'Piercing Quills',
    description: 'Quills pass through one enemy.',
    rarity: 'rare',
    effects: { piercing: 1 },
    maxStacks: 5,
  },
  {
    id: 'bounce_1',
    name: 'Bouncing Quills',
    description: 'Quills bounce off walls twice.',
    rarity: 'rare',
    effects: { bouncing: 2 },
    maxStacks: 3,
  },
  {
    id: 'crit_2',
    name: 'Deadly Precision',
    description: 'Increased critical hit chance and damage.',
    rarity: 'rare',
    effects: { critChance: 0.15, critDamage: 0.5 },
  },
  {
    id: 'damage_3',
    name: 'Lethal Quills',
    description: 'Massive damage increase.',
    rarity: 'rare',
    effects: { damage: 0.35 },
  },
  {
    id: 'multi_2',
    name: 'Triple Shot',
    description: 'Fire two additional quills per shot.',
    rarity: 'rare',
    effects: { projectileCount: 2 },
    maxStacks: 2,
  },
  {
    id: 'sustain_1',
    name: 'Endless Quills',
    description: 'Massive quill capacity and regeneration.',
    rarity: 'rare',
    effects: { maxQuills: 15, regenRate: 0.3 },
  },
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'Huge damage boost but reduced health.',
    rarity: 'rare',
    effects: { damage: 0.5, maxHealth: -30 },
  },

  // ===== EPIC UPGRADES =====
  {
    id: 'pierce_2',
    name: 'Impaling Quills',
    description: 'Quills pass through multiple enemies.',
    rarity: 'epic',
    effects: { piercing: 3 },
    maxStacks: 2,
  },
  {
    id: 'multi_3',
    name: 'Shotgun Burst',
    description: 'Fire a spread of quills.',
    rarity: 'epic',
    effects: { projectileCount: 4 },
    maxStacks: 2,
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Move and shoot faster, but deal less damage per hit.',
    rarity: 'epic',
    effects: { fireRate: 0.5, moveSpeed: 0.3, damage: -0.2 },
  },
  {
    id: 'crit_master',
    name: 'Critical Master',
    description: 'High crit chance with devastating crits.',
    rarity: 'epic',
    effects: { critChance: 0.25, critDamage: 1.0 },
  },
  {
    id: 'tank',
    name: 'Armored Porcupine',
    description: 'Greatly increased health and quill capacity.',
    rarity: 'epic',
    effects: { maxHealth: 50, maxQuills: 20 },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Extreme movement and projectile speed.',
    rarity: 'epic',
    effects: { moveSpeed: 0.4, projectileSpeed: 0.5 },
  },

  // ===== LEGENDARY UPGRADES =====
  {
    id: 'machine_gun',
    name: 'Quill Storm',
    description: 'Unleash a torrent of quills! Massive fire rate boost.',
    rarity: 'legendary',
    effects: { fireRate: 1.0, projectileCount: 2, damage: -0.1 },
    maxStacks: 1,
  },
  {
    id: 'sniper',
    name: 'Sniper Quills',
    description: 'Slower but devastating piercing shots.',
    rarity: 'legendary',
    effects: { damage: 1.0, piercing: 5, fireRate: -0.3, projectileSpeed: 0.8 },
    maxStacks: 1,
  },
  {
    id: 'bouncy_doom',
    name: 'Pinball Wizard',
    description: 'Quills bounce everywhere, gaining damage each bounce.',
    rarity: 'legendary',
    effects: { bouncing: 5, damage: 0.3, projectileSpeed: 0.3 },
    maxStacks: 1,
  },
  {
    id: 'infinite_quills',
    name: 'Quill Infinity',
    description: 'Absurd quill capacity with incredible regeneration.',
    rarity: 'legendary',
    effects: { maxQuills: 50, regenRate: 1.0 },
    maxStacks: 1,
  },
  {
    id: 'glass_god',
    name: 'Glass God',
    description: 'Incredible power, but you become very fragile.',
    rarity: 'legendary',
    effects: { damage: 1.5, critChance: 0.3, critDamage: 1.0, maxHealth: -50 },
    maxStacks: 1,
  },
];

export function getRandomUpgrades(count: number, upgradeManager: UpgradeManager): Upgrade[] {
  const weights = UPGRADE_CONFIG.rarityWeights;
  const totalWeight = weights.common + weights.uncommon + weights.rare + weights.epic + weights.legendary;

  const selected: Upgrade[] = [];
  const availableUpgrades = UPGRADES.filter(upgrade => {
    // Check if we can still stack this upgrade
    if (upgrade.maxStacks !== undefined) {
      const currentCount = upgradeManager.getUpgradeCount(upgrade.id);
      if (currentCount >= upgrade.maxStacks) return false;
    }
    return true;
  });

  while (selected.length < count && availableUpgrades.length > 0) {
    // Roll for rarity
    const roll = Math.random() * totalWeight;
    let rarity: Rarity;

    if (roll < weights.common) {
      rarity = 'common';
    } else if (roll < weights.common + weights.uncommon) {
      rarity = 'uncommon';
    } else if (roll < weights.common + weights.uncommon + weights.rare) {
      rarity = 'rare';
    } else if (roll < weights.common + weights.uncommon + weights.rare + weights.epic) {
      rarity = 'epic';
    } else {
      rarity = 'legendary';
    }

    // Get upgrades of this rarity that we haven't selected yet
    const rarityUpgrades = availableUpgrades.filter(
      u => u.rarity === rarity && !selected.some(s => s.id === u.id)
    );

    if (rarityUpgrades.length > 0) {
      // Pick random upgrade from this rarity
      const upgrade = rarityUpgrades[Math.floor(Math.random() * rarityUpgrades.length)];
      selected.push(upgrade);
    }
  }

  // If we couldn't get enough, fill with random available
  while (selected.length < count && availableUpgrades.length > selected.length) {
    const remaining = availableUpgrades.filter(u => !selected.some(s => s.id === u.id));
    if (remaining.length === 0) break;
    const upgrade = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(upgrade);
  }

  return selected;
}
