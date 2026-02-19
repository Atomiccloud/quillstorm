// Server-side upgrade effect lookup table
// Minimal extraction from src/data/upgrades.ts - only id, effects, and maxStacks
// Used by anti-cheat to reconstruct expected modifier values from upgrade ledger

export interface UpgradeEffectMap {
  [key: string]: number;
}

export interface UpgradeEntry {
  effects: UpgradeEffectMap;
  maxStacks?: number;
}

// All upgrade definitions - must stay in sync with src/data/upgrades.ts
export const UPGRADE_LOOKUP: Record<string, UpgradeEntry> = {
  // ===== COMMON =====
  damage_1: { effects: { damage: 0.1 } },
  fire_rate_1: { effects: { fireRate: 0.10, projectileSpeed: 0.15, distanceDamage: 0.40 } },
  max_quills_1: { effects: { maxQuills: 5 } },
  regen_1: { effects: { regenRate: 0.2 } },
  speed_1: { effects: { moveSpeed: 0.1 } },
  health_1: { effects: { maxHealth: 20 } },
  thick_quills: { effects: { projectileSize: 0.5, knockback: 1, damage: 0.05 } },
  life_leech_1: { effects: { vampirismStrength: 1 } },
  lucky_find: { effects: { prosperity: 5 } },
  tough_skin: { effects: { armor: 0.08, thorns: 2 } },
  quick_reflexes: { effects: { evasion: 0.08 } },

  // ===== UNCOMMON =====
  damage_2: { effects: { damage: 0.2 } },
  fire_rate_2: { effects: { fireRate: 0.25 } },
  max_quills_2: { effects: { maxQuills: 10 } },
  crit_1: { effects: { critChance: 0.15, critDamage: 0.15 } },
  multi_1: { effects: { projectileCount: 1 }, maxStacks: 4 },
  jump_1: { effects: { jumpHeight: 0.2 } },
  combo_damage_speed: { effects: { damage: 0.1, moveSpeed: 0.1 } },
  explosive_tips: { effects: { explosionRadius: 40 } },
  seeker_quills: { effects: { homingStrength: 0.3 } },
  fortune_seeker: { effects: { prosperity: 10 } },
  danger_1: { effects: { dangerLevel: 1 } },
  elite_hunter: { effects: { eliteDamageBonus: 0.35 } },
  static_quills: { effects: { shockStrength: 2 } },
  frost_tips: { effects: { freezeStrength: 2 } },
  ember_quills: { effects: { burnStrength: 2 } },
  toxic_quills: { effects: { poisonStrength: 2 } },
  iron_quills: { effects: { armor: 0.12, thorns: 4 } },
  acrobat: { effects: { evasion: 0.12 } },

  // ===== RARE =====
  pierce_1: { effects: { piercing: 1 }, maxStacks: 5 },
  bounce_1: { effects: { bouncing: 2 }, maxStacks: 3 },
  crit_2: { effects: { critChance: 0.25, critDamage: 0.5 } },
  damage_3: { effects: { damage: 0.35 } },
  multi_2: { effects: { projectileCount: 2 }, maxStacks: 2 },
  sustain_1: { effects: { maxQuills: 15, regenRate: 0.3 } },
  glass_cannon: { effects: { damage: 0.5, maxHealth: -30 } },
  cluster_bombs: { effects: { explosionRadius: 60, damage: 0.2 } },
  reinforced_shield: { effects: { shieldCharges: 1 } },
  baby_buddy: { effects: { companionCount: 1 }, maxStacks: 4 },
  blood_quills: { effects: { vampirismStrength: 3, damage: 0.2 } },
  treasure_hunter: { effects: { prosperity: 15, damage: 0.05 } },
  danger_2: { effects: { dangerLevel: 2 } },
  elite_slayer: { effects: { eliteDamageBonus: 0.50, damage: 0.05 } },
  lightning_quills: { effects: { shockStrength: 3 } },
  icicle_quills: { effects: { freezeStrength: 3 } },
  flame_quills: { effects: { burnStrength: 3 } },
  noxious_spines: { effects: { poisonStrength: 3 } },
  porcupine_plate: { effects: { armor: 0.18, thorns: 6, maxHealth: 20 } },
  shadow_step: { effects: { evasion: 0.18, moveSpeed: 0.05 } },

  // ===== EPIC =====
  pierce_2: { effects: { piercing: 3 }, maxStacks: 2 },
  multi_3: { effects: { projectileCount: 4 }, maxStacks: 2 },
  berserker: { effects: { fireRate: 0.5, moveSpeed: 0.3, damage: -0.2 } },
  crit_master: { effects: { critChance: 0.5, critDamage: 1.0 } },
  tank: { effects: { maxHealth: 50, maxQuills: 20 } },
  speed_demon: { effects: { moveSpeed: 0.4, projectileSpeed: 0.5 } },
  devastation: { effects: { explosionRadius: 100, damage: 0.4 } },
  porcupine_pack: { effects: { companionCount: 2 }, maxStacks: 2 },
  fortress: { effects: { shieldCharges: 2, maxHealth: 30 } },
  smart_missiles: { effects: { homingStrength: 0.7, piercing: 1 } },
  golden_touch: { effects: { prosperity: 25, maxHealth: 10 } },
  danger_3: { effects: { dangerLevel: 3 } },
  tempest: { effects: { shockStrength: 2, freezeStrength: 2 } },
  wildfire: { effects: { burnStrength: 2, poisonStrength: 2 } },
  frostfire: { effects: { burnStrength: 2, freezeStrength: 2 } },
  venomshock: { effects: { shockStrength: 2, poisonStrength: 2 } },
  diamond_hide: { effects: { armor: 0.22, thorns: 12 } },
  phantom_porcupine: { effects: { evasion: 0.22, moveSpeed: 0.10 } },

  // ===== LEGENDARY =====
  machine_gun: { effects: { fireRate: 1.0, projectileCount: 2, damage: -0.1 }, maxStacks: 3 },
  sniper: { effects: { damage: 1.0, piercing: 3, fireRate: -0.3, projectileSpeed: 0.6 }, maxStacks: 3 },
  bouncy_doom: { effects: { bouncing: 5, damage: 0.3, projectileSpeed: 0.3 }, maxStacks: 1 },
  infinite_quills: { effects: { maxQuills: 50, regenRate: 1.0 }, maxStacks: 1 },
  glass_god: { effects: { damage: 1.5, maxHealth: -50 } },
  deaths_edge: { effects: { critChance: 1.0, critDamage: 1.5 } },
  nuclear_quills: { effects: { explosionRadius: 150, damage: 0.8, fireRate: -0.3 }, maxStacks: 3 },
  porcupine_army: { effects: { companionCount: 4 }, maxStacks: 1 },
  vampire_lord: { effects: { vampirismStrength: 5, damage: 0.5 }, maxStacks: 1 },
  immortal_fortress: { effects: { shieldCharges: 4, maxHealth: 100 }, maxStacks: 1 },
  midas: { effects: { prosperity: 40 } },
  living_bastion: { effects: { armor: 0.60, thorns: 24, maxHealth: 100 } },
  wraith_form: { effects: { evasion: 1.0, moveSpeed: 0.10 } },
  lodestone: { effects: { magnetPulse: 1 }, maxStacks: 1 },

  // ===== MYTHIC =====
  expanded_options: { effects: { upgradeChoices: 1 }, maxStacks: 1 },
  fates_favor: { effects: { rerollChance: 0.50, damage: 1.0 }, maxStacks: 1 },
  quill_apotheosis: { effects: { apotheosis: 1, shockStrength: 5, freezeStrength: 5, burnStrength: 5, poisonStrength: 5 }, maxStacks: 1 },
};

// Reconstruct expected modifier totals from an upgrade ledger
export function reconstructModifiers(
  upgradeLedger: Array<{ id: string }>
): Record<string, number> {
  const modifiers: Record<string, number> = {};

  for (const entry of upgradeLedger) {
    const upgrade = UPGRADE_LOOKUP[entry.id];
    if (!upgrade) continue;

    for (const [key, value] of Object.entries(upgrade.effects)) {
      modifiers[key] = (modifiers[key] || 0) + value;
    }
  }

  return modifiers;
}
