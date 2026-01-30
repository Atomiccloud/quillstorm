import Phaser from 'phaser';
import { XP_CONFIG, COLORS } from '../config';

export class XPOrb extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private graphics!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;
  public xpValue: number;
  private despawnTime: number;
  private warningStarted: boolean = false;
  private magnetTarget: Phaser.GameObjects.Container | null = null;
  private isMagneting: boolean = false;

  // Visual properties
  private baseRadius: number = 6;
  private pulsePhase: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, xpValue: number) {
    super(scene, x, y);

    this.xpValue = xpValue;
    this.despawnTime = scene.time.now + XP_CONFIG.xpOrbDespawnTime;

    // Create graphics
    this.glow = scene.add.graphics();
    this.add(this.glow);

    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics
    this.body = this.body as Phaser.Physics.Arcade.Body;
    const size = this.baseRadius * 3;
    this.body.setSize(size, size);
    this.body.setOffset(-size / 2, -size / 2);
    this.body.setBounce(0.4);
    this.body.setDrag(50);

    // Initial upward velocity with some randomness
    this.body.setVelocity(
      (Math.random() - 0.5) * 100,
      -150 - Math.random() * 100
    );

    // Initial draw
    this.draw();
  }

  setMagnetTarget(target: Phaser.GameObjects.Container): void {
    this.magnetTarget = target;
  }

  update(time: number, _delta: number): void {
    this.pulsePhase += 0.15;

    // Check for magnetic attraction
    if (this.magnetTarget && !this.isMagneting) {
      const dist = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.magnetTarget.x, this.magnetTarget.y
      );

      if (dist < XP_CONFIG.xpOrbMagnetRange) {
        this.isMagneting = true;
        this.body.setAllowGravity(false);
      }
    }

    // Move toward player when magneting
    if (this.isMagneting && this.magnetTarget) {
      const angle = Phaser.Math.Angle.Between(
        this.x, this.y,
        this.magnetTarget.x, this.magnetTarget.y
      );
      const speed = 400;
      this.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }

    // Check despawn warning
    const timeLeft = this.despawnTime - time;
    if (timeLeft < 3000 && !this.warningStarted) {
      this.warningStarted = true;
      this.startDespawnWarning();
    }

    // Check despawn
    if (time >= this.despawnTime) {
      this.destroy();
      return;
    }

    this.draw();
  }

  private draw(): void {
    this.graphics.clear();
    this.glow.clear();

    // Color based on XP value (cyan for low, gold for high)
    const highValueThreshold = 20;
    const t = Math.min(1, this.xpValue / highValueThreshold);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(COLORS.xpOrb),
      Phaser.Display.Color.ValueToColor(COLORS.xpOrbHigh),
      100,
      Math.floor(t * 100)
    );
    const orbColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

    // Pulsing glow
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.2;
    const glowRadius = this.baseRadius * 2 * pulseScale;
    const glowAlpha = 0.3 + Math.sin(this.pulsePhase) * 0.1;

    this.glow.fillStyle(orbColor, glowAlpha);
    this.glow.fillCircle(0, 0, glowRadius);

    // Main orb
    this.graphics.fillStyle(orbColor, 1);
    this.graphics.fillCircle(0, 0, this.baseRadius);

    // Highlight
    this.graphics.fillStyle(0xffffff, 0.6);
    this.graphics.fillCircle(-2, -2, this.baseRadius * 0.4);
  }

  private startDespawnWarning(): void {
    // Flash warning before despawn
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        if (this.active) {
          this.destroy();
        }
      },
    });
  }

  getXPValue(): number {
    return this.xpValue;
  }
}
