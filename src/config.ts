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
  // Shellback - tanky, blocks frontal attacks
  shellback: {
    health: 80,
    damage: 15,
    speed: 50,
    points: 40,
    color: 0x696969,
    width: 45,
    height: 35,
    blockAngle: 90, // Degrees of frontal protection
  },
  // Boss - big, mean, multi-phase
  boss: {
    health: 300,
    damage: 25,
    speed: 100,
    projectileSpeed: 400,
    fireRate: 0.6, // Seconds between shots (faster)
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
  timeBetweenSpawns: 1000, // ms
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
