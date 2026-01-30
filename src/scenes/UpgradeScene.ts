import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, UPGRADE_CONFIG } from '../config';
import { Upgrade, getRandomUpgrades, RarityWeights, UpgradeSelectionOptions } from '../data/upgrades';
import { UpgradeManager } from '../systems/UpgradeManager';
import { AudioManager } from '../systems/AudioManager';

interface UpgradeSceneData {
  upgradeManager: UpgradeManager;
  playerStats: { health: number; maxHealth: number };
  wave: number;
  source?: 'wave' | 'chest' | 'levelup';
  customWeights?: Partial<RarityWeights>;
  guaranteeRareOrBetter?: boolean;
}

export class UpgradeScene extends Phaser.Scene {
  private upgradeManager!: UpgradeManager;

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create(data: UpgradeSceneData): void {
    this.upgradeManager = data.upgradeManager;
    const source = data.source || 'wave';

    const centerX = GAME_CONFIG.width / 2;

    // Title based on source
    const titleText = this.getTitleForSource(source, data.wave);
    const titleColor = this.getTitleColorForSource(source);

    this.add.text(centerX, 60, titleText, {
      fontSize: '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: titleColor,
    }).setOrigin(0.5);

    this.add.text(centerX, 110, 'Choose an upgrade:', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Get random upgrades with optional custom weights
    const options: UpgradeSelectionOptions = {};
    if (data.customWeights) {
      options.customWeights = data.customWeights;
    }
    if (data.guaranteeRareOrBetter) {
      options.guaranteeRareOrBetter = true;
    }

    const upgrades = getRandomUpgrades(UPGRADE_CONFIG.choicesPerUpgrade, this.upgradeManager, options);

    // Display upgrade cards
    const cardWidth = 280;
    const cardHeight = 380;
    const cardSpacing = 40;
    const totalWidth = (cardWidth * upgrades.length) + (cardSpacing * (upgrades.length - 1));
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    upgrades.forEach((upgrade, index) => {
      this.createUpgradeCard(
        startX + index * (cardWidth + cardSpacing),
        GAME_CONFIG.height / 2 + 30,
        cardWidth,
        cardHeight,
        upgrade
      );
    });
  }

  createUpgradeCard(x: number, y: number, width: number, height: number, upgrade: Upgrade): void {
    const rarityColor = COLORS.rarity[upgrade.rarity];

    // Card background
    const card = this.add.rectangle(x, y, width, height, 0x2a2a3e)
      .setStrokeStyle(3, rarityColor)
      .setInteractive({ useHandCursor: true });

    // Rarity banner
    this.add.rectangle(x, y - height / 2 + 25, width - 10, 40, rarityColor, 0.3);

    // Rarity text
    this.add.text(x, y - height / 2 + 25, upgrade.rarity.toUpperCase(), {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#' + rarityColor.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    // Icon (simple shape based on type)
    this.drawUpgradeIcon(x, y - height / 2 + 90, upgrade);

    // Name
    this.add.text(x, y - 30, upgrade.name, {
      fontSize: '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      wordWrap: { width: width - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Description
    this.add.text(x, y + 40, upgrade.description, {
      fontSize: '16px',
      color: '#cccccc',
      wordWrap: { width: width - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Effect preview
    const effectText = this.getEffectPreview(upgrade);
    this.add.text(x, y + height / 2 - 50, effectText, {
      fontSize: '14px',
      color: '#88ff88',
      wordWrap: { width: width - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Hover effects
    card.on('pointerover', () => {
      card.setFillStyle(0x3a3a4e);
      card.setScale(1.02);
    });

    card.on('pointerout', () => {
      card.setFillStyle(0x2a2a3e);
      card.setScale(1);
    });

    card.on('pointerdown', () => {
      this.selectUpgrade(upgrade);
    });
  }

  drawUpgradeIcon(x: number, y: number, upgrade: Upgrade): void {
    const graphics = this.add.graphics();
    const iconColor = 0xffffff;

    graphics.fillStyle(iconColor, 0.8);

    // Different icons based on upgrade category
    if (upgrade.id.includes('damage') || upgrade.id.includes('crit')) {
      // Sword/damage icon
      graphics.fillTriangle(x, y - 25, x - 15, y + 15, x + 15, y + 15);
    } else if (upgrade.id.includes('quill') || upgrade.id.includes('multi')) {
      // Quill icon
      for (let i = -1; i <= 1; i++) {
        graphics.fillRect(x + i * 12 - 2, y - 20, 4, 40);
        graphics.fillTriangle(x + i * 12, y - 25, x + i * 12 - 5, y - 15, x + i * 12 + 5, y - 15);
      }
    } else if (upgrade.id.includes('speed') || upgrade.id.includes('fire')) {
      // Speed/lightning icon
      graphics.fillTriangle(x - 10, y - 20, x + 5, y - 5, x - 5, y - 5);
      graphics.fillTriangle(x - 5, y - 5, x + 10, y + 20, x + 5, y - 5);
    } else if (upgrade.id.includes('regen') || upgrade.id.includes('health')) {
      // Heart/health icon
      graphics.fillCircle(x - 10, y - 5, 12);
      graphics.fillCircle(x + 10, y - 5, 12);
      graphics.fillTriangle(x - 20, y, x + 20, y, x, y + 25);
    } else if (upgrade.effects.prosperity) {
      // Prosperity: golden clover/coin icon
      graphics.fillStyle(0xffd700, 0.9);
      // Four leaf clover shape
      graphics.fillCircle(x, y - 12, 10);
      graphics.fillCircle(x - 12, y, 10);
      graphics.fillCircle(x + 12, y, 10);
      graphics.fillCircle(x, y + 12, 10);
      graphics.fillCircle(x, y, 8);
    } else {
      // Default star icon
      this.drawStar(graphics, x, y, 5, 20, 10);
    }
  }

  drawStar(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      graphics.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      graphics.lineTo(x, y);
      rot += step;
    }

    graphics.lineTo(cx, cy - outerRadius);
    graphics.closePath();
    graphics.fillPath();
  }

  getEffectPreview(upgrade: Upgrade): string {
    const effects: string[] = [];

    if (upgrade.effects.damage) {
      const val = upgrade.effects.damage;
      effects.push(`Damage: ${val > 0 ? '+' : ''}${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.fireRate) {
      const val = upgrade.effects.fireRate;
      effects.push(`Fire Rate: ${val > 0 ? '+' : ''}${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.maxQuills) {
      effects.push(`Max Quills: +${upgrade.effects.maxQuills}`);
    }
    if (upgrade.effects.regenRate) {
      const val = upgrade.effects.regenRate;
      effects.push(`Regen: ${val > 0 ? '+' : ''}${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.moveSpeed) {
      const val = upgrade.effects.moveSpeed;
      effects.push(`Speed: ${val > 0 ? '+' : ''}${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.projectileCount) {
      effects.push(`+${upgrade.effects.projectileCount} projectiles`);
    }
    if (upgrade.effects.critChance) {
      effects.push(`Crit: +${Math.round(upgrade.effects.critChance * 100)}%`);
    }
    if (upgrade.effects.piercing) {
      effects.push(`Pierce: +${upgrade.effects.piercing} enemies`);
    }
    if (upgrade.effects.maxHealth) {
      effects.push(`Max HP: +${upgrade.effects.maxHealth}`);
    }
    if (upgrade.effects.prosperity) {
      effects.push(`Prosperity: +${upgrade.effects.prosperity}`);
    }
    if (upgrade.effects.shieldCharges) {
      effects.push(`Shield: +${upgrade.effects.shieldCharges} charges`);
    }
    if (upgrade.effects.companionCount) {
      effects.push(`Companions: +${upgrade.effects.companionCount}`);
    }
    if (upgrade.effects.vampirism) {
      effects.push(`Lifesteal: +${Math.round(upgrade.effects.vampirism * 100)}%`);
    }
    if (upgrade.effects.explosionRadius) {
      effects.push(`Explosion: ${upgrade.effects.explosionRadius}px`);
    }
    if (upgrade.effects.homingStrength) {
      effects.push(`Homing: +${Math.round(upgrade.effects.homingStrength * 100)}%`);
    }

    return effects.join('\n') || 'Special effect';
  }

  selectUpgrade(upgrade: Upgrade): void {
    AudioManager.playUpgradeSelect();
    this.upgradeManager.addUpgrade(upgrade);
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  private getTitleForSource(source: 'wave' | 'chest' | 'levelup', wave: number): string {
    switch (source) {
      case 'chest':
        return 'TREASURE FOUND!';
      case 'levelup':
        return 'LEVEL UP!';
      case 'wave':
      default:
        return `WAVE ${wave} COMPLETE!`;
    }
  }

  private getTitleColorForSource(source: 'wave' | 'chest' | 'levelup'): string {
    switch (source) {
      case 'chest':
        return '#ffd700'; // Gold for treasure
      case 'levelup':
        return '#00ffff'; // Cyan for level up
      case 'wave':
      default:
        return '#ffffff'; // White for wave complete
    }
  }
}
