import { ModifierSource, ModifierType } from './UpgradeManager';
import { COMPANION_CONFIG } from '../config';

export class CompanionUpgradeProxy implements ModifierSource {
  private source: ModifierSource;
  private efficiency: number;

  constructor(source: ModifierSource, companionCount: number) {
    this.source = source;
    this.efficiency = Math.min(
      COMPANION_CONFIG.baseEfficiency + companionCount * COMPANION_CONFIG.efficiencyPerCompanion,
      COMPANION_CONFIG.maxEfficiency
    );
  }

  getModifier(type: ModifierType): number {
    if (COMPANION_CONFIG.excludedModifiers.includes(type)) {
      return 0;
    }
    return this.source.getModifier(type) * this.efficiency;
  }
}
