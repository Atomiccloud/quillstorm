import Phaser from 'phaser';
import { GAME_CONFIG, BOSS_REWARD_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';

interface BossRewardSceneData {
  wave: number;
  playerHealth: number;
  playerMaxHealth: number;
  currentQuills: number;
  maxQuills: number;
}

export type BossRewardChoice =
  | { type: 'restoration'; option: 'health' | 'quills' | 'balance'; balancePercent?: number }
  | { type: 'power' };

export class BossRewardScene extends Phaser.Scene {
  private inputEnabled: boolean = false;
  private static readonly INPUT_DELAY = 400;

  constructor() {
    super({ key: 'BossRewardScene' });
  }

  create(data: BossRewardSceneData): void {
    this.inputEnabled = false;
    this.time.delayedCall(BossRewardScene.INPUT_DELAY, () => {
      this.inputEnabled = true;
    });

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(centerX, centerY, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.75);
    overlay.setInteractive();

    // Title
    this.add.text(centerX, centerY - 200, `BOSS DEFEATED`, {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 150, `Wave ${data.wave} Clear`, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#cccccc',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 110, 'Choose your reward:', {
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Phase 1: Two large cards - Restoration vs Power
    const cardWidth = 280;
    const cardHeight = 300;
    const cardGap = 60;

    this.createForkCard(
      centerX - cardWidth / 2 - cardGap / 2,
      centerY + 30,
      cardWidth,
      cardHeight,
      'RESTORATION',
      'Recover your resources',
      'Choose to restore HP, quills,\nor a balance of both.',
      0x44aa44,
      data,
    );

    this.createForkCard(
      centerX + cardWidth / 2 + cardGap / 2,
      centerY + 30,
      cardWidth,
      cardHeight,
      'POWER',
      'Choose an upgrade',
      'Pick from 3 upgrade cards\nto strengthen your build.',
      0x6644cc,
      data,
    );
  }

  private createForkCard(
    x: number, y: number, width: number, height: number,
    title: string, subtitle: string, description: string,
    color: number, data: BossRewardSceneData,
  ): void {
    const card = this.add.rectangle(x, y, width, height, 0x2a2a3e)
      .setStrokeStyle(3, color)
      .setInteractive({ useHandCursor: true });

    // Title banner
    this.add.rectangle(x, y - height / 2 + 30, width - 10, 50, color, 0.3);

    this.add.text(x, y - height / 2 + 30, title, {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Icon area
    const iconY = y - 30;
    const graphics = this.add.graphics();
    if (title === 'RESTORATION') {
      // Heart icon
      graphics.fillStyle(0xff4444, 0.9);
      graphics.fillCircle(x - 12, iconY - 5, 14);
      graphics.fillCircle(x + 12, iconY - 5, 14);
      graphics.fillTriangle(x - 24, iconY, x + 24, iconY, x, iconY + 25);
    } else {
      // Lightning/power icon
      graphics.fillStyle(0xffdd44, 0.9);
      graphics.fillTriangle(x - 12, iconY - 25, x + 8, iconY - 5, x - 8, iconY - 5);
      graphics.fillTriangle(x - 8, iconY - 5, x + 12, iconY + 25, x + 8, iconY - 5);
    }

    // Subtitle
    this.add.text(x, y + 30, subtitle, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#dddddd',
    }).setOrigin(0.5);

    // Description
    this.add.text(x, y + 80, description, {
      fontSize: '14px',
      color: '#999999',
      align: 'center',
      wordWrap: { width: width - 30 },
    }).setOrigin(0.5);

    // Hover
    card.on('pointerover', () => {
      card.setFillStyle(0x3a3a4e);
      card.setScale(1.02);
    });
    card.on('pointerout', () => {
      card.setFillStyle(0x2a2a3e);
      card.setScale(1);
    });

    card.on('pointerdown', () => {
      if (!this.inputEnabled) return;
      this.inputEnabled = false;
      AudioManager.playButtonClick();

      if (title === 'RESTORATION') {
        this.showRestorationOptions(data);
      } else {
        this.selectChoice({ type: 'power' });
      }
    });
  }

  private showRestorationOptions(data: BossRewardSceneData): void {
    // Clear the scene and show restoration cards
    this.children.removeAll(true);
    this.inputEnabled = false;
    this.time.delayedCall(BossRewardScene.INPUT_DELAY, () => {
      this.inputEnabled = true;
    });

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Overlay
    const overlay = this.add.rectangle(centerX, centerY, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.75);
    overlay.setInteractive();

    // Title
    this.add.text(centerX, centerY - 200, 'RESTORATION', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 150, 'Choose one:', {
      fontSize: '22px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Pre-roll the balance percent
    const balancePercent = BOSS_REWARD_CONFIG.balanceMinPercent +
      Math.random() * (BOSS_REWARD_CONFIG.balanceMaxPercent - BOSS_REWARD_CONFIG.balanceMinPercent);
    const balancePctDisplay = Math.round(balancePercent * 100);

    // Three restoration cards
    const cardWidth = 240;
    const cardHeight = 300;
    const totalWidth = cardWidth * 3 + 50 * 2;
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    // Card 1: Full Health
    const missingHP = data.playerMaxHealth - data.playerHealth;
    this.createRestorationCard(
      startX,
      centerY + 30,
      cardWidth,
      cardHeight,
      'FULL HEALTH',
      `Restore to ${data.playerMaxHealth} HP`,
      missingHP > 0 ? `+${missingHP} HP` : 'Already full!',
      0xff4444,
      { type: 'restoration', option: 'health' },
    );

    // Card 2: Full Quills
    const missingQuills = Math.ceil(data.maxQuills - data.currentQuills);
    this.createRestorationCard(
      startX + cardWidth + 50,
      centerY + 30,
      cardWidth,
      cardHeight,
      'FULL QUILLS',
      `Restore to ${data.maxQuills} quills`,
      missingQuills > 0 ? `+${missingQuills} quills` : 'Already full!',
      0x00ccff,
      { type: 'restoration', option: 'quills' },
    );

    // Card 3: Balance
    const balanceHeal = Math.round(data.playerMaxHealth * balancePercent);
    const balanceQuills = Math.round(data.maxQuills * balancePercent);
    this.createRestorationCard(
      startX + (cardWidth + 50) * 2,
      centerY + 30,
      cardWidth,
      cardHeight,
      'BALANCE',
      `Restore ${balancePctDisplay}% of both`,
      `+${balanceHeal} HP, +${balanceQuills} quills`,
      0xffaa00,
      { type: 'restoration', option: 'balance', balancePercent },
    );
  }

  private createRestorationCard(
    x: number, y: number, width: number, height: number,
    title: string, subtitle: string, effectText: string,
    color: number, choice: BossRewardChoice,
  ): void {
    const card = this.add.rectangle(x, y, width, height, 0x2a2a3e)
      .setStrokeStyle(3, color)
      .setInteractive({ useHandCursor: true });

    // Title banner
    this.add.rectangle(x, y - height / 2 + 25, width - 10, 40, color, 0.3);

    this.add.text(x, y - height / 2 + 25, title, {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Icon
    const iconY = y - 20;
    const graphics = this.add.graphics();
    if (title === 'FULL HEALTH') {
      graphics.fillStyle(0xff4444, 0.9);
      graphics.fillCircle(x - 10, iconY - 4, 12);
      graphics.fillCircle(x + 10, iconY - 4, 12);
      graphics.fillTriangle(x - 20, iconY, x + 20, iconY, x, iconY + 20);
    } else if (title === 'FULL QUILLS') {
      graphics.fillStyle(0x00ccff, 0.9);
      for (let i = -1; i <= 1; i++) {
        graphics.fillRect(x + i * 12 - 2, iconY - 15, 4, 30);
        graphics.fillTriangle(x + i * 12, iconY - 20, x + i * 12 - 5, iconY - 10, x + i * 12 + 5, iconY - 10);
      }
    } else {
      // Balance - yin-yang style split
      graphics.fillStyle(0xff4444, 0.9);
      graphics.fillCircle(x - 8, iconY, 14);
      graphics.fillStyle(0x00ccff, 0.9);
      graphics.fillCircle(x + 8, iconY, 14);
    }

    // Subtitle
    this.add.text(x, y + 40, subtitle, {
      fontSize: '16px',
      color: '#dddddd',
      align: 'center',
      wordWrap: { width: width - 20 },
    }).setOrigin(0.5);

    // Effect preview
    this.add.text(x, y + height / 2 - 50, effectText, {
      fontSize: '15px',
      color: '#88ff88',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
    }).setOrigin(0.5);

    // Hover
    card.on('pointerover', () => {
      card.setFillStyle(0x3a3a4e);
      card.setScale(1.02);
    });
    card.on('pointerout', () => {
      card.setFillStyle(0x2a2a3e);
      card.setScale(1);
    });

    card.on('pointerdown', () => {
      if (!this.inputEnabled) return;
      this.inputEnabled = false;
      AudioManager.playUpgradeSelect();
      this.selectChoice(choice);
    });
  }

  private selectChoice(choice: BossRewardChoice): void {
    // Pass choice back to GameScene via registry
    this.registry.set('bossRewardChoice', choice);
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
