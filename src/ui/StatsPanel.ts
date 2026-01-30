import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, PROSPERITY_CONFIG } from '../config';
import { UpgradeManager } from '../systems/UpgradeManager';

export class StatsPanel {
  private scene: Phaser.Scene;
  private upgradeManager: UpgradeManager;
  private container: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  // UI elements
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private statTexts: Phaser.GameObjects.Text[] = [];

  // Panel dimensions
  private readonly PANEL_WIDTH = 280;
  private readonly PANEL_PADDING = 16;
  private readonly LINE_HEIGHT = 24;

  constructor(scene: Phaser.Scene, upgradeManager: UpgradeManager) {
    this.scene = scene;
    this.upgradeManager = upgradeManager;

    // Create container positioned on the right side
    this.container = scene.add.container(
      GAME_CONFIG.width - this.PANEL_WIDTH - 20,
      80
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(200);
    this.container.setVisible(false);

    this.createUI();
  }

  private createUI(): void {
    // Background
    this.background = this.scene.add.graphics();
    this.container.add(this.background);

    // Title
    this.titleText = this.scene.add.text(
      this.PANEL_PADDING,
      this.PANEL_PADDING,
      'STATS',
      {
        fontSize: '24px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.container.add(this.titleText);

    // Initial draw
    this.updateStats();
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
    if (this.isVisible) {
      this.updateStats();
    }
  }

  show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.updateStats();
  }

  hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  updateStats(): void {
    // Clear old stat texts
    this.statTexts.forEach(text => text.destroy());
    this.statTexts = [];

    // Get all stats organized by category
    const stats = this.getOrganizedStats();

    let yOffset = this.PANEL_PADDING + 40; // Below title

    // Draw each category
    for (const category of stats) {
      if (category.items.length === 0) continue;

      // Category header
      const headerText = this.scene.add.text(
        this.PANEL_PADDING,
        yOffset,
        category.name,
        {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: '#888888',
        }
      );
      this.container.add(headerText);
      this.statTexts.push(headerText);
      yOffset += this.LINE_HEIGHT;

      // Category items
      for (const item of category.items) {
        // Stat name (left aligned)
        const nameText = this.scene.add.text(
          this.PANEL_PADDING + 10,
          yOffset,
          item.name,
          {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
          }
        );
        this.container.add(nameText);
        this.statTexts.push(nameText);

        // Stat value (right aligned)
        const valueColor = item.value.startsWith('-') ? '#ff6666' : '#66ff66';
        const valueText = this.scene.add.text(
          this.PANEL_WIDTH - this.PANEL_PADDING,
          yOffset,
          item.value,
          {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: valueColor,
          }
        ).setOrigin(1, 0);
        this.container.add(valueText);
        this.statTexts.push(valueText);

        yOffset += this.LINE_HEIGHT;
      }

      yOffset += 8; // Gap between categories
    }

    // Redraw background to fit content
    const panelHeight = yOffset + this.PANEL_PADDING;
    this.background.clear();
    this.background.fillStyle(0x1a1a2e, 0.92);
    this.background.fillRoundedRect(0, 0, this.PANEL_WIDTH, panelHeight, 8);
    this.background.lineStyle(2, COLORS.rarity.legendary, 0.8);
    this.background.strokeRoundedRect(0, 0, this.PANEL_WIDTH, panelHeight, 8);
  }

  private getOrganizedStats(): { name: string; items: { name: string; value: string }[] }[] {
    const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const formatFlat = (v: number) => `${v >= 0 ? '+' : ''}${v}`;

    const combat: { name: string; value: string }[] = [];
    const defense: { name: string; value: string }[] = [];
    const movement: { name: string; value: string }[] = [];
    const special: { name: string; value: string }[] = [];

    // Combat stats
    const damage = this.upgradeManager.getModifier('damage');
    if (damage !== 0) combat.push({ name: 'Damage', value: formatPercent(damage) });

    const fireRate = this.upgradeManager.getModifier('fireRate');
    if (fireRate !== 0) combat.push({ name: 'Fire Rate', value: formatPercent(fireRate) });

    // Calculate effective crit chance (base + prosperity bonus)
    const baseCrit = this.upgradeManager.getModifier('critChance');
    const prosperity = this.upgradeManager.getModifier('prosperity');
    const prosperityCrit = Math.min(prosperity, PROSPERITY_CONFIG.maxProsperity) * PROSPERITY_CONFIG.critBonusPerPoint;
    const totalCrit = baseCrit + prosperityCrit;
    if (totalCrit !== 0) combat.push({ name: 'Crit Chance', value: formatPercent(totalCrit) });

    const critDamage = this.upgradeManager.getModifier('critDamage');
    if (critDamage !== 0) combat.push({ name: 'Crit Damage', value: `+${critDamage.toFixed(1)}x` });

    const piercing = this.upgradeManager.getModifier('piercing');
    if (piercing !== 0) combat.push({ name: 'Pierce', value: formatFlat(piercing) });

    const bouncing = this.upgradeManager.getModifier('bouncing');
    if (bouncing !== 0) combat.push({ name: 'Bounces', value: formatFlat(bouncing) });

    const explosionRadius = this.upgradeManager.getModifier('explosionRadius');
    if (explosionRadius !== 0) combat.push({ name: 'Explosion', value: `${explosionRadius}px` });

    const homingStrength = this.upgradeManager.getModifier('homingStrength');
    if (homingStrength !== 0) combat.push({ name: 'Homing', value: formatPercent(homingStrength) });

    const projectileCount = this.upgradeManager.getModifier('projectileCount');
    if (projectileCount !== 0) combat.push({ name: 'Multi-shot', value: formatFlat(projectileCount) });

    // Defense stats
    const maxHealth = this.upgradeManager.getModifier('maxHealth');
    if (maxHealth !== 0) defense.push({ name: 'Max Health', value: formatFlat(maxHealth) });

    const shieldCharges = this.upgradeManager.getModifier('shieldCharges');
    if (shieldCharges !== 0) defense.push({ name: 'Shields', value: `${shieldCharges} charges` });

    const vampirism = this.upgradeManager.getModifier('vampirism');
    if (vampirism !== 0) defense.push({ name: 'Lifesteal', value: formatPercent(vampirism) });

    // Movement stats
    const moveSpeed = this.upgradeManager.getModifier('moveSpeed');
    if (moveSpeed !== 0) movement.push({ name: 'Speed', value: formatPercent(moveSpeed) });

    const jumpHeight = this.upgradeManager.getModifier('jumpHeight');
    if (jumpHeight !== 0) movement.push({ name: 'Jump', value: formatPercent(jumpHeight) });

    // Special stats
    if (prosperity !== 0) special.push({ name: 'Prosperity', value: formatFlat(prosperity) });

    const companionCount = this.upgradeManager.getModifier('companionCount');
    if (companionCount !== 0) special.push({ name: 'Companions', value: formatFlat(companionCount) });

    const maxQuills = this.upgradeManager.getModifier('maxQuills');
    if (maxQuills !== 0) special.push({ name: 'Max Quills', value: formatFlat(maxQuills) });

    const regenRate = this.upgradeManager.getModifier('regenRate');
    if (regenRate !== 0) special.push({ name: 'Regen Rate', value: formatPercent(regenRate) });

    const projectileSize = this.upgradeManager.getModifier('projectileSize');
    if (projectileSize !== 0) special.push({ name: 'Quill Size', value: formatPercent(projectileSize) });

    return [
      { name: 'COMBAT', items: combat },
      { name: 'DEFENSE', items: defense },
      { name: 'MOVEMENT', items: movement },
      { name: 'SPECIAL', items: special },
    ];
  }

  destroy(): void {
    this.container.destroy();
  }
}
