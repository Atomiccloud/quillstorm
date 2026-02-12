import { UPGRADE_CONFIG, SHIELD_CONFIG } from '../config';
import { UpgradeManager } from '../systems/UpgradeManager';
import { ProgressionManager } from '../systems/ProgressionManager';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

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
  // New effect types
  explosionRadius?: number;  // AOE damage radius on impact
  projectileSize?: number;   // Visual size multiplier (larger hitbox)
  shieldCharges?: number;    // Absorbs N hits before breaking
  companionCount?: number;   // Baby porcupine companions
  homingStrength?: number;   // Projectile tracking (0-1)
  vampirismStrength?: number; // Vampirism strength stacks (proc & heal scale with stacks)
  prosperity?: number;       // Luck stat: chest drops, rarity, crit
  dangerLevel?: number;      // Opt-in difficulty stacks (+enemy stats, +rewards)
  eliteDamageBonus?: number; // Bonus damage vs elite enemies (multiplier)
  upgradeChoices?: number;   // Extra upgrade cards shown per selection
  // Elemental - strength-based (evolution tiers at 2/5/8/12 str)
  shockStrength?: number;    // Lightning strength (stun + chain arcs)
  freezeStrength?: number;   // Ice strength (chill → freeze → shatter)
  burnStrength?: number;     // Fire strength (DoT → spread → explosion)
  poisonStrength?: number;   // Poison strength (amp → growth → execute)
  // Defense (logarithmic diminishing returns, no cap, infinitely stackable)
  armor?: number;            // Raw armor value (effective = ln(1+raw) / (ln(1+raw)+0.5))
  evasion?: number;          // Raw evasion value (effective = ln(1+raw) / (ln(1+raw)+0.7))
  thorns?: number;           // Base damage reflected to attacker (scales with damage modifier)
  // Knockback & Distance
  knockback?: number;        // Knockback force multiplier (force = value * 200 px/s)
  distanceDamage?: number;   // Distance damage bonus (max at 400px travel)
  // Utility
  magnetPulse?: number;      // Flag (1 = periodic magnetic pulse pulls all pickups)
  // Mythic
  rerollChance?: number;     // Probability to reroll failed procs (0.3 = 30%)
  apotheosis?: number;       // Flag (1 = every 5th volley auto-crits with all elements)
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
    name: 'Swift Quills',
    description: 'Faster attacks with quills that hit harder at range.',
    rarity: 'common',
    effects: { fireRate: 0.10, projectileSpeed: 0.15, distanceDamage: 0.40 },
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
    description: 'Chance to deal increased critical damage.',
    rarity: 'uncommon',
    effects: { critChance: 0.15, critDamage: 0.15 },
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
    effects: { critChance: 0.25, critDamage: 0.5 },
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
    effects: { critChance: 0.5, critDamage: 1.0 },
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
    effects: { damage: 1.5, critChance: 1.0, critDamage: 1.0, maxHealth: -50 },
    maxStacks: 1,
  },

  // ===== NEW UPGRADES - PHASE 8 =====

  // COMMON - New
  {
    id: 'thick_quills',
    name: 'Thick Quills',
    description: 'Heavy quills slam enemies back on impact.',
    rarity: 'common',
    effects: { projectileSize: 0.5, knockback: 1, damage: 0.05 },
  },
  {
    id: 'life_leech_1',
    name: 'Life Leech',
    description: 'Chance to heal when dealing damage. Stacks increase proc rate and healing.',
    rarity: 'common',
    effects: { vampirismStrength: 1 },
  },

  // UNCOMMON - New
  {
    id: 'explosive_tips',
    name: 'Explosive Tips',
    description: 'Quills explode on impact, damaging nearby enemies.',
    rarity: 'uncommon',
    effects: { explosionRadius: 40 },
  },
  // energy_shield removed in v0.5.0 - shields now start at rare tier
  {
    id: 'seeker_quills',
    name: 'Seeker Quills',
    description: 'Quills slightly track enemies.',
    rarity: 'uncommon',
    effects: { homingStrength: 0.3 },
  },

  // RARE - New
  {
    id: 'cluster_bombs',
    name: 'Cluster Bombs',
    description: 'Bigger explosions with more damage.',
    rarity: 'rare',
    effects: { explosionRadius: 60, damage: 0.2 },
  },
  {
    id: 'reinforced_shield',
    name: 'Reinforced Shield',
    description: 'Block one hit per wave. Shield cap: 10.',
    rarity: 'rare',
    effects: { shieldCharges: 1 },
  },
  {
    id: 'baby_buddy',
    name: 'Baby Buddy',
    description: 'A baby porcupine fights alongside you!',
    rarity: 'rare',
    effects: { companionCount: 1 },
    maxStacks: 4,
  },
  {
    id: 'blood_quills',
    name: 'Blood Quills',
    description: 'Crimson quills drain life from enemies. Stronger proc chance and healing.',
    rarity: 'rare',
    effects: { vampirismStrength: 3, damage: 0.2 },
  },

  // EPIC - New
  {
    id: 'devastation',
    name: 'Devastation',
    description: 'Massive explosion radius with increased damage.',
    rarity: 'epic',
    effects: { explosionRadius: 100, damage: 0.4 },
  },
  {
    id: 'porcupine_pack',
    name: 'Porcupine Pack',
    description: 'Two baby porcupines join your fight!',
    rarity: 'epic',
    effects: { companionCount: 2 },
    maxStacks: 2,
  },
  {
    id: 'fortress',
    name: 'Fortress',
    description: 'Block two hits per wave and +30 HP. Shield cap: 10.',
    rarity: 'epic',
    effects: { shieldCharges: 2, maxHealth: 30 },
  },
  {
    id: 'smart_missiles',
    name: 'Smart Missiles',
    description: 'Homing quills that pierce enemies.',
    rarity: 'epic',
    effects: { homingStrength: 0.7, piercing: 1 },
  },

  // LEGENDARY - New
  {
    id: 'nuclear_quills',
    name: 'Nuclear Quills',
    description: 'Devastating explosions, but slower firing.',
    rarity: 'legendary',
    effects: { explosionRadius: 150, damage: 0.8, fireRate: -0.3 },
    maxStacks: 1,
  },
  {
    id: 'porcupine_army',
    name: 'Porcupine Army',
    description: 'An entire squad of baby porcupines!',
    rarity: 'legendary',
    effects: { companionCount: 4 },
    maxStacks: 1,
  },
  {
    id: 'vampire_lord',
    name: 'Vampire Lord',
    description: 'Overwhelming vampiric power with devastating damage.',
    rarity: 'legendary',
    effects: { vampirismStrength: 5, damage: 0.5 },
    maxStacks: 1,
  },
  {
    id: 'immortal_fortress',
    name: 'Immortal Fortress',
    description: 'Block four hits per wave and +100 HP. Shield cap: 10.',
    rarity: 'legendary',
    effects: { shieldCharges: 4, maxHealth: 100 },
  },

  // ===== PROSPERITY UPGRADES =====
  {
    id: 'lucky_find',
    name: 'Lucky Find',
    description: 'Slightly increases chest drops and rarity.',
    rarity: 'common',
    effects: { prosperity: 5 },
  },
  {
    id: 'fortune_seeker',
    name: 'Fortune Seeker',
    description: 'Better luck with drops and upgrade quality.',
    rarity: 'uncommon',
    effects: { prosperity: 10 },
  },
  {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Significantly better drops, plus bonus damage.',
    rarity: 'rare',
    effects: { prosperity: 15, damage: 0.05 },
  },
  {
    id: 'golden_touch',
    name: 'Golden Touch',
    description: 'Major luck boost with extra health.',
    rarity: 'epic',
    effects: { prosperity: 25, maxHealth: 10 },
  },
  {
    id: 'midas',
    name: 'Midas',
    description: 'Everything you touch turns to gold! Maximum prosperity.',
    rarity: 'legendary',
    effects: { prosperity: 40, damage: 0.15 },
  },

  // === DANGER LEVEL UPGRADES ===
  {
    id: 'danger_1',
    name: 'Reckless',
    description: '+12% mob strength, +3% elite spawn chance, +10% XP.',
    rarity: 'uncommon',
    effects: { dangerLevel: 1 },
  },
  {
    id: 'danger_2',
    name: 'Daredevil',
    description: '+24% mob strength, +6% elite spawn chance, +20% XP.',
    rarity: 'rare',
    effects: { dangerLevel: 2 },
  },
  {
    id: 'danger_3',
    name: 'Death Wish',
    description: '+36% mob strength, +9% elite spawn chance, +30% XP.',
    rarity: 'epic',
    effects: { dangerLevel: 3 },
  },

  // === ELITE DAMAGE UPGRADES ===
  {
    id: 'elite_hunter',
    name: 'Elite Hunter',
    description: 'Deal bonus damage to elite enemies.',
    rarity: 'uncommon',
    effects: { eliteDamageBonus: 0.25 },
  },
  {
    id: 'elite_slayer',
    name: 'Elite Slayer',
    description: 'Massive bonus damage to elite enemies, with a small damage boost.',
    rarity: 'rare',
    effects: { eliteDamageBonus: 0.50, damage: 0.05 },
  },

  // === ELEMENTAL UPGRADES - LIGHTNING ===
  {
    id: 'static_quills',
    name: 'Static Quills',
    description: 'Quills crackle with static. Chance to stun and arc to nearby enemies.',
    rarity: 'uncommon',
    effects: { shockStrength: 2 },
  },
  {
    id: 'lightning_quills',
    name: 'Lightning Quills',
    description: 'Electrified quills stun longer and arc to more enemies.',
    rarity: 'rare',
    effects: { shockStrength: 3 },
  },

  // === ELEMENTAL UPGRADES - ICE ===
  {
    id: 'frost_tips',
    name: 'Frost Tips',
    description: 'Chilled quills slow enemies. Higher strength freezes them solid.',
    rarity: 'uncommon',
    effects: { freezeStrength: 2 },
  },
  {
    id: 'icicle_quills',
    name: 'Icicle Quills',
    description: 'Deep cold freezes enemies, locking them in place.',
    rarity: 'rare',
    effects: { freezeStrength: 3 },
  },

  // === ELEMENTAL UPGRADES - FIRE ===
  {
    id: 'ember_quills',
    name: 'Ember Quills',
    description: 'Smoldering quills set enemies ablaze. Burns stack and spread.',
    rarity: 'uncommon',
    effects: { burnStrength: 2 },
  },
  {
    id: 'flame_quills',
    name: 'Flame Quills',
    description: 'Hotter flames burn fiercer and ignite nearby enemies on kill.',
    rarity: 'rare',
    effects: { burnStrength: 3 },
  },

  // === ELEMENTAL UPGRADES - POISON ===
  {
    id: 'toxic_quills',
    name: 'Toxic Quills',
    description: 'Venomous quills amplify damage taken. Stacks grow over time.',
    rarity: 'uncommon',
    effects: { poisonStrength: 2 },
  },
  {
    id: 'noxious_spines',
    name: 'Noxious Spines',
    description: 'Deeper venom spreads on kill. High strength executes weakened foes.',
    rarity: 'rare',
    effects: { poisonStrength: 3 },
  },

  // === ELEMENTAL UPGRADES - DUAL-ELEMENT EPICS ===
  {
    id: 'tempest',
    name: 'Tempest',
    description: 'Lightning and ice combine. Shocked enemies that get chilled are instantly frozen.',
    rarity: 'epic',
    effects: { shockStrength: 2, freezeStrength: 2 },
  },
  {
    id: 'wildfire',
    name: 'Wildfire',
    description: 'Fire and poison synergize. Burning poisoned enemies grow stacks twice as fast.',
    rarity: 'epic',
    effects: { burnStrength: 2, poisonStrength: 2 },
  },
  {
    id: 'frostfire',
    name: 'Frostfire',
    description: 'Fire and ice react. Frozen burning enemies release steam AoE on thaw.',
    rarity: 'epic',
    effects: { burnStrength: 2, freezeStrength: 2 },
  },
  {
    id: 'venomshock',
    name: 'Venomshock',
    description: 'Lightning carries poison. Chain arcs spread poison to targets they hit.',
    rarity: 'epic',
    effects: { shockStrength: 2, poisonStrength: 2 },
  },

  // === ELEMENTAL UPGRADES - UNIVERSAL LEGENDARY ===
  {
    id: 'elemental_convergence',
    name: 'Elemental Convergence',
    description: 'Master all elements. Procs have 20% chance to trigger a second element.',
    rarity: 'legendary',
    effects: { shockStrength: 3, freezeStrength: 3, burnStrength: 3, poisonStrength: 3 },
  },

  // === DEFENSE UPGRADES - ARMOR ===
  // Logarithmic diminishing returns: effective = ln(1 + raw) / (ln(1 + raw) + 1.5)
  // Stack infinitely with decreasing returns per point
  {
    id: 'tough_skin',
    name: 'Tough Skin',
    description: 'Thicker hide reduces and reflects damage. +8 Armor, +2 Thorns.',
    rarity: 'common',
    effects: { armor: 0.08, thorns: 2 },
  },
  {
    id: 'iron_quills',
    name: 'Iron Quills',
    description: 'Hardened quills resist and reflect damage. +12 Armor, +4 Thorns.',
    rarity: 'uncommon',
    effects: { armor: 0.12, thorns: 4 },
  },
  {
    id: 'porcupine_plate',
    name: 'Porcupine Plate',
    description: 'Natural armor plating with spiny defense. +18 Armor, +6 Thorns, +20 HP.',
    rarity: 'rare',
    effects: { armor: 0.18, thorns: 6, maxHealth: 20 },
  },
  {
    id: 'diamond_hide',
    name: 'Diamond Hide',
    description: 'Impenetrable hide that reflects damage. +22 Armor, +12 Thorns.',
    rarity: 'epic',
    effects: { armor: 0.22, thorns: 12 },
  },
  {
    id: 'living_bastion',
    name: 'Living Bastion',
    description: 'Become an unstoppable fortress. +45 Armor, +24 Thorns, +25 HP.',
    rarity: 'legendary',
    effects: { armor: 0.45, thorns: 24, maxHealth: 25 },
  },

  // === DEFENSE UPGRADES - EVASION ===
  // Logarithmic diminishing returns: effective = ln(1 + raw) / (ln(1 + raw) + 2.0)
  // Stack infinitely with decreasing returns per point
  {
    id: 'quick_reflexes',
    name: 'Quick Reflexes',
    description: 'Nimble footwork to dodge and counter attacks. +8 Evasion.',
    rarity: 'common',
    effects: { evasion: 0.08 },
  },
  {
    id: 'acrobat',
    name: 'Acrobat',
    description: 'Agile movements make you harder to hit. +12 Evasion.',
    rarity: 'uncommon',
    effects: { evasion: 0.12 },
  },
  {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'Phase through attacks with uncanny reflexes. +18 Evasion, +5% Speed.',
    rarity: 'rare',
    effects: { evasion: 0.18, moveSpeed: 0.05 },
  },
  {
    id: 'phantom_porcupine',
    name: 'Phantom Porcupine',
    description: 'A blur of quills and fury. +22 Evasion, +10% Speed.',
    rarity: 'epic',
    effects: { evasion: 0.22, moveSpeed: 0.10 },
  },
  {
    id: 'wraith_form',
    name: 'Wraith Form',
    description: 'Become intangible. +28 Evasion, +15% Speed.',
    rarity: 'legendary',
    effects: { evasion: 0.28, moveSpeed: 0.15 },
  },
  {
    id: 'lodestone',
    name: 'Lodestone',
    description: 'Periodically emit a magnetic pulse that draws all nearby resources toward you.',
    rarity: 'legendary',
    effects: { magnetPulse: 1 },
    maxStacks: 1,
  },

  // === MYTHIC UPGRADES ===
  {
    id: 'expanded_options',
    name: 'Expanded Options',
    description: 'See an additional upgrade card when choosing upgrades.',
    rarity: 'mythic',
    effects: { upgradeChoices: 1 },
    maxStacks: 1,
  },
  {
    id: 'fates_favor',
    name: "Fate's Favor",
    description: 'When a proc effect fails, roll again. Fortune favors the bold.',
    rarity: 'mythic',
    effects: { rerollChance: 0.30 },
    maxStacks: 1,
  },
  {
    id: 'quill_apotheosis',
    name: 'Quill Apotheosis',
    description: 'Every 5th volley transcends. All quills auto-crit with every unlocked element.',
    rarity: 'mythic',
    effects: { apotheosis: 1 },
    maxStacks: 1,
  },
];

export interface RarityWeights {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
}

export interface UpgradeSelectionOptions {
  customWeights?: Partial<RarityWeights>;
  guaranteeRareOrBetter?: boolean;  // For "rigged" early chests
  progressionManager?: ProgressionManager;  // For prosperity-based rarity shifts
  source?: 'levelup' | 'wave' | 'chest';  // v0.5.0: Different rarity systems for different sources
}

export function getRandomUpgrades(
  count: number,
  upgradeManager: UpgradeManager,
  options?: UpgradeSelectionOptions
): Upgrade[] {
  // v0.5.0: Use different rarity systems based on source
  let weights: RarityWeights;

  if (options?.progressionManager && options.source === 'chest') {
    // Chest upgrades use the linear chest rarity system
    weights = options.progressionManager.getChestRarityWeights();
  } else {
    // Level-up and wave upgrades use the two-phase level-up rarity system
    const baseWeights = UPGRADE_CONFIG.rarityWeights;
    weights = {
      common: options?.customWeights?.common ?? baseWeights.common,
      uncommon: options?.customWeights?.uncommon ?? baseWeights.uncommon,
      rare: options?.customWeights?.rare ?? baseWeights.rare,
      epic: options?.customWeights?.epic ?? baseWeights.epic,
      legendary: options?.customWeights?.legendary ?? baseWeights.legendary,
      mythic: options?.customWeights?.mythic ?? baseWeights.mythic,
    };

    // Apply prosperity-based rarity shift if progressionManager is provided
    if (options?.progressionManager) {
      const excludeCommon = options.customWeights?.common === 0;
      weights = options.progressionManager.getLevelUpRarityWeights(weights, excludeCommon);
    }
  }

  const totalWeight = weights.common + weights.uncommon + weights.rare + weights.epic + weights.legendary + weights.mythic;

  const selected: Upgrade[] = [];
  const availableUpgrades = UPGRADES.filter(upgrade => {
    // Check if we can still stack this upgrade
    if (upgrade.maxStacks !== undefined) {
      const currentCount = upgradeManager.getUpgradeCount(upgrade.id);
      if (currentCount >= upgrade.maxStacks) return false;
    }
    // Hide shield upgrades when at shield cap (v0.5.0)
    if (upgrade.effects.shieldCharges && upgrade.effects.shieldCharges > 0) {
      const currentShields = upgradeManager.getModifier('shieldCharges');
      if (currentShields >= SHIELD_CONFIG.maxCharges) return false;
    }
    // If common weight is 0, exclude common upgrades
    if (weights.common === 0 && upgrade.rarity === 'common') return false;
    return true;
  });

  // If guaranteeRareOrBetter, ensure at least one rare+ upgrade
  if (options?.guaranteeRareOrBetter && count > 0) {
    const rareOrBetter = availableUpgrades.filter(
      u => u.rarity === 'rare' || u.rarity === 'epic' || u.rarity === 'legendary' || u.rarity === 'mythic'
    );
    if (rareOrBetter.length > 0) {
      const guaranteed = rareOrBetter[Math.floor(Math.random() * rareOrBetter.length)];
      selected.push(guaranteed);
    }
  }

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
    } else if (roll < weights.common + weights.uncommon + weights.rare + weights.epic + weights.legendary) {
      rarity = 'legendary';
    } else {
      rarity = 'mythic';
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
