import { XP_CONFIG, CHEST_CONFIG, PROSPERITY_CONFIG, INFINITE_SWARM_CONFIG, PINECONE_CONFIG } from '../config';
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
  private swarmPausedTime: number = 0;
  private swarmPauseStart: number = 0;
  private swarmHPMultiplier: number = 1.0;
  private swarmDamageMultiplier: number = 1.0;
  private currentSpawnInterval: number = INFINITE_SWARM_CONFIG.baseSpawnInterval;
  private currentStage: number = 0;

  // Chest tracking (for "rigged" early chests)
  private chestsCollected: number = 0;

  // Pinecone (currency) tracking
  private sessionPinecones: number = 0;

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
    const prosperity = this.upgradeManager.getModifier('prosperity');
    // Logarithmic curve: bonus = maxBonus × (1 - e^(-prosperity/decayConstant))
    // This gives 7% at 100 prosperity, caps at ~14%
    const bonus = PROSPERITY_CONFIG.chestDropMaxBonus *
      (1 - Math.exp(-prosperity / PROSPERITY_CONFIG.chestDropDecayConstant));
    return CHEST_CONFIG.baseDropChance + bonus;
  }

  // Pinecone (currency) methods
  getEffectivePineconeDropChance(): number {
    const prosperity = Math.min(
      this.upgradeManager.getModifier('prosperity'),
      PROSPERITY_CONFIG.maxProsperity
    );
    return PINECONE_CONFIG.baseDropChance + (prosperity * PINECONE_CONFIG.prosperityBonusPerPoint);
  }

  addPinecones(amount: number): void {
    this.sessionPinecones += amount;
  }

  getSessionPinecones(): number {
    return this.sessionPinecones;
  }

  // Deprecated in v0.5.0 - crit bonus from prosperity removed
  // Kept for compatibility, always returns 0
  getEffectiveCritBonus(): number {
    return 0;
  }

  // Legacy method - delegates to getLevelUpRarityWeights for backward compatibility
  getModifiedRarityWeights(
    baseWeights: Record<Rarity, number>,
    excludeCommon: boolean = false
  ): Record<Rarity, number> {
    return this.getLevelUpRarityWeights(baseWeights, excludeCommon);
  }

  // v0.5.0: Two-phase level-up rarity system
  // Phase 1 (0-100 prosperity): Common transfers to Uncommon
  // Phase 2 (100-500 prosperity): Common and Uncommon transfer to higher rarities
  getLevelUpRarityWeights(
    baseWeights: Record<Rarity, number>,
    excludeCommon: boolean = false
  ): Record<Rarity, number> {
    const prosperity = this.upgradeManager.getModifier('prosperity');
    const cap = PROSPERITY_CONFIG.rarityProsperityCap; // 500

    const weights: Record<Rarity, number> = { ...baseWeights };

    if (excludeCommon) {
      weights.common = 0;
    }

    // Phase 1: 0-100 prosperity - Common transfers to Uncommon
    // At 100 prosperity: Common goes from 65% to 25%, Uncommon goes from 25% to ~60%
    const phase1Progress = Math.min(prosperity / 100, 1);
    const commonToUncommon = (baseWeights.common - 25) * phase1Progress; // Transfer down to 25%

    // Phase 2: 100-500 prosperity - Both Common and Uncommon decline
    // Common: 25% -> 1%, Uncommon: 60% -> 39%
    const phase2Progress = Math.max(0, (prosperity - 100) / (cap - 100));

    // Target values at 500 prosperity from the plan
    const phase2CommonDrop = 24 * phase2Progress; // 25% -> 1%
    const phase2UncommonDrop = 21.2 * phase2Progress; // 60% -> 38.98%

    // Calculate final common/uncommon
    weights.common = Math.max(1, baseWeights.common - commonToUncommon - phase2CommonDrop);
    weights.uncommon = baseWeights.uncommon + commonToUncommon - phase2UncommonDrop;

    // Higher rarities scale linearly from base to caps at 500 prosperity
    // Rare: 6% -> 48%, Epic: 3.5% -> 10.5%, Legendary: 0.49% -> 1.47%, Mythic: 0.01% -> 0.05%
    const progressToCap = Math.min(prosperity / cap, 1);
    weights.rare = baseWeights.rare + (48 - baseWeights.rare) * progressToCap;
    weights.epic = baseWeights.epic + (10.5 - baseWeights.epic) * progressToCap;
    weights.legendary = baseWeights.legendary + (1.47 - baseWeights.legendary) * progressToCap;
    weights.mythic = baseWeights.mythic + (0.05 - baseWeights.mythic) * progressToCap;

    // Normalize if excludeCommon
    if (excludeCommon) {
      weights.common = 0;
    }

    return weights;
  }

  // v0.5.0: Linear chest rarity system
  // Base: Uncommon 61%, Rare 30%, Epic 8%, Legendary 1%, Mythic 0.01%
  // At 500: Uncommon 9.5%, Rare 60%, Epic 20%, Legendary 10%, Mythic 0.5%
  getChestRarityWeights(): Record<Rarity, number> {
    const prosperity = this.upgradeManager.getModifier('prosperity');
    const cap = PROSPERITY_CONFIG.rarityProsperityCap; // 500

    const progress = Math.min(prosperity / cap, 1);

    const base = CHEST_CONFIG.rarityWeights;
    const caps = CHEST_CONFIG.rarityCaps;

    return {
      common: 0, // Chests never roll common
      uncommon: base.uncommon + (caps.uncommon - base.uncommon) * progress,
      rare: base.rare + (caps.rare - base.rare) * progress,
      epic: base.epic + (caps.epic - base.epic) * progress,
      legendary: base.legendary + (caps.legendary - base.legendary) * progress,
      mythic: base.mythic + (caps.mythic - base.mythic) * progress,
    };
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
    this.swarmHPMultiplier = 1.0;
    this.swarmDamageMultiplier = 1.0;
    this.currentSpawnInterval = INFINITE_SWARM_CONFIG.baseSpawnInterval;
  }

  isInfiniteSwarmActive(): boolean {
    return this.infiniteSwarmActive;
  }

  // Call when scene pauses (upgrade selection, pause menu)
  onSwarmPause(currentTime: number): void {
    if (this.infiniteSwarmActive && this.swarmPauseStart === 0) {
      this.swarmPauseStart = currentTime;
    }
  }

  // Call when scene resumes
  onSwarmResume(currentTime: number): void {
    if (this.infiniteSwarmActive && this.swarmPauseStart > 0) {
      this.swarmPausedTime += currentTime - this.swarmPauseStart;
      this.swarmPauseStart = 0;
    }
  }

  // Effective elapsed swarm time (excluding pauses)
  private getSwarmElapsed(currentTime: number): number {
    return currentTime - this.infiniteSwarmStartTime - this.swarmPausedTime;
  }

  // Update infinite swarm difficulty (call each frame)
  updateInfiniteSwarm(currentTime: number, _delta: number): void {
    if (!this.infiniteSwarmActive) return;

    const totalSeconds = this.getSwarmElapsed(currentTime) / 1000;
    const tiers = totalSeconds / INFINITE_SWARM_CONFIG.statScaleInterval;

    // Determine current stage (check from highest to lowest)
    const stages = INFINITE_SWARM_CONFIG.stages;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (totalSeconds >= stages[i].startTime) {
        this.currentStage = i;
        break;
      }
    }
    const stage = stages[this.currentStage];

    // Base HP/DMG formulas
    const baseHP = 1 + (tiers * tiers);
    const baseDMG = 1 + Math.sqrt(tiers);

    // Apply stage multipliers
    this.swarmHPMultiplier = baseHP * stage.hpMult;
    this.swarmDamageMultiplier = baseDMG * stage.dmgMult;

    // Stage 4 (Apocalypse): Add quadratic explosion term
    if ('quadraticBoost' in stage && stage.quadraticBoost) {
      const stageTime = totalSeconds - stage.startTime;
      const explosionTerm = Math.pow(stageTime / 20, 2.5) * 500;
      this.swarmHPMultiplier += explosionTerm;

      const dmgExplosion = Math.pow(stageTime / 30, 2);
      this.swarmDamageMultiplier += dmgExplosion;
    }

    // Spawn interval with stage-specific floor
    const decayedInterval = INFINITE_SWARM_CONFIG.baseSpawnInterval *
      Math.pow(INFINITE_SWARM_CONFIG.spawnIntervalDecayRate, totalSeconds);
    this.currentSpawnInterval = Math.max(stage.spawnFloor, decayedInterval);
  }

  getSwarmSpawnInterval(): number {
    return this.currentSpawnInterval;
  }

  getSwarmHPMultiplier(): number {
    return this.swarmHPMultiplier;
  }

  getSwarmDamageMultiplier(): number {
    return this.swarmDamageMultiplier;
  }

  // Backward compat: returns HP multiplier (used by HUD as headline difficulty)
  getSwarmDifficultyMultiplier(): number {
    return this.swarmHPMultiplier;
  }

  getSwarmDuration(currentTime: number): number {
    if (!this.infiniteSwarmActive) return 0;
    return this.getSwarmElapsed(currentTime);
  }

  getCurrentStage(): number {
    return this.currentStage;
  }

  getStageTint(): number | null {
    return INFINITE_SWARM_CONFIG.stages[this.currentStage]?.tint ?? null;
  }

  getStageEliteBonus(): number {
    return INFINITE_SWARM_CONFIG.stages[this.currentStage]?.eliteBonus ?? 0;
  }

  getStageName(): string {
    return INFINITE_SWARM_CONFIG.stages[this.currentStage]?.name ?? 'Swarm';
  }

  // Reset for new game
  reset(): void {
    this.currentXP = 0;
    this.currentLevel = 1;
    this.pendingLevelUps = 0;
    this.infiniteSwarmActive = false;
    this.infiniteSwarmStartTime = 0;
    this.swarmPausedTime = 0;
    this.swarmPauseStart = 0;
    this.swarmHPMultiplier = 1.0;
    this.swarmDamageMultiplier = 1.0;
    this.currentSpawnInterval = INFINITE_SWARM_CONFIG.baseSpawnInterval;
    this.currentStage = 0;
    this.chestsCollected = 0;
    this.sessionPinecones = 0;
  }
}
