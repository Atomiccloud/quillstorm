import Phaser from 'phaser';
import { QUILL_CONFIG, COLORS, DISTANCE_DAMAGE_CONFIG, CRIT_CONFIG } from '../config';
import { ModifierSource } from '../systems/UpgradeManager';

export class Quill extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;
  private upgradeManager: ModifierSource;

  private lifetime: number;
  private dead: boolean = false;
  private quillAngle: number;
  private pierceCount: number;
  private bounceCount: number;
  private sizeMultiplier: number;
  private homingStrength: number;
  private enemiesGroup?: Phaser.GameObjects.Group;
  private quillColor: number;
  private tipColor: number;
  private rainbow: boolean;
  private rainbowColors: number[] = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
  private rainbowTimer: number = 0;
  private spawnX: number;
  private spawnY: number;
  private _homingFrameOffset: number = 0;
  private static _globalFrameCounter: number = 0;
  private static _nextQuillIndex: number = 0;

  public damage: number;
  public isEmpowered: boolean = false;

  get modifiers(): ModifierSource { return this.upgradeManager; }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    upgradeManager: ModifierSource,
    enemiesGroup?: Phaser.GameObjects.Group,
    quillColor?: number,
    tipColor?: number,
    rainbow?: boolean,
    empowered?: boolean
  ) {
    super(scene, x, y);

    this.spawnX = x;
    this.spawnY = y;
    this.upgradeManager = upgradeManager;
    this.isEmpowered = empowered ?? false;
    this.quillColor = quillColor ?? COLORS.quill;
    this.tipColor = tipColor ?? 0xcccccc;
    // Empowered quills get rainbow effect
    this.rainbow = (rainbow ?? false) || this.isEmpowered;
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

    // Stagger homing frame offset for performance
    this._homingFrameOffset = Quill._nextQuillIndex++;

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

    // Apply homing behavior (staggered — each quill updates every 3rd frame)
    if (this.homingStrength > 0 && this.enemiesGroup) {
      Quill._globalFrameCounter++;
      if ((Quill._globalFrameCounter + this._homingFrameOffset) % 3 === 0) {
        this.applyHoming();
      }
    }

    // Update rotation to match velocity
    this.quillAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
    this.rotation = this.quillAngle;

    // Rainbow color cycling
    if (this.rainbow) {
      this.rainbowTimer += delta;
      if (this.rainbowTimer >= 80) {
        this.rainbowTimer = 0;
        const idx = Math.floor(Math.random() * this.rainbowColors.length);
        this.quillColor = this.rainbowColors[idx];
        this.tipColor = this.rainbowColors[(idx + 1) % this.rainbowColors.length];
        this.draw();
      }
    }

    // Fade out near end of life
    if (this.lifetime < 500) {
      this.alpha = this.lifetime / 500;
    }
  }

  private applyHoming(): void {
    if (!this.enemiesGroup) return;

    // Find nearest enemy using squared distance (avoids sqrt)
    let nearestEnemy: Phaser.GameObjects.GameObject | null = null;
    let nearestDistSq = 90000; // 300^2 — homing range

    this.enemiesGroup.getChildren().forEach((enemy) => {
      const e = enemy as Phaser.GameObjects.Container;
      const dx = this.x - e.x;
      const dy = this.y - e.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
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
    this.graphics.fillStyle(this.quillColor);

    // Draw as a pointed needle shape
    this.graphics.beginPath();
    this.graphics.moveTo(w / 2, 0); // Tip
    this.graphics.lineTo(-w / 2, -h / 2); // Back top
    this.graphics.lineTo(-w / 3, 0); // Back indent
    this.graphics.lineTo(-w / 2, h / 2); // Back bottom
    this.graphics.closePath();
    this.graphics.fillPath();

    // Add a slight tip highlight
    this.graphics.fillStyle(this.tipColor);
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
    // Apply distance damage bonus before crit (so crit multiplies it)
    const distDamageMod = this.upgradeManager.getModifier('distanceDamage');
    if (distDamageMod > 0) {
      const dist = Phaser.Math.Distance.Between(this.spawnX, this.spawnY, this.x, this.y);
      const distRatio = Math.min(dist / DISTANCE_DAMAGE_CONFIG.maxDistance, 1.0);
      this.damage *= (1 + distDamageMod * distRatio * distRatio);
    }

    const rawCrit = CRIT_CONFIG.baseCritChance + this.upgradeManager.getModifier('critChance');
    const effectiveCrit = rawCrit / (rawCrit + 1);
    const isCrit = this.isEmpowered || Math.random() < effectiveCrit;

    if (isCrit) {
      const critMult = CRIT_CONFIG.baseMultiplier + this.upgradeManager.getModifier('critDamage');
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
