import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
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
    this.add.text(centerX, centerY - 100, 'PAUSED', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Resume button
    const resumeButton = this.add.rectangle(centerX, centerY, 200, 50, 0x4a6741);
    resumeButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY, 'Resume', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Restart button
    const restartButton = this.add.rectangle(centerX, centerY + 70, 200, 50, 0x555555);
    restartButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY + 70, 'Restart', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Main Menu button
    const menuButton = this.add.rectangle(centerX, centerY + 140, 200, 50, 0x555555);
    menuButton.setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY + 140, 'Main Menu', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Button interactions
    resumeButton.on('pointerover', () => resumeButton.setFillStyle(0x5a7751));
    resumeButton.on('pointerout', () => resumeButton.setFillStyle(0x4a6741));
    resumeButton.on('pointerdown', () => this.resumeGame());

    restartButton.on('pointerover', () => restartButton.setFillStyle(0x666666));
    restartButton.on('pointerout', () => restartButton.setFillStyle(0x555555));
    restartButton.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    menuButton.on('pointerover', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x555555));
    menuButton.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    // Escape to resume
    this.input.keyboard?.on('keydown-ESC', () => {
      this.resumeGame();
    });

    // Instructions
    this.add.text(centerX, centerY + 220, 'Press ESC to resume', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5);
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
