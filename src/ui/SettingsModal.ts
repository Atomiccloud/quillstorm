import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { GraphicsSettings, QualityPreset } from '../systems/GraphicsSettings';
import { MobileDetector } from '../systems/MobileDetector';

const QUALITY_DESCRIPTIONS: Record<QualityPreset, string> = {
  auto: 'Automatically adjusts quality based on performance',
  high: 'Full visual effects, particles, glow, and screen shake',
  medium: 'Reduced particles and simplified status effects',
  low: 'Minimal effects for best performance — no glow, trails, or shake',
};

type OpacityCategory = 'combatText' | 'particle' | 'elemental' | 'statusOverlay';

const OPACITY_SLIDERS: { category: OpacityCategory; label: string }[] = [
  { category: 'combatText', label: 'Combat Text' },
  { category: 'particle', label: 'Particles' },
  { category: 'elemental', label: 'Elemental VFX' },
  { category: 'statusOverlay', label: 'Status Overlays' },
];

export class SettingsModal extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private onCloseCallback: () => void;

  // Audio controls
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteText!: Phaser.GameObjects.Text;

  // Per-category opacity controls
  private opacityFills = new Map<OpacityCategory, Phaser.GameObjects.Rectangle>();
  private opacityTexts = new Map<OpacityCategory, Phaser.GameObjects.Text>();

  // Graphics controls
  private qualityButtons: { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; preset: QualityPreset }[] = [];
  private qualityDescription!: Phaser.GameObjects.Text;

  // Slider drag tracking
  private isDraggingVolume: boolean = false;
  private draggingCategory: OpacityCategory | null = null;
  private barX: number;
  private barWidth: number = 200;

  constructor(scene: Phaser.Scene, onClose: () => void) {
    super(scene, 0, 0);

    this.onCloseCallback = onClose;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;
    const panelWidth = 600;
    const panelHeight = 570;

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
    const mob = MobileDetector.showVirtualControls;
    const title = scene.add.text(centerX, centerY - panelHeight / 2 + 30, 'Settings', {
      fontSize: mob ? '39px' : '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(title);

    // Close button (X)
    const closeButton = scene.add.text(centerX + panelWidth / 2 - 30, centerY - panelHeight / 2 + 30, '\u2715', {
      fontSize: mob ? '34px' : '24px',
      color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    if (!MobileDetector.isTouchDevice) {
      closeButton.on('pointerover', () => closeButton.setColor('#ffffff'));
      closeButton.on('pointerout', () => closeButton.setColor('#888888'));
    }
    closeButton.on('pointerdown', () => this.close());
    this.add(closeButton);

    // Content area starts below title
    const contentTop = centerY - panelHeight / 2 + 70;
    const leftX = centerX - panelWidth / 2 + 40;

    // --- Section 1: Audio ---
    this.createSectionHeader(scene, leftX, contentTop, 'Audio');
    this.createVolumeControls(scene, leftX, contentTop + 42);

    // --- Section 2: Effects (4 sliders) ---
    const effectsY = contentTop + 130;
    this.createSectionHeader(scene, leftX, effectsY, 'Effects');
    OPACITY_SLIDERS.forEach((s, i) => {
      this.createCategorySlider(scene, leftX, effectsY + 36 + i * 32, s.label, s.category);
    });

    // --- Section 3: Graphics Quality ---
    const graphicsY = effectsY + 36 + OPACITY_SLIDERS.length * 32 + 24;
    this.createSectionHeader(scene, leftX, graphicsY, 'Graphics Quality');
    this.createQualityControls(scene, centerX, graphicsY + 48);

    // Drag handlers at scene level for smooth slider dragging
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      if (this.isDraggingVolume) this.updateVolumeFromPointer(pointer);
      if (this.draggingCategory) this.updateCategoryFromPointer(pointer, this.draggingCategory);
    });

    scene.input.on('pointerup', () => {
      this.isDraggingVolume = false;
      this.draggingCategory = null;
    });

    // Initially hidden
    this.setVisible(false);
    this.setDepth(100);
  }

  private createSectionHeader(scene: Phaser.Scene, x: number, y: number, label: string): void {
    const mob = MobileDetector.showVirtualControls;
    const text = scene.add.text(x, y, label, {
      fontSize: mob ? '25px' : '18px',
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
    const mob = MobileDetector.showVirtualControls;

    // Volume label
    const label = scene.add.text(leftX, y, 'Volume', {
      fontSize: mob ? '22px' : '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
    }).setOrigin(0, 0.5);
    this.add(label);

    // Volume bar background (larger hit area on mobile)
    const barHeight = mob ? 24 : 14;
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
      fontSize: mob ? '20px' : '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add(this.volumeText);

    // Mute button
    const muteX = this.barX + this.barWidth / 2 + 70;
    const isMuted = AudioManager.getMuted();
    this.muteButton = scene.add.rectangle(muteX, y, mob ? 65 : 50, mob ? 36 : 26, isMuted ? 0x884444 : 0x448844);
    this.muteButton.setInteractive({ useHandCursor: true });
    this.add(this.muteButton);

    this.muteText = scene.add.text(muteX, y, isMuted ? 'MUTE' : 'ON', {
      fontSize: mob ? '17px' : '12px',
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

  private createCategorySlider(
    scene: Phaser.Scene, leftX: number, y: number,
    label: string, category: OpacityCategory
  ): void {
    const mob = MobileDetector.showVirtualControls;
    const sliderLabel = scene.add.text(leftX, y, label, {
      fontSize: mob ? '20px' : '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);
    this.add(sliderLabel);

    const barHeight = mob ? 22 : 12;
    const barBg = scene.add.rectangle(this.barX, y, this.barWidth, barHeight, 0x333333);
    barBg.setInteractive({ useHandCursor: true });
    this.add(barBg);

    const currentValue = this.getCategoryValue(category);
    const fill = scene.add.rectangle(
      this.barX - this.barWidth / 2, y,
      currentValue * this.barWidth, barHeight,
      0x4a6741
    ).setOrigin(0, 0.5);
    this.add(fill);

    const pctText = scene.add.text(this.barX + this.barWidth / 2 + 12, y,
      `${Math.round(currentValue * 100)}%`, {
      fontSize: mob ? '18px' : '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.add(pctText);

    this.opacityFills.set(category, fill);
    this.opacityTexts.set(category, pctText);

    barBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.draggingCategory = category;
      this.updateCategoryFromPointer(pointer, category);
    });
  }

  private getCategoryValue(category: OpacityCategory): number {
    switch (category) {
      case 'combatText': return SaveManager.getCombatTextOpacity();
      case 'particle': return SaveManager.getParticleOpacity();
      case 'elemental': return SaveManager.getElementalOpacity();
      case 'statusOverlay': return SaveManager.getStatusOverlayOpacity();
    }
  }

  private setCategoryValue(category: OpacityCategory, value: number): void {
    switch (category) {
      case 'combatText': SaveManager.setCombatTextOpacity(value); break;
      case 'particle': SaveManager.setParticleOpacity(value); break;
      case 'elemental': SaveManager.setElementalOpacity(value); break;
      case 'statusOverlay': SaveManager.setStatusOverlayOpacity(value); break;
    }
  }

  private updateCategoryFromPointer(pointer: Phaser.Input.Pointer, category: OpacityCategory): void {
    const relativeX = pointer.x - (this.barX - this.barWidth / 2);
    const newValue = Phaser.Math.Clamp(relativeX / this.barWidth, 0, 1);
    this.setCategoryValue(category, newValue);
    this.opacityFills.get(category)!.width = newValue * this.barWidth;
    this.opacityTexts.get(category)!.setText(`${Math.round(newValue * 100)}%`);
  }

  private createQualityControls(scene: Phaser.Scene, centerX: number, y: number): void {
    const mob = MobileDetector.showVirtualControls;
    const presets: { label: string; value: QualityPreset }[] = [
      { label: 'AUTO', value: 'auto' },
      { label: 'HIGH', value: 'high' },
      { label: 'MEDIUM', value: 'medium' },
      { label: 'LOW', value: 'low' },
    ];

    const btnWidth = 110;
    const btnHeight = mob ? 48 : 36;
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
        fontSize: mob ? '20px' : '14px',
        fontFamily: 'Arial Black, sans-serif',
        color: isActive ? '#ffffff' : '#888888',
      }).setOrigin(0.5);
      this.add(text);

      this.qualityButtons.push({ bg, text, preset: p.value });

      if (!MobileDetector.isTouchDevice) {
        bg.on('pointerover', () => {
          if (GraphicsSettings.getPreset() !== p.value) bg.setFillStyle(0x444444);
        });
        bg.on('pointerout', () => {
          bg.setFillStyle(GraphicsSettings.getPreset() === p.value ? 0x4a6741 : 0x333333);
        });
      }
      bg.on('pointerdown', () => {
        AudioManager.playButtonClick();
        GraphicsSettings.setPreset(p.value);
        this.refreshQualityButtons();
      });
    });

    // Description text below buttons
    this.qualityDescription = scene.add.text(centerX, y + btnHeight / 2 + 16, QUALITY_DESCRIPTIONS[currentPreset], {
      fontSize: mob ? '20px' : '14px',
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

    for (const { category } of OPACITY_SLIDERS) {
      const val = this.getCategoryValue(category);
      this.opacityFills.get(category)!.width = val * this.barWidth;
      this.opacityTexts.get(category)!.setText(`${Math.round(val * 100)}%`);
    }

    this.refreshQualityButtons();

    this.setVisible(true);
  }

  close(): void {
    AudioManager.playButtonClick();
    this.setVisible(false);
    this.onCloseCallback();
  }
}
