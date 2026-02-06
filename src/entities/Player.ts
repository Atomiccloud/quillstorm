import Phaser from 'phaser';
import { PLAYER_CONFIG, COLORS, QUILL_CONFIG, INFINITE_SWARM_CONFIG, ARMOR_CONFIG, EVASION_CONFIG, SHIELD_CONFIG } from '../config';
import { QuillManager } from '../systems/QuillManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
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
  private _pf: boolean = false;
  public _lastDodged: boolean = false;

  // Performance frame counters
  private _fd: number = 0;
  private _fc: number = 0;
  private _bs: number = 0;
  private facingRight: boolean = true;
  private shieldCharges: number = 0;
  private shieldPulsePhase: number = 0;
  private shieldRegenTimer: number = 0;
  private infiniteSwarmShieldRegen: boolean = false;
  private lastShieldBreakTime: number = 0;
  private currentShieldIframe: number = SHIELD_CONFIG.baseShieldIframe;

  // Cosmetic cache
  private equippedSkin: Cosmetic | undefined;
  private equippedHat: Cosmetic | undefined;
  private equippedTrail: Cosmetic | undefined;
  private lastTrailTime: number = 0;
  private trailInterval: number = 50; // ms between trail particles

  // Coyote time tracking
  private coyoteTimer: number = 0;
  private _jumping: boolean = false;

  // Animation state
  private walkTimer: number = 0;
  private landSquash: number = 0;
  private wasInAir: boolean = false;

  // Low health warning effect
  private lowHealthAlpha: number = 0;
  private lowHealthTween: Phaser.Tweens.Tween | null = null;

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

  update(time: number, delta: number): void {
    this.handleMovement(delta);
    this.updateLowHealthEffect();
    this.updateShieldRegen(delta);
    if (this.shieldCharges > 0) {
      this.shieldPulsePhase += delta * 0.003;
    }
    this.drawPorcupine();
    this.updateTrail(time);
  }

  private updateLowHealthEffect(): void {
    const healthPercent = this.health / this.maxHealth;
    const isLowHealth = healthPercent <= 0.2 && healthPercent > 0;

    if (isLowHealth && !this.lowHealthTween) {
      // Start pulsing red effect
      this.lowHealthTween = this.scene.tweens.add({
        targets: this,
        lowHealthAlpha: 0.4,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (!isLowHealth && this.lowHealthTween) {
      // Stop pulsing effect
      this.lowHealthTween.stop();
      this.lowHealthTween = null;
      this.lowHealthAlpha = 0;
    }
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

  private handleMovement(delta: number): void {
    const state = this.getQuillState();
    const stateConfig = QUILL_CONFIG.states[state];
    const speedMult = stateConfig.speedMult * (1 + this.upgradeManager.getModifier('moveSpeed'));
    // Apply speed cap to prevent uncontrollable gameplay
    const baseSpeed = Math.min(PLAYER_CONFIG.moveSpeed * speedMult, PLAYER_CONFIG.maxSpeed);

    // Check if in air for air control
    const onGround = this.body.blocked.down;
    const isInAir = !onGround;
    const controlMult = isInAir ? PLAYER_CONFIG.airControl : 1;

    // Coyote time: allow jumping briefly after walking off a ledge
    if (onGround) {
      this.coyoteTimer = PLAYER_CONFIG.coyoteTime;
    } else {
      this.coyoteTimer -= delta;
    }

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

    // Walk cycle animation timer
    const speed = Math.abs(this.body.velocity.x);
    if (onGround && speed > 20) {
      this.walkTimer += delta * speed * 0.015;
    } else {
      this.walkTimer = 0;
    }

    // Landing squash detection
    if (onGround && this.wasInAir) {
      this.landSquash = 1;
    }
    this.wasInAir = isInAir;
    if (this.landSquash > 0) {
      this.landSquash = Math.max(0, this.landSquash - delta * 0.006);
    }

    // Jumping (with coyote time + variable height)
    const jumpPressed = this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space.isDown;
    const canJump = onGround || this.coyoteTimer > 0;
    if (jumpPressed && canJump && !this._jumping) {
      const jumpMult = 1 + this.upgradeManager.getModifier('jumpHeight');
      this.body.setVelocityY(PLAYER_CONFIG.jumpForce * jumpMult);
      this.coyoteTimer = 0; // Consume coyote time
      this._jumping = true;
      AudioManager.playJump();
    }

    // Jump cut: release key early to reduce jump height
    if (!jumpPressed && this._jumping && this.body.velocity.y < 0) {
      this.body.setVelocityY(this.body.velocity.y * PLAYER_CONFIG.jumpCutMultiplier);
      this._jumping = false;
    }

    // Reset jump state on landing
    if (onGround) {
      this._jumping = false;
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

    // Animation values
    const walkPhase = Math.sin(this.walkTimer);
    const bodyBob = Math.abs(walkPhase) * 2;
    const squashX = 1 + this.landSquash * 0.15;
    const squashY = 1 - this.landSquash * 0.15;

    // Draw glow effect for special skins
    if (this.equippedSkin?.colors?.glow && state !== 'naked') {
      this.graphics.fillStyle(this.equippedSkin.colors.glow, 0.2);
      this.graphics.fillEllipse(0, 2, w * 1.7, h * 1.0);
    }

    // Draw quills (behind body)
    if (state !== 'naked') {
      this.drawQuills(state, dir);
    }

    // Legs (drawn before body so the body covers their top)
    this.graphics.fillStyle(bodyColor);
    const legTop = h * 0.05; // Start inside the body so they never detach
    const legHeight = 22; // Tall enough to extend below body
    const legAnim = walkPhase * 4;
    // Back leg (behind body center)
    this.graphics.fillRect(-dir * 14 - 5, legTop + legAnim, 10, legHeight);
    // Front leg (in front of body center)
    this.graphics.fillRect(dir * 8 - 5, legTop - legAnim, 10, legHeight);

    // Main body (slightly wider oval, drawn over leg tops)
    this.graphics.fillStyle(bodyColor);
    this.graphics.fillEllipse(0, 2 - bodyBob, w * 1.35 * squashX, h * 0.7 * squashY);

    // Face/snout (lighter color, extends forward)
    this.graphics.fillStyle(faceColor);
    this.graphics.fillEllipse(dir * 16, 0 - bodyBob, w * 0.45 * squashX, h * 0.45 * squashY);

    // Eye
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 19, -4 - bodyBob, 5);
    // Eye highlight
    this.graphics.fillStyle(0xffffff);
    this.graphics.fillCircle(dir * 20, -5 - bodyBob, 2);

    // Nose
    this.graphics.fillStyle(0x000000);
    this.graphics.fillCircle(dir * 27, 2 - bodyBob, 4);

    // Draw hat
    this.drawHat(dir, w, h, bodyBob);

    // Draw shield indicator above head
    this.drawShieldIndicator();

    // Flash white when invincible
    if (this._pf && Math.floor(Date.now() / 100) % 2 === 0) {
      this.graphics.fillStyle(0xffffff, 0.5);
      this.graphics.fillEllipse(0, 2, w * 1.35, h * 0.7);
    }

    // Pulse red when low health (below 20%)
    if (this.lowHealthAlpha > 0) {
      this.graphics.fillStyle(0xff0000, this.lowHealthAlpha);
      this.graphics.fillEllipse(0, 2, w * 1.35, h * 0.7);
    }

    // Naked state indicator - exclamation mark above head
    if (state === 'naked') {
      this.graphics.fillStyle(0xff0000);
      this.graphics.fillRect(-3, -h * 0.7, 6, 12);
      this.graphics.fillCircle(0, -h * 0.7 + 18, 4);
    }
  }

  private drawHat(dir: number, _w: number, h: number, bodyBob: number = 0): void {
    if (!this.equippedHat || this.equippedHat.id === 'hat_none') return;

    const hat = this.equippedHat;
    const colors = hat.colors || { primary: 0x888888 };
    const hatX = dir * 16; // Shift toward head/face direction
    const hatY = -h * 0.43 - bodyBob; // On top of head, bobs with body

    // Transform to hat position and tilt to follow rounded head
    this.graphics.save();
    this.graphics.translateCanvas(hatX, hatY);
    this.graphics.rotateCanvas(dir * 0.2); // ~11 degrees, tilts forward

    switch (hat.id) {
      case 'hat_crown':
        // Crown base
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillRect(-10, 0, 20, 10);
        // Crown points
        this.graphics.fillTriangle(-10, 0, -5, 0, -7.5, -10);
        this.graphics.fillTriangle(-2, 0, 2, 0, 0, -14);
        this.graphics.fillTriangle(5, 0, 10, 0, 7.5, -10);
        // Gem
        this.graphics.fillStyle(colors.secondary || 0xff4444);
        this.graphics.fillCircle(0, 4, 3);
        break;

      case 'hat_wizard':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillTriangle(-8, 10, 8, 10, 0, -16);
        // Star decoration
        this.graphics.fillStyle(colors.secondary || 0xffdd44);
        this.graphics.fillCircle(0, 0, 3);
        break;

      case 'hat_viking':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillEllipse(0, 5, 20, 12);
        // Horns - tucked inside helmet, curving up from top
        this.graphics.fillStyle(colors.secondary || 0xcccc99);
        this.graphics.fillTriangle(-10, 4, -7, -1, -14, -10);
        this.graphics.fillTriangle(10, 4, 7, -1, 14, -10);
        break;

      case 'hat_party':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillTriangle(-8, 6, 8, 6, 0, -14);
        // Pom pom
        this.graphics.fillStyle(colors.secondary || 0x44ffaa);
        this.graphics.fillCircle(0, -14, 4);
        break;

      case 'hat_chef':
        this.graphics.fillStyle(colors.primary);
        this.graphics.fillEllipse(0, -12, 20, 10);
        this.graphics.fillRect(-8, -8, 16, 16);
        break;

      case 'hat_halo':
        // Glowing halo effect
        if (colors.glow) {
          this.graphics.lineStyle(6, colors.glow, 0.3);
          this.graphics.strokeEllipse(0, -8, 24, 8);
        }
        this.graphics.lineStyle(3, colors.primary);
        this.graphics.strokeEllipse(0, -8, 22, 7);
        break;
    }

    this.graphics.restore();
  }

  private drawQuills(_state: QuillState, dir: number): void {
    const w = PLAYER_CONFIG.width;
    const h = PLAYER_CONFIG.height;

    // 5-tier visual quill count based on actual quill percentage
    const quillPercent = this.quillManager.currentQuills / this.quillManager.maxQuills;
    let quillCount: number;
    let quillLength: number;
    if (quillPercent >= 0.8) {
      quillCount = 9; quillLength = 20;   // 100%
    } else if (quillPercent >= 0.6) {
      quillCount = 7; quillLength = 18;   // 80%
    } else if (quillPercent >= 0.4) {
      quillCount = 6; quillLength = 16;   // 60%
    } else if (quillPercent >= 0.2) {
      quillCount = 5; quillLength = 14;   // 40%
    } else {
      quillCount = 3; quillLength = 12;   // 20%
    }

    // Quill style - thicker lines for better visibility
    this.graphics.lineStyle(3, 0xffffff);

    // Velocity sway - quills trail behind movement direction
    // Multiply by dir so sway pushes quills toward the back regardless of facing
    const velocitySway = this.body ? dir * (this.body.velocity.x / 300) * 0.25 : 0;

    // Body ellipse semi-axes (must match drawPorcupine body)
    const rx = w * 1.35 / 2; // horizontal semi-axis
    const ry = h * 0.7 / 2;  // vertical semi-axis
    const bodyCenterY = 2;    // body center Y offset

    // Distribute quills along the back arc of the body ellipse
    // Arc goes from top (-90deg) to lower back, on the side away from the face
    const arcStart = -94 * Math.PI / 180; // just past top
    const arcEnd = -1 * Math.PI / 180;     // stop before lower belly
    const arcRange = arcEnd - arcStart;

    for (let i = 0; i < quillCount; i++) {
      // Parameter along the ellipse arc
      const t = arcStart + (i / (quillCount - 1)) * arcRange;
      const swayedT = t + velocitySway;

      // Point on the ellipse surface (back side = negative dir)
      const startX = -dir * Math.cos(swayedT) * rx;
      const startY = bodyCenterY + Math.sin(swayedT) * ry;

      // Outward direction (normal-ish, pointing away from center)
      const outAngle = Math.atan2(Math.sin(swayedT) * rx, -dir * Math.cos(swayedT) * ry);
      const endX = startX + Math.cos(outAngle) * quillLength;
      const endY = startY + Math.sin(outAngle) * quillLength;

      this.graphics.beginPath();
      this.graphics.moveTo(startX, startY);
      this.graphics.lineTo(endX, endY);
      this.graphics.strokePath();
    }
  }

  private drawShieldIndicator(): void {
    if (this.shieldCharges <= 0) return;

    // Use capped max charges (respects SHIELD_CONFIG.maxCharges)
    const maxCharges = this.getMaxShieldCharges();
    const h = PLAYER_CONFIG.height;

    const indicatorY = -h * 1.0; // -50px, above all hats
    const indicatorX = 0;

    // Subtle pulse: scale between 0.9 and 1.1
    const pulse = 1.0 + Math.sin(this.shieldPulsePhase) * 0.1;
    const size = 8 * pulse;

    // Faint glow behind icon
    this.graphics.fillStyle(0x00aaff, 0.15);
    this.graphics.fillCircle(indicatorX, indicatorY, size + 4);

    // Shield diamond shape
    this.graphics.fillStyle(0x00aaff, 0.7);
    this.graphics.beginPath();
    this.graphics.moveTo(indicatorX, indicatorY - size);
    this.graphics.lineTo(indicatorX + size * 0.7, indicatorY);
    this.graphics.lineTo(indicatorX, indicatorY + size * 0.6);
    this.graphics.lineTo(indicatorX - size * 0.7, indicatorY);
    this.graphics.closePath();
    this.graphics.fillPath();

    // Shield border
    this.graphics.lineStyle(1.5, 0x00ddff, 0.9);
    this.graphics.beginPath();
    this.graphics.moveTo(indicatorX, indicatorY - size);
    this.graphics.lineTo(indicatorX + size * 0.7, indicatorY);
    this.graphics.lineTo(indicatorX, indicatorY + size * 0.6);
    this.graphics.lineTo(indicatorX - size * 0.7, indicatorY);
    this.graphics.closePath();
    this.graphics.strokePath();

    // Charge pips below icon (only when max > 1)
    if (maxCharges > 1) {
      const pipRadius = 2.5;
      const pipSpacing = 7;
      const totalWidth = (maxCharges - 1) * pipSpacing;
      const startX = indicatorX - totalWidth / 2;
      const pipY = indicatorY + size + 6;

      for (let i = 0; i < maxCharges; i++) {
        const pipX = startX + i * pipSpacing;
        if (i < this.shieldCharges) {
          // Active charge pip
          this.graphics.fillStyle(0x00aaff, 0.9);
          this.graphics.fillCircle(pipX, pipY, pipRadius);
        } else {
          // Depleted charge pip
          this.graphics.lineStyle(1, 0x00aaff, 0.3);
          this.graphics.strokeCircle(pipX, pipY, pipRadius);
        }
      }
    }
  }

  shoot(targetX: number, targetY: number): boolean {
    const state = this.getQuillState();
    if (state === 'naked') return false;

    return this.quillManager.shoot(this.x, this.y, targetX, targetY);
  }

  _uf(amount: number): boolean {
    if (this._pf) return false;

    // Evasion check - before shields so a dodge doesn't waste a charge
    // Logarithmic diminishing returns: effective = ln(1 + raw) / (ln(1 + raw) + k)
    const rawEvasion = this.upgradeManager.getModifier('evasion');
    const evasion = rawEvasion > 0 ? Math.log(1 + rawEvasion) / (Math.log(1 + rawEvasion) + EVASION_CONFIG.diminishingK) : 0;
    if (evasion > 0 && Math.random() < evasion) {
      this.spawnDodgeText();
      this._lastDodged = true;
      return false; // Dodged! No damage, no shield consumed
    }

    // Check shields first
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this._bs++;
      this.shieldRegenTimer = 0;
      this.spawnShieldBreakEffect();

      // Diminishing iframes: reset to base if enough time has passed
      const now = this.scene.time.now;
      if (now - this.lastShieldBreakTime > SHIELD_CONFIG.iframeDiminishResetTime) {
        this.currentShieldIframe = SHIELD_CONFIG.baseShieldIframe;
      }

      // Apply current iframe duration
      const iframeDuration = this.currentShieldIframe;
      this._pf = true;
      this.scene.time.delayedCall(iframeDuration, () => {
        this._pf = false;
      });

      // Diminish for next hit (apply rate, but floor at minimum)
      this.currentShieldIframe = Math.max(
        SHIELD_CONFIG.minShieldIframe,
        Math.floor(this.currentShieldIframe * SHIELD_CONFIG.iframeDiminishRate)
      );
      this.lastShieldBreakTime = now;

      return false; // No damage taken
    }

    // Apply armor damage reduction (logarithmic diminishing returns)
    const rawArmor = this.upgradeManager.getModifier('armor');
    const armor = rawArmor > 0 ? Math.log(1 + rawArmor) / (Math.log(1 + rawArmor) + ARMOR_CONFIG.diminishingK) : 0;
    const armorReduced = armor > 0 ? amount * (1 - armor) : amount;

    const state = this.getQuillState();
    const damageMult = QUILL_CONFIG.states[state]._ufm;
    const actualDamage = armorReduced * damageMult;

    this.health -= actualDamage;
    this.health = Math.max(0, this.health);
    this._fd += actualDamage;
    this._fc++;

    // Invincibility frames
    this._pf = true;
    this.scene.time.delayedCall(PLAYER_CONFIG.invincibilityTime, () => {
      this._pf = false;
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

  private spawnDodgeText(): void {
    const opacity = SaveManager.getEffectsOpacity();
    if (opacity <= 0) return;

    // "DODGE" floating text when evasion triggers
    const text = this.scene.add.text(this.x, this.y - 30, 'DODGE', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(opacity);
    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  resetShieldsForWave(): void {
    // Respect the hard cap from SHIELD_CONFIG
    const upgradeCharges = this.upgradeManager.getModifier('shieldCharges');
    this.shieldCharges = Math.min(upgradeCharges, SHIELD_CONFIG.maxCharges);
    // Reset iframe diminishing state for new wave
    this.currentShieldIframe = SHIELD_CONFIG.baseShieldIframe;
    this.lastShieldBreakTime = 0;
  }

  syncNewShieldCharges(previousMax: number): void {
    // Grant ONLY new charges from shield upgrades picked mid-wave
    // previousMax = max charges BEFORE upgrade was applied
    const upgradeCharges = this.upgradeManager.getModifier('shieldCharges');
    const maxCharges = Math.min(upgradeCharges, SHIELD_CONFIG.maxCharges);
    const newCharges = upgradeCharges - previousMax;
    if (newCharges > 0) {
      // Only add the difference (new charges from the upgrade), capped at max
      this.shieldCharges = Math.min(this.shieldCharges + newCharges, maxCharges);
    }
  }

  getMaxShieldCharges(): number {
    // Returns the effective maximum (upgrade value capped at system max)
    return Math.min(this.upgradeManager.getModifier('shieldCharges'), SHIELD_CONFIG.maxCharges);
  }

  isAtShieldCap(): boolean {
    // Returns true if player has reached the shield cap (for hiding upgrades)
    return this.upgradeManager.getModifier('shieldCharges') >= SHIELD_CONFIG.maxCharges;
  }

  getShieldCharges(): number {
    return this.shieldCharges;
  }

  getPerf(): { d: number; t: number; b: number } {
    return { d: this._fd, t: this._fc, b: this._bs };
  }

  resetPerf(): void {
    this._fd = 0;
    this._fc = 0;
    this._bs = 0;
  }

  enableInfiniteSwarmShieldRegen(): void {
    this.infiniteSwarmShieldRegen = true;
    this.shieldRegenTimer = 0;
  }

  private updateShieldRegen(delta: number): void {
    if (!this.infiniteSwarmShieldRegen) return;

    // Use capped max charges
    const maxCharges = this.getMaxShieldCharges();
    if (maxCharges <= 0 || this.shieldCharges >= maxCharges) {
      this.shieldRegenTimer = 0;
      return;
    }

    this.shieldRegenTimer += delta;

    if (this.shieldRegenTimer >= INFINITE_SWARM_CONFIG.shieldRegenInterval) {
      this.shieldRegenTimer -= INFINITE_SWARM_CONFIG.shieldRegenInterval;
      this.shieldCharges = Math.min(this.shieldCharges + 1, maxCharges);
      this.spawnShieldRegenEffect();
    }
  }

  private spawnShieldRegenEffect(): void {
    const sparkle = this.scene.add.circle(this.x, this.y - 30, 15, 0x00aaff, 0.0);
    this.scene.tweens.add({
      targets: sparkle,
      alpha: 0.5,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      onComplete: () => sparkle.destroy(),
    });
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
