import Phaser from 'phaser';
import { WAVE_CONFIG, GAME_CONFIG } from '../config';
import { Enemy, EnemyType } from '../entities/Enemy';

export class WaveManager {
  private scene: Phaser.Scene;
  public enemies: Phaser.GameObjects.Group;

  public currentWave: number = 0;
  public isWaveActive: boolean = false;
  private spawnQueue: EnemyType[] = [];
  private spawnTimer: number = 0;
  private target: Phaser.GameObjects.Container | null = null;

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

  startWave(): void {
    this.currentWave++;
    this.isWaveActive = true;

    // Generate spawn queue based on wave number
    this.spawnQueue = this.generateSpawnQueue();
    this.spawnTimer = 0;
  }

  private generateSpawnQueue(): EnemyType[] {
    const queue: EnemyType[] = [];

    // Boss wave every 5 waves
    if (this.currentWave % WAVE_CONFIG.bossWaveInterval === 0) {
      // Boss wave: just the boss plus a few minions
      queue.push('boss');
      const minionCount = Math.floor(this.currentWave / 5) + 2;
      for (let i = 0; i < minionCount; i++) {
        queue.push(this.getRandomEnemyType());
      }
      return queue;
    }

    // Normal wave
    const baseCount = WAVE_CONFIG.baseEnemyCount;
    const count = Math.floor(baseCount * Math.pow(WAVE_CONFIG.enemyScalePerWave, this.currentWave - 1));

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

    // Unlock enemy types based on wave
    if (this.currentWave >= 2) types.push('spitter');
    if (this.currentWave >= 3) types.push('swooper');
    if (this.currentWave >= 5) types.push('shellback');

    // Weight toward basic enemies
    const weights: number[] = types.map((type) => {
      if (type === 'scurrier') return 40;
      if (type === 'spitter') return 25;
      if (type === 'swooper') return 20;
      if (type === 'shellback') return 15;
      return 10;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;

    for (let i = 0; i < types.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return types[i];
    }

    return 'scurrier';
  }

  update(_time: number, delta: number): void {
    if (!this.isWaveActive) return;

    // Spawn enemies from queue
    this.spawnTimer += delta;
    if (this.spawnQueue.length > 0 && this.spawnTimer >= WAVE_CONFIG.timeBetweenSpawns) {
      this.spawnTimer = 0;
      this.spawnEnemy(this.spawnQueue.shift()!);
    }

    // Check if wave is complete
    if (this.spawnQueue.length === 0 && this.enemies.getLength() === 0) {
      this.isWaveActive = false;
    }

    // Clean up dead enemies
    this.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Enemy;
      if (e.isDead()) {
        e.destroy();
      }
    });
  }

  private spawnEnemy(type: EnemyType): void {
    let x: number;
    let y: number;

    if (type === 'boss') {
      // Boss spawns at a random edge
      const side = Math.random() < 0.5 ? 'left' : 'right';
      x = side === 'left' ? 80 : GAME_CONFIG.width - 80;
      y = GAME_CONFIG.height - 150;
    } else {
      // Regular enemies spawn at random edge
      const side = Math.random() < 0.5 ? 'left' : 'right';
      x = side === 'left' ? 50 : GAME_CONFIG.width - 50;
      y = type === 'swooper' ? 100 : GAME_CONFIG.height - 100;
    }

    const enemy = new Enemy(this.scene, x, y, type);
    if (this.target) {
      enemy.setTarget(this.target);
    }
    this.enemies.add(enemy);
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
    this.enemies.clear(true, true);
  }
}
