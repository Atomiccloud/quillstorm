import Phaser from 'phaser';
import { ENEMY_CONFIG, ENEMY_SCALING } from '../config';

export type EnemyType = 'scurrier' | 'spitter' | 'swooper' | 'shellback' | 'boss';

export class Enemy extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;

  public enemyType: EnemyType;
  public health: number;
  public maxHealth: number;
  public damage: number;
  public speed: number;
  public points: number;

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

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType,
    wave: number = 1
  ) {
    super(scene, x, y);

    this.enemyType = type;
    const config = ENEMY_CONFIG[type];

    // Calculate wave-based scaling with diminishing returns (capped at maxScaleMultiplier)
    const healthMultiplier = Math.min(
      ENEMY_SCALING.maxScaleMultiplier,
      1 + (wave - 1) * ENEMY_SCALING.healthPerWave
    );
    const damageMultiplier = Math.min(
      ENEMY_SCALING.maxScaleMultiplier,
      1 + (wave - 1) * ENEMY_SCALING.damagePerWave
    );
    const speedMultiplier = Math.min(
      1.5, // Lower cap for speed to keep game playable
      1 + (wave - 1) * ENEMY_SCALING.speedPerWave
    );

    this.health = Math.floor(config.health * healthMultiplier);
    this.maxHealth = this.health;
    this.damage = Math.floor(config.damage * damageMultiplier);
    this.speed = Math.floor(config.speed * speedMultiplier);
    this.points = config.points;

    if (type === 'shellback') {
      this.blockAngle = (config as typeof ENEMY_CONFIG.shellback).blockAngle;
    }

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(config.width, config.height);
    this.body.setOffset(-config.width / 2, -config.height / 2);

    // Swooper flies
    if (type === 'swooper') {
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
        this.updateShellback();
        break;
      case 'boss':
        this.updateBoss(time);
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

      // End dive if close or below target
      if (this.y > this.diveTarget.y + 50 ||
          Phaser.Math.Distance.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y) < 30) {
        this.isDiving = false;
        this.diveTarget = null;
      }
    } else {
      // Hover and prepare to dive
      const targetY = this.target!.y - 150;
      const targetX = this.target!.x + Math.sin(time / 500) * 100;

      // Move toward hover position
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      this.body.setVelocity(
        Phaser.Math.Clamp(dx * 2, -this.speed, this.speed),
        Phaser.Math.Clamp(dy * 2, -this.speed, this.speed)
      );

      // Start dive if above and close horizontally
      if (Math.abs(dx) < 50 && this.y < this.target!.y - 100) {
        this.isDiving = true;
        this.diveTarget = { x: this.target!.x, y: this.target!.y };
      }
    }
  }

  private updateShellback(): void {
    // Slow but steady approach
    const dir = this.target!.x > this.x ? 1 : -1;
    this.body.setVelocityX(dir * this.speed);
    this.tryJump();
  }

  private updateBoss(time: number): void {
    const config = ENEMY_CONFIG.boss;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y);

    // Update boss phase based on health
    const healthPercent = this.health / this.maxHealth;
    this.bossPhase = healthPercent > 0.5 ? 1 : 2;

    // Handle charging attack
    if (this.isCharging && this.chargeTarget) {
      const chargeAngle = Phaser.Math.Angle.Between(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);
      this.body.setVelocity(
        Math.cos(chargeAngle) * config.chargeSpeed,
        Math.sin(chargeAngle) * config.chargeSpeed
      );

      // End charge if reached target or too far
      const chargeDist = Phaser.Math.Distance.Between(this.x, this.y, this.chargeTarget.x, this.chargeTarget.y);
      if (chargeDist < 50 || this.body.blocked.left || this.body.blocked.right) {
        this.isCharging = false;
        this.chargeTarget = null;
      }
      return;
    }

    // Phase 2: More aggressive, faster attacks
    const preferredDist = this.bossPhase === 1 ? 200 : 150;

    // Try to jump to reach player on platforms
    if (this.body.blocked.down && this.target!.y < this.y - 60) {
      if (Math.random() < 0.03) {
        this.body.setVelocityY(-550);
      }
    }

    // Initiate charge attack when player is close and cooldown is up
    if (dist < 250 && time - this.lastChargeTime > config.chargeCooldown) {
      if (Math.random() < 0.02) {
        this.isCharging = true;
        this.chargeTarget = { x: this.target!.x, y: this.target!.y };
        this.lastChargeTime = time;
        return;
      }
    }

    // Normal movement
    if (dist < preferredDist - 30) {
      const dir = this.target!.x > this.x ? -1 : 1;
      this.body.setVelocityX(dir * this.speed);
    } else if (dist > preferredDist + 50) {
      const dir = this.target!.x > this.x ? 1 : -1;
      this.body.setVelocityX(dir * this.speed);
    } else {
      // Strafe side to side - faster in phase 2
      const strafeSpeed = this.bossPhase === 1 ? 300 : 200;
      this.body.setVelocityX(Math.sin(time / strafeSpeed) * this.speed * 1.2);
    }
  }

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
    }

    // Health bar
    this.drawHealthBar(w);
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

  private drawBoss(w: number, h: number, dir: number, color: number): void {
    // Visual effect when charging - red glow outline
    if (this.isCharging) {
      this.graphics.lineStyle(4, 0xff0000, 0.8);
      this.graphics.strokeEllipse(0, 0, w + 10, h + 10);
    }

    // Phase 2 indicator - darker, angrier color
    const bodyColor = this.bossPhase === 2 ? color - 0x220000 : color;

    // Huge menacing body
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 0, w, h);

    // Spiky protrusions - more in phase 2
    this.graphics.fillStyle(bodyColor - 0x220000);
    const spikeCount = this.bossPhase === 1 ? 5 : 7;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI - Math.PI / 2;
      const spikeX = Math.cos(angle) * w * 0.5;
      const spikeY = Math.sin(angle) * h * 0.5;
      const spikeLength = this.bossPhase === 1 ? 20 : 25;
      this.graphics.fillTriangle(
        spikeX, spikeY,
        spikeX + Math.cos(angle) * spikeLength, spikeY + Math.sin(angle) * spikeLength,
        spikeX + Math.cos(angle + 0.3) * (spikeLength * 0.75), spikeY + Math.sin(angle + 0.3) * (spikeLength * 0.75)
      );
    }

    // Armored head
    this.graphics.fillStyle(bodyColor + 0x111111);
    this.graphics.fillEllipse(w * 0.3 * dir, -h * 0.1, w * 0.4, h * 0.5);

    // Glowing eyes - brighter when charging or in phase 2
    const eyeColor = this.isCharging ? 0xff0000 : (this.bossPhase === 2 ? 0xff6600 : 0xffff00);
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

  private drawHealthBar(w: number): void {
    const barWidth = w;
    const barHeight = 4;
    const y = -30;

    // Background
    this.graphics.fillStyle(0x333333);
    this.graphics.fillRect(-barWidth / 2, y, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    this.graphics.fillStyle(healthColor);
    this.graphics.fillRect(-barWidth / 2, y, barWidth * healthPercent, barHeight);
  }

  takeDamage(amount: number, fromAngle?: number): boolean {
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

    this.health -= amount;
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
    if (this.enemyType !== 'spitter' && this.enemyType !== 'boss') return false;

    const config = this.enemyType === 'boss' ? ENEMY_CONFIG.boss : ENEMY_CONFIG.spitter;
    const now = this.scene.time.now;
    return now - this.lastFireTime >= config.fireRate * 1000;
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
    return 0;
  }

  isBoss(): boolean {
    return this.enemyType === 'boss';
  }

  isBossCharging(): boolean {
    return this.enemyType === 'boss' && this.isCharging;
  }

  getBossPhase(): number {
    return this.bossPhase;
  }

  // Boss fires multiple projectiles in phase 2
  getBurstCount(): number {
    if (this.enemyType !== 'boss') return 1;
    return this.bossPhase === 2 ? 3 : 1;
  }
}
