import Phaser from 'phaser';
import { WAVE_CONFIG, GAME_CONFIG, INFINITE_SWARM_CONFIG, XP_CONFIG } from '../config';
import { Enemy, EnemyType } from '../entities/Enemy';
import { ProgressionManager } from './ProgressionManager';

export class WaveManager {
  private scene: Phaser.Scene;
  public enemies: Phaser.GameObjects.Group;

  public currentWave: number = 0;
  public isWaveActive: boolean = false;
  private spawnQueue: EnemyType[] = [];
  private spawnTimer: number = 0;
  private totalSpawns: number = 0; // Total enemies to spawn this wave
  private spawnedCount: number = 0; // How many have been spawned so far
  private target: Phaser.GameObjects.Container | null = null;

  // Infinite swarm state
  private infiniteSwarmActive: boolean = false;
  private progressionManager: ProgressionManager | null = null;

  // Callback for when a splitter dies - GameScene sets this
  public onSplitterDeath: ((x: number, y: number) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemies = scene.add.group({
      classType: Enemy,
      runChildUpdate: true,
    });
  }

  setTarget(target: Phaser.GameObjects.Container): void {
    this.target = target;
  }

  setProgressionManager(progressionManager: ProgressionManager): void {
    this.progressionManager = progressionManager;
  }

  activateInfiniteSwarm(currentTime: number): void {
    this.infiniteSwarmActive = true;
    this.isWaveActive = true;
    this.spawnTimer = 0;
    // Initialize progression manager's infinite swarm state
    if (this.progressionManager) {
      this.progressionManager.activateInfiniteSwarm(currentTime);
    }
  }

  isInfiniteSwarm(): boolean {
    return this.infiniteSwarmActive;
  }

  startWave(): void {
    // Safety cap: never exceed the infinite swarm threshold
    // This prevents wave 21+ from starting - infinite swarm should take over at wave 20
    if (this.currentWave >= XP_CONFIG.infiniteSwarmWave) {
      // Shouldn't happen normally, but acts as a safety net
      return;
    }

    // Don't start a new wave if one is already active
    // This prevents double-starts from stacked delayed calls
    if (this.isWaveActive) {
      return;
    }

    this.currentWave++;
    this.isWaveActive = true;

    // Generate spawn queue based on wave number
    this.spawnQueue = this.generateSpawnQueue();
    this.totalSpawns = this.spawnQueue.length;
    this.spawnedCount = 0;
    this.spawnTimer = 0;
  }

  private generateSpawnQueue(): EnemyType[] {
    const queue: EnemyType[] = [];

    // Boss wave every 5 waves
    if (this.currentWave % WAVE_CONFIG.bossWaveInterval === 0) {
      const bossNumber = this.currentWave / WAVE_CONFIG.bossWaveInterval;

      if (bossNumber === 1) {
        // Wave 5: Ground boss only, no minions
        queue.push('boss');
      } else if (bossNumber === 2) {
        // Wave 10: Flying boss only, no minions
        queue.push('flyingBoss');
      } else {
        // Wave 15+: Both bosses with minions
        queue.push('boss');
        queue.push('flyingBoss');
        // Add minions based on boss number
        const minionCount = Math.floor(bossNumber);
        for (let i = 0; i < minionCount; i++) {
          queue.push(this.getRandomEnemyType());
        }
      }
      return queue;
    }

    // Normal wave - calculate count with cap
    const baseCount = WAVE_CONFIG.baseEnemyCount;
    const rawCount = Math.floor(baseCount * Math.pow(WAVE_CONFIG.enemyScalePerWave, this.currentWave - 1));
    const count = Math.min(rawCount, WAVE_CONFIG.maxEnemiesPerWave);

    for (let i = 0; i < count; i++) {
      queue.push(this.getRandomEnemyType());
    }

    return queue;
  }

  isBossWave(): boolean {
    return this.currentWave % WAVE_CONFIG.bossWaveInterval === 0;
  }

  private getRandomEnemyType(): EnemyType {
    const types: EnemyType[] = ['scurrier'];
    const weights: number[] = [30];

    // Unlock enemy types based on wave
    if (this.currentWave >= 2) { types.push('spitter'); weights.push(20); }
    if (this.currentWave >= 3) { types.push('swooper'); weights.push(15); }
    if (this.currentWave >= 5) { types.push('shellback'); weights.push(12); }
    if (this.currentWave >= 8) { types.push('burrower'); weights.push(10); }
    if (this.currentWave >= 12) { types.push('splitter'); weights.push(8); }
    if (this.currentWave >= 15) { types.push('healer'); weights.push(5); }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < types.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return types[i];
    }

    return 'scurrier';
  }

  // Calculate current spawn interval based on progress through the wave
  private getCurrentSpawnInterval(): number {
    if (this.totalSpawns <= 1) return WAVE_CONFIG.spawnIntervalStart;

    // Starting interval decreases every N waves (scalingInterval)
    const scalingSteps = Math.floor((this.currentWave - 1) / WAVE_CONFIG.scalingInterval);
    const startInterval = Math.max(
      WAVE_CONFIG.spawnIntervalMinStart,
      WAVE_CONFIG.spawnIntervalStart - scalingSteps * WAVE_CONFIG.spawnIntervalDecayPerWave
    );
    const endInterval = WAVE_CONFIG.spawnIntervalEnd;

    // Lerp from start to end based on spawn progress
    const progress = this.spawnedCount / (this.totalSpawns - 1);
    return startInterval + (endInterval - startInterval) * progress;
  }

  update(time: number, delta: number): void {
    if (!this.isWaveActive) return;

    // Handle infinite swarm mode
    if (this.infiniteSwarmActive) {
      // Update progression manager's swarm difficulty
      if (this.progressionManager) {
        this.progressionManager.updateInfiniteSwarm(time, delta);
      }

      // Spawn enemies continuously using progression manager's interval
      this.spawnTimer += delta;
      const interval = this.progressionManager?.getSwarmSpawnInterval() ?? INFINITE_SWARM_CONFIG.baseSpawnInterval;
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this.spawnInfiniteSwarmEnemy();
      }
    } else {
      // Normal wave mode - spawn enemies from queue with dynamic interval
      this.spawnTimer += delta;
      const interval = this.getCurrentSpawnInterval();
      if (this.spawnQueue.length > 0 && this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this.spawnedCount++;
        this.spawnEnemy(this.spawnQueue.shift()!);
      }

      // Check if wave is complete
      if (this.spawnQueue.length === 0 && this.enemies.getLength() === 0) {
        this.isWaveActive = false;
      }
    }

    // Clean up dead enemies
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Enemy;
      if (e.isDead()) {
        e.destroy();
      }
    });
  }

  private spawnInfiniteSwarmEnemy(): void {
    // Use difficulty multiplier for scaled enemy stats
    const type = this.getRandomEnemyType();
    const difficultyMult = this.progressionManager?.getSwarmDifficultyMultiplier() ?? 1.0;

    let x: number;
    let y: number;

    // Random edge spawn
    const side = Math.random() < 0.5 ? 'left' : 'right';
    x = side === 'left' ? 50 : GAME_CONFIG.width - 50;
    // Flying enemies spawn at top
    y = (type === 'swooper' || type === 'healer') ? 100 : GAME_CONFIG.height - 100;

    // Use very high wave for unlocking all enemy types (wave 100)
    const enemy = new Enemy(this.scene, x, y, type, 100, difficultyMult);
    if (this.target) {
      enemy.setTarget(this.target);
    }
    this.enemies.add(enemy);
  }

  private spawnEnemy(type: EnemyType): void {
    let x: number;
    let y: number;

    if (type === 'boss') {
      // Ground boss spawns at a random edge on the ground
      const side = Math.random() < 0.5 ? 'left' : 'right';
      x = side === 'left' ? 80 : GAME_CONFIG.width - 80;
      y = GAME_CONFIG.height - 150;
    } else if (type === 'flyingBoss') {
      // Flying boss spawns at top center area
      x = GAME_CONFIG.width / 2 + (Math.random() - 0.5) * 200;
      y = 100;
    } else {
      // Regular enemies spawn at random edge
      const side = Math.random() < 0.5 ? 'left' : 'right';
      x = side === 'left' ? 50 : GAME_CONFIG.width - 50;
      // Flying enemies (swooper, healer) spawn at top
      y = (type === 'swooper' || type === 'healer') ? 100 : GAME_CONFIG.height - 100;
    }

    const enemy = new Enemy(this.scene, x, y, type, this.currentWave);
    if (this.target) {
      enemy.setTarget(this.target);
    }
    this.enemies.add(enemy);
  }

  // Spawn splitlings at a specific position (called by GameScene on splitter death)
  spawnSplitlings(x: number, y: number): void {
    for (let i = 0; i < 2; i++) {
      const offsetX = i === 0 ? -25 : 25;
      const splitling = new Enemy(this.scene, x + offsetX, y, 'splitling', this.currentWave);
      if (this.target) {
        splitling.setTarget(this.target);
      }
      // Give splitlings a little upward and outward velocity
      const body = splitling.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(offsetX * 4, -200);
      this.enemies.add(splitling);
    }
  }

  getEnemyCount(): number {
    return this.enemies.getLength() + this.spawnQueue.length;
  }

  isWaveComplete(): boolean {
    return !this.isWaveActive && this.enemies.getLength() === 0 && this.spawnQueue.length === 0;
  }

  reset(): void {
    this.currentWave = 0;
    this.isWaveActive = false;
    this.spawnQueue = [];
    this.totalSpawns = 0;
    this.spawnedCount = 0;
    this.infiniteSwarmActive = false;
    this.spawnTimer = 0;
    this.enemies.clear(true, true);
  }
}
