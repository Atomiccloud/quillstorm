import Phaser from 'phaser';
import { PINECONE_CONFIG } from '../config';
import { GraphicsSettings } from '../systems/GraphicsSettings';

export class Pinecone extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private graphics!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics; // May not be created at low quality
  public value: number;
  private despawnTime: number;
  private remainingDespawnTime: number;
  private warningStarted: boolean = false;
  private magnetTarget: Phaser.GameObjects.Container | null = null;
  private isMagneting: boolean = false;

  // Visual properties
  private baseWidth: number = 10;
  private baseHeight: number = 14;
  private pulsePhase: number = 0;
  private rotationAngle: number = 0;
  private _drawFrameCounter: number = 0;
  private _hasGlow: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number = 1) {
    super(scene, x, y);

    this.value = value;
    this.despawnTime = scene.time.now + PINECONE_CONFIG.despawnTime;
    this.remainingDespawnTime = PINECONE_CONFIG.despawnTime;

    // Random initial rotation
    this.rotationAngle = Math.random() * Math.PI * 2;

    // Create graphics (skip glow at low quality)
    this._hasGlow = GraphicsSettings.glowEffects;
    if (this._hasGlow) {
      this.glow = scene.add.graphics();
      this.add(this.glow);
    }

    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics
    this.body = this.body as Phaser.Physics.Arcade.Body;
    const size = Math.max(this.baseWidth, this.baseHeight) * 2;
    this.body.setSize(size, size);
    this.body.setOffset(-size / 2, -size / 2);
    this.body.setBounce(0.3);
    this.body.setDrag(80);
    this.body.setCollideWorldBounds(true);

    // Initial upward velocity with some randomness
    this.body.setVelocity(
      (Math.random() - 0.5) * 120,
      -180 - Math.random() * 80
    );

    // Initial draw
    this.draw();

    // Pause/resume: freeze despawn timer when scene is paused
    scene.events.on('pause', this.onPause, this);
    scene.events.on('resume', this.onResume, this);
  }

  private onPause(): void {
    this.remainingDespawnTime = Math.max(0, this.despawnTime - this.scene.time.now);
  }

  private onResume(): void {
    this.despawnTime = this.scene.time.now + this.remainingDespawnTime;
  }

  setMagnetTarget(target: Phaser.GameObjects.Container): void {
    this.magnetTarget = target;
  }

  update(time: number, _delta: number): void {
    if (!this.body) return;
    this.pulsePhase += 0.12;
    this.rotationAngle += 0.02; // Slow spin

    // Check for magnetic attraction
    if (this.magnetTarget && !this.isMagneting) {
      const dist = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.magnetTarget.x, this.magnetTarget.y
      );

      if (dist < PINECONE_CONFIG.magnetRange) {
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
      const speed = 350;
      this.body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }

    // Check despawn warning
    const timeLeft = this.despawnTime - time;
    if (timeLeft < PINECONE_CONFIG.warningTime && !this.warningStarted) {
      this.warningStarted = true;
      this.startDespawnWarning();
    }

    // Check despawn
    if (time >= this.despawnTime) {
      this.destroy();
      return;
    }

    this._drawFrameCounter++;

    // Low quality: no glow, no pulse — draw once at construction, skip updates
    if (!this._hasGlow && !GraphicsSettings.pulseEffects) return;

    // Medium quality: redraw every 3rd frame
    if (GraphicsSettings.getEffectiveQuality() === 'medium' && this._drawFrameCounter % 3 !== 0) return;

    this.draw();
  }

  private draw(): void {
    this.graphics.clear();

    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15;

    // Colors
    const baseColor = 0x8b4513; // Saddle brown
    const highlightColor = 0xcd853f; // Peru (lighter brown)
    const glowColor = 0xdaa520; // Goldenrod

    // Pulsing glow (if enabled)
    if (this._hasGlow) {
      this.glow.clear();
      const glowRadius = Math.max(this.baseWidth, this.baseHeight) * 1.5 * pulseScale;
      const glowAlpha = 0.25 + Math.sin(this.pulsePhase) * 0.1;
      this.glow.fillStyle(glowColor, glowAlpha);
      this.glow.fillCircle(0, 0, glowRadius);
    }

    // Draw pinecone shape (oval with scale-like pattern)
    const w = this.baseWidth * pulseScale;
    const h = this.baseHeight * pulseScale;

    // Main body (oval)
    this.graphics.fillStyle(baseColor, 1);
    this.graphics.fillEllipse(0, 0, w, h);

    // Scale pattern - overlapping arcs from bottom to top
    const numScales = 5;
    const scaleHeight = h / numScales;

    this.graphics.fillStyle(highlightColor, 0.8);
    for (let i = 0; i < numScales; i++) {
      const yOffset = (h / 2) - (i * scaleHeight) - scaleHeight / 2;
      const scaleWidth = w * (0.4 + (i * 0.12));

      // Draw small arc/triangle for each scale
      this.graphics.fillTriangle(
        -scaleWidth / 2, yOffset,
        scaleWidth / 2, yOffset,
        0, yOffset - scaleHeight * 0.6
      );
    }

    // Highlight at top
    this.graphics.fillStyle(0xffffff, 0.4);
    this.graphics.fillCircle(0, -h * 0.3, w * 0.15);

    // Stem at top
    this.graphics.fillStyle(0x654321, 1);
    this.graphics.fillRect(-2, -h / 2 - 4, 4, 5);
  }

  private startDespawnWarning(): void {
    // Flash warning before despawn
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        if (this.active) {
          this.destroy();
        }
      },
    });
  }

  getValue(): number {
    return this.value;
  }

  destroy(fromScene?: boolean): void {
    if (this.scene) {
      this.scene.events.off('pause', this.onPause, this);
      this.scene.events.off('resume', this.onResume, this);
    }
    super.destroy(fromScene);
  }
}
