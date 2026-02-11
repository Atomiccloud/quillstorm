import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SettingsModal } from '../ui/SettingsModal';
import { StatsPanel } from '../ui/StatsPanel';

interface PauseSceneData {
  upgradeManager?: UpgradeManager;
}

export class PauseScene extends Phaser.Scene {
  private upgradeManager: UpgradeManager | null = null;
  private settingsModal!: SettingsModal;
  private statsPanel: StatsPanel | null = null;

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

    // Settings button
    const settingsButton = this.add.rectangle(centerX, centerY + 20, 200, 50, 0x555555);
    settingsButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY + 20, 'Settings', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Restart and Main Menu buttons side by side
    const buttonWidth = 160;
    const buttonGap = 20;
    const buttonY = centerY + 90;

    const restartButton = this.add.rectangle(centerX - buttonWidth / 2 - buttonGap / 2, buttonY, buttonWidth, 50, 0x555555);
    restartButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX - buttonWidth / 2 - buttonGap / 2, buttonY, 'Restart', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const menuButton = this.add.rectangle(centerX + buttonWidth / 2 + buttonGap / 2, buttonY, buttonWidth, 50, 0x555555);
    menuButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX + buttonWidth / 2 + buttonGap / 2, buttonY, 'Main Menu', {
      fontSize: '22px',
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

    settingsButton.on('pointerover', () => settingsButton.setFillStyle(0x666666));
    settingsButton.on('pointerout', () => settingsButton.setFillStyle(0x555555));
    settingsButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.settingsModal.show();
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
      AudioManager.toggleMute();
    });

    // Instructions
    this.add.text(centerX, centerY + 150, 'Press ESC to resume | M to toggle mute', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5);

    // Settings modal
    this.settingsModal = new SettingsModal(this, () => { });
    this.add.existing(this.settingsModal);

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
    // v0.5.0: Crit uses diminishing returns: effective = raw / (raw + 1)
    const rawCrit = this.upgradeManager.getModifier('critChance');
    if (rawCrit > 0) {
      const effectiveCrit = rawCrit / (rawCrit + 1);
      const rawDisplay = Math.round(rawCrit * 100);
      const effectiveDisplay = Math.round(effectiveCrit * 100);
      addStat('Crit', `+${rawDisplay} (${effectiveDisplay}%)`);
    }
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
    const vampStr = this.upgradeManager.getModifier('vampirismStrength');
    if (vampStr > 0) {
      const vampChance = Math.round((vampStr / (vampStr + 20)) * 100);
      const vampHeal = 8 + vampStr * 3;
      addStat('Vampirism', `${vampChance}% / ${vampHeal} HP`);
    }
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
    const prosperity = this.upgradeManager.getModifier('prosperity');
    if (prosperity !== 0) addStat('Prosperity', formatFlat(prosperity));
    const companionCount = this.upgradeManager.getModifier('companionCount');
    if (companionCount !== 0) addStat('Companions', formatFlat(companionCount));
    const maxQuills = this.upgradeManager.getModifier('maxQuills');
    if (maxQuills !== 0) addStat('Max Quills', formatFlat(maxQuills));
    const regenRate = this.upgradeManager.getModifier('regenRate');
    if (regenRate !== 0) addStat('Regen Rate', formatPercent(regenRate));
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
