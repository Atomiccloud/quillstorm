import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';

export class PauseScene extends Phaser.Scene {
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteText!: Phaser.GameObjects.Text;

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
