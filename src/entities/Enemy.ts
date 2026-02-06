import Phaser from 'phaser';
import { ENEMY_CONFIG, ENEMY_SCALING, WAVE_CONFIG, ELITE_CONFIG, STATUS_EFFECT_CONFIG } from '../config';
import { SaveManager } from '../systems/SaveManager';

export type EnemyType = 'scurrier' | 'spitter' | 'swooper' | 'shellback' | 'boss' | 'burrower' | 'splitter' | 'splitling' | 'healer' | 'flyingBoss' | 'bomber';

export class Enemy extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;

  public enemyType: EnemyType;
  public health: number;
  public maxHealth: number;
  public damage: number;
  public speed: number;
  public points: number;
  public isElite: boolean = false;

  private target: Phaser.GameObjects.Container | null = null;
  private facingRight: boolean = true;
  private lastFireTime: number = 0;
  public isDiving: boolean = false;
  private diveTarget: { x: number; y: number } | null = null;

  // For shellback blocking
  private blockAngle: number = 90;

  // Boss-specific state
  private isCharging: boolean = false;
  private chargeTarget: { x: number; y: number } | null = null;
  private lastChargeTime: number = 0;
  private bossPhase: number = 1; // Changes behavior based on health
  private stuckTimer: number = 0;
  private lastX: number = 0;

  // Flying boss state
  private isDiveBombing: boolean = false;
  private diveBombTarget: { x: number; y: number } | null = null;
  private lastDiveTime: number = 0;

  // Shellback roll state
  public isRolling: boolean = false;
  private rollTimer: number = 0;
  private lastRollTime: number = 0;

  // Burrower state
  public isBurrowed: boolean = false;
  private burrowTimer: number = 0;
  private burrowPhase: 'above' | 'burrowing' | 'underground' | 'warning' | 'surfacing' = 'above';
  private surfaceTarget: { x: number; y: number } | null = null;

  // Healer state
  private lastHealTime: number = 0;
  public healTarget: Enemy | null = null;

  // Bomber state
  private lastBombTime: number = 0;

  // Knockback state
  private knockbackTimer: number = 0;
  private knockbackVx: number = 0;
  private knockbackVy: number = 0;

  // Status effects
  private shockTimer: number = 0;
  private freezeTimer: number = 0;
  private burnStacks: { timer: number; dps: number; duration: number }[] = [];
  private poisonStacks: { timer: number; amp: number; duration: number }[] = [];
  private _isStunned: boolean = false;   // shocked or frozen
  private _isFrozen: boolean = false;
  private _statusTintTimer: number = 0;  // for visual flash timing
  private stageTint: number | null = null;  // Stage-based tint for infinite swarm

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType,
    wave: number = 1,
    difficultyMultiplier: number = 1.0,
    isElite: boolean = false,
    overrides?: { hpMultiplier?: number; dmgMultiplier?: number; stageTint?: number | null }
  ) {
    super(scene, x, y);

    this.enemyType = type;
    const config = ENEMY_CONFIG[type];

    // Calculate scaling steps (scales every N waves instead of every wave)
    const scalingSteps = Math.floor((wave - 1) / WAVE_CONFIG.scalingInterval);

    // Calculate wave-based scaling with diminishing returns (capped at maxScaleMultiplier)
    const healthMultiplier = Math.min(
      ENEMY_SCALING.maxScaleMultiplier,
      1 + scalingSteps * ENEMY_SCALING.healthPerWave
    );
    const damageMultiplier = Math.min(
      ENEMY_SCALING.maxScaleMultiplier,
      1 + scalingSteps * ENEMY_SCALING.damagePerWave
    );
    const speedMultiplier = Math.min(
      1.5, // Lower cap for speed to keep game playable
      1 + scalingSteps * ENEMY_SCALING.speedPerWave
    );

    // Use split multipliers when provided (infinite swarm), else fall back to single multiplier
    const hpDiffMult = overrides?.hpMultiplier ?? difficultyMultiplier;
    const dmgDiffMult = overrides?.dmgMultiplier ?? difficultyMultiplier;

    // Bosses use tier-based scaling: first boss (wave 5) = base HP, later bosses get bonus
    const isBoss = type === 'boss' || type === 'flyingBoss';
    let bossBonus = 1;
    if (isBoss) {
      const bossTier = Math.max(0, Math.floor(wave / WAVE_CONFIG.bossWaveInterval) - 1);
      bossBonus = 1 + (bossTier * bossTier * ENEMY_SCALING.bossHealthTierFactor);
    }
    // Note: Bosses don't get wave-based healthMultiplier, only tier bonus
    const effectiveHealthMult = isBoss ? bossBonus : healthMultiplier;
    this.health = Math.floor(config.health * effectiveHealthMult * hpDiffMult);
    this.maxHealth = this.health;

    // Calculate damage (fully uncapped - scales naturally with swarm multipliers)
    this.damage = Math.floor(config.damage * damageMultiplier * dmgDiffMult);

    // Store stage tint for infinite swarm visual feedback
    this.stageTint = overrides?.stageTint ?? null;

    this.speed = Math.floor(config.speed * speedMultiplier * Math.min(hpDiffMult, 1.3));
    this.points = config.points;

    // Apply elite stat boosts
    this.isElite = isElite;
    if (isElite) {
      this.health = Math.floor(this.health * ELITE_CONFIG.healthMultiplier);
      this.maxHealth = this.health;
      this.damage = Math.floor(this.damage * ELITE_CONFIG.damageMultiplier);
      this.speed = Math.floor(this.speed * ELITE_CONFIG.speedMultiplier);
      this.points = Math.floor(this.points * ELITE_CONFIG.pointsMultiplier);
    }

    if (type === 'shellback') {
      this.blockAngle = (config as typeof ENEMY_CONFIG.shellback).blockAngle;
    }

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body (elites are slightly larger)
    this.body = this.body as Phaser.Physics.Arcade.Body;
    const bodyW = isElite ? config.width * ELITE_CONFIG.sizeMultiplier : config.width;
    const bodyH = isElite ? config.height * ELITE_CONFIG.sizeMultiplier : config.height;
    this.body.setSize(bodyW, bodyH);
    this.body.setOffset(-bodyW / 2, -bodyH / 2);

    // Flying enemies don't have gravity
    if (type === 'swooper' || type === 'healer' || type === 'flyingBoss' || type === 'bomber') {
      this.body.setAllowGravity(false);
    } else {
      this.body.setCollideWorldBounds(true);
    }

    // Create graphics
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.draw();
  }

  setTarget(target: Phaser.GameObjects.Container): void {
    this.target = target;
  }

  update(time: number, _delta: number): void {
    if (!this.target || this.health <= 0) return;

    const delta = _delta;

    // Update status effects
    this.updateStatusEffects(delta);

    // Handle knockback (takes priority, skips AI)
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      this.body.setVelocity(this.knockbackVx, this.knockbackVy);
      this.draw();
      return;
    }

    // If stunned or frozen, skip all AI (movement, attacks, abilities)
    if (this._isStunned || this._isFrozen) {
      this.body.setVelocity(0, 0);
      this.draw();
      return;
    }

    // Face the target
    this.facingRight = this.target.x > this.x;

    // Movement AI based on type
    switch (this.enemyType) {
      case 'scurrier':
        this.updateScurrier();
        break;
      case 'spitter':
        this.updateSpitter(time);
        break;
      case 'swooper':
        this.updateSwooper(time);
        break;
      case 'shellback':
        this.updateShellback(time);
        break;
      case 'boss':
        this.updateBoss(time);
        break;
      case 'burrower':
        this.updateBurrower(time);
        break;
      case 'splitter':
        this.updateSplitter();
        break;
      case 'splitling':
        this.updateSplitling();
        break;
      case 'healer':
        this.updateHealer(time);
        break;
      case 'flyingBoss':
        this.updateFlyingBoss(time);
        break;
      case 'bomber':
        this.updateBomber(time);
        break;
    }

    this.draw();
  }

  private updateScurrier(): void {
    // Simple chase behavior
    const dir = this.target!.x > this.x ? 1 : -1;
    this.body.setVelocityX(dir * this.speed);
    this.tryJump();
  }

  private updateSpitter(_time: number): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y);

    // Spitters are ranged - they prefer to keep distance and don't jump
    const preferredDist = 250;
    const retreatDist = 150; // Back away if player gets close

    if (dist < retreatDist) {
      // Too close, back away
      const dir = this.target!.x > this.x ? -1 : 1;
      this.body.setVelocityX(dir * this.speed);
    } else if (dist < preferredDist) {
      // Good distance, slow strafe to make aiming harder
      const strafeDir = Math.sin(this.scene.time.now / 1000) > 0 ? 1 : -1;
      this.body.setVelocityX(strafeDir * this.speed * 0.5);
    } else {
      // Far away, slowly approach but don't rush
      const dir = this.target!.x > this.x ? 1 : -1;
      this.body.setVelocityX(dir * this.speed * 0.6);
    }

    // Spitters don't jump - they're ranged units that stay on the ground
  }

  private updateSwooper(time: number): void {
    const config = ENEMY_CONFIG.swooper;

    if (this.isDiving && this.diveTarget) {
      // Continue dive
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y);
      this.body.setVelocity(
        Math.cos(angle) * config.diveSpeed,
        Math.sin(angle) * config.diveSpeed
      );

      // End dive if close, below target, or hit something (platform/wall)
      if (this.y > this.diveTarget.y + 50 ||
          Phaser.Math.Distance.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y) < 30 ||
          this.body.blocked.down || this.body.blocked.left || this.body.blocked.right) {
        this.isDiving = false;
        this.diveTarget = null;
        // Immediately start recovering upward
        this.body.setVelocityY(-this.speed);
      }
    } else {
      // Hover position - randomize to allow angled dives
      // Sometimes hover directly above, sometimes offset to the side
      const hoverOffset = Math.sin(time / 800) * 150; // Wider patrol range
      const targetY = this.target!.y - 150;
      const targetX = this.target!.x + hoverOffset;

      // Move toward hover position
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      this.body.setVelocity(
        Phaser.Math.Clamp(dx * 2, -this.speed, this.speed),
        Phaser.Math.Clamp(dy * 2, -this.speed, this.speed)
      );

      // Distance from actual player position
      const playerDx = this.target!.x - this.x;

      // Start dive - can dive from angles now, not just directly above
      // Allows dives within 150px horizontal range when above player
      if (Math.abs(playerDx) < 150 && this.y < this.target!.y - 80 && Math.abs(dy) < 30) {
        // Random chance to dive each frame when in position
        if (Math.random() < 0.02) {
          this.isDiving = true;
          this.diveTarget = { x: this.target!.x, y: this.target!.y };
        }
      }
    }
  }

  private updateShellback(time: number): void {
    const config = ENEMY_CONFIG.shellback;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y);

    if (this.isRolling) {
      // Rolling: move toward player at 2x speed, invincible
      this.rollTimer -= this.scene.game.loop.delta;
      const dir = this.target!.x > this.x ? 1 : -1;
      this.body.setVelocityX(dir * config.rollSpeed);

      if (this.rollTimer <= 0) {
        this.isRolling = false;
        this.lastRollTime = time;
      }
      return;
    }

    // Check if should start rolling
    if (
      this.body.blocked.down &&
      dist >= config.rollMinDist &&
      dist <= config.rollMaxDist &&
      time - this.lastRollTime > config.rollCooldown &&
      Math.random() < 0.015
    ) {
      this.isRolling = true;
      this.rollTimer = config.rollDuration;
      return;
    }

    // Normal slow approach
    const dir = this.target!.x > this.x ? 1 : -1;
    this.body.setVelocityX(dir * this.speed);
    this.tryJump();
  }

  private updateBoss(time: number): void {
    const config = ENEMY_CONFIG.boss;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y);

    // Update boss phase based on health (3 phases)
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent > 0.5) {
      this.bossPhase = 1; // Slow single shots
    } else if (healthPercent > 0.25) {
      this.bossPhase = 2; // Triple shot but still slower
    } else {
      this.bossPhase = 3; // Enraged rapid triple shots
    }

    // Stuck detection - blocked from above (under a platform)
    if (this.body.blocked.up) {
      // Move horizontally toward player to escape from under the platform
      const dir = this.target!.x > this.x ? 1 : -1;
      this.body.setVelocityX(dir * this.speed * 1.5);
      this.body.setVelocityY(0); // Stop trying to go up
    }

    // Stuck detection - if on platform above player and not moving much
    const isAbovePlayer = this.y < this.target!.y - 80;
    const isOnPlatform = this.body.blocked.down;
    const notMovingMuch = Math.abs(this.x - this.lastX) < 5;

    if (isAbovePlayer && isOnPlatform && notMovingMuch) {
      this.stuckTimer += this.scene.game.loop.delta;
      // If stuck for 1.5 seconds, walk toward edge to drop down
      if (this.stuckTimer > 1500) {
        const dir = this.target!.x > this.x ? 1 : -1;
        this.body.setVelocityX(dir * this.speed * 1.5);
        // Reset timer but keep trying
        if (this.stuckTimer > 2500) {
          this.stuckTimer = 0;
        }
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastX = this.x;

    // Handle charging attack
    if (this.isCharging && this.chargeTarget) {
      const chargeAngle = Phaser.Math.Angle.Between(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);
      this.body.setVelocity(
        Math.cos(chargeAngle) * config.chargeSpeed,
        Math.sin(chargeAngle) * config.chargeSpeed
      );

      // End charge if reached target or hit any surface (wall, ceiling, floor)
      const chargeDist = Phaser.Math.Distance.Between(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);
      const hitSurface = this.body.blocked.left || this.body.blocked.right ||
                         this.body.blocked.up || this.body.blocked.down;
      if (chargeDist < 50 || hitSurface) {
        this.isCharging = false;
        this.chargeTarget = null;
        // Reset velocity so boss doesn't stay pinned
        this.body.setVelocity(0, 0);
      }
      return;
    }

    // Phase 3: Most aggressive (close distance), Phase 2: moderate, Phase 1: ranged
    const preferredDist = this.bossPhase === 3 ? 120 : this.bossPhase === 2 ? 160 : 200;

    // Try to jump to reach player on platforms
    if (this.body.blocked.down && this.target!.y < this.y - 60) {
      if (Math.random() < 0.03) {
        this.body.setVelocityY(-550);
      }
    }

    // Initiate charge attack when player is close and cooldown is up
    // Phase 3 is more aggressive with charges
    const chargeChance = this.bossPhase === 3 ? 0.04 : 0.02;
    if (dist < 250 && time - this.lastChargeTime > config.chargeCooldown) {
      if (Math.random() < chargeChance) {
        this.isCharging = true;
        this.chargeTarget = { x: this.target!.x, y: this.target!.y };
        this.lastChargeTime = time;
        return;
      }
    }

    // Normal movement (skip if stuck and trying to escape)
    if (this.stuckTimer > 1500) return;

    if (dist < preferredDist - 30) {
      const dir = this.target!.x > this.x ? -1 : 1;
      this.body.setVelocityX(dir * this.speed);
    } else if (dist > preferredDist + 50) {
      const dir = this.target!.x > this.x ? 1 : -1;
      this.body.setVelocityX(dir * this.speed);
    } else {
      // Strafe side to side - faster in phase 2/3
      const strafeSpeed = this.bossPhase === 1 ? 350 : this.bossPhase === 2 ? 280 : 200;
      this.body.setVelocityX(Math.sin(time / strafeSpeed) * this.speed * 1.2);
    }
  }

  private updateBurrower(_time: number): void {
    const config = ENEMY_CONFIG.burrower;

    switch (this.burrowPhase) {
      case 'above':
        // Chase player like scurrier while above ground
        {
          const dir = this.target!.x > this.x ? 1 : -1;
          this.body.setVelocityX(dir * this.speed);
          this.tryJump();

          this.burrowTimer += this.scene.game.loop.delta;
          if (this.burrowTimer >= config.surfaceDuration) {
            this.burrowPhase = 'burrowing';
            this.burrowTimer = 0;
          }
        }
        break;

      case 'burrowing':
        // Quick transition to underground - move to ground level
        this.isBurrowed = true;
        this.setAlpha(0.15);
        this.body.setAllowGravity(false);
        // Move to ground level (near bottom of game area)
        this.y = 750;
        this.body.setVelocityY(0);
        this.burrowPhase = 'underground';
        this.burrowTimer = 0;
        this._showingExclamation = false;
        break;

      case 'underground':
        // Move toward player invisibly along the ground
        {
          const dir = this.target!.x > this.x ? 1 : -1;
          this.body.setVelocityX(dir * this.speed * 1.5);
          // Stay at ground level
          this.y = 750;

          // Surface when close to player or timer expires
          const dist = Math.abs(this.target!.x - this.x);
          this.burrowTimer += this.scene.game.loop.delta;

          if (dist < 120 || this.burrowTimer >= config.burrowDuration) {
            // Calculate surface position - offset from player, on their platform level
            const approachDir = this.x < this.target!.x ? -1 : 1; // Opposite of approach
            const offset = 50 + Math.random() * 40; // 50-90px offset
            let surfaceX = this.target!.x + (approachDir * offset);

            // Clamp to screen bounds
            surfaceX = Math.max(80, Math.min(surfaceX, 1360));

            // Use player's Y position (they're likely on a platform)
            this.surfaceTarget = { x: surfaceX, y: this.target!.y + 20 };
            this.burrowPhase = 'warning';
            this.burrowTimer = 0;
          }
        }
        break;

      case 'warning':
        // Warning phase - dirt particles + exclamation mark show where burrower will emerge
        {
          // Move to surface position
          this.x = this.surfaceTarget!.x;
          this.y = this.surfaceTarget!.y + 30; // Slightly below surface
          this.body.setVelocity(0, 0);

          this.burrowTimer += this.scene.game.loop.delta;

          // Show exclamation mark during entire warning phase
          this._showingExclamation = true;

          // Pulse dirt particles every ~200ms throughout warning
          const delta = this.scene.game.loop.delta;
          if (Math.floor(this.burrowTimer / 200) !== Math.floor((this.burrowTimer - delta) / 200)) {
            this._showingWarning = true;
          }

          // After warning duration, surface
          if (this.burrowTimer >= 900) { // 900ms warning (was 600ms)
            this.burrowPhase = 'surfacing';
            this.burrowTimer = 0;
            this._showingWarning = false;
            this._showingExclamation = false;
          }
        }
        break;

      case 'surfacing':
        // Emerge with AOE damage - handled by GameScene
        this.isBurrowed = false;
        this.setAlpha(1);
        this.body.setAllowGravity(true);
        this.body.setVelocityX(0);
        this.body.setVelocityY(-350); // Pop up with more force
        this.burrowPhase = 'above';
        this.burrowTimer = 0;
        this.surfaceTarget = null;
        this._showingExclamation = false;
        // Flag that we just surfaced (GameScene checks this)
        this._justSurfaced = true;
        break;
    }
  }

  // Flag for GameScene to detect surfacing event
  public _justSurfaced: boolean = false;
  // Flag for warning dirt particles
  public _showingWarning: boolean = false;
  // Flag for exclamation mark during warning phase
  public _showingExclamation: boolean = false;

  private updateSplitter(): void {
    // Slower scurrier behavior - chase player
    const dir = this.target!.x > this.x ? 1 : -1;
    this.body.setVelocityX(dir * this.speed);
    this.tryJump();
  }

  private updateSplitling(): void {
    // Faster, more aggressive chase
    const dir = this.target!.x > this.x ? 1 : -1;
    this.body.setVelocityX(dir * this.speed);
    this.tryJump();
  }

  private updateHealer(time: number): void {
    const config = ENEMY_CONFIG.healer;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y);

    // Flee from player if too close
    if (dist < config.fleeRange) {
      const fleeDir = this.target!.x > this.x ? -1 : 1;
      this.body.setVelocityX(fleeDir * this.speed * 1.5);
      // Float upward to escape
      if (this.y > 150) {
        this.body.setVelocityY(-this.speed);
      }
    } else if (dist > config.preferredDist + 100) {
      // Move closer if too far
      const dir = this.target!.x > this.x ? 1 : -1;
      this.body.setVelocityX(dir * this.speed * 0.5);
    } else {
      // Hover at preferred distance, gentle bob
      this.body.setVelocityX(Math.sin(time / 800) * this.speed * 0.3);
    }

    // Float at a consistent height
    const targetY = this.target!.y - 120;
    const dy = targetY - this.y;
    this.body.setVelocityY(Phaser.Math.Clamp(dy * 1.5, -this.speed, this.speed));

    // Heal logic - find lowest HP ally in range (not boss, not self)
    if (time - this.lastHealTime >= config.healCooldown) {
      this.healTarget = null;
      const allies = this.scene.children.list.filter(
        (obj) => obj instanceof Enemy && obj !== this && !obj.isDead() && !obj.isBoss()
      ) as Enemy[];

      let lowestHPAlly: Enemy | null = null;
      let lowestHPPercent = 1;

      for (const ally of allies) {
        const allyDist = Phaser.Math.Distance.Between(this.x, this.y, ally.x, ally.y);
        if (allyDist <= config.healRange) {
          const hpPercent = ally.health / ally.maxHealth;
          if (hpPercent < lowestHPPercent && hpPercent < 1) {
            lowestHPPercent = hpPercent;
            lowestHPAlly = ally;
          }
        }
      }

      if (lowestHPAlly) {
        // Heal the ally
        const healAmount = Math.floor(lowestHPAlly.maxHealth * config.healPercent);
        lowestHPAlly.health = Math.min(lowestHPAlly.maxHealth, lowestHPAlly.health + healAmount);
        this.healTarget = lowestHPAlly;
        this.lastHealTime = time;
        // _justHealed flag for GameScene sound/visual
        this._justHealed = true;
      }
    }
  }

  // Flag for GameScene to detect heal event
  public _justHealed: boolean = false;

  // Flag for GameScene to create bomb zone
  public _droppingBomb: boolean = false;
  public _bombDropX: number = 0;
  public _bombDropY: number = 0;

  private updateBomber(time: number): void {
    const config = ENEMY_CONFIG.bomber;

    // Hover high above player
    const targetY = this.target!.y - 200;
    const hoverOffset = Math.sin(time / 1000) * 120;
    const targetX = this.target!.x + hoverOffset;

    // Drift toward hover position
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.body.setVelocity(
      Phaser.Math.Clamp(dx * 1.5, -this.speed, this.speed),
      Phaser.Math.Clamp(dy * 1.5, -this.speed, this.speed)
    );

    // Drop bombs on cooldown
    if (time - this.lastBombTime >= config.bombCooldown) {
      this.lastBombTime = time;
      this._droppingBomb = true;
      this._bombDropX = this.x;
      this._bombDropY = this.target!.y + 20; // Target ground near player
    }
  }

  private updateFlyingBoss(time: number): void {
    const config = ENEMY_CONFIG.flyingBoss;

    // Update boss phase based on health (3 phases)
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent > 0.5) {
      this.bossPhase = 1;
    } else if (healthPercent > 0.25) {
      this.bossPhase = 2;
    } else {
      this.bossPhase = 3;
    }

    // Handle dive bomb attack
    if (this.isDiveBombing && this.diveBombTarget) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.diveBombTarget.x, this.diveBombTarget.y);
      this.body.setVelocity(
        Math.cos(angle) * config.diveSpeed,
        Math.sin(angle) * config.diveSpeed
      );

      // End dive if close to target or passed it
      if (this.y > this.diveBombTarget.y + 30 ||
          Phaser.Math.Distance.Between(this.x, this.y, this.diveBombTarget.x, this.diveBombTarget.y) < 40) {
        this.isDiveBombing = false;
        this.diveBombTarget = null;
        // Pull up after dive
        this.body.setVelocityY(-this.speed);
      }
      return;
    }

    // Hovering behavior - stay above player
    const targetY = this.target!.y - config.hoverHeight;
    const targetX = this.target!.x + Math.sin(time / 600) * 120;

    // Move toward hover position
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.body.setVelocity(
      Phaser.Math.Clamp(dx * 2.5, -this.speed, this.speed),
      Phaser.Math.Clamp(dy * 2.5, -this.speed, this.speed)
    );

    // Initiate dive bomb when above player and cooldown is up
    // More frequent dives in phase 2/3
    const diveChance = this.bossPhase === 3 ? 0.025 : this.bossPhase === 2 ? 0.015 : 0.01;
    if (Math.abs(dx) < 80 && this.y < this.target!.y - 100 &&
        time - this.lastDiveTime > config.diveCooldown) {
      if (Math.random() < diveChance) {
        this.isDiveBombing = true;
        this.diveBombTarget = { x: this.target!.x, y: this.target!.y };
        this.lastDiveTime = time;
      }
    }
  }

  // Flag for dive bomb event (for sound in GameScene)
  public _justDived: boolean = false;

  private tryJump(): void {
    // Only jump if on the ground and player is above
    if (!this.body.blocked.down || !this.target) return;

    const heightDiff = this.target.y - this.y;
    // Player is at least 60px above
    if (heightDiff < -60) {
      // Small random chance per frame to avoid all enemies jumping at once
      if (Math.random() < 0.03) {
        this.body.setVelocityY(-620); // Strong jump to reach platforms
      }
    }
  }

  private draw(): void {
    this.graphics.clear();
    const config = ENEMY_CONFIG[this.enemyType];
    const w = config.width;
    const h = config.height;
    const dir = this.facingRight ? 1 : -1;

    // Elites are drawn slightly larger
    if (this.isElite) {
      this.graphics.setScale(ELITE_CONFIG.sizeMultiplier);
    }

    switch (this.enemyType) {
      case 'scurrier':
        this.drawScurrier(w, h, dir, config.color);
        break;
      case 'spitter':
        this.drawSpitter(w, h, dir, config.color);
        break;
      case 'swooper':
        this.drawSwooper(w, h, dir, config.color);
        break;
      case 'shellback':
        this.drawShellback(w, h, dir, config.color);
        break;
      case 'boss':
        this.drawBoss(w, h, dir, config.color);
        break;
      case 'burrower':
        this.drawBurrower(w, h, dir, config.color);
        break;
      case 'splitter':
        this.drawSplitter(w, h, dir, config.color);
        break;
      case 'splitling':
        this.drawSplitling(w, h, dir, config.color);
        break;
      case 'healer':
        this.drawHealer(w, h, dir, config.color);
        break;
      case 'flyingBoss':
        this.drawFlyingBoss(w, h, dir, config.color);
        break;
      case 'bomber':
        this.drawBomber(w, h, dir, config.color);
        break;
    }

    // Health bar
    this.drawHealthBar(w);

    // Elite visual overlay (gold glow + crown)
    if (this.isElite) {
      this.drawEliteOverlay(w, h);
    }

    // Stage tint overlay (infinite swarm stages)
    if (this.stageTint !== null) {
      this.drawStageTintOverlay(w, h);
    }

    // Status effect visual overlays
    this.drawStatusOverlays(w, h);
  }

  private drawStageTintOverlay(w: number, h: number): void {
    if (this.stageTint === null) return;
    // Draw a semi-transparent colored overlay
    this.graphics.fillStyle(this.stageTint, 0.25);
    this.graphics.fillEllipse(0, 0, w, h);
  }

  private drawScurrier(w: number, h: number, dir: number, color: number): void {
    // Small rodent body
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, 0, w, h);

    // Ears
    this.graphics.fillCircle(-w * 0.3 * dir, -h * 0.4, 5);
    this.graphics.fillCircle(-w * 0.1 * dir, -h * 0.45, 5);

    // Eye
    this.graphics.fillStyle(0xff0000);
    this.graphics.fillCircle(w * 0.2 * dir, -h * 0.1, 4);

    // Teeth
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillRect(w * 0.3 * dir - 2, h * 0.1, 4, 6);
  }

  private drawSpitter(w: number, h: number, dir: number, color: number): void {
    // Toad body
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, h * 0.1, w, h * 0.8);

    // Head bulge
    this.graphics.fillEllipse(w * 0.2 * dir, -h * 0.2, w * 0.5, h * 0.5);

    // Bulging cheeks
    this.graphics.fillStyle(color + 0x222200);
    this.graphics.fillCircle(w * 0.15 * dir, h * 0.1, 8);

    // Eye
    this.graphics.fillStyle(0xffff00);
    this.graphics.fillCircle(w * 0.25 * dir, -h * 0.25, 6);
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(w * 0.27 * dir, -h * 0.25, 3);
  }

  private drawSwooper(w: number, h: number, _dir: number, color: number): void {
    // Bat body
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, 0, w * 0.5, h);

    // Wings
    this.graphics.fillTriangle(
      -w * 0.5, -h * 0.3,
      0, 0,
      -w * 0.5, h * 0.3
    );
    this.graphics.fillTriangle(
      w * 0.5, -h * 0.3,
      0, 0,
      w * 0.5, h * 0.3
    );

    // Ears
    this.graphics.fillTriangle(-5, -h * 0.5, -8, -h * 0.8, -2, -h * 0.5);
    this.graphics.fillTriangle(5, -h * 0.5, 8, -h * 0.8, 2, -h * 0.5);

    // Eyes
    this.graphics.fillStyle(0xff0000);
    this.graphics.fillCircle(-4, -h * 0.2, 3);
    this.graphics.fillCircle(4, -h * 0.2, 3);
  }

  private drawShellback(w: number, h: number, dir: number, color: number): void {
    if (this.isRolling) {
      // Rolling: curled ball with spin lines
      this.graphics.fillStyle(color - 0x222222);
      const rollSize = Math.max(w, h) * 0.6;
      this.graphics.fillCircle(0, 0, rollSize);

      // Shell pattern on ball
      this.graphics.lineStyle(2, color);
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + (this.scene.time.now / 100);
        this.graphics.beginPath();
        this.graphics.arc(0, 0, rollSize * 0.6, angle, angle + Math.PI * 0.3);
        this.graphics.strokePath();
      }

      // Invincibility glow
      this.graphics.lineStyle(3, 0xffff00, 0.6);
      this.graphics.strokeCircle(0, 0, rollSize + 4);
      return;
    }

    // Shell (back)
    this.graphics.fillStyle(color - 0x222222);
    this.graphics.fillEllipse(-w * 0.1 * dir, 0, w * 0.9, h);

    // Shell pattern
    this.graphics.lineStyle(2, color);
    for (let i = -2; i <= 2; i++) {
      this.graphics.beginPath();
      this.graphics.arc(-w * 0.1 * dir, 0, h * 0.3 + Math.abs(i) * 5, -Math.PI / 2, Math.PI / 2);
      this.graphics.strokePath();
    }

    // Head
    this.graphics.fillStyle(color + 0x111111);
    this.graphics.fillEllipse(w * 0.3 * dir, 0, w * 0.35, h * 0.5);

    // Eye
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(w * 0.35 * dir, -h * 0.1, 4);

    // Legs
    this.graphics.fillStyle(color + 0x111111);
    this.graphics.fillRect(-w * 0.3, h * 0.3, 10, 8);
    this.graphics.fillRect(w * 0.1, h * 0.3, 10, 8);
  }

  private drawBurrower(w: number, h: number, dir: number, color: number): void {
    if (this.isBurrowed) {
      // When burrowed: just small dirt mound indicator
      this.graphics.fillStyle(0x443322, 0.3);
      this.graphics.fillEllipse(0, h * 0.3, w * 0.8, 8);
      return;
    }

    // Mole body
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, 0, w, h * 0.85);

    // Snout
    this.graphics.fillStyle(0xffccaa);
    this.graphics.fillEllipse(w * 0.35 * dir, h * 0.1, 12, 8);
    // Nose
    this.graphics.fillStyle(0x331111);
    this.graphics.fillCircle(w * 0.42 * dir, h * 0.1, 3);

    // Small beady eyes
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(w * 0.2 * dir, -h * 0.15, 3);

    // Big digging claws
    this.graphics.fillStyle(0xddccaa);
    this.graphics.fillTriangle(
      w * 0.3 * dir, h * 0.35,
      w * 0.45 * dir, h * 0.5,
      w * 0.15 * dir, h * 0.5
    );
    this.graphics.fillTriangle(
      -w * 0.1 * dir, h * 0.35,
      w * 0.05 * dir, h * 0.5,
      -w * 0.25 * dir, h * 0.5
    );
  }

  private drawSplitter(w: number, h: number, _dir: number, color: number): void {
    // Blob body with visible seam
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, 0, w, h);

    // Center seam showing it can split
    this.graphics.lineStyle(2, 0x000000, 0.6);
    this.graphics.beginPath();
    this.graphics.moveTo(0, -h * 0.5);
    this.graphics.lineTo(0, h * 0.5);
    this.graphics.strokePath();

    // Two pairs of eyes (one on each side of seam)
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(-w * 0.15, -h * 0.15, 5);
    this.graphics.fillCircle(w * 0.15, -h * 0.15, 5);
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(-w * 0.15, -h * 0.15, 3);
    this.graphics.fillCircle(w * 0.15, -h * 0.15, 3);

    // Jiggly aura
    const pulse = Math.sin(this.scene.time.now / 200) * 2;
    this.graphics.lineStyle(1, color + 0x222222, 0.4);
    this.graphics.strokeEllipse(0, 0, w + pulse, h + pulse);
  }

  private drawSplitling(w: number, h: number, _dir: number, color: number): void {
    // Small blob
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, 0, w, h);

    // Single eye
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(0, -h * 0.15, 4);
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(0, -h * 0.15, 2);
  }

  private drawHealer(w: number, h: number, _dir: number, color: number): void {
    // Floating orb body
    this.graphics.fillStyle(color);
    this.graphics.fillCircle(0, 0, w * 0.45);

    // White cross (healer symbol)
    this.graphics.fillStyle(0xffffff, 0.9);
    this.graphics.fillRect(-3, -h * 0.25, 6, h * 0.5);
    this.graphics.fillRect(-w * 0.25, -3, w * 0.5, 6);

    // Pulsing aura
    const pulse = Math.sin(this.scene.time.now / 300) * 0.2 + 0.3;
    this.graphics.lineStyle(2, 0x90ee90, pulse);
    this.graphics.strokeCircle(0, 0, w * 0.55);

    // Heal beam to target
    if (this.healTarget && !this.healTarget.isDead()) {
      const dx = this.healTarget.x - this.x;
      const dy = this.healTarget.y - this.y;
      this.graphics.lineStyle(2, 0x00ff00, 0.6);
      this.graphics.beginPath();
      this.graphics.moveTo(0, 0);
      this.graphics.lineTo(dx, dy);
      this.graphics.strokePath();

      // Clear target after drawing beam briefly
      if (this.scene.time.now - this.lastHealTime > 300) {
        this.healTarget = null;
      }
    }
  }

  private drawBomber(w: number, h: number, _dir: number, color: number): void {
    // Crow/raven body - bulkier than swooper
    this.graphics.fillStyle(color);
    this.graphics.fillEllipse(0, 0, w * 0.6, h);

    // Wings - wider spread than swooper
    this.graphics.fillStyle(color + 0x111111);
    this.graphics.fillTriangle(
      -w * 0.55, -h * 0.35,
      -w * 0.1, -h * 0.1,
      -w * 0.55, h * 0.2
    );
    this.graphics.fillTriangle(
      w * 0.55, -h * 0.35,
      w * 0.1, -h * 0.1,
      w * 0.55, h * 0.2
    );

    // Orange-red belly (bomb pouch)
    this.graphics.fillStyle(0xcc4400, 0.8);
    this.graphics.fillEllipse(0, h * 0.15, w * 0.35, h * 0.4);

    // Beak
    this.graphics.fillStyle(0x333333);
    this.graphics.fillTriangle(
      w * 0.25 * (_dir || 1), -h * 0.1,
      w * 0.4 * (_dir || 1), 0,
      w * 0.2 * (_dir || 1), h * 0.05
    );

    // Orange eyes
    this.graphics.fillStyle(0xff6600);
    this.graphics.fillCircle(-5, -h * 0.2, 3);
    this.graphics.fillCircle(5, -h * 0.2, 3);
  }

  private drawBoss(w: number, h: number, dir: number, color: number): void {
    // Visual effect when charging - red glow outline
    if (this.isCharging) {
      this.graphics.lineStyle(4, 0xff0000, 0.8);
      this.graphics.strokeEllipse(0, 0, w + 10, h + 10);
    }

    // Phase indicator - gets darker and angrier in each phase
    const bodyColor = this.bossPhase === 3 ? color - 0x330000 : this.bossPhase === 2 ? color - 0x220000 : color;

    // Huge menacing body
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 0, w, h);

    // Spiky protrusions - more in higher phases
    this.graphics.fillStyle(bodyColor - 0x220000);
    const spikeCount = this.bossPhase === 1 ? 5 : this.bossPhase === 2 ? 7 : 9;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI - Math.PI / 2;
      const spikeX = Math.cos(angle) * w * 0.5;
      const spikeY = Math.sin(angle) * h * 0.5;
      const spikeLength = this.bossPhase === 1 ? 20 : this.bossPhase === 2 ? 25 : 30;
      this.graphics.fillTriangle(
        spikeX, spikeY,
        spikeX + Math.cos(angle) * spikeLength, spikeY + Math.sin(angle) * spikeLength,
        spikeX + Math.cos(angle + 0.3) * (spikeLength * 0.75), spikeY + Math.sin(angle + 0.3) * (spikeLength * 0.75)
      );
    }

    // Phase 3 enrage glow
    if (this.bossPhase === 3) {
      const pulse = Math.sin(this.scene.time.now / 100) * 0.2 + 0.6;
      this.graphics.lineStyle(3, 0xff4400, pulse);
      this.graphics.strokeEllipse(0, 0, w + 5, h + 5);
    }

    // Armored head
    this.graphics.fillStyle(bodyColor + 0x111111);
    this.graphics.fillEllipse(w * 0.3 * dir, -h * 0.1, w * 0.4, h * 0.5);

    // Glowing eyes - brighter based on phase and charging
    const eyeColor = this.isCharging ? 0xff0000 : (this.bossPhase === 3 ? 0xff2200 : this.bossPhase === 2 ? 0xff6600 : 0xffff00);
    this.graphics.fillStyle(eyeColor);
    this.graphics.fillCircle(w * 0.35 * dir, -h * 0.2, 8);
    this.graphics.fillCircle(w * 0.25 * dir, -h * 0.15, 6);
    this.graphics.fillStyle(0xff0000);
    this.graphics.fillCircle(w * 0.35 * dir, -h * 0.2, 4);
    this.graphics.fillCircle(w * 0.25 * dir, -h * 0.15, 3);

    // Mouth with fangs
    this.graphics.fillStyle(0x000000);
    this.graphics.fillEllipse(w * 0.4 * dir, h * 0.1, 15, 10);
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillTriangle(
      w * 0.35 * dir, h * 0.05,
      w * 0.38 * dir, h * 0.2,
      w * 0.32 * dir, h * 0.15
    );
    this.graphics.fillTriangle(
      w * 0.45 * dir, h * 0.05,
      w * 0.48 * dir, h * 0.2,
      w * 0.42 * dir, h * 0.15
    );

    // Crown/horns
    this.graphics.fillStyle(0x440000);
    this.graphics.fillTriangle(
      w * 0.1 * dir, -h * 0.5,
      w * 0.2 * dir, -h * 0.8,
      w * 0.3 * dir, -h * 0.5
    );
    this.graphics.fillTriangle(
      w * 0.3 * dir, -h * 0.5,
      w * 0.4 * dir, -h * 0.9,
      w * 0.5 * dir, -h * 0.5
    );
  }

  private drawFlyingBoss(w: number, h: number, dir: number, color: number): void {
    // Visual effect when dive bombing - red glow
    if (this.isDiveBombing) {
      this.graphics.lineStyle(4, 0xff0000, 0.8);
      this.graphics.strokeEllipse(0, 0, w + 10, h + 10);
    }

    // Phase indicator - gets darker and angrier
    const bodyColor = this.bossPhase === 3 ? color - 0x220022 : this.bossPhase === 2 ? color - 0x110011 : color;

    // Main body - more elongated for flying
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 0, w, h * 0.8);

    // Large bat-like wings
    this.graphics.fillStyle(bodyColor - 0x111111);
    // Left wing
    this.graphics.fillTriangle(
      -w * 0.2, -h * 0.2,
      -w * 0.7, -h * 0.5,
      -w * 0.2, h * 0.2
    );
    this.graphics.fillTriangle(
      -w * 0.7, -h * 0.5,
      -w * 0.9, 0,
      -w * 0.2, h * 0.2
    );
    // Right wing
    this.graphics.fillTriangle(
      w * 0.2, -h * 0.2,
      w * 0.7, -h * 0.5,
      w * 0.2, h * 0.2
    );
    this.graphics.fillTriangle(
      w * 0.7, -h * 0.5,
      w * 0.9, 0,
      w * 0.2, h * 0.2
    );

    // Phase 3 enrage glow
    if (this.bossPhase === 3) {
      const pulse = Math.sin(this.scene.time.now / 100) * 0.2 + 0.6;
      this.graphics.lineStyle(3, 0xff00ff, pulse);
      this.graphics.strokeEllipse(0, 0, w * 0.6, h * 0.5);
    }

    // Head
    this.graphics.fillStyle(bodyColor + 0x111111);
    this.graphics.fillEllipse(w * 0.25 * dir, -h * 0.1, w * 0.3, h * 0.4);

    // Glowing eyes - brighter based on phase
    const eyeColor = this.isDiveBombing ? 0xff0000 : (this.bossPhase === 3 ? 0xff00ff : this.bossPhase === 2 ? 0xcc00cc : 0x9900ff);
    this.graphics.fillStyle(eyeColor);
    this.graphics.fillCircle(w * 0.3 * dir, -h * 0.15, 6);
    this.graphics.fillCircle(w * 0.2 * dir, -h * 0.1, 5);
    this.graphics.fillStyle(0xff0000);
    this.graphics.fillCircle(w * 0.3 * dir, -h * 0.15, 3);
    this.graphics.fillCircle(w * 0.2 * dir, -h * 0.1, 2);

    // Horns
    this.graphics.fillStyle(0x330033);
    this.graphics.fillTriangle(
      w * 0.1 * dir, -h * 0.4,
      w * 0.15 * dir, -h * 0.7,
      w * 0.25 * dir, -h * 0.35
    );
    this.graphics.fillTriangle(
      w * 0.3 * dir, -h * 0.35,
      w * 0.4 * dir, -h * 0.65,
      w * 0.45 * dir, -h * 0.3
    );

    // Talons at bottom
    this.graphics.fillStyle(0x333333);
    this.graphics.fillTriangle(-w * 0.15, h * 0.3, -w * 0.2, h * 0.55, -w * 0.1, h * 0.35);
    this.graphics.fillTriangle(w * 0.15, h * 0.3, w * 0.2, h * 0.55, w * 0.1, h * 0.35);
  }

  private drawHealthBar(w: number): void {
    const barWidth = w;
    const barHeight = 4;
    const y = -30;

    // Background
    this.graphics.fillStyle(0x333333);
    this.graphics.fillRect(-barWidth / 2, y, barWidth, barHeight);

    // Health - elites get a gold health bar
    const healthPercent = this.health / this.maxHealth;
    const healthColor = this.isElite
      ? ELITE_CONFIG.glowColor
      : healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    this.graphics.fillStyle(healthColor);
    this.graphics.fillRect(-barWidth / 2, y, barWidth * healthPercent, barHeight);
  }

  private drawEliteOverlay(w: number, h: number): void {
    // Pulsing gold glow ellipse around the enemy
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
    this.graphics.lineStyle(2, ELITE_CONFIG.glowColor, ELITE_CONFIG.glowAlpha * pulse);
    this.graphics.strokeEllipse(0, 0, w * 1.3, h * 1.3);

    // Small star indicator above the enemy
    const starY = -h * 0.5 - 14;
    const outerR = 5;
    const innerR = 2.25;
    const points = 5;
    this.graphics.fillStyle(ELITE_CONFIG.glowColor);
    this.graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const sx = Math.cos(angle) * r;
      const sy = starY + Math.sin(angle) * r;
      if (i === 0) {
        this.graphics.moveTo(sx, sy);
      } else {
        this.graphics.lineTo(sx, sy);
      }
    }
    this.graphics.closePath();
    this.graphics.fillPath();
  }

  // --- Status Effect System ---

  private updateStatusEffects(delta: number): void {
    this._isStunned = false;
    this._isFrozen = false;
    this._statusTintTimer += delta;

    // Shock (stun)
    if (this.shockTimer > 0) {
      this.shockTimer -= delta;
      this._isStunned = true;
      if (this.shockTimer <= 0) {
        this.shockTimer = 0;
      }
    }

    // Freeze
    if (this.freezeTimer > 0) {
      this.freezeTimer -= delta;
      this._isFrozen = true;
      if (this.freezeTimer <= 0) {
        this.freezeTimer = 0;
      }
    }

    // Burn stacks - tick DPS independently, remove expired
    for (let i = this.burnStacks.length - 1; i >= 0; i--) {
      const stack = this.burnStacks[i];
      stack.timer -= delta;
      // Apply DPS (damage per millisecond * delta)
      const burnDamage = (stack.dps / 1000) * delta;
      if (burnDamage > 0) {
        this.health -= burnDamage;
        this.health = Math.max(0, this.health);
      }
      if (stack.timer <= 0) {
        this.burnStacks.splice(i, 1);
      }
    }

    // Poison stacks - just tick timers, amp is applied in _uf()
    for (let i = this.poisonStacks.length - 1; i >= 0; i--) {
      const stack = this.poisonStacks[i];
      stack.timer -= delta;
      if (stack.timer <= 0) {
        this.poisonStacks.splice(i, 1);
      }
    }
  }

  applyShock(duration: number): void {
    // Single instance - refresh if new duration is longer than remaining
    if (duration > this.shockTimer) {
      this.shockTimer = duration;
    }
  }

  applyFreeze(duration: number): void {
    // Single instance - refresh if new duration is longer than remaining
    if (duration > this.freezeTimer) {
      this.freezeTimer = duration;
    }
  }

  applyKnockback(forceX: number, forceY: number, duration: number): void {
    // Skip if stunned, frozen, burrowed, rolling, or boss
    if (this._isStunned || this._isFrozen || this.isBurrowed || this.isRolling) return;
    if (this.enemyType === 'boss' || this.enemyType === 'flyingBoss') return;
    this.knockbackTimer = duration;
    this.knockbackVx = forceX;
    this.knockbackVy = forceY;
  }

  applyBurn(dps: number, duration: number): void {
    // Stacking - add new stack (capped for safety)
    if (this.burnStacks.length < STATUS_EFFECT_CONFIG.burn.maxStacks) {
      this.burnStacks.push({ timer: duration, dps, duration });
    }
  }

  applyPoison(amp: number, duration: number): void {
    // Stacking - add new stack (capped for safety)
    if (this.poisonStacks.length < STATUS_EFFECT_CONFIG.poison.maxStacks) {
      this.poisonStacks.push({ timer: duration, amp, duration });
    }
  }

  /** Total poison damage amplification from all active stacks */
  getPoisonAmp(): number {
    let total = 0;
    for (const stack of this.poisonStacks) {
      total += stack.amp;
    }
    return total;
  }

  /** Whether this enemy has any active burn stacks */
  isBurning(): boolean {
    return this.burnStacks.length > 0;
  }

  /** Whether this enemy has any active poison stacks */
  isPoisoned(): boolean {
    return this.poisonStacks.length > 0;
  }

  /** Whether this enemy is currently shocked (stunned) */
  isShocked(): boolean {
    return this.shockTimer > 0;
  }

  /** Whether this enemy is currently frozen */
  isFreezeActive(): boolean {
    return this.freezeTimer > 0;
  }

  /** Number of active burn stacks */
  getBurnStackCount(): number {
    return this.burnStacks.length;
  }

  /** Number of active poison stacks */
  getPoisonStackCount(): number {
    return this.poisonStacks.length;
  }

  private drawStatusOverlays(w: number, h: number): void {
    const opacity = SaveManager.getEffectsOpacity();
    if (opacity <= 0) return;

    // Shock overlay - yellow flash
    if (this.shockTimer > 0) {
      const flash = (0.3 + 0.3 * Math.sin(this._statusTintTimer * 0.02)) * opacity;
      this.graphics.fillStyle(STATUS_EFFECT_CONFIG.shock.color, flash);
      this.graphics.fillEllipse(0, 0, w, h);
      // Small jagged spark particles
      const sparkAlpha = (0.5 + 0.3 * Math.sin(this._statusTintTimer * 0.03)) * opacity;
      this.graphics.lineStyle(2, STATUS_EFFECT_CONFIG.shock.color, sparkAlpha);
      for (let i = 0; i < 3; i++) {
        const angle = (this._statusTintTimer * 0.01 + i * 2.1) % (Math.PI * 2);
        const r1 = w * 0.4;
        const r2 = w * 0.65;
        const x1 = Math.cos(angle) * r1;
        const y1 = Math.sin(angle) * r1 * (h / w);
        const x2 = Math.cos(angle + 0.3) * r2;
        const y2 = Math.sin(angle + 0.3) * r2 * (h / w);
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.strokePath();
      }
    }

    // Freeze overlay - blue tint
    if (this.freezeTimer > 0) {
      this.graphics.fillStyle(STATUS_EFFECT_CONFIG.freeze.color, 0.35 * opacity);
      this.graphics.fillEllipse(0, 0, w, h);
      // Ice crystal outline
      this.graphics.lineStyle(2, 0xaaddff, 0.5 * opacity);
      this.graphics.strokeEllipse(0, 0, w * 1.1, h * 1.1);
    }

    // Burn overlay - orange glow, intensity scales with stacks
    if (this.burnStacks.length > 0) {
      const intensity = Math.min(0.5, 0.15 + this.burnStacks.length * 0.07);
      const flicker = (intensity + 0.1 * Math.sin(this._statusTintTimer * 0.015)) * opacity;
      this.graphics.fillStyle(STATUS_EFFECT_CONFIG.burn.color, flicker);
      this.graphics.fillEllipse(0, 0, w, h);
      // Flickering glow ring
      if (this.burnStacks.length >= 2) {
        this.graphics.lineStyle(1, 0xff4400, flicker * 0.8);
        this.graphics.strokeEllipse(0, 0, w * 1.15, h * 1.15);
      }
    }

    // Poison overlay - green tint, intensity scales with stacks
    if (this.poisonStacks.length > 0) {
      const intensity = Math.min(0.5, 0.15 + this.poisonStacks.length * 0.07) * opacity;
      this.graphics.fillStyle(STATUS_EFFECT_CONFIG.poison.color, intensity);
      this.graphics.fillEllipse(0, 0, w, h);
      // Drip particles (simple dots moving downward)
      if (this.poisonStacks.length >= 2) {
        const dripAlpha = (0.3 + 0.2 * Math.sin(this._statusTintTimer * 0.008)) * opacity;
        this.graphics.fillStyle(0x44ff44, dripAlpha);
        for (let i = 0; i < Math.min(this.poisonStacks.length, 3); i++) {
          const dripY = ((this._statusTintTimer * 0.05 + i * 100) % (h * 1.2)) - h * 0.4;
          const dripX = (i - 1) * w * 0.2;
          this.graphics.fillCircle(dripX, dripY, 2);
        }
      }
    }
  }

  _uf(amount: number, fromAngle?: number): boolean {
    // Burrowed enemies are immune to damage
    if (this.isBurrowed) {
      return false;
    }

    // Rolling shellback is invincible
    if (this.isRolling) {
      this.scene.cameras.main.shake(50, 0.002);
      return false;
    }

    // Shellback blocks frontal damage
    if (this.enemyType === 'shellback' && fromAngle !== undefined) {
      const facingAngle = this.facingRight ? 0 : Math.PI;
      let angleDiff = Math.abs(fromAngle - facingAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      const blockRadians = (this.blockAngle / 2) * Math.PI / 180;
      if (angleDiff < blockRadians) {
        // Blocked! Visual feedback
        this.scene.cameras.main.shake(50, 0.002);
        return false;
      }
    }

    // Apply poison damage amplification
    const poisonAmp = this.getPoisonAmp();
    const amplifiedAmount = poisonAmp > 0 ? amount * (1 + poisonAmp) : amount;

    this.health -= amplifiedAmount;
    this.health = Math.max(0, this.health);

    // Flash white
    this.graphics.fillStyle(0xffffff, 0.5);
    const config = ENEMY_CONFIG[this.enemyType];
    this.graphics.fillEllipse(0, 0, config.width, config.height);

    return this.health <= 0;
  }

  isDead(): boolean {
    return this.health <= 0;
  }

  canShoot(): boolean {
    if (this.enemyType !== 'spitter' && this.enemyType !== 'boss' && this.enemyType !== 'flyingBoss') return false;
    // Stunned/frozen enemies cannot shoot
    if (this._isStunned || this._isFrozen) return false;

    const now = this.scene.time.now;

    if (this.enemyType === 'boss') {
      // Ground boss uses 3-phase fire rates
      const config = ENEMY_CONFIG.boss;
      const fireRate = this.bossPhase === 1 ? config.fireRatePhase1 :
                       this.bossPhase === 2 ? config.fireRatePhase2 :
                       config.fireRatePhase3;
      return now - this.lastFireTime >= fireRate * 1000;
    }

    if (this.enemyType === 'flyingBoss') {
      // Flying boss uses 3-phase fire rates (don't shoot while diving)
      if (this.isDiveBombing) return false;
      const config = ENEMY_CONFIG.flyingBoss;
      const fireRate = this.bossPhase === 1 ? config.fireRatePhase1 :
                       this.bossPhase === 2 ? config.fireRatePhase2 :
                       config.fireRatePhase3;
      return now - this.lastFireTime >= fireRate * 1000;
    }

    return now - this.lastFireTime >= ENEMY_CONFIG.spitter.fireRate * 1000;
  }

  markShot(): void {
    this.lastFireTime = this.scene.time.now;
  }

  getProjectileSpeed(): number {
    if (this.enemyType === 'spitter') {
      return ENEMY_CONFIG.spitter.projectileSpeed;
    }
    if (this.enemyType === 'boss') {
      return ENEMY_CONFIG.boss.projectileSpeed;
    }
    if (this.enemyType === 'flyingBoss') {
      return ENEMY_CONFIG.flyingBoss.projectileSpeed;
    }
    return 0;
  }

  isBoss(): boolean {
    return this.enemyType === 'boss' || this.enemyType === 'flyingBoss';
  }

  isGroundBoss(): boolean {
    return this.enemyType === 'boss';
  }

  isFlyingBoss(): boolean {
    return this.enemyType === 'flyingBoss';
  }

  isBossCharging(): boolean {
    return this.enemyType === 'boss' && this.isCharging;
  }

  isBossDiving(): boolean {
    return this.enemyType === 'flyingBoss' && this.isDiveBombing;
  }

  getBossPhase(): number {
    return this.bossPhase;
  }

  // Boss fires multiple projectiles in phase 2+ (single shot in phase 1)
  getBurstCount(): number {
    if (this.enemyType === 'boss') {
      return this.bossPhase >= 2 ? 3 : 1;
    }
    if (this.enemyType === 'flyingBoss') {
      // Flying boss: single shots in phase 1, double in phase 2, triple in phase 3
      return this.bossPhase === 3 ? 3 : this.bossPhase === 2 ? 2 : 1;
    }
    return 1;
  }

  isSplitter(): boolean {
    return this.enemyType === 'splitter';
  }

  isBurrower(): boolean {
    return this.enemyType === 'burrower';
  }

  isHealer(): boolean {
    return this.enemyType === 'healer';
  }

  isBomber(): boolean {
    return this.enemyType === 'bomber';
  }

  getRollDamage(): number {
    return ENEMY_CONFIG.shellback.rollDamage;
  }
}
