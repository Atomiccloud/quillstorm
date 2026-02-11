import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { GraphicsSettings, QualityPreset } from '../systems/GraphicsSettings';

const QUALITY_DESCRIPTIONS: Record<QualityPreset, string> = {
  auto: 'Automatically adjusts quality based on performance',
  high: 'Full visual effects, particles, glow, and screen shake',
  medium: 'Reduced particles and simplified status effects',
  low: 'Minimal effects for best performance — no glow, trails, or shake',
};

export class SettingsModal extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private onCloseCallback: () => void;

  // Audio controls
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteText!: Phaser.GameObjects.Text;

  // Effects controls
  private effectsFill!: Phaser.GameObjects.Rectangle;
  private effectsText!: Phaser.GameObjects.Text;

  // Graphics controls
  private qualityButtons: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; preset: QualityPreset }[] = [];
  private qualityDescription!: Phaser.GameObjects.Text;

  // Slider drag tracking
  private isDraggingVolume: boolean = false;
  private isDraggingEffects: boolean = false;
  private barX: number;
  private barWidth: number = 200;

  constructor(scene: Phaser.Scene, onClose: () => void) {
    super(scene, 0, 0);

    this.onCloseCallback = onClose;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;
    const panelWidth = 600;
    const panelHeight = 480;

    this.barX = centerX + 30;

    // Semi-transparent background
    this.background = scene.add.rectangle(
      centerX, centerY,
      GAME_CONFIG.width, GAME_CONFIG.height,
      0x000000, 0.7
    );
    this.background.setInteractive();
    this.background.on('pointerdown', () => this.close());
    this.add(this.background);

    // Modal panel
    this.panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e);
    this.panel.setStrokeStyle(2, 0x4a6741);
    this.panel.setInteractive();
    this.add(this.panel);

    // Title
    const title = scene.add.text(centerX, centerY - panelHeight / 2 + 30, 'Settings', {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(title);

    // Close button (X)
    const closeButton = scene.add.text(centerX + panelWidth / 2 - 30, centerY - panelHeight / 2 + 30, '\u2715', {
      fontSize: '24px',
      color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeButton.on('pointerover', () => closeButton.setColor('#ffffff'));
    closeButton.on('pointerout', () => closeButton.setColor('#888888'));
    closeButton.on('pointerdown', () => this.close());
    this.add(closeButton);

    // Content area starts below title
    const contentTop = centerY - panelHeight / 2 + 70;
    const leftX = centerX - panelWidth / 2 + 40;

    // --- Section 1: Audio ---
    this.createSectionHeader(scene, leftX, contentTop, 'Audio');
    this.createVolumeControls(scene, leftX, contentTop + 42);

    // --- Section 2: Effects ---
    const effectsY = contentTop + 130;
    this.createSectionHeader(scene, leftX, effectsY, 'Effects');
    this.createEffectsControls(scene, leftX, effectsY + 42);

    // --- Section 3: Graphics Quality ---
    const graphicsY = effectsY + 130;
    this.createSectionHeader(scene, leftX, graphicsY, 'Graphics Quality');
    this.createQualityControls(scene, centerX, graphicsY + 48);

    // Drag handlers at scene level for smooth slider dragging
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      if (this.isDraggingVolume) this.updateVolumeFromPointer(pointer);
      if (this.isDraggingEffects) this.updateEffectsFromPointer(pointer);
    });

    scene.input.on('pointerup', () => {
      this.isDraggingVolume = false;
      this.isDraggingEffects = false;
    });

    // Initially hidden
    this.setVisible(false);
    this.setDepth(100);
  }

  private createSectionHeader(scene: Phaser.Scene, x: number, y: number, label: string): void {
    const text = scene.add.text(x, y, label, {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700',
    });
    this.add(text);

    // Divider line under header
    const lineWidth = 520;
    const divider = scene.add.graphics();
    divider.lineStyle(1, 0x333333);
    divider.beginPath();
    divider.moveTo(x, y + 22);
    divider.lineTo(x + lineWidth, y + 22);
    divider.strokePath();
    this.add(divider);
  }

  private createVolumeControls(scene: Phaser.Scene, leftX: number, y: number): void {
    // Volume label
    const label = scene.add.text(leftX, y, 'Volume', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
    }).setOrigin(0, 0.5);
    this.add(label);

    // Volume bar background
    const barHeight = 14;
    const barBg = scene.add.rectangle(this.barX, y, this.barWidth, barHeight, 0x333333);
    barBg.setInteractive({ useHandCursor: true });
    this.add(barBg);

    // Volume bar fill
    const currentVolume = AudioManager.getVolume();
    this.volumeFill = scene.add.rectangle(
      this.barX - this.barWidth / 2, y,
      currentVolume * this.barWidth, barHeight,
      0x4a6741
    ).setOrigin(0, 0.5);
    this.add(this.volumeFill);

    // Volume percentage text
    this.volumeText = scene.add.text(this.barX + this.barWidth / 2 + 12, y, `${Math.round(currentVolume * 100)}%`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add(this.volumeText);

    // Mute button
    const muteX = this.barX + this.barWidth / 2 + 70;
    const isMuted = AudioManager.getMuted();
    this.muteButton = scene.add.rectangle(muteX, y, 50, 26, isMuted ? 0x884444 : 0x448844);
    this.muteButton.setInteractive({ useHandCursor: true });
    this.add(this.muteButton);

    this.muteText = scene.add.text(muteX, y, isMuted ? 'MUTE' : 'ON', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(this.muteText);

    // Bar click/drag
    barBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingVolume = true;
      this.updateVolumeFromPointer(pointer);
    });

    // Mute click
    this.muteButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      const muted = AudioManager.toggleMute();
      this.updateMuteDisplay(muted);
    });
  }

  private createEffectsControls(scene: Phaser.Scene, leftX: number, y: number): void {
    // Effects label
    const label = scene.add.text(leftX, y, 'Effects Opacity', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
    }).setOrigin(0, 0.5);
    this.add(label);

    // Effects bar background
    const barHeight = 14;
    const barBg = scene.add.rectangle(this.barX, y, this.barWidth, barHeight, 0x333333);
    barBg.setInteractive({ useHandCursor: true });
    this.add(barBg);

    // Effects bar fill
    const currentEffects = SaveManager.getEffectsOpacity();
    this.effectsFill = scene.add.rectangle(
      this.barX - this.barWidth / 2, y,
      currentEffects * this.barWidth, barHeight,
      0x4a6741
    ).setOrigin(0, 0.5);
    this.add(this.effectsFill);

    // Effects percentage text
    this.effectsText = scene.add.text(this.barX + this.barWidth / 2 + 12, y, `${Math.round(currentEffects * 100)}%`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add(this.effectsText);

    // Description
    const desc = scene.add.text(leftX, y + 22, 'Controls visibility of combat effects like damage numbers and particles', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#777777',
    });
    this.add(desc);

    // Bar click/drag
    barBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingEffects = true;
      this.updateEffectsFromPointer(pointer);
    });
  }

  private createQualityControls(scene: Phaser.Scene, centerX: number, y: number): void {
    const presets: { label: string; value: QualityPreset }[] = [
      { label: 'AUTO', value: 'auto' },
      { label: 'HIGH', value: 'high' },
      { label: 'MEDIUM', value: 'medium' },
      { label: 'LOW', value: 'low' },
    ];

    const btnWidth = 110;
    const btnHeight = 36;
    const gap = 12;
    const totalWidth = presets.length * btnWidth + (presets.length - 1) * gap;
    const startX = centerX - totalWidth / 2 + btnWidth / 2;

    const currentPreset = GraphicsSettings.getPreset();

    presets.forEach((p, i) => {
      const bx = startX + i * (btnWidth + gap);
      const isActive = p.value === currentPreset;

      const bg = scene.add.rectangle(bx, y, btnWidth, btnHeight, isActive ? 0x4a6741 : 0x333333);
      bg.setInteractive({ useHandCursor: true });
      this.add(bg);

      const text = scene.add.text(bx, y, p.label, {
        fontSize: '14px',
        fontFamily: 'Arial Black, sans-serif',
        color: isActive ? '#ffffff' : '#888888',
      }).setOrigin(0.5);
      this.add(text);

      this.qualityButtons.push({ bg, text, preset: p.value });

      bg.on('pointerover', () => {
        if (GraphicsSettings.getPreset() !== p.value) bg.setFillStyle(0x444444);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(GraphicsSettings.getPreset() === p.value ? 0x4a6741 : 0x333333);
      });
      bg.on('pointerdown', () => {
        AudioManager.playButtonClick();
        GraphicsSettings.setPreset(p.value);
        this.refreshQualityButtons();
      });
    });

    // Description text below buttons
    this.qualityDescription = scene.add.text(centerX, y + btnHeight / 2 + 16, QUALITY_DESCRIPTIONS[currentPreset], {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#999999',
    }).setOrigin(0.5, 0);
    this.add(this.qualityDescription);
  }

  private refreshQualityButtons(): void {
    const currentPreset = GraphicsSettings.getPreset();
    this.qualityButtons.forEach(b => {
      const active = b.preset === currentPreset;
      b.bg.setFillStyle(active ? 0x4a6741 : 0x333333);
      b.text.setColor(active ? '#ffffff' : '#888888');
    });
    this.qualityDescription.setText(QUALITY_DESCRIPTIONS[currentPreset]);
  }

  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer): void {
    const relativeX = pointer.x - (this.barX - this.barWidth / 2);
    const newVolume = Phaser.Math.Clamp(relativeX / this.barWidth, 0, 1);
    AudioManager.setVolume(newVolume);
    this.volumeFill.width = newVolume * this.barWidth;
    this.volumeText.setText(`${Math.round(newVolume * 100)}%`);
  }

  private updateEffectsFromPointer(pointer: Phaser.Input.Pointer): void {
    const relativeX = pointer.x - (this.barX - this.barWidth / 2);
    const newOpacity = Phaser.Math.Clamp(relativeX / this.barWidth, 0, 1);
    SaveManager.setEffectsOpacity(newOpacity);
    this.effectsFill.width = newOpacity * this.barWidth;
    this.effectsText.setText(`${Math.round(newOpacity * 100)}%`);
  }

  private updateMuteDisplay(muted: boolean): void {
    this.muteButton.setFillStyle(muted ? 0x884444 : 0x448844);
    this.muteText.setText(muted ? 'MUTE' : 'ON');
  }

  show(): void {
    // Refresh all controls to current values
    const vol = AudioManager.getVolume();
    this.volumeFill.width = vol * this.barWidth;
    this.volumeText.setText(`${Math.round(vol * 100)}%`);
    this.updateMuteDisplay(AudioManager.getMuted());

    const effects = SaveManager.getEffectsOpacity();
    this.effectsFill.width = effects * this.barWidth;
    this.effectsText.setText(`${Math.round(effects * 100)}%`);

    this.refreshQualityButtons();

    this.setVisible(true);
  }

  close(): void {
    AudioManager.playButtonClick();
    this.setVisible(false);
    this.onCloseCallback();
  }
}
