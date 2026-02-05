import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, DANGER_CONFIG, ELITE_CONFIG, STATUS_EFFECT_CONFIG, ARMOR_CONFIG, EVASION_CONFIG } from '../config';
import { UpgradeManager } from '../systems/UpgradeManager';

export class StatsPanel {
  private scene: Phaser.Scene;
  private upgradeManager: UpgradeManager;
  private container: Phaser.GameObjects.Container;
  private scrollContainer: Phaser.GameObjects.Container;
  private isVisible: boolean = false;

  // UI elements
  private background!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private statTexts: Phaser.GameObjects.Text[] = [];
  private scrollMask!: Phaser.GameObjects.Graphics;

  // Panel dimensions
  private readonly PANEL_WIDTH = 220;
  private readonly PANEL_PADDING = 16;
  private readonly LINE_HEIGHT = 22;
  private readonly MAX_PANEL_HEIGHT = 600; // Max height before scrolling

  // Scroll state
  private scrollOffset: number = 0;
  private totalContentHeight: number = 0;
  private scrollListener?: (event: WheelEvent) => void;

  constructor(scene: Phaser.Scene, upgradeManager: UpgradeManager) {
    this.scene = scene;
    this.upgradeManager = upgradeManager;

    // Create main container positioned on the right side
    this.container = scene.add.container(
      GAME_CONFIG.width - this.PANEL_WIDTH - 16,
      80
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(200);
    this.container.setVisible(false);

    // Create scroll container for stats (will be masked)
    this.scrollContainer = scene.add.container(0, 0);
    this.container.add(this.scrollContainer);

    this.createUI();
    this.setupScrolling();
  }

  private createUI(): void {
    // Background (drawn behind scroll container)
    this.background = this.scene.add.graphics();
    this.container.addAt(this.background, 0);

    // Title (fixed, not scrollable)
    this.titleText = this.scene.add.text(
      this.PANEL_PADDING,
      this.PANEL_PADDING,
      'STATS',
      {
        fontSize: '20px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.container.add(this.titleText);

    // Scroll mask (created but applied in updateStats)
    this.scrollMask = this.scene.add.graphics();
    this.scrollMask.setVisible(false);

    // Initial draw
    this.updateStats();
  }

  private setupScrolling(): void {
    // Mouse wheel scrolling
    this.scrollListener = (event: WheelEvent) => {
      if (!this.isVisible) return;

      const maxScroll = Math.max(0, this.totalContentHeight - this.MAX_PANEL_HEIGHT + this.PANEL_PADDING * 2 + 40);
      this.scrollOffset = Phaser.Math.Clamp(
        this.scrollOffset + event.deltaY * 0.5,
        0,
        maxScroll
      );
      this.updateScrollPosition();
    };

    this.scene.game.canvas.addEventListener('wheel', this.scrollListener);
  }

  private updateScrollPosition(): void {
    this.scrollContainer.setY(-this.scrollOffset);
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
    this.scrollOffset = 0; // Reset scroll position
    this.updateScrollPosition();
  }

  getVisible(): boolean {
    return this.isVisible;
  }

  // Call this in the game loop to keep stats fresh
  update(): void {
    if (this.isVisible) {
      this.updateStats();
    }
  }

  updateStats(): void {
    // Clear old stat texts
    this.statTexts.forEach(text => text.destroy());
    this.statTexts = [];

    // Get all stats organized by category
    const stats = this.getOrganizedStats();

    let yOffset = this.PANEL_PADDING + 36; // Below title

    // Draw each category in scroll container
    for (const category of stats) {
      if (category.items.length === 0) continue;

      // Category header
      const headerText = this.scene.add.text(
        this.PANEL_PADDING,
        yOffset,
        category.name,
        {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#888888',
        }
      );
      this.scrollContainer.add(headerText);
      this.statTexts.push(headerText);
      yOffset += this.LINE_HEIGHT - 2;

      // Category items
      for (const item of category.items) {
        // Stat name (left aligned)
        const nameText = this.scene.add.text(
          this.PANEL_PADDING + 8,
          yOffset,
          item.name,
          {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
          }
        );
        this.scrollContainer.add(nameText);
        this.statTexts.push(nameText);

        // Stat value (right aligned)
        const valueColor = item.value.startsWith('-') ? '#ff6666' : '#66ff66';
        const valueText = this.scene.add.text(
          this.PANEL_WIDTH - this.PANEL_PADDING,
          yOffset,
          item.value,
          {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: valueColor,
          }
        ).setOrigin(1, 0);
        this.scrollContainer.add(valueText);
        this.statTexts.push(valueText);

        yOffset += this.LINE_HEIGHT;
      }

      yOffset += 4; // Gap between categories
    }

    // Calculate total content height
    this.totalContentHeight = yOffset;

    // Determine panel height (cap at max)
    const panelHeight = Math.min(yOffset + this.PANEL_PADDING, this.MAX_PANEL_HEIGHT);
    const needsScroll = yOffset > this.MAX_PANEL_HEIGHT - this.PANEL_PADDING;

    // Redraw background
    this.background.clear();
    this.background.fillStyle(0x1a1a2e, 0.92);
    this.background.fillRoundedRect(0, 0, this.PANEL_WIDTH, panelHeight, 8);
    this.background.lineStyle(2, COLORS.rarity.legendary, 0.8);
    this.background.strokeRoundedRect(0, 0, this.PANEL_WIDTH, panelHeight, 8);

    // Apply mask if content needs scrolling
    if (needsScroll) {
      const maskX = this.container.x;
      const maskY = this.container.y + this.PANEL_PADDING + 30;
      const maskHeight = panelHeight - this.PANEL_PADDING * 2 - 30;

      this.scrollMask.clear();
      this.scrollMask.fillStyle(0xffffff);
      this.scrollMask.fillRect(maskX, maskY, this.PANEL_WIDTH, maskHeight);

      const mask = this.scrollMask.createGeometryMask();
      this.scrollContainer.setMask(mask);

      // Draw scroll indicator
      const scrollPercent = this.scrollOffset / Math.max(1, this.totalContentHeight - this.MAX_PANEL_HEIGHT + this.PANEL_PADDING * 2 + 40);
      const scrollBarHeight = 40;
      const scrollBarY = this.PANEL_PADDING + 36 + (panelHeight - this.PANEL_PADDING * 2 - 36 - scrollBarHeight) * scrollPercent;
      this.background.fillStyle(0x666666, 0.5);
      this.background.fillRect(this.PANEL_WIDTH - 6, scrollBarY, 4, scrollBarHeight);
    } else {
      this.scrollContainer.clearMask();
      this.scrollOffset = 0;
    }

    this.updateScrollPosition();
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

    // v0.5.0: Crit uses diminishing returns: effective = raw / (raw + 1)
    // Display as flat number with effective percentage
    const rawCrit = this.upgradeManager.getModifier('critChance');
    if (rawCrit > 0) {
      const effectiveCrit = rawCrit / (rawCrit + 1);
      const rawDisplay = Math.round(rawCrit * 100);
      const effectiveDisplay = Math.round(effectiveCrit * 100);
      combat.push({ name: 'Crit', value: `+${rawDisplay} (${effectiveDisplay}%)` });
    }

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

    // Display armor/evasion with effective percentages (diminishing returns)
    // Armor: effective = ln(1 + raw) / (ln(1 + raw) + k)
    const armor = this.upgradeManager.getModifier('armor');
    if (armor > 0) {
      const rawDisplay = Math.round(armor * 100);
      const lnTerm = Math.log(1 + armor);
      const effectiveArmor = lnTerm / (lnTerm + ARMOR_CONFIG.diminishingK);
      const effectiveDisplay = Math.round(effectiveArmor * 100);
      defense.push({ name: 'Armor', value: `${rawDisplay} (${effectiveDisplay}%)` });
    }

    // Evasion: effective = ln(1 + raw) / (ln(1 + raw) + k)
    const evasion = this.upgradeManager.getModifier('evasion');
    if (evasion > 0) {
      const rawDisplay = Math.round(evasion * 100);
      const lnTerm = Math.log(1 + evasion);
      const effectiveEvasion = lnTerm / (lnTerm + EVASION_CONFIG.diminishingK);
      const effectiveDisplay = Math.round(effectiveEvasion * 100);
      defense.push({ name: 'Evasion', value: `${rawDisplay} (${effectiveDisplay}%)` });
    }

    const thorns = this.upgradeManager.getModifier('thorns');
    if (thorns > 0) defense.push({ name: 'Thorns', value: formatFlat(thorns) });

    const vampirism = this.upgradeManager.getModifier('vampirism');
    if (vampirism !== 0) defense.push({ name: 'Heal Chance', value: formatPercent(vampirism) });

    // Movement stats
    const moveSpeed = this.upgradeManager.getModifier('moveSpeed');
    if (moveSpeed !== 0) movement.push({ name: 'Speed', value: formatPercent(moveSpeed) });

    const jumpHeight = this.upgradeManager.getModifier('jumpHeight');
    if (jumpHeight !== 0) movement.push({ name: 'Jump', value: formatPercent(jumpHeight) });

    // Special stats
    const prosperity = this.upgradeManager.getModifier('prosperity');
    if (prosperity !== 0) special.push({ name: 'Prosperity', value: formatFlat(prosperity) });

    const companionCount = this.upgradeManager.getModifier('companionCount');
    if (companionCount !== 0) special.push({ name: 'Companions', value: formatFlat(companionCount) });

    const maxQuills = this.upgradeManager.getModifier('maxQuills');
    if (maxQuills !== 0) special.push({ name: 'Max Quills', value: formatFlat(maxQuills) });

    const regenRate = this.upgradeManager.getModifier('regenRate');
    if (regenRate !== 0) special.push({ name: 'Regen Rate', value: formatPercent(regenRate) });

    const projectileSize = this.upgradeManager.getModifier('projectileSize');
    if (projectileSize !== 0) special.push({ name: 'Quill Size', value: formatPercent(projectileSize) });

    const upgradeChoices = this.upgradeManager.getModifier('upgradeChoices');
    if (upgradeChoices !== 0) special.push({ name: 'Extra Choices', value: formatFlat(upgradeChoices) });

    // Elite damage bonus goes in combat
    const eliteDamageBonus = this.upgradeManager.getModifier('eliteDamageBonus');
    if (eliteDamageBonus !== 0) combat.push({ name: 'Elite Damage', value: formatPercent(eliteDamageBonus) });

    // Elemental stats (strength-based with diminishing returns formula)
    const elemental: { name: string; value: string }[] = [];
    const getChance = (str: number) => str > 0 ? (str * 0.1) / (1 + str * 0.1) : 0;

    const shockStrength = this.upgradeManager.getModifier('shockStrength');
    if (shockStrength > 0) {
      const chance = Math.round(getChance(shockStrength) * 100);
      elemental.push({ name: 'Shock', value: `${chance}% (${shockStrength} str)` });
      const chainLightning = this.upgradeManager.getModifier('chainLightning');
      if (chainLightning > 0) elemental.push({ name: '  Chain', value: `${chainLightning} targets` });
    }

    const freezeStrength = this.upgradeManager.getModifier('freezeStrength');
    if (freezeStrength > 0) {
      const chance = Math.round(getChance(freezeStrength) * 100);
      elemental.push({ name: 'Freeze', value: `${chance}% (${freezeStrength} str)` });
      const shatterDamage = this.upgradeManager.getModifier('shatterDamage');
      if (shatterDamage > 0) elemental.push({ name: '  Shatter', value: `${Math.round(shatterDamage * 100)}% HP` });
      const frostSlow = this.upgradeManager.getModifier('frostSlow');
      if (frostSlow > 0) elemental.push({ name: '  Slow', value: `${Math.round(Math.min(frostSlow, 1) * 100)}%` });
    }

    const burnStrength = this.upgradeManager.getModifier('burnStrength');
    if (burnStrength > 0) {
      const chance = Math.round(getChance(burnStrength) * 100);
      const damageMult = 1 + this.upgradeManager.getModifier('damage');
      const scaledDPS = Math.round(burnStrength * 8 * damageMult);
      const duration = STATUS_EFFECT_CONFIG.burn.defaultDuration / 1000;
      elemental.push({ name: 'Burn', value: `${chance}% (${burnStrength} str)` });
      elemental.push({ name: '  DPS/stack', value: `${scaledDPS} (${duration}s)` });
      const fireExplosion = this.upgradeManager.getModifier('fireExplosion');
      if (fireExplosion > 0) elemental.push({ name: '  Explosion', value: `${fireExplosion}px` });
      const fireAura = this.upgradeManager.getModifier('fireAura');
      if (fireAura > 0) elemental.push({ name: '  Aura', value: `${fireAura}px` });
    }

    const poisonStrength = this.upgradeManager.getModifier('poisonStrength');
    if (poisonStrength > 0) {
      const chance = Math.round(getChance(poisonStrength) * 100);
      const amp = poisonStrength * 5; // 5% per strength
      const duration = STATUS_EFFECT_CONFIG.poison.defaultDuration / 1000;
      elemental.push({ name: 'Poison', value: `${chance}% (${poisonStrength} str)` });
      elemental.push({ name: '  Amp/stack', value: `${amp}% (${duration}s)` });
      const poisonCloud = this.upgradeManager.getModifier('poisonCloud');
      if (poisonCloud > 0) elemental.push({ name: '  Cloud', value: `${poisonCloud}px` });
    }

    const rerollChance = this.upgradeManager.getModifier('rerollChance');
    if (rerollChance > 0) elemental.push({ name: 'Proc Reroll', value: formatPercent(rerollChance) });

    const apotheosis = this.upgradeManager.getModifier('apotheosis');
    if (apotheosis > 0) elemental.push({ name: 'Apotheosis', value: 'Every 5th' });

    // Danger level section
    const danger: { name: string; value: string }[] = [];
    const dangerLevel = this.upgradeManager.getModifier('dangerLevel');
    if (dangerLevel > 0) {
      danger.push({ name: 'Danger Level', value: `x${dangerLevel}` });
      const hpBuff = Math.round(dangerLevel * DANGER_CONFIG.enemyHealthBonusPerStack * 100);
      const dmgBuff = Math.round(dangerLevel * DANGER_CONFIG.enemyDamageBonusPerStack * 100);
      danger.push({ name: 'Mob HP', value: `+${hpBuff}%` });
      danger.push({ name: 'Mob Damage', value: `+${dmgBuff}%` });
      const eliteChance = Math.round((ELITE_CONFIG.baseSpawnChance + dangerLevel * DANGER_CONFIG.eliteChanceBonusPerStack) * 100);
      danger.push({ name: 'Elite Chance', value: `${eliteChance}%` });
      const scoreMult = Math.round(dangerLevel * DANGER_CONFIG.scoreMultiplierPerStack * 100);
      danger.push({ name: 'Score Bonus', value: `+${scoreMult}%` });
      const xpMult = Math.round(dangerLevel * DANGER_CONFIG.xpMultiplierPerStack * 100);
      danger.push({ name: 'XP Bonus', value: `+${xpMult}%` });
    }

    return [
      { name: 'COMBAT', items: combat },
      { name: 'DEFENSE', items: defense },
      { name: 'MOVEMENT', items: movement },
      ...(elemental.length > 0 ? [{ name: 'ELEMENTAL', items: elemental }] : []),
      { name: 'SPECIAL', items: special },
      ...(danger.length > 0 ? [{ name: 'DANGER', items: danger }] : []),
    ];
  }

  destroy(): void {
    if (this.scrollListener) {
      this.scene.game.canvas.removeEventListener('wheel', this.scrollListener);
    }
    this.scrollMask.destroy();
    this.container.destroy();
  }
}
