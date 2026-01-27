import Phaser from 'phaser';
import { QUILL_CONFIG } from '../config';
import { Quill } from '../entities/Quill';
import { UpgradeManager } from './UpgradeManager';

export class QuillManager {
  private scene: Phaser.Scene;
  private upgradeManager: UpgradeManager;
  public quills: Phaser.GameObjects.Group;

  public currentQuills: number;
  public maxQuills: number;
  private lastFireTime: number = 0;
  private regenPaused: boolean = false;
  private regenPauseTimer: number = 0;

  constructor(scene: Phaser.Scene, upgradeManager: UpgradeManager) {
    this.scene = scene;
    this.upgradeManager = upgradeManager;

    this.maxQuills = QUILL_CONFIG.maxQuills + this.upgradeManager.getModifier('maxQuills');
    this.currentQuills = QUILL_CONFIG.startingQuills;

    // Create group for quill projectiles
    this.quills = scene.add.group({
      classType: Quill,
      runChildUpdate: true,
    });
  }

  update(_time: number, delta: number): void {
    // Update max quills from upgrades
    this.maxQuills = QUILL_CONFIG.maxQuills + this.upgradeManager.getModifier('maxQuills');

    // Handle regeneration
    this.handleRegen(delta);

    // Clean up dead quills
    this.quills.getChildren().forEach((quill) => {
      const q = quill as Quill;
      if (q.isDead()) {
        q.destroy();
      }
    });
  }

  private handleRegen(delta: number): void {
    // Check if regen is paused
    if (this.regenPaused) {
      this.regenPauseTimer -= delta;
      if (this.regenPauseTimer <= 0) {
        this.regenPaused = false;
      }
      return;
    }

    // Don't regen if full
    if (this.currentQuills >= this.maxQuills) return;

    // Calculate regen rate
    let regenRate = QUILL_CONFIG.regenRate * (1 + this.upgradeManager.getModifier('regenRate'));

    // Naked state bonus regen
    const quillPercent = this.currentQuills / this.maxQuills;
    if (quillPercent < QUILL_CONFIG.states.naked.min + 0.01) {
      regenRate *= QUILL_CONFIG.nakedRegenMultiplier;
    }

    // Regenerate
    const regenPerMs = regenRate / 1000;
    this.currentQuills += regenPerMs * delta;
    this.currentQuills = Math.min(this.currentQuills, this.maxQuills);
  }

  canShoot(): boolean {
    if (this.currentQuills < 1) return false;

    const fireRate = QUILL_CONFIG.fireRate * (1 + this.upgradeManager.getModifier('fireRate'));
    const fireDelay = 1000 / fireRate;
    const now = this.scene.time.now;

    return now - this.lastFireTime >= fireDelay;
  }

  shoot(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.canShoot()) return false;

    this.lastFireTime = this.scene.time.now;

    // Consume quill
    this.currentQuills -= 1;

    // Pause regen
    this.regenPaused = true;
    this.regenPauseTimer = QUILL_CONFIG.regenDelay;

    // Calculate angle to target
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);

    // Get projectile count from upgrades
    const projectileCount = 1 + Math.floor(this.upgradeManager.getModifier('projectileCount'));

    // Calculate spread for multiple projectiles
    const spreadAngle = projectileCount > 1 ? 0.15 : 0; // ~8.5 degrees spread per additional projectile

    for (let i = 0; i < projectileCount; i++) {
      // Calculate offset angle for spread
      let projectileAngle = angle;
      if (projectileCount > 1) {
        const offsetIndex = i - (projectileCount - 1) / 2;
        projectileAngle = angle + offsetIndex * spreadAngle;
      }

      // Create quill projectile
      const quill = new Quill(
        this.scene,
        fromX,
        fromY,
        projectileAngle,
        this.upgradeManager
      );

      this.quills.add(quill);
    }

    return true;
  }

  getQuillPercent(): number {
    return this.currentQuills / this.maxQuills;
  }

  addQuills(amount: number): void {
    this.currentQuills = Math.min(this.maxQuills, this.currentQuills + amount);
  }
}
