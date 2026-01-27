import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, WAVE_CONFIG, PLAYER_CONFIG } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Quill } from '../entities/Quill';
import { QuillManager } from '../systems/QuillManager';
import { WaveManager } from '../systems/WaveManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SaveManager } from '../systems/SaveManager';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private quillManager!: QuillManager;
  private waveManager!: WaveManager;
  private upgradeManager!: UpgradeManager;
  private hud!: HUD;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;

  private waveCompleteTimer: number = 0;
  private isChoosingUpgrade: boolean = false;
  private gameOver: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameOver = false;
    this.isChoosingUpgrade = false;
    this.waveCompleteTimer = 0;

    // Initialize systems
    this.upgradeManager = new UpgradeManager();
    this.quillManager = new QuillManager(this, this.upgradeManager);

    // Create platforms
    this.createPlatforms();

    // Create player
    this.player = new Player(
      this,
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - 150,
      this.quillManager,
      this.upgradeManager
    );

    // Set up wave manager
    this.waveManager = new WaveManager(this);
    this.waveManager.setTarget(this.player);

    // Create enemy projectile group
    this.enemyProjectiles = this.physics.add.group();

    // Create HUD
    this.hud = new HUD(this, this.player, this.quillManager, this.waveManager, this.upgradeManager);

    // Set up collisions
    this.setupCollisions();

    // Set up input
    this.setupInput();

    // Start first wave
    this.time.delayedCall(1000, () => {
      this.waveManager.startWave();
    });

    // Listen for resume from upgrade scene
    this.events.on('resume', this.onResumeFromUpgrade, this);
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - 30,
      GAME_CONFIG.width,
      60,
      COLORS.platform
    );
    this.platforms.add(ground);

    // Create some platforms - arranged as stepping stones
    const platformData = [
      // Lower tier (easy to reach from ground)
      { x: 200, y: 550, width: 200 },
      { x: 640, y: 550, width: 200 },
      { x: 1080, y: 550, width: 200 },
      // Mid tier (reachable from lower tier)
      { x: 400, y: 420, width: 180 },
      { x: 880, y: 420, width: 180 },
      // Upper tier (reachable from mid tier)
      { x: 640, y: 300, width: 220 },
      { x: 150, y: 350, width: 140 },
      { x: 1130, y: 350, width: 140 },
    ];

    platformData.forEach(({ x, y, width }) => {
      const platform = this.add.rectangle(x, y, width, 20, COLORS.platform);
      this.platforms.add(platform);
    });
  }

  private setupCollisions(): void {
    // Player collides with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Enemies collide with platforms
    this.physics.add.collider(this.waveManager.enemies, this.platforms);

    // Player quills hit enemies
    this.physics.add.overlap(
      this.quillManager.quills,
      this.waveManager.enemies,
      this.onQuillHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Enemies hit player
    this.physics.add.overlap(
      this.player,
      this.waveManager.enemies,
      this.onEnemyHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Enemy projectiles hit player
    this.physics.add.overlap(
      this.player,
      this.enemyProjectiles,
      this.onProjectileHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private setupInput(): void {
    // Shooting with mouse
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isChoosingUpgrade) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.player.shoot(worldPoint.x, worldPoint.y);
    });

    // Hold to shoot continuously
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || this.gameOver || this.isChoosingUpgrade) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.player.shoot(worldPoint.x, worldPoint.y);
    });

    // Escape to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gameOver || this.isChoosingUpgrade) return;
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    // Update systems
    this.player.update(time, delta);
    this.quillManager.update(time, delta);
    this.waveManager.update(time, delta);
    this.hud.update();

    // Handle enemy shooting
    this.handleEnemyShooting();

    // Check for wave completion
    if (!this.isChoosingUpgrade && this.waveManager.isWaveComplete()) {
      this.waveCompleteTimer += delta;

      if (this.waveCompleteTimer >= WAVE_CONFIG.waveDelay) {
        this.waveCompleteTimer = 0;
        this.showUpgradeSelection();
      }
    }

    // Check for player death
    if (this.player.isDead()) {
      this.onPlayerDeath();
    }
  }

  private handleEnemyShooting(): void {
    this.waveManager.enemies.getChildren().forEach((enemy) => {
      const e = enemy as Enemy;

      if (e.canShoot()) {
        e.markShot();

        // Create projectile toward player
        const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
        const speed = e.getProjectileSpeed();

        const projectile = this.add.circle(e.x, e.y, 8, 0x00ff00);
        this.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        body.setAllowGravity(false);

        this.enemyProjectiles.add(projectile);

        // Destroy after timeout
        this.time.delayedCall(3000, () => {
          if (projectile.active) projectile.destroy();
        });
      }
    });
  }

  private onQuillHitEnemy(quillObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const quill = quillObj as Quill;
    const enemy = enemyObj as Enemy;

    if (quill.isDead() || enemy.isDead()) return;

    // Calculate hit angle for shellback blocking
    const hitAngle = Math.atan2(enemy.y - quill.y, enemy.x - quill.x);

    // Deal damage
    const killed = enemy.takeDamage(quill.getDamage(), hitAngle);

    if (killed) {
      this.hud.addScore(enemy.points);
      this.spawnDeathParticles(enemy.x, enemy.y);

      // Chance to drop quill pickup
      if (Math.random() < 0.3) {
        this.spawnQuillPickup(enemy.x, enemy.y);
      }
    }

    // Handle quill (may pierce or die)
    quill.onHitEnemy();
  }

  private onEnemyHitPlayer(_playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObj as Enemy;

    if (enemy.isDead()) return;

    this.player.takeDamage(enemy.damage);
  }

  private onProjectileHitPlayer(_playerObj: Phaser.GameObjects.GameObject, projectileObj: Phaser.GameObjects.GameObject): void {
    const projectile = projectileObj as Phaser.GameObjects.Arc;

    this.player.takeDamage(15);
    projectile.destroy();
  }

  private spawnDeathParticles(x: number, y: number): void {
    // Simple particle effect
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 4, 0xff4444);
      this.physics.add.existing(particle);
      const body = particle.body as Phaser.Physics.Arcade.Body;

      const angle = (i / 8) * Math.PI * 2;
      const speed = 100 + Math.random() * 100;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed - 100);

      this.tweens.add({
        targets: particle,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private spawnQuillPickup(x: number, y: number): void {
    const pickup = this.add.triangle(x, y, 0, 10, 5, 0, 10, 10, 0xffffff);
    this.physics.add.existing(pickup);
    const body = pickup.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-100);

    // Bob animation
    this.tweens.add({
      targets: pickup,
      y: y - 10,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Pickup collision
    this.physics.add.overlap(this.player, pickup, () => {
      this.quillManager.addQuills(3);
      pickup.destroy();
    });

    // Timeout
    this.time.delayedCall(10000, () => {
      if (pickup.active) {
        this.tweens.add({
          targets: pickup,
          alpha: 0,
          duration: 500,
          onComplete: () => pickup.destroy(),
        });
      }
    });
  }

  private showUpgradeSelection(): void {
    this.isChoosingUpgrade = true;
    this.hud.showWaveComplete();

    // Pause game and show upgrade scene
    this.scene.pause();
    this.scene.launch('UpgradeScene', {
      upgradeManager: this.upgradeManager,
      playerStats: {
        health: this.player.health,
        maxHealth: this.player.maxHealth,
      },
      wave: this.waveManager.currentWave,
    });
  }

  private onResumeFromUpgrade(): void {
    this.isChoosingUpgrade = false;

    // Apply any health upgrades
    const healthBonus = this.upgradeManager.getModifier('maxHealth');
    this.player.maxHealth = PLAYER_CONFIG.maxHealth + healthBonus;
    this.player.heal(20); // Small heal between waves

    // Check if next wave is a boss wave
    const nextWave = this.waveManager.currentWave + 1;
    const isBossWave = nextWave % 5 === 0;

    // Start next wave
    this.time.delayedCall(500, () => {
      if (isBossWave) {
        this.hud.showBossWarning();
        this.time.delayedCall(1500, () => {
          this.waveManager.startWave();
        });
      } else {
        this.waveManager.startWave();
      }
    });
  }

  private onPlayerDeath(): void {
    this.gameOver = true;

    // Submit score
    const isNewHighScore = SaveManager.submitRun(this.hud.score, this.waveManager.currentWave);

    // Show game over screen
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        score: this.hud.score,
        wave: this.waveManager.currentWave,
        victory: false,
        isNewHighScore,
        highScore: SaveManager.getHighScore(),
        highestWave: SaveManager.getHighestWave(),
      });
    });
  }

  shutdown(): void {
    this.events.off('resume', this.onResumeFromUpgrade, this);
  }
}
