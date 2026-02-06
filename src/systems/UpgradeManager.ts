import { Upgrade, Rarity } from '../data/upgrades';
import { LEVEL_SCALING_CONFIG } from '../config';

export type ModifierType =
  | 'damage'
  | 'fireRate'
  | 'maxQuills'
  | 'regenRate'
  | 'moveSpeed'
  | 'jumpHeight'
  | 'projectileCount'
  | 'projectileSpeed'
  | 'critChance'
  | 'critDamage'
  | 'piercing'
  | 'bouncing'
  | 'aoeRadius'
  | 'maxHealth'
  // New modifier types
  | 'explosionRadius'
  | 'projectileSize'
  | 'shieldCharges'
  | 'companionCount'
  | 'homingStrength'
  | 'vampirismStrength'
  | 'prosperity'
  | 'dangerLevel'
  | 'eliteDamageBonus'
  | 'upgradeChoices'
  // Elemental - Lightning (strength-based)
  | 'shockStrength'
  | 'chainLightning'
  // Elemental - Ice (strength-based)
  | 'freezeStrength'
  | 'frostSlow'
  | 'shatterDamage'
  // Elemental - Fire (strength-based)
  | 'burnStrength'
  | 'fireAura'
  | 'fireExplosion'
  // Elemental - Poison (strength-based)
  | 'poisonStrength'
  | 'poisonSpread'
  | 'poisonCloud'
  // Defense
  | 'armor'
  | 'evasion'
  | 'thorns'
  // Knockback & Distance
  | 'knockback'
  | 'distanceDamage'
  // Mythic
  | 'rerollChance'
  | 'apotheosis';

export class UpgradeManager {
  private upgrades: Upgrade[] = [];
  private modifiers: Map<ModifierType, number> = new Map();
  private playerLevel: number = 1;

  constructor() {
    this.resetModifiers();
  }

  private resetModifiers(): void {
    this.modifiers.set('damage', 0);
    this.modifiers.set('fireRate', 0);
    this.modifiers.set('maxQuills', 0);
    this.modifiers.set('regenRate', 0);
    this.modifiers.set('moveSpeed', 0);
    this.modifiers.set('jumpHeight', 0);
    this.modifiers.set('projectileCount', 0);
    this.modifiers.set('projectileSpeed', 0);
    this.modifiers.set('critChance', 0);
    this.modifiers.set('critDamage', 0);
    this.modifiers.set('piercing', 0);
    this.modifiers.set('bouncing', 0);
    this.modifiers.set('aoeRadius', 0);
    this.modifiers.set('maxHealth', 0);
    // New modifiers
    this.modifiers.set('explosionRadius', 0);
    this.modifiers.set('projectileSize', 0);
    this.modifiers.set('shieldCharges', 0);
    this.modifiers.set('companionCount', 0);
    this.modifiers.set('homingStrength', 0);
    this.modifiers.set('vampirismStrength', 0);
    this.modifiers.set('prosperity', 0);
    this.modifiers.set('dangerLevel', 0);
    this.modifiers.set('eliteDamageBonus', 0);
    this.modifiers.set('upgradeChoices', 0);
    // Elemental - Lightning (strength-based)
    this.modifiers.set('shockStrength', 0);
    this.modifiers.set('chainLightning', 0);
    // Elemental - Ice (strength-based)
    this.modifiers.set('freezeStrength', 0);
    this.modifiers.set('frostSlow', 0);
    this.modifiers.set('shatterDamage', 0);
    // Elemental - Fire (strength-based)
    this.modifiers.set('burnStrength', 0);
    this.modifiers.set('fireAura', 0);
    this.modifiers.set('fireExplosion', 0);
    // Elemental - Poison (strength-based)
    this.modifiers.set('poisonStrength', 0);
    this.modifiers.set('poisonSpread', 0);
    this.modifiers.set('poisonCloud', 0);
    // Defense
    this.modifiers.set('armor', 0);
    this.modifiers.set('evasion', 0);
    this.modifiers.set('thorns', 0);
    // Knockback & Distance
    this.modifiers.set('knockback', 0);
    this.modifiers.set('distanceDamage', 0);
    // Mythic
    this.modifiers.set('rerollChance', 0);
    this.modifiers.set('apotheosis', 0);
  }

  addUpgrade(upgrade: Upgrade): void {
    this.upgrades.push(upgrade);
    this.recalculateModifiers();
  }

  private recalculateModifiers(): void {
    this.resetModifiers();

    for (const upgrade of this.upgrades) {
      const effects = upgrade.effects;

      // Apply each effect
      if (effects.damage !== undefined) {
        this.addModifier('damage', effects.damage);
      }
      if (effects.fireRate !== undefined) {
        this.addModifier('fireRate', effects.fireRate);
      }
      if (effects.maxQuills !== undefined) {
        this.addModifier('maxQuills', effects.maxQuills);
      }
      if (effects.regenRate !== undefined) {
        this.addModifier('regenRate', effects.regenRate);
      }
      if (effects.moveSpeed !== undefined) {
        this.addModifier('moveSpeed', effects.moveSpeed);
      }
      if (effects.jumpHeight !== undefined) {
        this.addModifier('jumpHeight', effects.jumpHeight);
      }
      if (effects.projectileCount !== undefined) {
        this.addModifier('projectileCount', effects.projectileCount);
      }
      if (effects.projectileSpeed !== undefined) {
        this.addModifier('projectileSpeed', effects.projectileSpeed);
      }
      if (effects.critChance !== undefined) {
        this.addModifier('critChance', effects.critChance);
      }
      if (effects.critDamage !== undefined) {
        this.addModifier('critDamage', effects.critDamage);
      }
      if (effects.piercing !== undefined) {
        this.addModifier('piercing', effects.piercing);
      }
      if (effects.bouncing !== undefined) {
        this.addModifier('bouncing', effects.bouncing);
      }
      if (effects.aoeRadius !== undefined) {
        this.addModifier('aoeRadius', effects.aoeRadius);
      }
      if (effects.maxHealth !== undefined) {
        this.addModifier('maxHealth', effects.maxHealth);
      }
      // New effect types
      if (effects.explosionRadius !== undefined) {
        this.addModifier('explosionRadius', effects.explosionRadius);
      }
      if (effects.projectileSize !== undefined) {
        this.addModifier('projectileSize', effects.projectileSize);
      }
      if (effects.shieldCharges !== undefined) {
        this.addModifier('shieldCharges', effects.shieldCharges);
      }
      if (effects.companionCount !== undefined) {
        this.addModifier('companionCount', effects.companionCount);
      }
      if (effects.homingStrength !== undefined) {
        this.addModifier('homingStrength', effects.homingStrength);
      }
      if (effects.vampirismStrength !== undefined) {
        this.addModifier('vampirismStrength', effects.vampirismStrength);
      }
      if (effects.prosperity !== undefined) {
        this.addModifier('prosperity', effects.prosperity);
      }
      if (effects.dangerLevel !== undefined) {
        this.addModifier('dangerLevel', effects.dangerLevel);
      }
      if (effects.eliteDamageBonus !== undefined) {
        this.addModifier('eliteDamageBonus', effects.eliteDamageBonus);
      }
      if (effects.upgradeChoices !== undefined) {
        this.addModifier('upgradeChoices', effects.upgradeChoices);
      }
      // Elemental - Lightning (strength-based)
      if (effects.shockStrength !== undefined) {
        this.addModifier('shockStrength', effects.shockStrength);
      }
      if (effects.chainLightning !== undefined) {
        this.addModifier('chainLightning', effects.chainLightning);
      }
      // Elemental - Ice (strength-based)
      if (effects.freezeStrength !== undefined) {
        this.addModifier('freezeStrength', effects.freezeStrength);
      }
      if (effects.frostSlow !== undefined) {
        this.addModifier('frostSlow', effects.frostSlow);
      }
      if (effects.shatterDamage !== undefined) {
        this.addModifier('shatterDamage', effects.shatterDamage);
      }
      // Elemental - Fire (strength-based)
      if (effects.burnStrength !== undefined) {
        this.addModifier('burnStrength', effects.burnStrength);
      }
      if (effects.fireAura !== undefined) {
        this.addModifier('fireAura', effects.fireAura);
      }
      if (effects.fireExplosion !== undefined) {
        this.addModifier('fireExplosion', effects.fireExplosion);
      }
      // Elemental - Poison (strength-based)
      if (effects.poisonStrength !== undefined) {
        this.addModifier('poisonStrength', effects.poisonStrength);
      }
      if (effects.poisonSpread !== undefined) {
        this.addModifier('poisonSpread', effects.poisonSpread);
      }
      if (effects.poisonCloud !== undefined) {
        this.addModifier('poisonCloud', effects.poisonCloud);
      }
      // Defense
      if (effects.armor !== undefined) {
        this.addModifier('armor', effects.armor);
      }
      if (effects.evasion !== undefined) {
        this.addModifier('evasion', effects.evasion);
      }
      if (effects.thorns !== undefined) {
        this.addModifier('thorns', effects.thorns);
      }
      // Knockback & Distance
      if (effects.knockback !== undefined) {
        this.addModifier('knockback', effects.knockback);
      }
      if (effects.distanceDamage !== undefined) {
        this.addModifier('distanceDamage', effects.distanceDamage);
      }
      // Mythic
      if (effects.rerollChance !== undefined) {
        this.addModifier('rerollChance', effects.rerollChance);
      }
      if (effects.apotheosis !== undefined) {
        this.addModifier('apotheosis', effects.apotheosis);
      }
    }
  }

  private addModifier(type: ModifierType, value: number): void {
    const current = this.modifiers.get(type) || 0;
    this.modifiers.set(type, current + value);
  }

  setPlayerLevel(level: number): void {
    this.playerLevel = level;
  }

  getLevelDamageBonus(): number {
    return (this.playerLevel - 1) * LEVEL_SCALING_CONFIG.damagePerLevel;
  }

  getModifier(type: ModifierType): number {
    const base = this.modifiers.get(type) || 0;
    if (type === 'damage') {
      return base + this.getLevelDamageBonus();
    }
    return base;
  }

  // Get raw modifier value without level bonuses
  getRawModifier(type: ModifierType): number {
    return this.modifiers.get(type) || 0;
  }

  getUpgrades(): Upgrade[] {
    return [...this.upgrades];
  }

  getUpgradeCount(upgradeId: string): number {
    return this.upgrades.filter(u => u.id === upgradeId).length;
  }

  hasUpgrade(upgradeId: string): boolean {
    return this.upgrades.some(u => u.id === upgradeId);
  }

  reset(): void {
    this.upgrades = [];
    this.playerLevel = 1;
    this.resetModifiers();
  }

  // Get a summary of all modifiers for UI display
  getSummary(): { name: string; value: string }[] {
    const summary: { name: string; value: string }[] = [];

    const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const formatFlat = (v: number) => `${v >= 0 ? '+' : ''}${v}`;

    const upgradeDamage = this.modifiers.get('damage')!;
    if (upgradeDamage !== 0) {
      summary.push({ name: 'Damage', value: formatPercent(upgradeDamage) });
    }
    const levelBonus = this.getLevelDamageBonus();
    if (levelBonus > 0) {
      summary.push({ name: 'Level Bonus', value: formatPercent(levelBonus) });
    }
    if (this.modifiers.get('fireRate')! !== 0) {
      summary.push({ name: 'Fire Rate', value: formatPercent(this.modifiers.get('fireRate')!) });
    }
    if (this.modifiers.get('maxQuills')! !== 0) {
      summary.push({ name: 'Max Quills', value: formatFlat(this.modifiers.get('maxQuills')!) });
    }
    if (this.modifiers.get('regenRate')! !== 0) {
      summary.push({ name: 'Regen Rate', value: formatPercent(this.modifiers.get('regenRate')!) });
    }
    if (this.modifiers.get('moveSpeed')! !== 0) {
      summary.push({ name: 'Move Speed', value: formatPercent(this.modifiers.get('moveSpeed')!) });
    }
    if (this.modifiers.get('projectileCount')! !== 0) {
      summary.push({ name: 'Multi-shot', value: formatFlat(this.modifiers.get('projectileCount')!) });
    }
    if (this.modifiers.get('critChance')! !== 0) {
      summary.push({ name: 'Crit Chance', value: formatPercent(this.modifiers.get('critChance')!) });
    }
    if (this.modifiers.get('piercing')! !== 0) {
      summary.push({ name: 'Pierce', value: formatFlat(this.modifiers.get('piercing')!) });
    }
    if (this.modifiers.get('bouncing')! !== 0) {
      summary.push({ name: 'Bounces', value: formatFlat(this.modifiers.get('bouncing')!) });
    }
    // New modifiers
    if (this.modifiers.get('explosionRadius')! !== 0) {
      summary.push({ name: 'Explosion', value: `${this.modifiers.get('explosionRadius')!}px` });
    }
    if (this.modifiers.get('projectileSize')! !== 0) {
      summary.push({ name: 'Quill Size', value: formatPercent(this.modifiers.get('projectileSize')!) });
    }
    if (this.modifiers.get('shieldCharges')! !== 0) {
      summary.push({ name: 'Shields', value: formatFlat(this.modifiers.get('shieldCharges')!) });
    }
    if (this.modifiers.get('companionCount')! !== 0) {
      summary.push({ name: 'Companions', value: formatFlat(this.modifiers.get('companionCount')!) });
    }
    if (this.modifiers.get('homingStrength')! !== 0) {
      summary.push({ name: 'Homing', value: formatPercent(this.modifiers.get('homingStrength')!) });
    }
    if (this.modifiers.get('vampirismStrength')! !== 0) {
      const vampStr = this.modifiers.get('vampirismStrength')!;
      const chance = Math.round((vampStr / (vampStr + 20)) * 100);
      const heal = 8 + vampStr * 3;
      summary.push({ name: 'Vampirism', value: `${chance}% / ${heal} HP` });
    }
    if (this.modifiers.get('prosperity')! !== 0) {
      summary.push({ name: 'Prosperity', value: formatFlat(this.modifiers.get('prosperity')!) });
    }
    if (this.modifiers.get('dangerLevel')! !== 0) {
      const dl = this.modifiers.get('dangerLevel')!;
      const scoreMult = Math.round(dl * 15);
      summary.push({ name: 'Danger Level', value: `${dl} (+${scoreMult}% score)` });
    }
    if (this.modifiers.get('eliteDamageBonus')! !== 0) {
      summary.push({ name: 'Elite Damage', value: formatPercent(this.modifiers.get('eliteDamageBonus')!) });
    }
    if (this.modifiers.get('upgradeChoices')! !== 0) {
      summary.push({ name: 'Extra Choices', value: formatFlat(this.modifiers.get('upgradeChoices')!) });
    }
    // Elemental (strength-based with diminishing returns formula)
    const getChance = (str: number) => str > 0 ? (str * 0.1) / (1 + str * 0.1) : 0;
    const shockStr = this.modifiers.get('shockStrength')!;
    if (shockStr !== 0) {
      const chance = Math.round(getChance(shockStr) * 100);
      summary.push({ name: 'Shock', value: `${chance}% (${shockStr} str)` });
    }
    const freezeStr = this.modifiers.get('freezeStrength')!;
    if (freezeStr !== 0) {
      const chance = Math.round(getChance(freezeStr) * 100);
      summary.push({ name: 'Freeze', value: `${chance}% (${freezeStr} str)` });
    }
    const burnStr = this.modifiers.get('burnStrength')!;
    if (burnStr !== 0) {
      const chance = Math.round(getChance(burnStr) * 100);
      summary.push({ name: 'Burn', value: `${chance}% (${burnStr} str)` });
    }
    const poisonStr = this.modifiers.get('poisonStrength')!;
    if (poisonStr !== 0) {
      const chance = Math.round(getChance(poisonStr) * 100);
      summary.push({ name: 'Poison', value: `${chance}% (${poisonStr} str)` });
    }
    if (this.modifiers.get('chainLightning')! !== 0) {
      summary.push({ name: 'Chain Lightning', value: `${this.modifiers.get('chainLightning')!} targets` });
    }
    // Defense (displayed as flat values - diminishing returns applied internally)
    if (this.modifiers.get('armor')! !== 0) {
      const armor = Math.round(this.modifiers.get('armor')! * 100);
      summary.push({ name: 'Armor', value: armor.toString() });
    }
    if (this.modifiers.get('evasion')! !== 0) {
      const evasion = Math.round(this.modifiers.get('evasion')! * 100);
      summary.push({ name: 'Evasion', value: evasion.toString() });
    }
    if (this.modifiers.get('thorns')! !== 0) {
      summary.push({ name: 'Thorns', value: formatFlat(this.modifiers.get('thorns')!) });
    }
    // Knockback & Distance
    if (this.modifiers.get('knockback')! !== 0) {
      summary.push({ name: 'Knockback', value: formatFlat(this.modifiers.get('knockback')!) });
    }
    if (this.modifiers.get('distanceDamage')! !== 0) {
      summary.push({ name: 'Distance Dmg', value: formatPercent(this.modifiers.get('distanceDamage')!) });
    }
    // Mythic
    if (this.modifiers.get('rerollChance')! !== 0) {
      summary.push({ name: 'Proc Reroll', value: formatPercent(this.modifiers.get('rerollChance')!) });
    }
    if (this.modifiers.get('apotheosis')! !== 0) {
      summary.push({ name: 'Apotheosis', value: 'Every 5th volley' });
    }

    return summary;
  }

  getHighestEvasionTier(): Rarity | null {
    const rarityOrder: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    let highest: Rarity | null = null;
    let highestIndex = -1;

    for (const upgrade of this.upgrades) {
      if (upgrade.effects.evasion !== undefined && upgrade.effects.evasion > 0) {
        const idx = rarityOrder.indexOf(upgrade.rarity);
        if (idx > highestIndex) {
          highestIndex = idx;
          highest = upgrade.rarity;
        }
      }
    }

    return highest;
  }
}
