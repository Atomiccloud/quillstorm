import Phaser from 'phaser';

const JOYSTICK_CONFIG = {
  baseRadius: 120,
  thumbRadius: 40,
  maxDist: 100,       // Max thumb travel from center
  captureRadius: 200, // Touch must land within this radius to capture
  idleAlpha: 0.3,
  activeAlpha: 0.6,
  x: 180,             // Position in game coords
  y: 660,
};

export class VirtualJoystick extends Phaser.GameObjects.Container {
  private base: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private trackingPointerId: number = -1;

  /** Normalized force output (-1 to 1) */
  public forceX: number = 0;
  public forceY: number = 0;
  public isActive: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, JOYSTICK_CONFIG.x, JOYSTICK_CONFIG.y);

    // Outer ring (base)
    this.base = scene.add.circle(0, 0, JOYSTICK_CONFIG.baseRadius, 0xffffff, JOYSTICK_CONFIG.idleAlpha);
    this.base.setStrokeStyle(3, 0xffffff, JOYSTICK_CONFIG.idleAlpha);
    this.base.setFillStyle(0x333333, JOYSTICK_CONFIG.idleAlpha);
    this.add(this.base);

    // Inner circle (thumb)
    this.thumb = scene.add.circle(0, 0, JOYSTICK_CONFIG.thumbRadius, 0xaaaaaa, JOYSTICK_CONFIG.idleAlpha + 0.1);
    this.add(this.thumb);

    this.setScrollFactor(0);
    this.setDepth(110);

    scene.add.existing(this);

    // Pointer event listeners
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }

  /** Returns true if this joystick is tracking the given pointer ID */
  isTrackingPointer(id: number): boolean {
    return this.isActive && this.trackingPointerId === id;
  }

  /** Returns true if the given game-space coordinates are inside the joystick capture zone */
  isInCaptureZone(x: number, y: number): boolean {
    const dx = x - JOYSTICK_CONFIG.x;
    const dy = y - JOYSTICK_CONFIG.y;
    return Math.sqrt(dx * dx + dy * dy) <= JOYSTICK_CONFIG.captureRadius;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isActive) return; // Already tracking a finger

    // With Scale.FIT, Phaser maps pointer coords to game coords automatically.
    // pointer.x ranges 0..1440, pointer.y ranges 0..810 in game space.
    const distX = pointer.x - JOYSTICK_CONFIG.x;
    const distY = pointer.y - JOYSTICK_CONFIG.y;
    const dist = Math.sqrt(distX * distX + distY * distY);

    if (dist <= JOYSTICK_CONFIG.captureRadius) {
      this.trackingPointerId = pointer.id;
      this.isActive = true;
      this.base.setAlpha(JOYSTICK_CONFIG.activeAlpha);
      this.base.setStrokeStyle(3, 0xffffff, JOYSTICK_CONFIG.activeAlpha);
      this.thumb.setAlpha(JOYSTICK_CONFIG.activeAlpha + 0.1);
      this.updateThumb(pointer);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isActive || pointer.id !== this.trackingPointerId) return;
    this.updateThumb(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.trackingPointerId) return;
    this.reset();
  }

  private updateThumb(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - JOYSTICK_CONFIG.x;
    const dy = pointer.y - JOYSTICK_CONFIG.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= JOYSTICK_CONFIG.maxDist) {
      this.thumb.setPosition(dx, dy);
      this.forceX = dx / JOYSTICK_CONFIG.maxDist;
      this.forceY = dy / JOYSTICK_CONFIG.maxDist;
    } else {
      // Clamp to max distance
      const angle = Math.atan2(dy, dx);
      this.thumb.setPosition(
        Math.cos(angle) * JOYSTICK_CONFIG.maxDist,
        Math.sin(angle) * JOYSTICK_CONFIG.maxDist
      );
      this.forceX = Math.cos(angle);
      this.forceY = Math.sin(angle);
    }
  }

  private reset(): void {
    this.trackingPointerId = -1;
    this.isActive = false;
    this.forceX = 0;
    this.forceY = 0;
    this.thumb.setPosition(0, 0);
    this.base.setAlpha(JOYSTICK_CONFIG.idleAlpha);
    this.base.setStrokeStyle(3, 0xffffff, JOYSTICK_CONFIG.idleAlpha);
    this.thumb.setAlpha(JOYSTICK_CONFIG.idleAlpha + 0.1);
  }

  destroy(fromScene?: boolean): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    super.destroy(fromScene);
  }
}
