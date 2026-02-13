import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, UPGRADE_CONFIG } from '../config';
import { Upgrade, getRandomUpgrades, RarityWeights, UpgradeSelectionOptions } from '../data/upgrades';
import { UpgradeManager } from '../systems/UpgradeManager';
import { ProgressionManager } from '../systems/ProgressionManager';
import { AudioManager } from '../systems/AudioManager';
import { SessionManager } from '../systems/SessionManager';
import { StatsPanel } from '../ui/StatsPanel';
import { MobileDetector } from '../systems/MobileDetector';

interface UpgradeSceneData {
  upgradeManager: UpgradeManager;
  progressionManager?: ProgressionManager;
  playerStats: { health: number; maxHealth: number };
  wave: number;
  source?: 'wave' | 'chest' | 'levelup';
  customWeights?: Partial<RarityWeights>;
  guaranteeRareOrBetter?: boolean;
}

export class UpgradeScene extends Phaser.Scene {
  private upgradeManager!: UpgradeManager;
  private inputEnabled: boolean = false;
  private statsPanel: StatsPanel | null = null;
  private upgradeSource: 'wave' | 'chest' | 'levelup' = 'wave';
  private static readonly INPUT_DELAY = 400; // ms before cards become clickable

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  create(data: UpgradeSceneData): void {
    this.upgradeManager = data.upgradeManager;
    this.inputEnabled = false;
    const source = data.source || 'wave';
    this.upgradeSource = source;

    // Delay before enabling input to prevent accidental clicks
    this.time.delayedCall(UpgradeScene.INPUT_DELAY, () => {
      this.inputEnabled = true;
    });

    const centerX = GAME_CONFIG.width / 2;

    // Title based on source
    const titleText = this.getTitleForSource(source, data.wave);
    const titleColor = this.getTitleColorForSource(source);

    const m = MobileDetector.showVirtualControls;

    this.add.text(centerX, 100, titleText, {
      fontSize: m ? '50px' : '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: titleColor,
    }).setOrigin(0.5);

    this.add.text(centerX, m ? 160 : 150, 'Choose an upgrade:', {
      fontSize: m ? '34px' : '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Stats panel (Tab to toggle)
    this.statsPanel = new StatsPanel(this, this.upgradeManager);
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.statsPanel?.toggle();
    });

    // Get random upgrades with optional custom weights and prosperity modifier
    const options: UpgradeSelectionOptions = {};
    if (data.customWeights) {
      options.customWeights = data.customWeights;
    }
    if (data.guaranteeRareOrBetter) {
      options.guaranteeRareOrBetter = true;
    }
    if (data.progressionManager) {
      options.progressionManager = data.progressionManager;
    }
    if (data.source) {
      options.source = data.source;
    }

    const extraChoices = Math.floor(this.upgradeManager.getModifier('upgradeChoices'));
    const totalChoices = UPGRADE_CONFIG.choicesPerUpgrade + extraChoices;
    const upgrades = getRandomUpgrades(totalChoices, this.upgradeManager, options);

    // Display upgrade cards
    const cardWidth = m ? 240 : 280;
    const cardHeight = m ? 340 : 380;
    const cardSpacing = m ? 20 : 40;
    const totalWidth = (cardWidth * upgrades.length) + (cardSpacing * (upgrades.length - 1));
    const startX = centerX - totalWidth / 2 + cardWidth / 2;

    upgrades.forEach((upgrade, index) => {
      this.createUpgradeCard(
        startX + index * (cardWidth + cardSpacing),
        GAME_CONFIG.height / 2 + 50,
        cardWidth,
        cardHeight,
        upgrade
      );
    });
  }

  createUpgradeCard(x: number, y: number, width: number, height: number, upgrade: Upgrade): void {
    const rarityColor = COLORS.rarity[upgrade.rarity];
    const m = MobileDetector.showVirtualControls;

    // Card background
    const card = this.add.rectangle(x, y, width, height, 0x2a2a3e)
      .setStrokeStyle(3, rarityColor)
      .setInteractive({ useHandCursor: true });

    // Rarity banner
    this.add.rectangle(x, y - height / 2 + 25, width - 10, 40, rarityColor, 0.3);

    // Rarity text
    this.add.text(x, y - height / 2 + 25, upgrade.rarity.toUpperCase(), {
      fontSize: m ? '20px' : '14px',
      fontFamily: 'Arial',
      color: '#' + rarityColor.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);

    // Icon (simple shape based on type)
    this.drawUpgradeIcon(x, y - height / 2 + 90, upgrade);

    // Name
    this.add.text(x, y - 30, upgrade.name, {
      fontSize: m ? '30px' : '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      wordWrap: { width: width - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Description
    this.add.text(x, y + 40, upgrade.description, {
      fontSize: m ? '22px' : '16px',
      color: '#cccccc',
      wordWrap: { width: width - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Effect preview
    const effectText = this.getEffectPreview(upgrade);
    this.add.text(x, y + height / 2 - 50, effectText, {
      fontSize: m ? '20px' : '14px',
      color: '#88ff88',
      wordWrap: { width: width - 30 },
      align: 'center',
    }).setOrigin(0.5);

    // Hover effects (disabled on touch devices to prevent sticky states)
    if (!MobileDetector.isTouchDevice) {
      card.on('pointerover', () => {
        card.setFillStyle(0x3a3a4e);
        card.setScale(1.02);
      });

      card.on('pointerout', () => {
        card.setFillStyle(0x2a2a3e);
        card.setScale(1);
      });
    }

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
    } else if (upgrade.effects.dangerLevel) {
      // Danger: red skull icon
      graphics.fillStyle(0xff4444, 0.9);
      graphics.fillCircle(x, y - 8, 14);
      graphics.fillRect(x - 8, y, 16, 12);
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(x - 5, y - 10, 3);
      graphics.fillCircle(x + 5, y - 10, 3);
      graphics.fillTriangle(x, y - 4, x - 3, y + 2, x + 3, y + 2);
    } else if (upgrade.effects.eliteDamageBonus) {
      // Elite damage: gold crown + sword
      graphics.fillStyle(0xffd700, 0.9);
      graphics.fillRect(x - 12, y - 5, 24, 8);
      graphics.fillTriangle(x - 12, y - 5, x - 6, y - 18, x, y - 5);
      graphics.fillTriangle(x, y - 5, x + 6, y - 18, x + 12, y - 5);
      graphics.fillStyle(0xcccccc, 0.9);
      graphics.fillRect(x - 2, y + 3, 4, 20);
    } else if (upgrade.effects.upgradeChoices) {
      // Extra choices: triple card icon
      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillRect(x - 18, y - 12, 12, 24);
      graphics.fillRect(x - 6, y - 15, 12, 24);
      graphics.fillRect(x + 6, y - 12, 12, 24);
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
    if (upgrade.effects.jumpHeight) {
      const val = upgrade.effects.jumpHeight;
      effects.push(`Jump: +${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.projectileCount) {
      effects.push(`+${upgrade.effects.projectileCount} projectiles`);
    }
    if (upgrade.effects.projectileSpeed) {
      const val = upgrade.effects.projectileSpeed;
      effects.push(`Quill Speed: +${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.projectileSize) {
      const val = upgrade.effects.projectileSize;
      effects.push(`Quill Size: +${Math.round(val * 100)}%`);
    }
    if (upgrade.effects.critChance) {
      effects.push(`Crit: +${Math.round(upgrade.effects.critChance * 100)}`);
    }
    if (upgrade.effects.critDamage) {
      const val = upgrade.effects.critDamage;
      effects.push(`Crit Dmg: +${val.toFixed(2)}x`);
    }
    if (upgrade.effects.piercing) {
      effects.push(`Pierce: +${upgrade.effects.piercing} enemies`);
    }
    if (upgrade.effects.bouncing) {
      effects.push(`Bounces: +${upgrade.effects.bouncing}`);
    }
    if (upgrade.effects.knockback) {
      effects.push(`Knockback: +${upgrade.effects.knockback}`);
    }
    if (upgrade.effects.distanceDamage) {
      const val = upgrade.effects.distanceDamage;
      effects.push(`Range Dmg: +${Math.round(val * 100)}%`);
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
    if (upgrade.effects.vampirismStrength) {
      effects.push(`Vampirism: +${upgrade.effects.vampirismStrength} strength`);
    }
    if (upgrade.effects.explosionRadius) {
      effects.push(`Explosion: ${upgrade.effects.explosionRadius}px`);
    }
    if (upgrade.effects.homingStrength) {
      effects.push(`Homing: +${Math.round(upgrade.effects.homingStrength * 100)}%`);
    }
    if (upgrade.effects.dangerLevel) {
      effects.push(`Danger: +${upgrade.effects.dangerLevel} level`);
      effects.push(`Enemies: +${upgrade.effects.dangerLevel * 12}% HP`);
      effects.push(`Score: +${upgrade.effects.dangerLevel * 15}%`);
    }
    if (upgrade.effects.eliteDamageBonus) {
      effects.push(`Elite Dmg: +${Math.round(upgrade.effects.eliteDamageBonus * 100)}%`);
    }
    if (upgrade.effects.upgradeChoices) {
      effects.push(`+${upgrade.effects.upgradeChoices} upgrade choice`);
    }
    // Defense stats
    if (upgrade.effects.armor) {
      effects.push(`Armor: +${Math.round(upgrade.effects.armor * 100)}`);
    }
    if (upgrade.effects.evasion) {
      effects.push(`Evasion: +${Math.round(upgrade.effects.evasion * 100)}`);
    }
    if (upgrade.effects.thorns) {
      effects.push(`Thorns: +${upgrade.effects.thorns}`);
    }
    // Elemental effects
    if (upgrade.effects.shockStrength) {
      effects.push(`Shock: +${upgrade.effects.shockStrength} strength`);
    }
    if (upgrade.effects.freezeStrength) {
      effects.push(`Freeze: +${upgrade.effects.freezeStrength} strength`);
    }
    if (upgrade.effects.burnStrength) {
      effects.push(`Burn: +${upgrade.effects.burnStrength} strength`);
    }
    if (upgrade.effects.poisonStrength) {
      effects.push(`Poison: +${upgrade.effects.poisonStrength} strength`);
    }
    // Mythic effects
    if (upgrade.effects.rerollChance) {
      effects.push(`Reroll chance: +${Math.round(upgrade.effects.rerollChance * 100)}%`);
    }
    if (upgrade.effects.apotheosis) {
      effects.push(`Every 5th volley auto-crits`);
    }
    if (upgrade.effects.magnetPulse) {
      effects.push(`Magnetic pulse every 12s`);
    }

    return effects.join('\n') || 'Special effect';
  }

  selectUpgrade(upgrade: Upgrade): void {
    // Prevent selection if input is not yet enabled (spam-click protection)
    if (!this.inputEnabled) return;

    // Disable further input to prevent double-selection
    this.inputEnabled = false;

    AudioManager.playUpgradeSelect();
    this.upgradeManager.addUpgrade(upgrade);
    SessionManager._rp(upgrade.id, this.upgradeSource);
    if (this.statsPanel) {
      this.statsPanel.destroy();
      this.statsPanel = null;
    }
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
        return '#44ff44'; // Green for wave complete
    }
  }
}
