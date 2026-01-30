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
  regenDelay: 800, // ms before regen starts after firing
  nakedRegenMultiplier: 3, // Faster regen when naked

  // Firing
  fireRate: 3, // Shots per second (base)
  speed: 800, // Projectile speed
  damage: 10, // Base damage per quill
  lifetime: 3000, // ms before quill despawns

  // Quill size
  width: 20,
  height: 6,

  // States (percentage thresholds)
  states: {
    full: { min: 0.70, speedMult: 1, damageMult: 1, takeDamageMult: 1 },
    patchy: { min: 0.40, speedMult: 1, damageMult: 1, takeDamageMult: 1 },
    sparse: { min: 0.03, speedMult: 1.1, damageMult: 0.85, takeDamageMult: 1 },
    naked: { min: 0, speedMult: 1.25, damageMult: 0, takeDamageMult: 2 },
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
    rollSpeed: 100, // 2x base speed during roll
    rollDuration: 2000, // ms of rolling
    rollCooldown: 6000, // ms between rolls
    rollDamage: 20, // contact damage while rolling
    rollMinDist: 100, // min distance to start roll
    rollMaxDist: 400, // max distance to start roll
  },
  // Burrower - underground ambush enemy
  burrower: {
    health: 50,
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
  // Boss - big, mean, 3-phase fight
  boss: {
    health: 300,
    damage: 25,
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
    health: 250, // Slightly less HP since harder to hit
    damage: 30,
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
  spawnIntervalEnd: 300, // ms between spawns at wave end (was 500)
  spawnIntervalDecayPerWave: 100, // start interval decreases by this per scaling step (was 50)
  spawnIntervalMinStart: 400, // floor for starting interval (was 800)
  scalingInterval: 2, // Stats and spawn pacing scale every N waves
  waveDelay: 2000, // ms between waves (was 3000)
  bossWaveInterval: 5, // Boss every N waves
};

// Enemy stat scaling per wave - keeps progression challenging
export const ENEMY_SCALING = {
  healthPerWave: 0.08,     // +8% health per wave
  damagePerWave: 0.05,     // +5% damage per wave
  speedPerWave: 0.02,      // +2% speed per wave (subtle)
  maxScaleMultiplier: 3.0, // Cap at 3x base stats
};

export const UPGRADE_CONFIG = {
  choicesPerUpgrade: 3,
  rarityWeights: {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 1,
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
  platform: 0x4a6741,
  background: 0x1a1a2e,
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
  },
  chest: 0xffd700, // Gold
  xpOrb: 0x00ffff, // Cyan
  xpOrbHigh: 0xffd700, // Gold for high-value orbs
};

// XP and level progression
export const XP_CONFIG = {
  baseXPToLevel: 100,        // XP needed for first level up
  xpScalingFactor: 1.15,     // Each level needs 15% more XP
  xpDropBase: 5,             // Base XP per enemy
  xpDropBossMultiplier: 10,  // Bosses give 10x XP
  xpOrbMagnetRange: 80,      // Pixels before orb auto-collects
  xpOrbDespawnTime: 15000,   // 15 seconds before despawn
  infiniteSwarmLevel: 20,    // Level threshold for infinite mode
};

// Treasure chest drops
export const CHEST_CONFIG = {
  baseDropChance: 0.01,      // 1% base drop rate
  despawnTime: 7000,         // 7 seconds before despawn
  warningTime: 5000,         // Start flashing at 5 seconds
  riggedChestCount: 3,       // First N chests guarantee rare+
  width: 32,
  height: 24,
  rarityWeights: {
    common: 0,               // Never rolls common
    uncommon: 30,            // 30% uncommon
    rare: 40,                // 40% rare
    epic: 20,                // 20% epic
    legendary: 10,           // 10% legendary
  },
};

// Prosperity (luck) system
export const PROSPERITY_CONFIG = {
  chestDropBonusPerPoint: 0.005,  // +0.5% chest drop per point
  rarityShiftPerPoint: 0.01,     // +1% rarity shift per point
  critBonusPerPoint: 0.005,      // +0.5% crit per point
  maxProsperity: 50,             // Cap at 50 points
};

// Infinite swarm mode (activates at level 20)
export const INFINITE_SWARM_CONFIG = {
  baseSpawnInterval: 800,        // Starting spawn interval (ms)
  spawnIntervalDecayRate: 0.995, // Decays by 0.5% per second
  minSpawnInterval: 200,         // Floor for spawn rate
  statScaleRate: 0.001,          // +0.1% enemy stats per second
};
