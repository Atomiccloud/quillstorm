import { XP_CONFIG, CHEST_CONFIG, PROSPERITY_CONFIG, INFINITE_SWARM_CONFIG } from '../config';
import { UpgradeManager } from './UpgradeManager';
import { Rarity } from '../data/upgrades';

export interface LevelUpEvent {
  newLevel: number;
  totalXP: number;
}

export class ProgressionManager {
  private currentXP: number = 0;
  private currentLevel: number = 1;
  private pendingLevelUps: number = 0;
  private upgradeManager: UpgradeManager;

  // Infinite swarm state
  private infiniteSwarmActive: boolean = false;
  private infiniteSwarmStartTime: number = 0;
  private swarmDifficultyMultiplier: number = 1.0;
  private currentSpawnInterval: number = INFINITE_SWARM_CONFIG.baseSpawnInterval;

  // Chest tracking (for "rigged" early chests)
  private chestsCollected: number = 0;

  constructor(upgradeManager: UpgradeManager) {
    this.upgradeManager = upgradeManager;
  }

  // XP Methods
  addXP(amount: number): LevelUpEvent | null {
    this.currentXP += amount;

    // Check for level up
    const xpRequired = this.getXPForNextLevel();
    if (this.currentXP >= xpRequired) {
      this.currentXP -= xpRequired;
      this.currentLevel++;
      this.pendingLevelUps++;

      return {
        newLevel: this.currentLevel,
        totalXP: this.currentXP,
      };
    }

    return null;
  }

  getXPForNextLevel(): number {
    return Math.floor(
      XP_CONFIG.baseXPToLevel * Math.pow(XP_CONFIG.xpScalingFactor, this.currentLevel - 1)
    );
  }

  getXPProgress(): { current: number; required: number; percent: number } {
    const required = this.getXPForNextLevel();
    return {
      current: this.currentXP,
      required,
      percent: this.currentXP / required,
    };
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  getCurrentXP(): number {
    return this.currentXP;
  }

  hasPendingLevelUp(): boolean {
    return this.pendingLevelUps > 0;
  }

  consumeLevelUp(): boolean {
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps--;
      return true;
    }
    return false;
  }

  // Calculate XP value for an enemy
  getEnemyXPValue(isBoss: boolean, currentWave: number): number {
    const baseXP = XP_CONFIG.xpDropBase;
    const bossMultiplier = isBoss ? XP_CONFIG.xpDropBossMultiplier : 1;
    const waveBonus = 1 + (currentWave * 0.1); // 10% more XP per wave
    return Math.floor(baseXP * bossMultiplier * waveBonus);
  }

  // Prosperity Effects
  getEffectiveChestDropChance(): number {
    const prosperity = Math.min(
      this.upgradeManager.getModifier('prosperity'),
      PROSPERITY_CONFIG.maxProsperity
    );
    return CHEST_CONFIG.baseDropChance + (prosperity * PROSPERITY_CONFIG.chestDropBonusPerPoint);
  }

  getEffectiveCritBonus(): number {
    const prosperity = Math.min(
      this.upgradeManager.getModifier('prosperity'),
      PROSPERITY_CONFIG.maxProsperity
    );
    return prosperity * PROSPERITY_CONFIG.critBonusPerPoint;
  }

  getModifiedRarityWeights(
    baseWeights: Record<Rarity, number>,
    excludeCommon: boolean = false
  ): Record<Rarity, number> {
    const prosperity = Math.min(
      this.upgradeManager.getModifier('prosperity'),
      PROSPERITY_CONFIG.maxProsperity
    );
    const shift = prosperity * PROSPERITY_CONFIG.rarityShiftPerPoint;

    const weights = { ...baseWeights };

    if (excludeCommon) {
      weights.common = 0;
    }

    // Transfer weight from common/uncommon to rare+
    const commonTransfer = weights.common * shift * 0.5;
    const uncommonTransfer = weights.uncommon * shift * 0.3;
    const totalTransfer = commonTransfer + uncommonTransfer;

    weights.common = Math.max(0, weights.common - commonTransfer);
    weights.uncommon = Math.max(0, weights.uncommon - uncommonTransfer);
    weights.rare += totalTransfer * 0.5;
    weights.epic += totalTransfer * 0.3;
    weights.legendary += totalTransfer * 0.2;

    return weights;
  }

  // Chest tracking
  collectChest(): void {
    this.chestsCollected++;
  }

  isRiggedChest(): boolean {
    return this.chestsCollected < CHEST_CONFIG.riggedChestCount;
  }

  getChestsCollected(): number {
    return this.chestsCollected;
  }

  // Infinite Swarm Methods
  canActivateInfiniteSwarm(currentWave: number): boolean {
    // Trigger infinite swarm after wave 20 (4th boss)
    return currentWave >= XP_CONFIG.infiniteSwarmWave && !this.infiniteSwarmActive;
  }

  activateInfiniteSwarm(currentTime: number): void {
    this.infiniteSwarmActive = true;
    this.infiniteSwarmStartTime = currentTime;
    this.swarmDifficultyMultiplier = 1.0;
    this.currentSpawnInterval = INFINITE_SWARM_CONFIG.baseSpawnInterval;
  }

  isInfiniteSwarmActive(): boolean {
    return this.infiniteSwarmActive;
  }

  // Update infinite swarm difficulty (call each frame)
  updateInfiniteSwarm(currentTime: number, delta: number): void {
    if (!this.infiniteSwarmActive) return;

    const elapsedSeconds = delta / 1000;

    // Decay spawn interval (1% per second)
    this.currentSpawnInterval = Math.max(
      INFINITE_SWARM_CONFIG.minSpawnInterval,
      this.currentSpawnInterval * Math.pow(INFINITE_SWARM_CONFIG.spawnIntervalDecayRate, elapsedSeconds * 60)
    );

    // Quadratic difficulty scaling: multiplier = 1 + (totalSeconds / interval)^2
    const totalSeconds = (currentTime - this.infiniteSwarmStartTime) / 1000;
    const tiers = totalSeconds / INFINITE_SWARM_CONFIG.statScaleInterval;
    this.swarmDifficultyMultiplier = 1 + (tiers * tiers);
  }

  getSwarmSpawnInterval(): number {
    return this.currentSpawnInterval;
  }

  getSwarmDifficultyMultiplier(): number {
    return this.swarmDifficultyMultiplier;
  }

  getSwarmDuration(currentTime: number): number {
    if (!this.infiniteSwarmActive) return 0;
    return currentTime - this.infiniteSwarmStartTime;
  }

  // Reset for new game
  reset(): void {
    this.currentXP = 0;
    this.currentLevel = 1;
    this.pendingLevelUps = 0;
    this.infiniteSwarmActive = false;
    this.infiniteSwarmStartTime = 0;
    this.swarmDifficultyMultiplier = 1.0;
    this.currentSpawnInterval = INFINITE_SWARM_CONFIG.baseSpawnInterval;
    this.chestsCollected = 0;
  }
}
