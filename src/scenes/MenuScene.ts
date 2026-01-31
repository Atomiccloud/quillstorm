import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { AuthManager } from '../systems/AuthManager';

export class MenuScene extends Phaser.Scene {
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Initialize audio context on scene create (needed for volume controls)
    AudioManager.initialize();
    // Initialize Firebase Auth
    AuthManager.initialize();

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
      AudioManager.resume();
      AudioManager.playButtonClick();
      this.scene.start('GameScene');
    });

    // Shop button
    const shopButton = this.add.rectangle(centerX, centerY + 220, 120, 40, 0x8b4513)
      .setInteractive({ useHandCursor: true });

    this.add.text(centerX, centerY + 220, 'SHOP', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    shopButton.on('pointerover', () => {
      shopButton.setFillStyle(0xa0522d);
    });

    shopButton.on('pointerout', () => {
      shopButton.setFillStyle(0x8b4513);
    });

    shopButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.scene.start('ShopScene');
    });

    // Leaderboard button
    const leaderboardButton = this.add.rectangle(centerX, centerY + 270, 160, 40, 0x444477)
      .setInteractive({ useHandCursor: true });

    this.add.text(centerX, centerY + 270, 'LEADERBOARD', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    leaderboardButton.on('pointerover', () => {
      leaderboardButton.setFillStyle(0x555588);
    });

    leaderboardButton.on('pointerout', () => {
      leaderboardButton.setFillStyle(0x444477);
    });

    leaderboardButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.scene.start('LeaderboardScene');
    });

    // Account button (top right)
    const accountButton = this.add.rectangle(GAME_CONFIG.width - 80, 35, 130, 40, 0x555577)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    const accountText = this.add.text(GAME_CONFIG.width - 80, 35,
      AuthManager.isSignedIn() ? AuthManager.getDisplayName() : 'Account', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(11);

    accountButton.on('pointerover', () => accountButton.setFillStyle(0x666688));
    accountButton.on('pointerout', () => accountButton.setFillStyle(0x555577));
    accountButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.scene.start('LoginScene');
    });

    // Update account button text when auth state changes
    AuthManager.onAuthStateChanged((user) => {
      if (user) {
        accountText.setText(user.displayName?.split(' ')[0] || 'Account');
      } else {
        accountText.setText('Account');
      }
    });

    // Volume controls section
    this.createVolumeControls(centerX, centerY + 320);

    // Controls info
    this.add.text(centerX, GAME_CONFIG.height - 40, 'WASD / Arrows: Move  |  Space: Jump  |  Mouse: Aim & Shoot  |  M: Mute', {
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);

    // M key to toggle mute
    this.input.keyboard?.on('keydown-M', () => {
      const muted = AudioManager.toggleMute();
      this.updateMuteDisplay(muted);
    });
  }

  private createVolumeControls(centerX: number, y: number): void {
    // Volume label
    this.add.text(centerX - 150, y, 'Volume', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    // Volume bar background
    const barWidth = 120;
    const barHeight = 12;
    const barX = centerX - 30;
    const volumeBarBg = this.add.rectangle(barX, y, barWidth, barHeight, 0x333333);
    volumeBarBg.setInteractive({ useHandCursor: true });

    // Volume bar fill
    const currentVolume = AudioManager.getVolume();
    this.volumeFill = this.add.rectangle(
      barX - barWidth / 2,
      y,
      currentVolume * barWidth,
      barHeight,
      0x4a6741
    ).setOrigin(0, 0.5);

    // Volume percentage text
    this.volumeText = this.add.text(barX + barWidth / 2 + 10, y, `${Math.round(currentVolume * 100)}%`, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Mute button
    const isMuted = AudioManager.getMuted();
    this.muteButton = this.add.rectangle(centerX + 100, y, 50, 24, isMuted ? 0x884444 : 0x448844);
    this.muteButton.setInteractive({ useHandCursor: true });
    this.muteText = this.add.text(centerX + 100, y, isMuted ? 'MUTE' : 'ON', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Click volume bar to adjust
    volumeBarBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.updateVolumeFromPointer(pointer, barX, barWidth);
    });
    volumeBarBg.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.updateVolumeFromPointer(pointer, barX, barWidth);
      }
    });

    // Mute button click
    this.muteButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      const muted = AudioManager.toggleMute();
      this.updateMuteDisplay(muted);
    });
  }

  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer, barX: number, barWidth: number): void {
    const relativeX = pointer.x - (barX - barWidth / 2);
    const newVolume = Phaser.Math.Clamp(relativeX / barWidth, 0, 1);
    AudioManager.setVolume(newVolume);
    this.volumeFill.width = newVolume * barWidth;
    this.volumeText.setText(`${Math.round(newVolume * 100)}%`);
  }

  private updateMuteDisplay(muted: boolean): void {
    this.muteButton.setFillStyle(muted ? 0x884444 : 0x448844);
    this.muteText.setText(muted ? 'MUTE' : 'ON');
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
