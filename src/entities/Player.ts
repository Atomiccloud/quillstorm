import Phaser from 'phaser';
import { PLAYER_CONFIG, COLORS, QUILL_CONFIG } from '../config';
import { QuillManager } from '../systems/QuillManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { AudioManager } from '../systems/AudioManager';
import { getCosmeticManager } from '../systems/CosmeticManager';
import { Cosmetic } from '../data/cosmetics';

export type QuillState = 'full' | 'patchy' | 'sparse' | 'naked';

export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;
  private graphics!: Phaser.GameObjects.Graphics;
  private quillManager: QuillManager;
  private upgradeManager: UpgradeManager;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  public health: number = PLAYER_CONFIG.maxHealth;
  public maxHealth: number = PLAYER_CONFIG.maxHealth;
  private isInvincible: boolean = false;
  private facingRight: boolean = true;
  private shieldCharges: number = 0;

  // Cosmetic cache
  private equippedSkin: Cosmetic | undefined;
  private equippedHat: Cosmetic | undefined;
  private equippedTrail: Cosmetic | undefined;
  private lastTrailTime: number = 0;
  private trailInterval: number = 50; // ms between trail particles

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    quillManager: QuillManager,
    upgradeManager: UpgradeManager
  ) {
    super(scene, x, y);

    this.quillManager = quillManager;
    this.upgradeManager = upgradeManager;

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up physics body
    this.body = this.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(PLAYER_CONFIG.width, PLAYER_CONFIG.height);
    this.body.setOffset(-PLAYER_CONFIG.width / 2, -PLAYER_CONFIG.height / 2);
    this.body.setCollideWorldBounds(true);

    // Create graphics for the porcupine
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    // Set up input
    this.setupInput();

    // Load cosmetics
    this.loadCosmetics();

    // Initial draw
    this.drawPorcupine();
  }

  private loadCosmetics(): void {
    const manager = getCosmeticManager();
    this.equippedSkin = manager.getEquipped('skin');
    this.equippedHat = manager.getEquipped('hat');
    this.equippedTrail = manager.getEquipped('trail');
  }

  private setupInput(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(time: number, _delta: number): void {
    this.handleMovement();
    this.drawPorcupine();
    this.updateTrail(time);
  }

  private updateTrail(time: number): void {
    if (!this.equippedTrail || this.equippedTrail.id === 'trail_none') return;

    // Only spawn trail when moving
    const isMoving = Math.abs(this.body.velocity.x) > 20 || Math.abs(this.body.velocity.y) > 20;
    if (!isMoving) return;

    if (time - this.lastTrailTime > this.trailInterval) {
      this.lastTrailTime = time;
      this.spawnTrailParticle();
    }
  }

  private spawnTrailParticle(): void {
    const trail = this.equippedTrail;
    if (!trail?.colors) return;

    const color = trail.colors.primary;
    const secondaryColor = trail.colors.secondary || color;

    // Create particle at current position (slightly behind)
    const offsetX = this.facingRight ? -10 : 10;
    const particle = this.scene.add.circle(
      this.x + offsetX + (Math.random() - 0.5) * 10,
      this.y + (Math.random() - 0.5) * 15,
      3 + Math.random() * 3,
      Math.random() > 0.5 ? color : secondaryColor,
      0.7
    );

    // Animate and destroy
    this.scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0.3,
      y: particle.y + 20,
      duration: 400 + Math.random() * 200,
      onComplete: () => particle.destroy(),
    });
  }

  private handleMovement(): void {
    const state = this.getQuillState();
    const stateConfig = QUILL_CONFIG.states[state];
    const speedMult = stateConfig.speedMult * (1 + this.upgradeManager.getModifier('moveSpeed'));
    const baseSpeed = PLAYER_CONFIG.moveSpeed * speedMult;

    // Check if in air for air control
    const isInAir = !this.body.blocked.down;
    const controlMult = isInAir ? PLAYER_CONFIG.airControl : 1;

    // Horizontal movement
    const leftPressed = this.cursors.left.isDown || this.wasd.A.isDown;
    const rightPressed = this.cursors.right.isDown || this.wasd.D.isDown;

    if (leftPressed) {
      this.body.setVelocityX(-baseSpeed * controlMult);
      this.facingRight = false;
    } else if (rightPressed) {
      this.body.setVelocityX(baseSpeed * controlMult);
      this.facingRight = true;
    } else {
      // Decelerate
      if (isInAir) {
        this.body.setVelocityX(this.body.velocity.x * 0.98);
      } else {
        this.body.setVelocityX(this.body.velocity.x * 0.8);
      }
    }

    // Jumping
    const jumpPressed = this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space.isDown;
    if (jumpPressed && this.body.blocked.down) {
      const jumpMult = 1 + this.upgradeManager.getModifier('jumpHeight');
      this.body.setVelocityY(PLAYER_CONFIG.jumpForce * jumpMult);
      AudioManager.playJump();
    }
  }

  getQuillState(): QuillState {
    const percent = this.quillManager.currentQuills / this.quillManager.maxQuills;

    if (percent >= QUILL_CONFIG.states.full.min) return 'full';
    if (percent >= QUILL_CONFIG.states.patchy.min) return 'patchy';
    if (percent >= QUILL_CONFIG.states.sparse.min) return 'sparse';
    return 'naked';
  }

  private drawPorcupine(): void {
    this.graphics.clear();

    const state = this.getQuillState();

    // Get body color from skin cosmetic or default
    let bodyColor = COLORS.player[state];
    let faceColor = 0x6b5344;

    if (this.equippedSkin?.colors && state !== 'naked') {
      bodyColor = this.equippedSkin.colors.primary;
      faceColor = this.equippedSkin.colors.secondary || 0x6b5344;
    }

    const w = PLAYER_CONFIG.width;
    const h = PLAYER_CONFIG.height;

    // Direction multiplier for flipping
    const dir = this.facingRight ? 1 : -1;

    // Draw glow effect for special skins
    if (this.equippedSkin?.colors?.glow && state !== 'naked') {
      this.graphics.fillStyle(this.equippedSkin.colors.glow, 0.2);
      this.graphics.fillEllipse(0, 2, w * 1.5, h * 1.0);
    }

    // Draw quills first (behind body)
    if (state !== 'naked') {
      this.drawQuills(state, dir);
    }

    // Main body (larger oval, matching menu porcupine)
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 2, w * 1.1, h * 0.7);

    // Face/snout (lighter color, extends forward)
    this.graphics.fillStyle(faceColor);
    this.graphics.fillEllipse(dir * 15, 0, w * 0.45, h * 0.45);

    // Eye
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 18, -4, 5);
    // Eye highlight
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(dir * 19, -5, 2);

    // Nose
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 26, 2, 4);

    // Legs (front and back)
    this.graphics.fillStyle(bodyColor);
    const legY = h * 0.25;
    // Back leg
    this.graphics.fillRect(-dir * 12, legY, 10, 15);
    // Front leg
    this.graphics.fillRect(dir * 2, legY, 10, 15);

    // Draw hat
    this.drawHat(dir, w, h);

    // Flash white when invincible
    if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      this.graphics.fillStyle(0xffffff, 0.5);
      this.graphics.fillEllipse(0, 2, w * 1.1, h * 0.7);
    }

    // Naked state indicator - exclamation mark above head
    if (state === 'naked') {
      this.graphics.fillStyle(0xff0000);
      this.graphics.fillRect(-3, -h * 0.7, 6, 12);
      this.graphics.fillCircle(0, -h * 0.7 + 18, 4);
    }
  }

  private drawHat(_dir: number, _w: number, h: number): void {
    if (!this.equippedHat || this.equippedHat.id === 'hat_none') return;

    const hat = this.equippedHat;
    const colors = hat.colors || { primary: 0x888888 };
    const hatY = -h * 0.5; // Above head

    switch (hat.id) {
      case 'hat_crown':
        // Crown base
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillRect(-10, hatY, 20, 10);
        // Crown points
        this.graphics.fillTriangle(-10, hatY, -5, hatY, -7.5, hatY - 10);
        this.graphics.fillTriangle(-2, hatY, 2, hatY, 0, hatY - 14);
        this.graphics.fillTriangle(5, hatY, 10, hatY, 7.5, hatY - 10);
        // Gem
        this.graphics.fillStyle(colors.secondary || 0xff4444);
        this.graphics.fillCircle(0, hatY + 4, 3);
        break;

      case 'hat_wizard':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillTriangle(-12, hatY + 8, 12, hatY + 8, 0, hatY - 18);
        // Star decoration
        this.graphics.fillStyle(colors.secondary || 0xffdd44);
        this.graphics.fillCircle(0, hatY - 2, 3);
        break;

      case 'hat_viking':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillEllipse(0, hatY + 5, 24, 12);
        // Horns
        this.graphics.fillStyle(colors.secondary || 0xcccc99);
        this.graphics.fillTriangle(-14, hatY + 5, -10, hatY + 5, -18, hatY - 12);
        this.graphics.fillTriangle(14, hatY + 5, 10, hatY + 5, 18, hatY - 12);
        break;

      case 'hat_party':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillTriangle(-8, hatY + 6, 8, hatY + 6, 0, hatY - 14);
        // Pom pom
        this.graphics.fillStyle(colors.secondary || 0x44ffaa);
        this.graphics.fillCircle(0, hatY - 14, 4);
        break;

      case 'hat_chef':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillEllipse(0, hatY - 4, 22, 14);
        this.graphics.fillRect(-12, hatY + 2, 24, 8);
        break;

      case 'hat_halo':
        // Glowing halo effect
        if (colors.glow) {
          this.graphics.lineStyle(6, colors.glow, 0.3);
          this.graphics.strokeEllipse(0, hatY - 8, 24, 8);
        }
        this.graphics.lineStyle(3, colors.primary);
        this.graphics.strokeEllipse(0, hatY - 8, 22, 7);
        break;
    }
  }

  private drawQuills(state: QuillState, dir: number): void {
    const quillCount = state === 'full' ? 9 : state === 'patchy' ? 6 : 4;
    const quillLength = state === 'full' ? 30 : state === 'patchy' ? 25 : 18;

    // Quill style - thicker lines for better visibility
    this.graphics.lineStyle(3, 0xffffff);

    // Draw quills radiating from the back (like the menu porcupine)
    for (let i = 0; i < quillCount; i++) {
      // Quills point up and back, spread in a fan pattern
      const baseAngle = -90 - (dir * 20); // Point up and away from face
      const spread = (i - (quillCount - 1) / 2) * 18; // Fan spread
      const angle = (baseAngle + spread) * Math.PI / 180;

      // Start from the back of the body
      const startX = -dir * 8;
      const startY = -5;
      const endX = startX + Math.cos(angle) * quillLength;
      const endY = startY + Math.sin(angle) * quillLength;

      this.graphics.beginPath();
      this.graphics.moveTo(startX, startY);
      this.graphics.lineTo(endX, endY);
      this.graphics.strokePath();
    }
  }

  shoot(targetX: number, targetY: number): boolean {
    const state = this.getQuillState();
    if (state === 'naked') return false;

    return this.quillManager.shoot(this.x, this.y, targetX, targetY);
  }

  takeDamage(amount: number): boolean {
    if (this.isInvincible) return false;

    // Check shields first
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.spawnShieldBreakEffect();
      // Brief invincibility after shield break
      this.isInvincible = true;
      this.scene.time.delayedCall(500, () => {
        this.isInvincible = false;
      });
      return false; // No damage taken
    }

    const state = this.getQuillState();
    const damageMult = QUILL_CONFIG.states[state].takeDamageMult;
    const actualDamage = amount * damageMult;

    this.health -= actualDamage;
    this.health = Math.max(0, this.health);

    // Invincibility frames
    this.isInvincible = true;
    this.scene.time.delayedCall(PLAYER_CONFIG.invincibilityTime, () => {
      this.isInvincible = false;
    });

    // Knockback
    const knockbackDir = this.facingRight ? -1 : 1;
    this.body.setVelocityX(knockbackDir * 200);
    this.body.setVelocityY(-150);

    return true;
  }

  private spawnShieldBreakEffect(): void {
    // Visual feedback when shield absorbs a hit
    const shield = this.scene.add.circle(this.x, this.y, 40, 0x00aaff, 0.6);
    this.scene.tweens.add({
      targets: shield,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => shield.destroy(),
    });
  }

  resetShieldsForWave(): void {
    this.shieldCharges = this.upgradeManager.getModifier('shieldCharges');
  }

  getShieldCharges(): number {
    return this.shieldCharges;
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  getAimAngle(): number {
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
  }

  isDead(): boolean {
    return this.health <= 0;
  }
}
