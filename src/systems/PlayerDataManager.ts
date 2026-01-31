import { AuthManager, AuthUser } from './AuthManager';
import { CosmeticState, getCosmeticManager } from './CosmeticManager';
import { SaveManager } from './SaveManager';

export interface PlayerData {
  uid: string;
  displayName: string;
  pinecones: number;
  totalPineconesEarned: number;
  unlockedIds: string[];
  equipped: Record<string, string>;
  stats: {
    highScore: number;
    highestWave: number;
    totalRuns: number;
    totalKills: number;
    totalBossKills: number;
  };
  lastSyncAt: number;
  createdAt: number;
}

interface SyncResult {
  success: boolean;
  error?: string;
  data?: PlayerData;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
  newBalance?: number;
}

class PlayerDataManagerClass {
  private syncInProgress: boolean = false;
  private pendingSyncs: Array<() => void> = [];
  private lastSyncTime: number = 0;
  private syncInterval: number = 30000; // 30 seconds
  private offlineQueue: Array<{ type: string; data: unknown }> = [];
  private initialized: boolean = false;

  initialize(): void {
    if (this.initialized) return;

    // Listen for auth state changes
    AuthManager.onAuthStateChanged((user) => {
      if (user) {
        this.onUserSignIn(user);
      } else {
        this.onUserSignOut();
      }
    });

    // Load offline queue from storage
    this.loadOfflineQueue();

    this.initialized = true;
  }

  private async onUserSignIn(_user: AuthUser): Promise<void> {
    console.log('User signed in, syncing data...');

    // Sync local data to server
    await this.syncToServer();

    // Process any offline queue items
    await this.processOfflineQueue();
  }

  private onUserSignOut(): void {
    console.log('User signed out');
    this.lastSyncTime = 0;
  }

  private loadOfflineQueue(): void {
    try {
      const saved = localStorage.getItem('quillstorm_offline_queue');
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load offline queue:', e);
      this.offlineQueue = [];
    }
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('quillstorm_offline_queue', JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;
    if (!AuthManager.isSignedIn()) return;

    console.log(`Processing ${this.offlineQueue.length} offline queue items`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    for (const item of queue) {
      try {
        if (item.type === 'purchase') {
          await this.serverPurchase(item.data as { cosmeticId: string });
        }
      } catch (e) {
        console.warn('Failed to process offline item:', e);
        // Re-add to queue
        this.offlineQueue.push(item);
      }
    }

    this.saveOfflineQueue();
  }

  async syncToServer(): Promise<SyncResult> {
    if (!AuthManager.isSignedIn()) {
      return { success: false, error: 'Not signed in' };
    }

    if (this.syncInProgress) {
      // Queue this sync request
      return new Promise((resolve) => {
        this.pendingSyncs.push(() => resolve(this.syncToServer()));
      });
    }

    this.syncInProgress = true;

    try {
      const token = await AuthManager.getIdToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      const cosmeticManager = getCosmeticManager();
      const localState = cosmeticManager.getState();
      const localStats = {
        highScore: SaveManager.getHighScore(),
        highestWave: SaveManager.getHighestWave(),
        totalRuns: 0,
        totalKills: 0,
        totalBossKills: 0,
      };

      const response = await fetch('/api/player/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          localState,
          localStats,
          lastSyncAt: this.lastSyncTime,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Sync failed');
      }

      const result: { success: boolean; data: PlayerData; merged: boolean } =
        await response.json();

      if (result.success && result.data) {
        // Update local state with server data
        this.applyServerData(result.data);
        this.lastSyncTime = Date.now();
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    } finally {
      this.syncInProgress = false;

      // Process pending syncs
      const pending = this.pendingSyncs.shift();
      if (pending) {
        pending();
      }
    }
  }

  private applyServerData(data: PlayerData): void {
    const cosmeticManager = getCosmeticManager();

    // Merge unlocked cosmetics (union of local and server)
    const localState = cosmeticManager.getState();
    const mergedUnlocks = Array.from(
      new Set([...localState.unlockedIds, ...data.unlockedIds])
    );

    // Use server's pinecone balance (authoritative)
    cosmeticManager.setState({
      unlockedIds: mergedUnlocks,
      equipped: data.equipped as CosmeticState['equipped'],
      pinecones: data.pinecones,
      totalPineconesEarned: Math.max(
        localState.totalPineconesEarned,
        data.totalPineconesEarned
      ),
    });

    // Update local stats if server has higher values
    if (data.stats.highScore > SaveManager.getHighScore()) {
      SaveManager.submitRun(data.stats.highScore, data.stats.highestWave);
    }
  }

  async serverPurchase(data: { cosmeticId: string }): Promise<PurchaseResult> {
    if (!AuthManager.isSignedIn()) {
      // Queue for later
      this.offlineQueue.push({ type: 'purchase', data });
      this.saveOfflineQueue();
      return { success: true }; // Optimistic - local purchase already happened
    }

    try {
      const token = await AuthManager.getIdToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      const response = await fetch('/api/player/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Purchase failed');
      }

      const result: { success: boolean; newBalance: number } =
        await response.json();
      return { success: true, newBalance: result.newBalance };
    } catch (error) {
      console.error('Server purchase error:', error);
      // Queue for retry
      this.offlineQueue.push({ type: 'purchase', data });
      this.saveOfflineQueue();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  async purchase(cosmeticId: string): Promise<PurchaseResult> {
    const cosmeticManager = getCosmeticManager();

    // Do local purchase first (optimistic)
    const localResult = cosmeticManager.purchase(cosmeticId);
    if (!localResult.success) {
      return { success: false, error: localResult.reason };
    }

    // Then sync with server
    const serverResult = await this.serverPurchase({ cosmeticId });

    // If server reports different balance, update local
    if (serverResult.success && serverResult.newBalance !== undefined) {
      const currentState = cosmeticManager.getState();
      if (currentState.pinecones !== serverResult.newBalance) {
        cosmeticManager.setState({ pinecones: serverResult.newBalance });
      }
    }

    return { success: true };
  }

  shouldSync(): boolean {
    if (!AuthManager.isSignedIn()) return false;
    return Date.now() - this.lastSyncTime > this.syncInterval;
  }

  async syncIfNeeded(): Promise<void> {
    if (this.shouldSync()) {
      await this.syncToServer();
    }
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  hasOfflineItems(): boolean {
    return this.offlineQueue.length > 0;
  }
}

// Singleton instance
let playerDataManagerInstance: PlayerDataManagerClass | null = null;

export function getPlayerDataManager(): PlayerDataManagerClass {
  if (!playerDataManagerInstance) {
    playerDataManagerInstance = new PlayerDataManagerClass();
  }
  return playerDataManagerInstance;
}

export const PlayerDataManager = {
  initialize: () => getPlayerDataManager().initialize(),
  syncToServer: () => getPlayerDataManager().syncToServer(),
  purchase: (cosmeticId: string) => getPlayerDataManager().purchase(cosmeticId),
  syncIfNeeded: () => getPlayerDataManager().syncIfNeeded(),
  shouldSync: () => getPlayerDataManager().shouldSync(),
  getLastSyncTime: () => getPlayerDataManager().getLastSyncTime(),
  hasOfflineItems: () => getPlayerDataManager().hasOfflineItems(),
};
