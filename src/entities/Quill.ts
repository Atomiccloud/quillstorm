import Phaser from 'phaser';
import { QUILL_CONFIG, COLORS } from '../config';
import { UpgradeManager } from '../systems/UpgradeManager';

export class Quill extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;
  private upgradeManager: UpgradeManager;

  private lifetime: number;
  private dead: boolean = false;
  private quillAngle: number;
  private pierceCount: number;
  private bounceCount: number;
  private sizeMultiplier: number;
  private homingStrength: number;
  private enemiesGroup?: Phaser.GameObjects.Group;

  public damage: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    upgradeManager: UpgradeManager,
    enemiesGroup?: Phaser.GameObjects.Group
  ) {
    super(scene, x, y);

    this.upgradeManager = upgradeManager;
    this.quillAngle = angle;
    this.lifetime = QUILL_CONFIG.lifetime;

    // Calculate damage
    const baseDamage = QUILL_CONFIG.damage;
    const damageMult = 1 + this.upgradeManager.getModifier('damage');
    this.damage = baseDamage * damageMult;

    // Get pierce count from upgrades
    this.pierceCount = Math.floor(this.upgradeManager.getModifier('piercing'));

    // Get bounce count
    this.bounceCount = Math.floor(this.upgradeManager.getModifier('bouncing'));

    // Get size multiplier
    this.sizeMultiplier = 1 + this.upgradeManager.getModifier('projectileSize');

    // Get homing strength and enemies reference
    this.homingStrength = this.upgradeManager.getModifier('homingStrength');
    this.enemiesGroup = enemiesGroup;

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body (scaled by size multiplier)
    this.body = this.body as Phaser.Physics.Arcade.Body;
    const scaledWidth = QUILL_CONFIG.width * this.sizeMultiplier;
    const scaledHeight = QUILL_CONFIG.height * this.sizeMultiplier;
    this.body.setSize(scaledWidth, scaledHeight);
    this.body.setOffset(-scaledWidth / 2, -scaledHeight / 2);

    // Set velocity
    const speed = QUILL_CONFIG.speed * (1 + this.upgradeManager.getModifier('projectileSpeed'));
    this.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Disable gravity for quills
    this.body.setAllowGravity(false);

    // Enable bounce if upgraded
    if (this.bounceCount > 0) {
      this.body.setBounce(1, 1);
      this.body.setCollideWorldBounds(true);
      this.body.onWorldBounds = true;

      // Track bounces
      scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
        if (body.gameObject === this) {
          this.handleBounce();
        }
      });
    }

    // Create graphics
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.draw();
  }

  update(_time: number, delta: number): void {
    // Update lifetime
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.dead = true;
      return;
    }

    // Apply homing behavior
    if (this.homingStrength > 0 && this.enemiesGroup) {
      this.applyHoming();
    }

    // Update rotation to match velocity
    this.quillAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
    this.rotation = this.quillAngle;

    // Fade out near end of life
    if (this.lifetime < 500) {
      this.alpha = this.lifetime / 500;
    }
  }

  private applyHoming(): void {
    if (!this.enemiesGroup) return;

    // Find nearest enemy
    let nearestEnemy: Phaser.GameObjects.GameObject | null = null;
    let nearestDist = Infinity;

    this.enemiesGroup.getChildren().forEach((enemy) => {
      const e = enemy as Phaser.GameObjects.Container;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (dist < nearestDist && dist < 300) { // Only home within range
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });

    if (nearestEnemy) {
      const target = nearestEnemy as Phaser.GameObjects.Container;
      const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
      const currentAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);

      // Calculate angle difference and turn toward target
      let angleDiff = targetAngle - currentAngle;

      // Normalize angle difference to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Apply homing - turn toward target based on strength
      const turnAmount = angleDiff * this.homingStrength * 0.1;
      const newAngle = currentAngle + turnAmount;

      // Maintain current speed
      const currentSpeed = Math.sqrt(
        this.body.velocity.x * this.body.velocity.x +
        this.body.velocity.y * this.body.velocity.y
      );

      this.body.setVelocity(
        Math.cos(newAngle) * currentSpeed,
        Math.sin(newAngle) * currentSpeed
      );
    }
  }

  private draw(): void {
    this.graphics.clear();

    // Apply size multiplier to visuals
    const w = QUILL_CONFIG.width * this.sizeMultiplier;
    const h = QUILL_CONFIG.height * this.sizeMultiplier;

    // Quill body (pointed shape)
    this.graphics.fillStyle(COLORS.quill);

    // Draw as a pointed needle shape
    this.graphics.beginPath();
    this.graphics.moveTo(w / 2, 0); // Tip
    this.graphics.lineTo(-w / 2, -h / 2); // Back top
    this.graphics.lineTo(-w / 3, 0); // Back indent
    this.graphics.lineTo(-w / 2, h / 2); // Back bottom
    this.graphics.closePath();
    this.graphics.fillPath();

    // Add a slight dark tip
    this.graphics.fillStyle(0xcccccc);
    this.graphics.fillTriangle(
      w / 2, 0,
      w / 4, -h / 4,
      w / 4, h / 4
    );
  }

  handleBounce(): void {
    this.bounceCount--;
    if (this.bounceCount < 0) {
      this.dead = true;
    }
  }

  onHitEnemy(): boolean {
    // Check for crit
    const critChance = this.upgradeManager.getModifier('critChance');
    const isCrit = Math.random() < critChance;

    if (isCrit) {
      const critMult = 2 + this.upgradeManager.getModifier('critDamage');
      this.damage *= critMult;
    }

    // Handle piercing
    if (this.pierceCount > 0) {
      this.pierceCount--;
      return false; // Don't destroy
    }

    this.dead = true;
    return true;
  }

  isDead(): boolean {
    return this.dead;
  }

  getDamage(): number {
    return this.damage;
  }
}
