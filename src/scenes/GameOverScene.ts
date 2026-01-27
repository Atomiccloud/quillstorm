import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

interface GameOverData {
  score: number;
  wave: number;
  victory: boolean;
  isNewHighScore?: boolean;
  highScore?: number;
  highestWave?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    const title = data.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.victory ? '#ffaa00' : '#ff4444';

    // Title
    this.add.text(centerX, centerY - 150, title, {
      fontSize: '64px',
      fontFamily: 'Arial Black, sans-serif',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // New high score banner
    if (data.isNewHighScore) {
      const banner = this.add.text(centerX, centerY - 80, 'NEW HIGH SCORE!', {
        fontSize: '32px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      // Pulse animation
      this.tweens.add({
        targets: banner,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // Stats
    this.add.text(centerX, centerY - 20, `Wave Reached: ${data.wave}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 20, `Score: ${data.score}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // High score display
    if (data.highScore !== undefined) {
      this.add.text(centerX, centerY + 70, `High Score: ${data.highScore}`, {
        fontSize: '22px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      this.add.text(centerX, centerY + 100, `Best Wave: ${data.highestWave}`, {
        fontSize: '22px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Buttons
    const retryButton = this.add.rectangle(centerX - 110, centerY + 170, 180, 50, 0x4a6741)
      .setInteractive({ useHandCursor: true });

    this.add.text(centerX - 110, centerY + 170, 'RETRY', {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    const menuButton = this.add.rectangle(centerX + 110, centerY + 170, 180, 50, 0x555555)
      .setInteractive({ useHandCursor: true });

    this.add.text(centerX + 110, centerY + 170, 'MENU', {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Button interactions
    retryButton.on('pointerover', () => retryButton.setFillStyle(0x5a7751));
    retryButton.on('pointerout', () => retryButton.setFillStyle(0x4a6741));
    retryButton.on('pointerdown', () => this.scene.start('GameScene'));

    menuButton.on('pointerover', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x555555));
    menuButton.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
