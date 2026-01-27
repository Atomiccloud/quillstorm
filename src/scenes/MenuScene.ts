import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Title
    this.add.text(centerX, centerY - 150, 'QUILLSTORM', {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(centerX, centerY - 80, 'A Porcupine Roguelike', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Draw a cute porcupine
    this.drawPorcupine(centerX, centerY + 20);

    // Play button
    const playButton = this.add.rectangle(centerX, centerY + 150, 200, 60, 0x4a6741)
      .setInteractive({ useHandCursor: true });

    this.add.text(centerX, centerY + 150, 'PLAY', {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    playButton.on('pointerover', () => {
      playButton.setFillStyle(0x5a7751);
    });

    playButton.on('pointerout', () => {
      playButton.setFillStyle(0x4a6741);
    });

    playButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Controls info
    this.add.text(centerX, GAME_CONFIG.height - 80, 'Controls:', {
      fontSize: '20px',
      color: '#888888',
    }).setOrigin(0.5);

    this.add.text(centerX, GAME_CONFIG.height - 50, 'WASD / Arrows: Move  |  Space: Jump  |  Mouse: Aim & Shoot', {
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);
  }

  drawPorcupine(x: number, y: number): void {
    const graphics = this.add.graphics();

    // Body (oval)
    graphics.fillStyle(COLORS.player.full);
    graphics.fillEllipse(x, y, 80, 50);

    // Quills on back
    graphics.fillStyle(0xffffff);
    for (let i = -4; i <= 4; i++) {
      const angle = (i * 15 - 90) * Math.PI / 180;
      const startX = x + Math.cos(angle) * 25;
      const startY = y + Math.sin(angle) * 20;
      const endX = x + Math.cos(angle) * 50;
      const endY = y + Math.sin(angle) * 40;

      graphics.lineStyle(3, 0xffffff);
      graphics.beginPath();
      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);
      graphics.strokePath();
    }

    // Face
    graphics.fillStyle(0x6b5344);
    graphics.fillEllipse(x + 30, y + 5, 30, 25);

    // Eye
    graphics.fillStyle(0x000000);
    graphics.fillCircle(x + 38, y, 5);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(x + 40, y - 2, 2);

    // Nose
    graphics.fillStyle(0x000000);
    graphics.fillCircle(x + 48, y + 5, 4);

    // Legs
    graphics.fillStyle(COLORS.player.full);
    graphics.fillRect(x - 20, y + 20, 12, 15);
    graphics.fillRect(x + 8, y + 20, 12, 15);
  }
}
