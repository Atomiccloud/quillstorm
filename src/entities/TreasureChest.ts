import Phaser from 'phaser';
import { CHEST_CONFIG, COLORS } from '../config';

export class TreasureChest extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private graphics!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;
  private despawnTime: number;
  private warningStarted: boolean = false;
  private collected: boolean = false;

  // Visual properties
  private pulsePhase: number = 0;
  private readonly chestWidth = CHEST_CONFIG.width;
  private readonly chestHeight = CHEST_CONFIG.height;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.despawnTime = scene.time.now + CHEST_CONFIG.despawnTime;

    // Create glow behind chest
    this.glow = scene.add.graphics();
    this.add(this.glow);

    // Create chest graphics
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // Add to scene and physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(this.chestWidth, this.chestHeight);
    this.body.setOffset(-this.chestWidth / 2, -this.chestHeight / 2);
    this.body.setBounce(0.3);

    // Initial upward velocity
    this.body.setVelocity(
      (Math.random() - 0.5) * 80,
      -180
    );

    // Initial draw
    this.draw();

    // Start bobbing animation after landing
    scene.time.delayedCall(800, () => {
      if (this.active && !this.collected) {
        this.startBobbing();
      }
    });
  }

  private startBobbing(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(time: number, _delta: number): void {
    if (this.collected) return;

    this.pulsePhase += 0.1;

    // Check despawn warning
    const timeLeft = this.despawnTime - time;
    if (timeLeft < CHEST_CONFIG.despawnTime - CHEST_CONFIG.warningTime && !this.warningStarted) {
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

    const w = this.chestWidth;
    const h = this.chestHeight;

    // Pulsing golden glow
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15;
    const glowSize = Math.max(w, h) * 1.5 * pulseScale;
    const glowAlpha = 0.35 + Math.sin(this.pulsePhase) * 0.1;

    this.glow.fillStyle(COLORS.chest, glowAlpha);
    this.glow.fillCircle(0, 0, glowSize / 2);

    // Chest base (dark gold)
    this.graphics.fillStyle(0xb8860b);
    this.graphics.fillRect(-w / 2, -h / 4, w, h * 0.75);

    // Chest lid (bright gold)
    this.graphics.fillStyle(COLORS.chest);
    this.graphics.fillRect(-w / 2, -h / 2, w, h / 4);

    // Lid curve
    this.graphics.fillStyle(COLORS.chest);
    this.graphics.fillEllipse(0, -h / 2, w, h / 4);

    // Metal trim lines
    this.graphics.fillStyle(0x8b6914);
    this.graphics.fillRect(-w / 2, -h / 4 - 2, w, 4);

    // Lock/clasp (centered)
    this.graphics.fillStyle(0x8b6914);
    this.graphics.fillRect(-4, -h / 4 - 2, 8, 10);
    this.graphics.fillStyle(0xffd700);
    this.graphics.fillCircle(0, -h / 4 + 3, 3);

    // Highlight on lid
    this.graphics.fillStyle(0xffec8b, 0.6);
    this.graphics.fillRect(-w / 2 + 4, -h / 2 + 2, w - 8, 3);

    // Corner accents
    this.graphics.fillStyle(COLORS.chest);
    this.graphics.fillRect(-w / 2, -h / 4, 4, h * 0.75);
    this.graphics.fillRect(w / 2 - 4, -h / 4, 4, h * 0.75);
  }

  private startDespawnWarning(): void {
    // Flash warning before despawn
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 200,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        if (this.active && !this.collected) {
          this.destroy();
        }
      },
    });
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;

    // Stop any tweens
    this.scene.tweens.killTweensOf(this);

    // Collection particle burst
    this.spawnCollectParticles();

    // Destroy after brief delay for particles
    this.scene.time.delayedCall(50, () => {
      this.destroy();
    });
  }

  private spawnCollectParticles(): void {
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const particle = this.scene.add.graphics();
      particle.setPosition(this.x, this.y);

      // Gold sparkle
      particle.fillStyle(COLORS.chest, 1);
      particle.fillCircle(0, 0, 4);
      particle.fillStyle(0xffffff, 0.8);
      particle.fillCircle(-1, -1, 2);

      // Burst outward
      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * 60,
        y: this.y + Math.sin(angle) * 60 - 20,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  isCollected(): boolean {
    return this.collected;
  }
}
