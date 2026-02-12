// Game balance constants - tweak these to adjust gameplay feel

export const GAME_CONFIG = {
  width: 1440,
  height: 810,
  backgroundColor: 0x1a1a2e,
};

export const PLAYER_CONFIG = {
  // Movement
  moveSpeed: 300,
  jumpForce: -580,
  gravity: 1200,
  airControl: 0.8, // Multiplier for air movement
  coyoteTime: 100, // ms after leaving a platform where jump is still allowed
  jumpCutMultiplier: 0.4, // Velocity multiplier when jump key released early (lower = shorter min jump)
  maxSpeed: 500, // Maximum movement speed in px/sec (prevents uncontrollable gameplay)

  // Health
  maxHealth: 100,
  invincibilityTime: 1000, // ms of invincibility after taking damage

  // Size
  width: 40,
  height: 50,
};

export const QUILL_CONFIG = {
  // Quill count
  maxQuills: 30,
  startingQuills: 30,

  // Regeneration
  regenRate: 1.0, // Quills per second (base)
  regenDelay: 600, // base ms before regen starts after firing (scales down with regen rate)
  regenDelayMin: 100, // minimum regen delay at high regen rate
  regenDelayMaxRegen: 2.0, // regen bonus at which delay hits minimum (200%)
  nakedRegenMultiplier: 3, // Faster regen when naked

  // Firing
  fireRate: 3, // Shots per second (base)
  speed: 800, // Projectile speed
  damage: 10, // Base damage per quill
  lifetime: 3000, // ms before quill despawns

  // Quill size
  width: 20,
  height: 6,

  // Caps
  maxExplosionRadius: 400, // Maximum explosion radius in px (covers ~56% width, nearly full height)

  // States (percentage thresholds)
  // Note: speedMult and _ufm are the only active modifiers
  // - speedMult: movement speed bonus when low on quills
  // - _ufm: damage taken multiplier (2x when naked)
  states: {
    full: { min: 0.70, speedMult: 1, _ufm: 1 },
    patchy: { min: 0.40, speedMult: 1, _ufm: 1 },
    sparse: { min: 0.03, speedMult: 1.1, _ufm: 1 },
    naked: { min: 0, speedMult: 1.25, _ufm: 2 },
  },
};

export const ENEMY_CONFIG = {
  // Scurrier - basic melee
  scurrier: {
    health: 30,
    damage: 10,
    speed: 120, // Slowed down to give player more breathing room
    points: 10,
    color: 0x8b4513,
    width: 30,
    height: 25,
    directionChangeDelay: 250, // ms before scurrier can reverse direction
    jumpCooldown: 1200, // ms after landing before can jump again
  },
  // Spitter - ranged attacker
  spitter: {
    health: 25,
    damage: 15,
    speed: 60,
    projectileSpeed: 250,
    fireRate: 3.0, // Seconds between shots (longer cooldown)
    points: 20,
    color: 0x228b22,
    width: 35,
    height: 30,
  },
  // Swooper - flying dive-bomber
  swooper: {
    health: 15,
    damage: 20,
    speed: 200,
    diveSpeed: 400,
    points: 25,
    color: 0x4b0082,
    width: 35,
    height: 20,
  },
  // Shellback - tanky, blocks frontal attacks, can roll
  shellback: {
    health: 80,
    damage: 15,
    speed: 50,
    points: 40,
    color: 0x696969,
    width: 45,
    height: 35,
    blockAngle: 90, // Degrees of frontal protection
    rollSpeed: 160, // Fast roll speed during charge
    rollDuration: 2000, // ms of rolling
    rollCooldown: 6000, // ms between rolls
    rollDamage: 20, // contact damage while rolling
    rollMinDist: 100, // min distance to start roll
    rollMaxDist: 400, // max distance to start roll
  },
  // Burrower - underground ambush enemy
  burrower: {
    health: 38,
    damage: 20,
    speed: 90,
    points: 35,
    color: 0x5c3317,
    width: 35,
    height: 30,
    burrowDuration: 3000, // ms underground
    surfaceDuration: 4000, // ms above ground before burrowing again
    surfaceRadius: 60, // AOE damage radius on emergence
    surfaceDamage: 20, // damage on emergence
  },
  // Splitter - splits into two splitlings on death
  splitter: {
    health: 60,
    damage: 12,
    speed: 80,
    points: 30,
    color: 0x9932cc,
    width: 40,
    height: 35,
  },
  // Splitling - child of splitter, does NOT split again
  splitling: {
    health: 20,
    damage: 8,
    speed: 160,
    points: 10,
    color: 0xba55d3,
    width: 22,
    height: 18,
  },
  // Healer - heals nearby allies, flees from player
  healer: {
    health: 35,
    damage: 5,
    speed: 70,
    points: 50,
    color: 0x32cd32,
    width: 30,
    height: 25,
    healRange: 200, // range to heal allies
    healPercent: 0.12, // heals 12% of target's max HP
    healCooldown: 3000, // ms between heals
    fleeRange: 300, // flees when player is within this range
    preferredDist: 350, // tries to stay this far from player
  },
  // Bomber - flying crow that drops AoE ground danger zones
  bomber: {
    health: 40,
    damage: 8,                  // Low contact damage (ranged area denial)
    speed: 80,
    points: 45,
    color: 0x1a1a2e,            // Dark navy/black
    width: 40,
    height: 30,
    bombDamage: 20,             // AoE zone damage
    bombRadius: 70,             // Danger zone radius
    bombCooldown: 3000,         // ms between drops
    bombWarningDuration: 800,   // Warning circle before detonation
    bombActiveDuration: 1000,   // Danger zone linger time
  },
  // Boss - big, mean, 3-phase fight
  boss: {
    health: 300, // Base HP for wave 5 boss (scales with tier)
    damage: 30,
    speed: 100,
    projectileSpeed: 400,
    // 3-phase fire rates: Phase 1 (100-50%), Phase 2 (50-25%), Phase 3 (<25%)
    fireRatePhase1: 1.8, // Slow single shots
    fireRatePhase2: 1.2, // Faster triple shots
    fireRatePhase3: 0.6, // Enraged rapid triple shots
    points: 500,
    color: 0x8b0000,
    width: 100,
    height: 80,
    chargeSpeed: 350, // Speed during charge attack
    chargeCooldown: 4000, // ms between charges
  },
  // Flying Boss - aerial menace, appears wave 10+
  flyingBoss: {
    health: 1000, // Significantly increased (was 250)
    damage: 35,
    speed: 150, // Faster movement
    projectileSpeed: 350,
    // 3-phase fire rates like ground boss
    fireRatePhase1: 2.0, // Slow shots while hovering
    fireRatePhase2: 1.4, // Faster shots
    fireRatePhase3: 0.7, // Rapid fire
    points: 600,
    color: 0x800080, // Purple
    width: 90,
    height: 60,
    diveSpeed: 500, // Dive bomb attack speed
    diveCooldown: 5000, // ms between dive bombs
    hoverHeight: 180, // Preferred height above player
  },
};

export const WAVE_CONFIG = {
  baseEnemyCount: 5,
  enemyScalePerWave: 1.15, // Each wave has 15% more enemies (was 1.2)
  maxEnemiesPerWave: 60, // Cap to prevent marathon waves (was 100)
  // Spawn pacing - ramps from slow start to fast finish within each wave
  spawnIntervalStart: 1200, // ms between spawns at wave start (was 2000)
  spawnIntervalEnd: 375, // ms between spawns at wave end (was 300)
  spawnIntervalDecayPerWave: 100, // start interval decreases by this per scaling step (was 50)
  spawnIntervalMinStart: 500, // floor for starting interval (was 400)
  scalingInterval: 2, // Stats and spawn pacing scale every N waves
  waveDelay: 2000, // ms between waves (was 3000)
  bossWaveInterval: 5, // Boss every N waves
};

// Enemy stat scaling per wave - keeps progression challenging
export const ENEMY_SCALING = {
  healthPerWave: 0.15,     // +15% health per scaling step
  damagePerWave: 0.10,     // +10% damage per scaling step
  speedPerWave: 0.03,      // +3% speed per wave
  maxScaleMultiplier: 5.0, // Cap at 5x base stats
  // Boss tier scaling: quadratic formula = 1 + (tier^2 * factor)
  // Wave 5 (tier 0): 300 HP, Wave 10: 525, Wave 15: 1200, Wave 20: 2325
  bossHealthTierFactor: 0.75, // Quadratic scaling factor per tier^2
};

// Elite enemy configuration - rare, tougher variants with boosted rewards
export const ELITE_CONFIG = {
  healthMultiplier: 2.0,       // 2x health
  damageMultiplier: 3.0,       // 3x damage
  speedMultiplier: 1.15,       // 15% faster
  sizeMultiplier: 1.15,        // 15% visually larger
  pointsMultiplier: 2.5,       // 2.5x score
  xpMultiplier: 3.0,           // 3x XP
  baseSpawnChance: 0.01,       // 1% base chance per non-boss spawn
  glowColor: 0xffd700,         // Gold glow
  glowAlpha: 0.6,              // Glow opacity
};

// Danger Level - opt-in difficulty scaling per stack
export const DANGER_CONFIG = {
  enemyHealthBonusPerStack: 0.12,    // +12% enemy HP per stack
  enemyDamageBonusPerStack: 0.08,    // +8% enemy damage per stack
  eliteChanceBonusPerStack: 0.03,    // +3% elite spawn chance per stack
  scoreMultiplierPerStack: 0.15,     // +15% score multiplier per stack
  xpMultiplierPerStack: 0.10,        // +10% XP multiplier per stack
};

// Elemental evolution tiers — unlock new behaviors at strength thresholds
export const ELEMENTAL_EVOLUTION_CONFIG = {
  tierThresholds: [0, 2, 5, 8, 12] as const,  // Tier 0/1/2/3/4

  lightning: {
    // Stun duration per tier (ms)
    stunDuration: [0, 300, 400, 500, 600],
    // Chain arc count per tier
    arcCount: [0, 1, 2, 4, 6],
    // Arc damage as fraction of hit damage
    arcDamagePercent: [0, 0.30, 0.40, 0.50, 0.60],
    // Chance for arcs to stun their targets
    arcStunChance: [0, 0, 0.20, 0.30, 0.50],
    arcRange: 150,              // Range for chain arcs (px)
  },

  ice: {
    // Tier 1: chill (slow), Tier 2+: freeze (immobilize)
    chillSlowAmount: 0.70,      // 70% slow at Tier 1
    chillDuration: 1500,        // Chill lasts 1.5s
    freezeDuration: [0, 0, 800, 1200, 1200],  // Freeze duration per tier (ms)
    frostAuraRange: 80,         // Tier 3+: frozen enemies slow nearby (px)
    frostAuraSlowAmount: 0.40,  // 40% slow from frost aura
    shatterRange: 120,          // Tier 4: shatter AoE range (px)
    shatterDamagePercent: 0.25, // 25% of max HP as shatter damage
  },

  fire: {
    // DPS = burnStrength * 8 * (1 + damageMult) at T1, ×1.5 at T2+
    burnDuration: 2000,         // Base burn duration (ms)
    tier2DpsMultiplier: 1.5,    // +50% DPS at Tier 2+
    // Death spread: ignite N nearby enemies on death
    deathSpreadCount: [0, 0, 1, 3, 3],
    deathSpreadRange: 120,      // Range for death spread (px)
    // Tier 3: burns slow enemy
    burnSlowAmount: 0.20,       // 20% slow from burning at Tier 3+
    // Tier 4: explosion on death
    explosionBaseRadius: 80,    // Base explosion radius (px)
    explosionStackScale: 0.15,  // +15% radius per burn stack
    explosionDamageMultiplier: 2, // Burst damage = scaledDPS × stacks × this
  },

  poison: {
    // Amp per stack = poisonStrength * ampPerStrength
    ampPerStrength: 0.25,       // 25% per strength per stack
    duration: 5000,             // 5s poison duration
    // Tier 2: stacks grow over time
    growthInterval: 2000,       // Add 1 stack every 2s
    // Tier 3: death spreads stacks
    deathSpreadCount: 2,        // Spread to 2 nearby enemies
    deathSpreadRange: 120,      // Range for spread (px)
    // Tier 4: execute threshold (regular+elite only, NOT bosses)
    executeThreshold: 0.15,     // Kill at ≤15% HP
    // Tier 4: poison cloud on death
    cloudRadius: 60,            // Cloud radius (px)
    cloudDuration: 3000,        // Cloud lasts 3s
    cloudTickRate: 500,         // Cloud ticks every 500ms
  },
};

// Status effect configuration
export const STATUS_EFFECT_CONFIG = {
  // Lightning (shock) - stun + chain arcs (tier-based from ELEMENTAL_EVOLUTION_CONFIG)
  shock: {
    color: 0xffff00,            // Yellow flash
  },
  // Ice - chill (slow) at T1, freeze (immobilize) at T2+
  chill: {
    color: 0x66bbee,            // Light blue tint (lighter than freeze)
  },
  freeze: {
    color: 0x88ccff,            // Solid blue tint
  },
  // Fire (burn) - STACKS, each proc adds new stack
  burn: {
    color: 0xff6600,            // Orange tint
    maxStacks: 10,              // Safety cap on burn stacks per enemy
  },
  // Poison (venom) - STACKS, damage amp + execute
  poison: {
    color: 0x88ff88,            // Green tint
    maxStacks: 10,              // Safety cap on poison stacks per enemy
  },
};

// Armor configuration - exponential saturation with soft cap
// Base: 1 - e^(-raw * scale), then above threshold: threshold + (excess * penalty)
// Soft cap limits deep infinite swarm stacking to ~92.5% max
export const ARMOR_CONFIG = {
  scale: 1.2,                   // raw 0.08 → 9%, raw 0.5 → 45%, raw 1.05 → 72%
  softCapThreshold: 0.50,       // Diminishing returns kick in above 50% effective
  softCapPenalty: 0.85,          // 85% of excess above threshold → max ~92.5%
};

// Evasion configuration - exponential saturation with soft cap
// Base: 1 - e^(-raw * scale), then above threshold: threshold + (excess * penalty)
// Soft cap limits deep infinite swarm stacking to ~85% max
export const EVASION_CONFIG = {
  scale: 0.9,                   // raw 0.08 → 7%, raw 0.5 → 36%, raw 0.88 → 55%
  softCapThreshold: 0.40,       // Diminishing returns kick in above 40% effective
  softCapPenalty: 0.75,          // 75% of excess above threshold → max ~85%
};

export const MAGNET_PULSE_CONFIG = {
  cooldown: 12000,              // 12s between pulses
  duration: 2000,               // 2s active pull
  pullSpeed: 450,               // px/s toward player during pulse
  chestMagnetRange: 120,        // passive chest magnet range (px)
  chestMagnetSpeed: 300,        // passive chest pull speed (px/s)
};

export const KNOCKBACK_CONFIG = {
  baseForceMult: 200,           // px/s per knockback point
  duration: 150,                // ms of knockback push
};

export const DODGE_COUNTER_CONFIG = {
  executeChances: {
    common: 0.30,
    uncommon: 0.40,
    rare: 0.60,
    epic: 0.80,
    legendary: 0.90,
  } as Record<string, number>,
  eliteDamagePercent: 0.25,     // 25% max HP chunk to elites/bosses
};

export const DISTANCE_DAMAGE_CONFIG = {
  maxDistance: 600,              // px for full distance bonus (quadratic scaling)
};

export const CRIT_CONFIG = {
  baseCritChance: 0.05,         // ~5% effective crit from the start (diminishing returns: raw/(raw+1))
  baseMultiplier: 2.5,          // Crits deal 2.5x damage baseline (before critDamage upgrades)
};

export const COMPANION_CONFIG = {
  range: 600,                    // Detection/targeting range in px
  baseShootInterval: 2000,       // Base ms between shots (before fire rate scaling)
  baseEfficiency: 0.40,          // 40% of player's modifier values
  efficiencyPerCompanion: 0.03,  // +3% per companion owned
  maxEfficiency: 0.70,           // Cap at 70%
  projectileCountRatio: 0.20,    // 20% of player's projectile count
  spreadAngle: 0.15,             // Radians between multi-shot projectiles
  quillColor: 0x00ffff,          // Cyan tint for companion quills
  tipColor: 0x88ffff,            // Lighter cyan tip
  excludedModifiers: ['knockback', 'distanceDamage', 'piercing', 'vampirismStrength'] as string[],
};

// Level scaling - passive bonuses per level
export const LEVEL_SCALING_CONFIG = {
  damagePerLevel: 0.05,           // +5% damage per level (applied from level 2+)
};

export const UPGRADE_CONFIG = {
  choicesPerUpgrade: 3,
  // Base weights for level-up upgrades (before prosperity modifies)
  rarityWeights: {
    common: 65,
    uncommon: 25,
    rare: 6,
    epic: 3.5,
    legendary: 0.49,
    mythic: 0.01,
  },
};

export const COLORS = {
  player: {
    full: 0x8b7355,      // Brown
    patchy: 0xa08060,    // Lighter brown
    sparse: 0xc0a080,    // Even lighter
    naked: 0xffb6c1,     // Pink!
  },
  quill: 0xffffff,
  platform: 0x4a6741,    // Default green (Forest)
  background: 0x1a1a2e,
  // Stage color palettes - platform and background colors for each biome
  stages: [
    { platform: 0x4a6741, background: 0x1a1a2e, name: 'Forest' },      // Green - waves 1-5
    { platform: 0x5a4a6a, background: 0x1a1a2e, name: 'Twilight' },    // Purple - waves 6-10
    { platform: 0x6a5040, background: 0x1e1a1a, name: 'Cavern' },      // Brown - waves 11-15
    { platform: 0x4a5a6a, background: 0x1a1e2e, name: 'Frost' },       // Blue-gray - waves 16-20
    { platform: 0x6a4a4a, background: 0x2e1a1a, name: 'Inferno' },     // Red - infinite swarm
  ],
  ui: {
    health: 0xff4444,
    quillBar: 0xffffff,
    quillBarBg: 0x333333,
  },
  rarity: {
    common: 0xaaaaaa,
    uncommon: 0x55ff55,
    rare: 0x5555ff,
    epic: 0xaa55ff,
    legendary: 0xffaa00,
    mythic: 0xff2222,
  } as Record<string, number>,
  chest: 0xffd700, // Gold
  xpOrb: 0x00ffff, // Cyan
  xpOrbHigh: 0xffd700, // Gold for high-value orbs
  pinecone: 0x8b4513, // Saddle brown
  pineconeGlow: 0xdaa520, // Goldenrod
};

// XP and level progression
export const XP_CONFIG = {
  baseXPToLevel: 55,         // XP needed for first level up (retuned: level-up by end of wave 2)
  xpScalingFactor: 1.18,     // Each level needs 18% more XP (steeper curve keeps late-game on par)
  xpDropBase: 5,             // Base XP per enemy
  xpDropBossMultiplier: 10,  // Bosses give 10x XP
  xpOrbMagnetRange: 80,      // Pixels before orb auto-collects
  xpOrbDespawnTime: 15000,   // 15 seconds before despawn
  infiniteSwarmWave: 20,     // Wave threshold for infinite mode (after boss 4)
};

// Treasure chest drops
export const CHEST_CONFIG = {
  baseDropChance: 0.01,      // 1% base drop rate
  despawnTime: 15000,        // 15 seconds before despawn
  warningTime: 12000,        // Start flashing at 12 seconds (3 sec warning)
  riggedChestCount: 3,       // First N chests guarantee rare+
  width: 32,
  height: 24,
  // Base weights for chest upgrades (before prosperity modifies)
  rarityWeights: {
    common: 0,               // Never rolls common
    uncommon: 60.99,         // ~61% uncommon
    rare: 30,                // 30% rare
    epic: 8,                 // 8% epic
    legendary: 1,            // 1% legendary
    mythic: 0.01,            // 0.01% mythic
  },
  // Caps at 500 prosperity
  rarityCaps: {
    uncommon: 9.5,           // Drops to 9.5% at 500 prosperity
    rare: 60,                // Rises to 60% at 500 prosperity
    epic: 20,                // Rises to 20% at 500 prosperity
    legendary: 10,           // Rises to 10% at 500 prosperity
    mythic: 0.5,             // Rises to 0.5% at 500 prosperity
  },
};

// Prosperity (luck) system
export const PROSPERITY_CONFIG = {
  // Chest drop curve: bonus = maxBonus × (1 - e^(-prosperity/decayConstant))
  // At 100 prosperity: 7%, caps at 14%
  chestDropMaxBonus: 0.13,        // 13% max bonus (base 1% + 13% = 14% cap)
  chestDropDecayConstant: 161,    // Decay constant for logarithmic curve
  // Rarity shift is now handled by dedicated methods in ProgressionManager
  rarityProsperityCap: 500,       // Prosperity value where rarity caps are reached
  maxProsperity: 500,             // Soft cap for display (no hard limit)
};

// Pinecone currency drops
export const PINECONE_CONFIG = {
  baseDropChance: 0.04,        // 4% base drop rate from enemies
  bossDropMin: 1,              // Min pinecones from boss
  bossDropMax: 3,              // Max pinecones from boss
  chestBonus: 1,               // Bonus pinecones from treasure chests
  waveCompletionBonus: 0,      // Pinecones for completing a wave (0 for now)
  despawnTime: 15000,          // 15 seconds before despawn
  warningTime: 3000,           // Start flashing 3 seconds before despawn
  magnetRange: 80,             // Same as XP orbs
  prosperityBonusPerPoint: 0.001, // +0.1% drop chance per prosperity
};

// Infinite swarm mode (activates at level 20)
export const INFINITE_SWARM_CONFIG = {
  // Spawn interval: deterministic decay based on total elapsed time
  // Formula: max(stageFloor, baseInterval * decayRate^totalSeconds)
  baseSpawnInterval: 600,
  spawnIntervalDecayRate: 0.9943,
  minSpawnInterval: 10,            // Absolute floor: 100 enemies/sec maximum chaos

  // Stat scaling — tiers every 15 seconds
  // HP: quadratic → 1 + (t/15)^2 — enemies become very tanky
  // Damage: square root → 1 + sqrt(t/15) — scales naturally (no caps)
  statScaleInterval: 15,

  // 4-stage system with escalating difficulty
  stages: [
    {
      name: 'Swarm',
      startTime: 0,
      hpMult: 1.0,
      dmgMult: 1.0,
      spawnFloor: 200,
      eliteBonus: 0,       // +0% elite chance
      tint: null as number | null,  // No tint, use base colors
    },
    {
      name: 'Surge',
      startTime: 180,      // 3 min
      hpMult: 1.5,
      dmgMult: 1.5,
      spawnFloor: 100,
      eliteBonus: 0.05,    // +5% elite chance
      tint: 0xff8800 as number | null,  // Orange
    },
    {
      name: 'Frenzy',
      startTime: 360,      // 6 min
      hpMult: 2.5,
      dmgMult: 2.0,
      spawnFloor: 50,
      eliteBonus: 0.10,    // +10% elite chance
      tint: 0xff4400 as number | null,  // Deep red
    },
    {
      name: 'Apocalypse',
      startTime: 540,      // 9 min
      hpMult: 5.0,
      dmgMult: 3.0,
      spawnFloor: 10,
      eliteBonus: 0.20,    // +20% elite chance
      tint: 0xaa00ff as number | null,  // Purple
      quadraticBoost: true,
    },
  ],

  // Boss spawning in infinite swarm (gated by danger level)
  bossMinDangerLevel: 5,           // Danger level required to unlock boss spawns
  bossBaseChance: 0.005,           // 0.5% base chance per spawn at danger 5
  bossChancePerDanger: 0.005,      // +0.5% per danger level above 5
  bossMaxChance: 0.08,             // 8% max chance cap
  bossCooldownMaxMs: 15000,        // 15s cooldown at danger 5
  bossCooldownMinMs: 5000,         // 5s cooldown at danger 25+
  bossCooldownDangerRange: 20,     // Scales linearly over 20 danger levels (5→25)
  // Cooldown formula: max(5000, 15000 - (danger - 5) * 500)

  _sri: 5000,
};

// Boss reward configuration (v0.5.1)
export const BOSS_REWARD_CONFIG = {
  balanceMinPercent: 0.30,  // Minimum for "Balance" restoration option
  balanceMaxPercent: 0.60,  // Maximum for "Balance" restoration option
  waveQuillBonus: 5,        // Quills restored on normal wave clear
};

// Vampirism configuration (v0.5.1 rework - stack-based)
export const VAMPIRISM_CONFIG = {
  // Proc chance: stacks / (stacks + k)  — diminishing returns
  procDivisor: 20,          // k value: 1 stack = 4.8%, 5 = 20%, 10 = 33%, 20 = 50%
  // Heal amount: base + (stacks * perStack)  — linear scaling
  healBase: 8,              // Base heal amount
  healPerStack: 3,          // Additional heal per stack (1 stack = 11 HP, 10 = 38 HP)
};

// Shield system configuration (v0.5.0 balance overhaul)
export const SHIELD_CONFIG = {
  maxCharges: 10,                    // Hard cap on shield charges
  baseShieldIframe: 400,             // Base iframe duration in ms (first hit)
  minShieldIframe: 100,              // Minimum iframe duration (floor)
  iframeDiminishRate: 0.6,           // Each hit multiplies duration by this (400→240→144→100)
  iframeDiminishResetTime: 2000,     // Reset to base iframe after this many ms without shield breaks
};
