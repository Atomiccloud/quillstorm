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
};

export const WAVE_CONFIG = {
  baseEnemyCount: 5,
  enemyScalePerWave: 1.2, // Each wave has 20% more enemies
  maxEnemiesPerWave: 100, // Cap to prevent 400+ enemy marathons
  // Spawn pacing - ramps from slow start to fast finish within each wave
  spawnIntervalStart: 2000, // ms between spawns at wave start
  spawnIntervalEnd: 500, // ms between spawns at wave end
  spawnIntervalDecayPerWave: 50, // start interval decreases by this per scaling step
  spawnIntervalMinStart: 800, // floor for starting interval
  scalingInterval: 2, // Stats and spawn pacing scale every N waves
  waveDelay: 3000, // ms between waves
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
};
