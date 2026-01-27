import { Upgrade } from '../data/upgrades';

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
  | 'maxHealth';

export class UpgradeManager {
  private upgrades: Upgrade[] = [];
  private modifiers: Map<ModifierType, number> = new Map();

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
    }
  }

  private addModifier(type: ModifierType, value: number): void {
    const current = this.modifiers.get(type) || 0;
    this.modifiers.set(type, current + value);
  }

  getModifier(type: ModifierType): number {
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
    this.resetModifiers();
  }

  // Get a summary of all modifiers for UI display
  getSummary(): { name: string; value: string }[] {
    const summary: { name: string; value: string }[] = [];

    const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const formatFlat = (v: number) => `${v >= 0 ? '+' : ''}${v}`;

    if (this.modifiers.get('damage')! !== 0) {
      summary.push({ name: 'Damage', value: formatPercent(this.modifiers.get('damage')!) });
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

    return summary;
  }
}
