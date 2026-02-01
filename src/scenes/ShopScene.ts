import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { getCosmeticManager, CosmeticManager } from '../systems/CosmeticManager';
import {
  Cosmetic,
  CosmeticCategory,
  getCosmeticsByCategory,
  getCosmeticCost,
  isPurchasable,
  isAchievementUnlock,
} from '../data/cosmetics';

interface ShopCard {
  container: Phaser.GameObjects.Container;
  cosmetic: Cosmetic;
  background: Phaser.GameObjects.Rectangle;
  button: Phaser.GameObjects.Rectangle;
  buttonText: Phaser.GameObjects.Text;
}

export class ShopScene extends Phaser.Scene {
  private cosmeticManager!: CosmeticManager;
  private currentCategory: CosmeticCategory = 'skin';
  private cards: ShopCard[] = [];
  private pineconeText!: Phaser.GameObjects.Text;
  private categoryButtons: Map<CosmeticCategory, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    this.cosmeticManager = getCosmeticManager();
    this.cards = [];
    this.categoryButtons.clear();

    // Background
    this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x1a1a2e
    );

    this.createHeader();
    this.createCategoryTabs();
    this.displayCategory(this.currentCategory);

    // ESC to go back
    this.input.keyboard?.on('keydown-ESC', () => {
      this.goBack();
    });
  }

  private createHeader(): void {
    // Title
    this.add.text(GAME_CONFIG.width / 2, 40, 'SHOP', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Back button
    const backButton = this.add.rectangle(80, 40, 100, 40, 0x555555)
      .setInteractive({ useHandCursor: true });

    this.add.text(80, 40, '< BACK', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0x666666));
    backButton.on('pointerout', () => backButton.setFillStyle(0x555555));
    backButton.on('pointerdown', () => this.goBack());

    // Pinecone counter
    const pineconeCount = this.cosmeticManager.getPinecones();
    this.pineconeText = this.add.text(GAME_CONFIG.width - 30, 40, `${pineconeCount}`, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#daa520',
    }).setOrigin(1, 0.5);

    // Pinecone icon (simple circle)
    this.add.circle(GAME_CONFIG.width - this.pineconeText.width - 50, 40, 12, 0x8b4513);
    this.add.circle(GAME_CONFIG.width - this.pineconeText.width - 50, 40, 8, 0xcd853f);
  }

  private createCategoryTabs(): void {
    const categories: { id: CosmeticCategory; label: string }[] = [
      { id: 'skin', label: 'Skins' },
      { id: 'hat', label: 'Hats' },
      { id: 'quillStyle', label: 'Quills' },
      { id: 'trail', label: 'Trails' },
    ];

    const tabWidth = 140;
    const tabHeight = 40;
    const startX = GAME_CONFIG.width / 2 - (categories.length * tabWidth) / 2 + tabWidth / 2;
    const y = 100;

    categories.forEach((cat, index) => {
      const x = startX + index * tabWidth;
      const isActive = cat.id === this.currentCategory;

      const button = this.add.rectangle(x, y, tabWidth - 10, tabHeight, isActive ? 0x4a6741 : 0x333344)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, y, cat.label, {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: isActive ? '#ffffff' : '#aaaaaa',
      }).setOrigin(0.5);

      button.on('pointerover', () => {
        if (cat.id !== this.currentCategory) {
          button.setFillStyle(0x444455);
        }
      });

      button.on('pointerout', () => {
        if (cat.id !== this.currentCategory) {
          button.setFillStyle(0x333344);
        }
      });

      button.on('pointerdown', () => {
        AudioManager.playButtonClick();
        this.selectCategory(cat.id);
      });

      this.categoryButtons.set(cat.id, button);
    });
  }

  private selectCategory(category: CosmeticCategory): void {
    this.currentCategory = category;

    // Update tab colors
    this.categoryButtons.forEach((button, id) => {
      button.setFillStyle(id === category ? 0x4a6741 : 0x333344);
    });

    // Refresh cards
    this.displayCategory(category);
  }

  private displayCategory(category: CosmeticCategory): void {
    // Clear existing cards
    this.cards.forEach(card => card.container.destroy());
    this.cards = [];

    const cosmetics = getCosmeticsByCategory(category);

    // Grid layout
    const cardWidth = 180;
    const cardHeight = 200;
    const cardsPerRow = 5;
    const startX = GAME_CONFIG.width / 2 - (Math.min(cosmetics.length, cardsPerRow) * cardWidth) / 2 + cardWidth / 2;
    const startY = 250;  // Below category tabs (tabs end at ~120)
    const rowGap = 20;

    cosmetics.forEach((cosmetic, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = startX + col * cardWidth;
      const y = startY + row * (cardHeight + rowGap);

      this.createCard(cosmetic, x, y, cardWidth - 20, cardHeight);
    });
  }

  private createCard(cosmetic: Cosmetic, x: number, y: number, width: number, height: number): void {
    const container = this.add.container(x, y);

    const isUnlocked = this.cosmeticManager.isUnlocked(cosmetic.id);
    const isEquipped = this.cosmeticManager.getEquippedId(cosmetic.category) === cosmetic.id;

    // Card background
    const bgColor = isEquipped ? 0x4a6741 : isUnlocked ? 0x333344 : 0x222233;
    const background = this.add.rectangle(0, 0, width, height, bgColor)
      .setStrokeStyle(2, isEquipped ? 0x88ff88 : 0x555566);
    container.add(background);

    // Preview area (top portion)
    const previewBg = this.add.rectangle(0, -height / 2 + 60, width - 20, 80, 0x1a1a2e);
    container.add(previewBg);

    // Draw cosmetic preview
    this.drawCosmeticPreview(container, cosmetic, 0, -height / 2 + 60);

    // Name
    const name = this.add.text(0, 10, cosmetic.name, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(name);

    // Description
    const desc = this.add.text(0, 35, cosmetic.description, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
      wordWrap: { width: width - 20 },
      align: 'center',
    }).setOrigin(0.5, 0);
    container.add(desc);

    // Action button
    const buttonY = height / 2 - 30;
    let buttonText = '';
    let buttonColor = 0x555555;
    let buttonEnabled = false;

    if (isEquipped) {
      buttonText = 'EQUIPPED';
      buttonColor = 0x4a6741;
      buttonEnabled = false;
    } else if (isUnlocked) {
      buttonText = 'EQUIP';
      buttonColor = 0x4a6741;
      buttonEnabled = true;
    } else if (isPurchasable(cosmetic)) {
      const cost = getCosmeticCost(cosmetic);
      const canAfford = this.cosmeticManager.canAfford(cost);
      buttonText = `${cost}`;
      buttonColor = canAfford ? 0x8b4513 : 0x553322;
      buttonEnabled = canAfford;
    } else if (isAchievementUnlock(cosmetic)) {
      const unlock = cosmetic.unlock as { type: 'achievement'; description: string };
      buttonText = 'LOCKED';
      buttonColor = 0x444444;
      buttonEnabled = false;

      // Show achievement hint
      const hint = this.add.text(0, 70, unlock.description, {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: '#666666',
        wordWrap: { width: width - 10 },
        align: 'center',
      }).setOrigin(0.5, 0);
      container.add(hint);
    }

    const button = this.add.rectangle(0, buttonY, width - 30, 32, buttonColor);
    if (buttonEnabled) {
      button.setInteractive({ useHandCursor: true });
    }
    container.add(button);

    const btnTextObj = this.add.text(0, buttonY, buttonText, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: buttonEnabled ? '#ffffff' : '#888888',
    }).setOrigin(0.5);
    container.add(btnTextObj);

    if (buttonEnabled) {
      button.on('pointerover', () => {
        button.setFillStyle(Phaser.Display.Color.ValueToColor(buttonColor).brighten(20).color);
      });
      button.on('pointerout', () => button.setFillStyle(buttonColor));
      button.on('pointerdown', () => {
        this.onCardAction(cosmetic);
      });
    }

    this.cards.push({ container, cosmetic, background, button, buttonText: btnTextObj });
  }

  private drawCosmeticPreview(container: Phaser.GameObjects.Container, cosmetic: Cosmetic, x: number, y: number): void {
    const graphics = this.add.graphics();
    container.add(graphics);

    const colors = cosmetic.colors || { primary: 0x888888 };

    switch (cosmetic.category) {
      case 'skin':
        // Draw mini porcupine body
        graphics.fillStyle(colors.primary);
        graphics.fillEllipse(x, y, 50, 30);
        // Face
        graphics.fillStyle(colors.secondary || 0x6b5344);
        graphics.fillEllipse(x + 18, y + 2, 18, 15);
        // Eye
        graphics.fillStyle(0x000000);
        graphics.fillCircle(x + 22, y, 3);
        // Quills
        graphics.lineStyle(2, 0xffffff);
        for (let i = -3; i <= 3; i++) {
          const angle = (i * 20 - 90) * Math.PI / 180;
          graphics.beginPath();
          graphics.moveTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 12);
          graphics.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 25);
          graphics.strokePath();
        }
        break;

      case 'hat':
        if (cosmetic.id === 'hat_none') {
          // Draw "no hat" icon
          graphics.lineStyle(2, 0x666666);
          graphics.strokeCircle(x, y, 20);
          graphics.beginPath();
          graphics.moveTo(x - 14, y - 14);
          graphics.lineTo(x + 14, y + 14);
          graphics.strokePath();
        } else if (cosmetic.id === 'hat_crown') {
          graphics.fillStyle(colors.primary);
          graphics.fillRect(x - 20, y - 5, 40, 20);
          // Crown points
          graphics.fillTriangle(x - 18, y - 5, x - 10, y - 5, x - 14, y - 18);
          graphics.fillTriangle(x - 5, y - 5, x + 5, y - 5, x, y - 22);
          graphics.fillTriangle(x + 10, y - 5, x + 18, y - 5, x + 14, y - 18);
          // Gems
          graphics.fillStyle(colors.secondary || 0xff4444);
          graphics.fillCircle(x, y + 3, 4);
        } else if (cosmetic.id === 'hat_wizard') {
          graphics.fillStyle(colors.primary);
          graphics.fillTriangle(x - 20, y + 15, x + 20, y + 15, x, y - 30);
          graphics.fillStyle(colors.secondary || 0xffdd44);
          // Draw a simple star shape
          graphics.fillCircle(x, y - 5, 5);
        } else if (cosmetic.id === 'hat_viking') {
          graphics.fillStyle(colors.primary);
          graphics.fillEllipse(x, y + 5, 40, 20);
          // Horns
          graphics.fillStyle(colors.secondary || 0xcccc99);
          graphics.fillTriangle(x - 25, y + 5, x - 18, y + 5, x - 30, y - 20);
          graphics.fillTriangle(x + 25, y + 5, x + 18, y + 5, x + 30, y - 20);
        } else if (cosmetic.id === 'hat_party') {
          graphics.fillStyle(colors.primary);
          graphics.fillTriangle(x - 15, y + 10, x + 15, y + 10, x, y - 25);
          // Pom pom
          graphics.fillStyle(colors.secondary || 0x44ffaa);
          graphics.fillCircle(x, y - 25, 6);
        } else if (cosmetic.id === 'hat_chef') {
          graphics.fillStyle(colors.primary);
          graphics.fillEllipse(x, y - 10, 35, 25);
          graphics.fillRect(x - 18, y, 36, 15);
        } else if (cosmetic.id === 'hat_halo') {
          graphics.lineStyle(4, colors.primary);
          graphics.strokeEllipse(x, y - 15, 35, 12);
          if (colors.glow) {
            graphics.lineStyle(8, colors.glow, 0.3);
            graphics.strokeEllipse(x, y - 15, 35, 12);
          }
        }
        break;

      case 'quillStyle':
        // Draw quill projectile preview
        const quillColor = colors.primary;
        graphics.fillStyle(quillColor);
        graphics.fillTriangle(x - 25, y, x + 15, y - 4, x + 15, y + 4);
        // Trail effect for some styles
        if (cosmetic.renderData?.trail) {
          graphics.fillStyle(colors.secondary || quillColor, 0.5);
          for (let i = 1; i <= 3; i++) {
            graphics.fillCircle(x - 25 - i * 8, y, 3 - i * 0.5);
          }
        }
        if (cosmetic.renderData?.rainbow) {
          // Rainbow preview - multiple colored quills
          const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
          rainbowColors.forEach((c, i) => {
            graphics.fillStyle(c, 0.7);
            graphics.fillCircle(x - 15 + i * 8, y + 15, 4);
          });
        }
        break;

      case 'trail':
        if (cosmetic.id === 'trail_none') {
          graphics.lineStyle(2, 0x666666);
          graphics.strokeCircle(x, y, 20);
          graphics.beginPath();
          graphics.moveTo(x - 14, y - 14);
          graphics.lineTo(x + 14, y + 14);
          graphics.strokePath();
        } else {
          // Draw trail particles
          const trailColor = colors.primary;
          for (let i = 0; i < 8; i++) {
            const px = x - 30 + i * 8;
            const py = y + Math.sin(i * 0.8) * 5;
            const size = 4 - i * 0.3;
            const alpha = 1 - i * 0.1;
            graphics.fillStyle(trailColor, alpha);
            graphics.fillCircle(px, py, Math.max(1, size));
          }
        }
        break;
    }
  }

  private onCardAction(cosmetic: Cosmetic): void {
    const isUnlocked = this.cosmeticManager.isUnlocked(cosmetic.id);

    if (isUnlocked) {
      // Equip
      AudioManager.playUpgradeSelect();
      this.cosmeticManager.equip(cosmetic.id);
      this.displayCategory(this.currentCategory);
    } else if (isPurchasable(cosmetic)) {
      // Purchase
      const result = this.cosmeticManager.purchase(cosmetic.id);
      if (result.success) {
        AudioManager.playChestOpen();
        this.updatePineconeDisplay();
        this.displayCategory(this.currentCategory);
      } else {
        // Show error feedback
        AudioManager.playPlayerDamage();
      }
    }
  }

  private updatePineconeDisplay(): void {
    const pineconeCount = this.cosmeticManager.getPinecones();
    this.pineconeText.setText(`${pineconeCount}`);
  }

  private goBack(): void {
    AudioManager.playButtonClick();
    this.scene.start('MenuScene');
  }
}
