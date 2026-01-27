import Phaser from 'phaser';
import { PLAYER_CONFIG, COLORS, QUILL_CONFIG } from '../config';
import { QuillManager } from '../systems/QuillManager';
import { UpgradeManager } from '../systems/UpgradeManager';

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

    // Initial draw
    this.drawPorcupine();
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

  update(_time: number, _delta: number): void {
    this.handleMovement();
    this.drawPorcupine();
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
    const bodyColor = COLORS.player[state];
    const w = PLAYER_CONFIG.width;
    const h = PLAYER_CONFIG.height;

    // Direction multiplier for flipping
    const dir = this.facingRight ? 1 : -1;

    // Body (oval)
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 0, w, h * 0.8);

    // Draw quills based on state
    if (state !== 'naked') {
      this.drawQuills(state, dir);
    }

    // Face
    this.graphics.fillStyle(0x6b5344);
    this.graphics.fillEllipse(dir * 12, -5, w * 0.4, h * 0.4);

    // Eye
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 16, -8, 4);
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(dir * 17, -9, 1.5);

    // Nose
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 22, -3, 3);

    // Legs (simple rectangles)
    this.graphics.fillStyle(bodyColor);
    const legY = h * 0.3;
    this.graphics.fillRect(-10, legY, 8, 12);
    this.graphics.fillRect(2, legY, 8, 12);

    // Flash white when invincible
    if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
      this.graphics.fillStyle(0xffffff, 0.5);
      this.graphics.fillEllipse(0, 0, w, h * 0.8);
    }

    // Naked state indicator - exclamation mark
    if (state === 'naked') {
      this.graphics.fillStyle(0xff0000);
      this.graphics.fillRect(-3, -h * 0.8, 6, 15);
      this.graphics.fillCircle(0, -h * 0.8 + 22, 4);
    }
  }

  private drawQuills(state: QuillState, dir: number): void {
    this.graphics.lineStyle(2, 0xffffff);

    const quillCount = state === 'full' ? 9 : state === 'patchy' ? 6 : 4;
    const quillLength = state === 'full' ? 25 : state === 'patchy' ? 20 : 15;

    // Draw quills on the back pointing UP and away from facing direction
    for (let i = 0; i < quillCount; i++) {
      // Base angle points up (-90 deg), offset away from facing direction, spread across back
      const baseAngle = -90 + (-dir * 30); // Point up and slightly back
      const spread = (i - (quillCount - 1) / 2) * 15; // Spread quills across back
      const angle = (baseAngle + spread) * Math.PI / 180;

      const startX = -dir * 5 + Math.cos(angle) * 8;
      const startY = Math.sin(angle) * 8 - 5;
      const endX = -dir * 5 + Math.cos(angle) * (8 + quillLength);
      const endY = Math.sin(angle) * (8 + quillLength) - 5;

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

  takeDamage(amount: number): void {
    if (this.isInvincible) return;

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
