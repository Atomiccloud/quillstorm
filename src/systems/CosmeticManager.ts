import {
  Cosmetic,
  CosmeticCategory,
  getAllCosmetics,
  getCosmeticById,
  getDefaultCosmetics,
  getCosmeticCost,
  isPurchasable,
} from '../data/cosmetics';

export interface CosmeticState {
  unlockedIds: string[];
  equipped: Record<CosmeticCategory, string>;
  pinecones: number;
  totalPineconesEarned: number;
}

const STORAGE_KEY = 'quillstorm_cosmetics';

export class CosmeticManager {
  private state: CosmeticState;
  private onChangeCallbacks: Array<() => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CosmeticState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new cosmetics
        return {
          unlockedIds: parsed.unlockedIds || this.getDefaultUnlockedIds(),
          equipped: { ...getDefaultCosmetics(), ...parsed.equipped },
          pinecones: parsed.pinecones || 0,
          totalPineconesEarned: parsed.totalPineconesEarned || 0,
        };
      }
    } catch (e) {
      console.warn('Failed to load cosmetic state:', e);
    }

    return {
      unlockedIds: this.getDefaultUnlockedIds(),
      equipped: getDefaultCosmetics(),
      pinecones: 0,
      totalPineconesEarned: 0,
    };
  }

  private getDefaultUnlockedIds(): string[] {
    // All cosmetics with type 'default' are unlocked by default
    return getAllCosmetics()
      .filter(c => c.unlock.type === 'default')
      .map(c => c.id);
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save cosmetic state:', e);
    }
    this.notifyChange();
  }

  private notifyChange(): void {
    this.onChangeCallbacks.forEach(cb => cb());
  }

  onChange(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }

  offChange(callback: () => void): void {
    this.onChangeCallbacks = this.onChangeCallbacks.filter(cb => cb !== callback);
  }

  // ============ Pinecone Methods ============

  getPinecones(): number {
    return this.state.pinecones;
  }

  getTotalPineconesEarned(): number {
    return this.state.totalPineconesEarned;
  }

  addPinecones(amount: number): void {
    this.state.pinecones += amount;
    this.state.totalPineconesEarned += amount;
    this.saveState();
  }

  spendPinecones(amount: number): boolean {
    if (this.state.pinecones < amount) {
      return false;
    }
    this.state.pinecones -= amount;
    this.saveState();
    return true;
  }

  canAfford(amount: number): boolean {
    return this.state.pinecones >= amount;
  }

  // ============ Unlock Methods ============

  isUnlocked(cosmeticId: string): boolean {
    return this.state.unlockedIds.includes(cosmeticId);
  }

  unlock(cosmeticId: string): void {
    if (!this.state.unlockedIds.includes(cosmeticId)) {
      this.state.unlockedIds.push(cosmeticId);
      this.saveState();
    }
  }

  getUnlockedCosmetics(): Cosmetic[] {
    return this.state.unlockedIds
      .map(id => getCosmeticById(id))
      .filter((c): c is Cosmetic => c !== undefined);
  }

  getUnlockedByCategory(category: CosmeticCategory): Cosmetic[] {
    return this.getUnlockedCosmetics().filter(c => c.category === category);
  }

  // ============ Purchase Methods ============

  canPurchase(cosmeticId: string): { success: boolean; reason?: string } {
    const cosmetic = getCosmeticById(cosmeticId);
    if (!cosmetic) {
      return { success: false, reason: 'Cosmetic not found' };
    }

    if (this.isUnlocked(cosmeticId)) {
      return { success: false, reason: 'Already owned' };
    }

    if (!isPurchasable(cosmetic)) {
      return { success: false, reason: 'Not available for purchase' };
    }

    const cost = getCosmeticCost(cosmetic);
    if (!this.canAfford(cost)) {
      return { success: false, reason: 'Not enough pinecones' };
    }

    return { success: true };
  }

  purchase(cosmeticId: string): { success: boolean; reason?: string } {
    const canBuy = this.canPurchase(cosmeticId);
    if (!canBuy.success) {
      return canBuy;
    }

    const cosmetic = getCosmeticById(cosmeticId)!;
    const cost = getCosmeticCost(cosmetic);

    this.spendPinecones(cost);
    this.unlock(cosmeticId);

    return { success: true };
  }

  // ============ Equip Methods ============

  getEquipped(category: CosmeticCategory): Cosmetic | undefined {
    const id = this.state.equipped[category];
    return getCosmeticById(id);
  }

  getEquippedId(category: CosmeticCategory): string {
    return this.state.equipped[category];
  }

  getAllEquipped(): Record<CosmeticCategory, Cosmetic | undefined> {
    return {
      skin: this.getEquipped('skin'),
      hat: this.getEquipped('hat'),
      quillStyle: this.getEquipped('quillStyle'),
      trail: this.getEquipped('trail'),
    };
  }

  equip(cosmeticId: string): boolean {
    const cosmetic = getCosmeticById(cosmeticId);
    if (!cosmetic) {
      return false;
    }

    if (!this.isUnlocked(cosmeticId)) {
      return false;
    }

    this.state.equipped[cosmetic.category] = cosmeticId;
    this.saveState();
    return true;
  }

  // ============ Achievement Unlock Methods ============

  unlockByAchievement(achievementId: string): Cosmetic[] {
    const unlockedCosmetics: Cosmetic[] = [];

    getAllCosmetics().forEach(cosmetic => {
      if (
        cosmetic.unlock.type === 'achievement' &&
        cosmetic.unlock.achievementId === achievementId &&
        !this.isUnlocked(cosmetic.id)
      ) {
        this.unlock(cosmetic.id);
        unlockedCosmetics.push(cosmetic);
      }
    });

    return unlockedCosmetics;
  }

  // ============ State Management ============

  getState(): CosmeticState {
    return { ...this.state };
  }

  setState(state: Partial<CosmeticState>): void {
    this.state = {
      ...this.state,
      ...state,
    };
    this.saveState();
  }

  reset(): void {
    this.state = {
      unlockedIds: this.getDefaultUnlockedIds(),
      equipped: getDefaultCosmetics(),
      pinecones: 0,
      totalPineconesEarned: 0,
    };
    this.saveState();
  }
}

// Singleton instance
let instance: CosmeticManager | null = null;

export function getCosmeticManager(): CosmeticManager {
  if (!instance) {
    instance = new CosmeticManager();
  }
  return instance;
}
