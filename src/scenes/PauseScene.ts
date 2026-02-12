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
  private confirmGroup: Phaser.GameObjects.Group | null = null;
  private confirmOverlay: Phaser.GameObjects.Rectangle | null = null;

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
      this.showConfirm('Restart this run?', 'Your current progress will be lost.', () => {
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
      });
    });

    menuButton.on('pointerover', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x555555));
    menuButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.showConfirm('Quit to main menu?', 'Your current progress will be lost.', () => {
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      });
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

  private showConfirm(title: string, subtitle: string, onConfirm: () => void): void {
    if (this.confirmGroup) return;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Darken overlay to focus on dialog
    this.confirmOverlay = this.add.rectangle(centerX, centerY, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.5);
    this.confirmOverlay.setInteractive();
    this.confirmOverlay.setDepth(100);

    this.confirmGroup = this.add.group();

    const panel = this.add.rectangle(centerX, centerY, 320, 180, 0x1a1a2e, 0.95).setStrokeStyle(2, 0x555555).setDepth(101);
    const titleText = this.add.text(centerX, centerY - 50, title, {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);
    const subText = this.add.text(centerX, centerY - 18, subtitle, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(101);

    const confirmBtn = this.add.rectangle(centerX - 70, centerY + 40, 120, 44, 0x8b2020).setDepth(101);
    confirmBtn.setInteractive({ useHandCursor: true });
    const confirmLabel = this.add.text(centerX - 70, centerY + 40, 'Confirm', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);

    const cancelBtn = this.add.rectangle(centerX + 70, centerY + 40, 120, 44, 0x555555).setDepth(101);
    cancelBtn.setInteractive({ useHandCursor: true });
    const cancelLabel = this.add.text(centerX + 70, centerY + 40, 'Cancel', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);

    confirmBtn.on('pointerover', () => confirmBtn.setFillStyle(0xa52a2a));
    confirmBtn.on('pointerout', () => confirmBtn.setFillStyle(0x8b2020));
    confirmBtn.on('pointerdown', () => {
      AudioManager.playButtonClick();
      onConfirm();
    });

    cancelBtn.on('pointerover', () => cancelBtn.setFillStyle(0x666666));
    cancelBtn.on('pointerout', () => cancelBtn.setFillStyle(0x555555));
    cancelBtn.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.dismissConfirm();
    });

    this.confirmGroup.addMultiple([panel, titleText, subText, confirmBtn, confirmLabel, cancelBtn, cancelLabel]);
  }

  private dismissConfirm(): void {
    if (this.confirmGroup) {
      this.confirmGroup.clear(true, true);
      this.confirmGroup = null;
    }
    if (this.confirmOverlay) {
      this.confirmOverlay.destroy();
      this.confirmOverlay = null;
    }
  }

  private resumeGame(): void {
    this.statsPanel?.destroy();
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
