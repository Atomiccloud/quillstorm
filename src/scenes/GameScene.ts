import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, WAVE_CONFIG, PLAYER_CONFIG } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Quill } from '../entities/Quill';
import { QuillManager } from '../systems/QuillManager';
import { WaveManager } from '../systems/WaveManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { LevelGenerator } from '../systems/LevelGenerator';
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

    // Create enemy projectile group (no gravity so projectiles fly straight)
    this.enemyProjectiles = this.physics.add.group({
      allowGravity: false,
      collideWorldBounds: false
    });

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

  private createPlatforms(wave: number = 1): void {
    this.platforms = this.physics.add.staticGroup();

    // Ground (always present)
    const ground = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - 30,
      GAME_CONFIG.width,
      60,
      COLORS.platform
    );
    this.platforms.add(ground);

    // Get platforms from level generator based on current wave
    const platformData = LevelGenerator.getPlatformsForWave(wave);

    platformData.forEach(({ x, y, width }) => {
      const platform = this.add.rectangle(x, y, width, 20, COLORS.platform);
      this.platforms.add(platform);
    });
  }

  private regeneratePlatforms(wave: number): void {
    // Clear existing platforms
    this.platforms.clear(true, true);

    // Recreate with new layout
    this.createPlatforms(wave);

    // Re-establish collision with player (collider persists, but group changed)
    this.physics.add.collider(this.player, this.platforms);

    // Re-establish collision with enemies
    this.physics.add.collider(
      this.waveManager.enemies,
      this.platforms,
      undefined,
      (enemyObj) => {
        const enemy = enemyObj as unknown as Enemy;
        if (enemy.enemyType === 'swooper') {
          return enemy.isDiving;
        }
        return true;
      },
      this
    );
  }

  private setupCollisions(): void {
    // Player collides with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Enemies collide with platforms (swoopers only when diving)
    this.physics.add.collider(
      this.waveManager.enemies,
      this.platforms,
      undefined,
      (enemyObj) => {
        const enemy = enemyObj as unknown as Enemy;
        // Swoopers can phase through platforms when hovering, only collide when diving
        if (enemy.enemyType === 'swooper') {
          return enemy.isDiving;
        }
        return true;
      },
      this
    );

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
      if (this.player.shoot(worldPoint.x, worldPoint.y)) {
        AudioManager.playShoot();
      }
    });

    // Hold to shoot continuously
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || this.gameOver || this.isChoosingUpgrade) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.player.shoot(worldPoint.x, worldPoint.y)) {
        AudioManager.playShoot();
      }
    });

    // Escape to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gameOver || this.isChoosingUpgrade) return;
      this.scene.pause();
      this.scene.launch('PauseScene');
    });

    // M to toggle mute
    this.input.keyboard?.on('keydown-M', () => {
      const muted = AudioManager.toggleMute();
      this.showMuteIndicator(muted);
    });
  }

  private showMuteIndicator(muted: boolean): void {
    const text = this.add.text(
      GAME_CONFIG.width / 2,
      100,
      muted ? 'MUTED' : 'UNMUTED',
      {
        fontSize: '24px',
        fontFamily: 'Arial Black, sans-serif',
        color: muted ? '#ff6666' : '#66ff66',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: 80,
      duration: 1000,
      onComplete: () => text.destroy(),
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

        const baseAngle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
        const speed = e.getProjectileSpeed();
        const burstCount = e.getBurstCount();

        // Fire projectiles - bosses in phase 2 fire a spread
        for (let i = 0; i < burstCount; i++) {
          // Spread angle for burst shots
          const spreadOffset = burstCount > 1 ? (i - (burstCount - 1) / 2) * 0.2 : 0;
          const angle = baseAngle + spreadOffset;

          // Boss projectiles are larger and red
          const projSize = e.isBoss() ? 12 : 8;
          const projColor = e.isBoss() ? 0xff4400 : 0x00ff00;

          const projectile = this.add.circle(e.x, e.y, projSize, projColor);
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
      AudioManager.playEnemyDeath();
      this.hud.addScore(enemy.points);
      this.spawnDeathParticles(enemy.x, enemy.y);

      // Chance to drop quill pickup
      if (Math.random() < 0.3) {
        this.spawnQuillPickup(enemy.x, enemy.y);
      }
    } else {
      AudioManager.playHit();
    }

    // Handle quill (may pierce or die)
    quill.onHitEnemy();
  }

  private onEnemyHitPlayer(_playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObj as Enemy;

    if (enemy.isDead()) return;

    if (this.player.takeDamage(enemy.damage)) {
      AudioManager.playPlayerDamage();
    }
  }

  private onProjectileHitPlayer(_playerObj: Phaser.GameObjects.GameObject, projectileObj: Phaser.GameObjects.GameObject): void {
    const projectile = projectileObj as Phaser.GameObjects.Arc;

    if (this.player.takeDamage(15)) {
      AudioManager.playPlayerDamage();
    }
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
    // Create container for pickup with glow effect
    const pickupContainer = this.add.container(x, y);

    // Glow effect (larger, semi-transparent circle behind)
    const glow = this.add.circle(0, 0, 16, 0x00ffff, 0.3);
    pickupContainer.add(glow);

    // Pulsing glow animation
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.3, to: 0.1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Draw quill shape using graphics
    const quillGraphics = this.add.graphics();
    quillGraphics.fillStyle(0x00ffff);
    // Quill body - elongated diamond shape
    quillGraphics.beginPath();
    quillGraphics.moveTo(12, 0);   // Tip (right)
    quillGraphics.lineTo(0, -4);   // Top back
    quillGraphics.lineTo(-12, 0);  // Back (left)
    quillGraphics.lineTo(0, 4);    // Bottom back
    quillGraphics.closePath();
    quillGraphics.fillPath();
    // Sharp tip highlight
    quillGraphics.fillStyle(0xffffff);
    quillGraphics.fillTriangle(12, 0, 6, -2, 6, 2);
    pickupContainer.add(quillGraphics);

    // Add physics to container
    this.physics.add.existing(pickupContainer);
    const body = pickupContainer.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 16);
    body.setOffset(-12, -8);
    body.setVelocityY(-150);
    body.setAllowGravity(true);
    body.setBounce(0.3);

    // Enable platform collision so pickups land on surfaces
    this.physics.add.collider(pickupContainer, this.platforms);

    // Gentle floating animation after landing
    this.time.delayedCall(800, () => {
      if (pickupContainer.active) {
        this.tweens.add({
          targets: pickupContainer,
          y: pickupContainer.y - 8,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });

    // Pickup collision with player
    this.physics.add.overlap(this.player, pickupContainer, () => {
      // Spawn collect particles
      this.spawnCollectParticles(pickupContainer.x, pickupContainer.y);
      AudioManager.playPickup();
      this.quillManager.addQuills(3);
      pickupContainer.destroy();
    });

    // Timeout with flash warning before despawn
    this.time.delayedCall(8000, () => {
      if (pickupContainer.active) {
        // Flash warning (5 blinks) before disappearing
        this.tweens.add({
          targets: pickupContainer,
          alpha: 0.2,
          duration: 200,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            if (pickupContainer.active) pickupContainer.destroy();
          },
        });
      }
    });
  }

  private spawnCollectParticles(x: number, y: number): void {
    // Burst of cyan particles spiraling outward on pickup collection
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.add.circle(x, y, 4, 0x00ffff);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
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

    // Check if layout should change (after boss waves: 5, 10, 15, etc.)
    const currentWave = this.waveManager.currentWave;
    if (LevelGenerator.shouldChangeLayout(currentWave)) {
      // Show layout change notification
      this.showLayoutChange(currentWave + 1);
      // Regenerate platforms for next wave
      this.regeneratePlatforms(currentWave + 1);
    }

    // Check if next wave is a boss wave
    const nextWave = currentWave + 1;
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

  private showLayoutChange(wave: number): void {
    const layoutName = LevelGenerator.getLayoutName(wave);
    const text = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 + 50,
      `New Arena: ${layoutName.toUpperCase()}`,
      {
        fontSize: '28px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: text,
      alpha: 0,
      y: GAME_CONFIG.height / 2,
      duration: 2500,
      onComplete: () => text.destroy(),
    });
  }

  private onPlayerDeath(): void {
    this.gameOver = true;
    AudioManager.playGameOver();

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
