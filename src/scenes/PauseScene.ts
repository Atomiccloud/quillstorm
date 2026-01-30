import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, PROSPERITY_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { UpgradeManager } from '../systems/UpgradeManager';

interface PauseSceneData {
  upgradeManager?: UpgradeManager;
}

export class PauseScene extends Phaser.Scene {
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteText!: Phaser.GameObjects.Text;
  private upgradeManager: UpgradeManager | null = null;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(data: PauseSceneData): void {
    this.upgradeManager = data.upgradeManager || null;
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(
      centerX,
      centerY,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.7
    );
    overlay.setInteractive(); // Block clicks to game behind

    // Title
    this.add.text(centerX, centerY - 130, 'PAUSED', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Resume button
    const resumeButton = this.add.rectangle(centerX, centerY - 50, 200, 50, 0x4a6741);
    resumeButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY - 50, 'Resume', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Volume section
    this.add.text(centerX, centerY + 20, 'Volume', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Volume bar background
    const barWidth = 180;
    const barHeight = 12;
    const barY = centerY + 50;
    const volumeBarBg = this.add.rectangle(centerX, barY, barWidth, barHeight, 0x333333);
    volumeBarBg.setInteractive({ useHandCursor: true });

    // Volume bar fill
    const currentVolume = AudioManager.getVolume();
    this.volumeFill = this.add.rectangle(
      centerX - barWidth / 2,
      barY,
      currentVolume * barWidth,
      barHeight,
      0x4a6741
    ).setOrigin(0, 0.5);

    // Volume percentage text
    this.volumeText = this.add.text(centerX + barWidth / 2 + 15, barY, `${Math.round(currentVolume * 100)}%`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Mute button
    const isMuted = AudioManager.getMuted();
    this.muteButton = this.add.rectangle(centerX - barWidth / 2 - 25, barY, 30, 20, isMuted ? 0x884444 : 0x448844);
    this.muteButton.setInteractive({ useHandCursor: true });
    this.muteText = this.add.text(centerX - barWidth / 2 - 25, barY, isMuted ? 'OFF' : 'ON', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Click volume bar to adjust
    volumeBarBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.updateVolumeFromPointer(pointer, centerX, barWidth);
    });
    volumeBarBg.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.updateVolumeFromPointer(pointer, centerX, barWidth);
      }
    });

    // Mute button click
    this.muteButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      const muted = AudioManager.toggleMute();
      this.updateMuteDisplay(muted);
    });

    // Restart button
    const restartButton = this.add.rectangle(centerX, centerY + 100, 200, 50, 0x555555);
    restartButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY + 100, 'Restart', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Main Menu button
    const menuButton = this.add.rectangle(centerX, centerY + 170, 200, 50, 0x555555);
    menuButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY + 170, 'Main Menu', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Button interactions
    resumeButton.on('pointerover', () => resumeButton.setFillStyle(0x5a7751));
    resumeButton.on('pointerout', () => resumeButton.setFillStyle(0x4a6741));
    resumeButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.resumeGame();
    });

    restartButton.on('pointerover', () => restartButton.setFillStyle(0x666666));
    restartButton.on('pointerout', () => restartButton.setFillStyle(0x555555));
    restartButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    menuButton.on('pointerover', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x555555));
    menuButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    // Escape to resume
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resumeGame();
    });

    // M to toggle mute
    this.input.keyboard?.on('keydown-M', () => {
      const muted = AudioManager.toggleMute();
      this.updateMuteDisplay(muted);
    });

    // Instructions
    this.add.text(centerX, centerY + 240, 'Press ESC to resume | M to toggle mute', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5);

    // Stats panel on the right side
    if (this.upgradeManager) {
      this.createStatsDisplay();
    }
  }

  private createStatsDisplay(): void {
    if (!this.upgradeManager) return;

    const panelX = GAME_CONFIG.width - 300;
    const panelY = 60;
    const panelWidth = 260;
    const lineHeight = 22;

    // Panel background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(panelX, panelY, panelWidth, 500, 8);
    bg.lineStyle(2, COLORS.rarity.legendary, 0.8);
    bg.strokeRoundedRect(panelX, panelY, panelWidth, 500, 8);

    // Title
    this.add.text(panelX + panelWidth / 2, panelY + 16, 'CURRENT STATS', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700',
    }).setOrigin(0.5, 0);

    let y = panelY + 50;

    const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const formatFlat = (v: number) => `${v >= 0 ? '+' : ''}${v}`;

    const addStat = (name: string, value: string, isPositive: boolean = true) => {
      this.add.text(panelX + 16, y, name, {
        fontSize: '14px',
        color: '#cccccc',
      });
      this.add.text(panelX + panelWidth - 16, y, value, {
        fontSize: '14px',
        color: isPositive ? '#66ff66' : '#ff6666',
      }).setOrigin(1, 0);
      y += lineHeight;
    };

    const addHeader = (name: string) => {
      this.add.text(panelX + 16, y, name, {
        fontSize: '12px',
        color: '#888888',
      });
      y += lineHeight;
    };

    // Combat stats
    addHeader('COMBAT');
    const damage = this.upgradeManager.getModifier('damage');
    if (damage !== 0) addStat('Damage', formatPercent(damage));
    const fireRate = this.upgradeManager.getModifier('fireRate');
    if (fireRate !== 0) addStat('Fire Rate', formatPercent(fireRate));
    const baseCrit = this.upgradeManager.getModifier('critChance');
    const prosperity = this.upgradeManager.getModifier('prosperity');
    const prosperityCrit = Math.min(prosperity, PROSPERITY_CONFIG.maxProsperity) * PROSPERITY_CONFIG.critBonusPerPoint;
    const totalCrit = baseCrit + prosperityCrit;
    if (totalCrit !== 0) addStat('Crit Chance', formatPercent(totalCrit));
    const critDamage = this.upgradeManager.getModifier('critDamage');
    if (critDamage !== 0) addStat('Crit Damage', `+${critDamage.toFixed(1)}x`);
    const piercing = this.upgradeManager.getModifier('piercing');
    if (piercing !== 0) addStat('Pierce', formatFlat(piercing));
    const explosionRadius = this.upgradeManager.getModifier('explosionRadius');
    if (explosionRadius !== 0) addStat('Explosion', `${explosionRadius}px`);
    const projectileCount = this.upgradeManager.getModifier('projectileCount');
    if (projectileCount !== 0) addStat('Multi-shot', formatFlat(projectileCount));
    y += 8;

    // Defense stats
    addHeader('DEFENSE');
    const maxHealth = this.upgradeManager.getModifier('maxHealth');
    if (maxHealth !== 0) addStat('Max Health', formatFlat(maxHealth));
    const shieldCharges = this.upgradeManager.getModifier('shieldCharges');
    if (shieldCharges !== 0) addStat('Shields', `${shieldCharges} charges`);
    const vampirism = this.upgradeManager.getModifier('vampirism');
    if (vampirism !== 0) addStat('Lifesteal', formatPercent(vampirism));
    y += 8;

    // Movement stats
    addHeader('MOVEMENT');
    const moveSpeed = this.upgradeManager.getModifier('moveSpeed');
    if (moveSpeed !== 0) addStat('Speed', formatPercent(moveSpeed));
    const jumpHeight = this.upgradeManager.getModifier('jumpHeight');
    if (jumpHeight !== 0) addStat('Jump', formatPercent(jumpHeight));
    y += 8;

    // Special stats
    addHeader('SPECIAL');
    if (prosperity !== 0) addStat('Prosperity', formatFlat(prosperity));
    const companionCount = this.upgradeManager.getModifier('companionCount');
    if (companionCount !== 0) addStat('Companions', formatFlat(companionCount));
    const maxQuills = this.upgradeManager.getModifier('maxQuills');
    if (maxQuills !== 0) addStat('Max Quills', formatFlat(maxQuills));
    const regenRate = this.upgradeManager.getModifier('regenRate');
    if (regenRate !== 0) addStat('Regen Rate', formatPercent(regenRate));
  }

  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer, centerX: number, barWidth: number): void {
    const relativeX = pointer.x - (centerX - barWidth / 2);
    const newVolume = Phaser.Math.Clamp(relativeX / barWidth, 0, 1);
    AudioManager.setVolume(newVolume);
    this.volumeFill.width = newVolume * barWidth;
    this.volumeText.setText(`${Math.round(newVolume * 100)}%`);
  }

  private updateMuteDisplay(muted: boolean): void {
    this.muteButton.setFillStyle(muted ? 0x884444 : 0x448844);
    this.muteText.setText(muted ? 'OFF' : 'ON');
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
