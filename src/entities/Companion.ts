import Phaser from 'phaser';
import { COLORS } from '../config';

export class Companion extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;
  private target: Phaser.GameObjects.Container;
  private offsetIndex: number;

  private shootCooldown: number = 0;
  private readonly SHOOT_INTERVAL = 2000; // 2 seconds between shots
  private readonly FOLLOW_DISTANCE = 50;
  private readonly FOLLOW_SPEED = 180;
  private facingRight: boolean = true;

  // Callback for when companion wants to shoot
  public onShoot?: (x: number, y: number, targetX: number, targetY: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Phaser.GameObjects.Container,
    offsetIndex: number
  ) {
    super(scene, x, y);

    this.target = target;
    this.offsetIndex = offsetIndex;

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(20, 16);
    this.body.setOffset(-10, -8);
    this.body.setAllowGravity(false);

    // Create graphics
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.draw();
  }

  update(_time: number, delta: number, enemies: Phaser.GameObjects.Group): void {
    this.followPlayer();
    this.updateShooting(delta, enemies);
    this.draw();
  }

  private followPlayer(): void {
    // Calculate target position offset from player
    // Multiple companions spread out in a formation
    const angleOffset = (this.offsetIndex * 0.8) - 0.4; // Spread companions
    const offsetX = Math.cos(Math.PI + angleOffset) * this.FOLLOW_DISTANCE;
    const offsetY = Math.sin(Math.PI + angleOffset) * this.FOLLOW_DISTANCE - 20; // Slightly above

    const targetX = this.target.x + offsetX;
    const targetY = this.target.y + offsetY;

    // Move toward target position
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      const speed = Math.min(this.FOLLOW_SPEED, dist * 5); // Smooth follow
      this.body.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed
      );
    } else {
      this.body.setVelocity(0, 0);
    }

    // Face the same direction as movement
    if (Math.abs(dx) > 5) {
      this.facingRight = dx > 0;
    }
  }

  private updateShooting(delta: number, enemies: Phaser.GameObjects.Group): void {
    this.shootCooldown -= delta;

    if (this.shootCooldown <= 0) {
      // Find nearest enemy
      let nearestEnemy: Phaser.GameObjects.GameObject | null = null;
      let nearestDist = Infinity;

      enemies.getChildren().forEach((enemy) => {
        const e = enemy as Phaser.GameObjects.Container;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (dist < nearestDist && dist < 800) { // Target enemies within 800px (most of screen)
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (nearestEnemy && this.onShoot) {
        const e = nearestEnemy as Phaser.GameObjects.Container;
        this.onShoot(this.x, this.y, e.x, e.y);
        this.shootCooldown = this.SHOOT_INTERVAL;

        // Face the enemy when shooting
        this.facingRight = e.x > this.x;
      }
    }
  }

  private draw(): void {
    this.graphics.clear();

    const dir = this.facingRight ? 1 : -1;

    // Mini porcupine body (smaller, cuter version)
    const bodyColor = COLORS.player.full;

    // Draw quills (small)
    this.graphics.lineStyle(2, 0xffffff);
    for (let i = 0; i < 5; i++) {
      const baseAngle = -90 - (dir * 20);
      const spread = (i - 2) * 20;
      const angle = (baseAngle + spread) * Math.PI / 180;

      const startX = -dir * 4;
      const startY = -3;
      const endX = startX + Math.cos(angle) * 12;
      const endY = startY + Math.sin(angle) * 12;

      this.graphics.beginPath();
      this.graphics.moveTo(startX, startY);
      this.graphics.lineTo(endX, endY);
      this.graphics.strokePath();
    }

    // Main body (small oval)
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 1, 18, 12);

    // Face/snout
    this.graphics.fillStyle(0x6b5344);
    this.graphics.fillEllipse(dir * 6, 0, 8, 8);

    // Eye
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 7, -2, 2.5);
    // Eye highlight
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(dir * 7.5, -2.5, 1);

    // Nose
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 11, 1, 2);

    // Tiny legs
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillRect(-dir * 4, 5, 4, 6);
    this.graphics.fillRect(dir * 1, 5, 4, 6);
  }
}
