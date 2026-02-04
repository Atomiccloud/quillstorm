import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { AuthManager } from '../systems/AuthManager';
import { PlayerDataManager } from '../systems/PlayerDataManager';
import { GAME_VERSION } from '../data/version';
import { ChangelogModal } from '../ui/ChangelogModal';

export class MenuScene extends Phaser.Scene {
  private volumeFill!: Phaser.GameObjects.Rectangle;
  private volumeText!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Rectangle;
  private muteText!: Phaser.GameObjects.Text;
  private changelogModal!: ChangelogModal;

  // Volume slider drag tracking
  private isDraggingVolume: boolean = false;
  private volumeBarX: number = 0;
  private volumeBarWidth: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Initialize audio context on scene create (needed for volume controls)
    AudioManager.initialize();
    // Initialize Firebase Auth
    AuthManager.initialize();
    // Initialize player data sync (auth state listener + offline queue)
    PlayerDataManager.initialize();
    // Sync player data if due (handles returning from game, offline queue retry)
    PlayerDataManager.syncIfNeeded();

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Title
    this.add.text(centerX, centerY - 280, 'QUILLSTORM', {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(centerX, centerY - 215, 'A Porcupine Roguelike', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Mascot image
    this.add.image(centerX, centerY - 10, 'mascot').setScale(0.4);

    // Play button
    const playBtnY = centerY + 150;
    this.createRoundedButton(centerX, playBtnY, 220, 56, 12, 0x4a6741, 0x5a7751, 'PLAY', '30px', () => {
      AudioManager.resume();
      AudioManager.playButtonClick();
      this.scene.start('GameScene');
    });

    // Shop and Leaderboard side by side
    const secondRowY = playBtnY + 85;
    const btnWidth = 190;
    const gap = 20;

    this.createRoundedButton(centerX - btnWidth / 2 - gap / 2, secondRowY, btnWidth, 46, 10, 0x8b4513, 0xa0522d, 'SHOP', '20px', () => {
      AudioManager.playButtonClick();
      this.scene.start('ShopScene');
    });

    this.createRoundedButton(centerX + btnWidth / 2 + gap / 2, secondRowY, btnWidth, 46, 10, 0x444477, 0x555588, 'LEADERBOARD', '20px', () => {
      AudioManager.playButtonClick();
      this.scene.start('LeaderboardScene', { returnScene: 'MenuScene' });
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
    this.add.text(centerX, GAME_CONFIG.height - 40, 'WASD / Arrows: Move  |  Space: Jump  |  Mouse: Aim & Shoot  |  Tab: Stats  |  M: Mute', {
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);

    // Version number (bottom right, clickable for changelog)
    const versionText = this.add.text(GAME_CONFIG.width - 15, GAME_CONFIG.height - 15, `v${GAME_VERSION}`, {
      fontSize: '14px',
      color: '#555555',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    versionText.on('pointerover', () => versionText.setColor('#888888'));
    versionText.on('pointerout', () => versionText.setColor('#555555'));
    versionText.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.changelogModal.show();
    });

    // Changelog modal
    this.changelogModal = new ChangelogModal(this, () => { });
    this.add.existing(this.changelogModal);

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
    this.volumeBarX = barX;
    this.volumeBarWidth = barWidth;

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

    // Start dragging on volume bar
    volumeBarBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDraggingVolume = true;
      this.updateVolumeFromPointer(pointer);
    });

    // Track dragging at scene level (allows dragging outside the bar)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingVolume) {
        this.updateVolumeFromPointer(pointer);
      }
    });

    // Stop dragging when mouse is released anywhere
    this.input.on('pointerup', () => {
      this.isDraggingVolume = false;
    });

    // Mute button click
    this.muteButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      const muted = AudioManager.toggleMute();
      this.updateMuteDisplay(muted);
    });
  }

  private updateVolumeFromPointer(pointer: Phaser.Input.Pointer): void {
    const relativeX = pointer.x - (this.volumeBarX - this.volumeBarWidth / 2);
    const newVolume = Phaser.Math.Clamp(relativeX / this.volumeBarWidth, 0, 1);
    AudioManager.setVolume(newVolume);
    this.volumeFill.width = newVolume * this.volumeBarWidth;
    this.volumeText.setText(`${Math.round(newVolume * 100)}%`);
  }

  private updateMuteDisplay(muted: boolean): void {
    this.muteButton.setFillStyle(muted ? 0x884444 : 0x448844);
    this.muteText.setText(muted ? 'MUTE' : 'ON');
  }

  private createRoundedButton(
    x: number, y: number, w: number, h: number, radius: number,
    color: number, hoverColor: number,
    label: string, fontSize: string,
    onClick: () => void
  ): void {
    const gfx = this.add.graphics();
    const drawBtn = (c: number) => {
      gfx.clear();
      gfx.fillStyle(c);
      gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
    };
    drawBtn(color);

    // Invisible hit area
    const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize,
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    hitZone.on('pointerover', () => drawBtn(hoverColor));
    hitZone.on('pointerout', () => drawBtn(color));
    hitZone.on('pointerdown', onClick);
  }
}
