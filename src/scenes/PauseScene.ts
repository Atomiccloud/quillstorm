import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
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
      this.statsPanel = new StatsPanel(this, this.upgradeManager);
      this.statsPanel.show();
    }
  }

  private resumeGame(): void {
    this.statsPanel?.destroy();
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
