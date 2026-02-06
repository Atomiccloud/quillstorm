import Phaser from 'phaser';
import { GAME_CONFIG, COLORS, WAVE_CONFIG, PLAYER_CONFIG, ENEMY_CONFIG, CHEST_CONFIG, PINECONE_CONFIG, ELITE_CONFIG, DANGER_CONFIG, STATUS_EFFECT_CONFIG, QUILL_CONFIG, INFINITE_SWARM_CONFIG, BOSS_REWARD_CONFIG, VAMPIRISM_CONFIG, KNOCKBACK_CONFIG, DODGE_COUNTER_CONFIG } from '../config';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Quill } from '../entities/Quill';
import { Companion } from '../entities/Companion';
import { XPOrb } from '../entities/XPOrb';
import { TreasureChest } from '../entities/TreasureChest';
import { Pinecone } from '../entities/Pinecone';
import { QuillManager } from '../systems/QuillManager';
import { WaveManager } from '../systems/WaveManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { ProgressionManager } from '../systems/ProgressionManager';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { LevelGenerator } from '../systems/LevelGenerator';
import { HUD } from '../ui/HUD';
import { StatsPanel } from '../ui/StatsPanel';
import { SessionManager } from '../systems/SessionManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private quillManager!: QuillManager;
  private waveManager!: WaveManager;
  private upgradeManager!: UpgradeManager;
  private progressionManager!: ProgressionManager;
  private hud!: HUD;
  private statsPanel!: StatsPanel;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private xpOrbs!: Phaser.GameObjects.Group;
  private treasureChests!: Phaser.GameObjects.Group;
  private pinecones!: Phaser.GameObjects.Group;
  private companions: Companion[] = [];

  // Track upgrade source for different flows
  private pendingUpgradeSource: 'wave' | 'chest' | 'levelup' | 'bossReward' | null = null;
  private previousMaxShields: number = 0;  // For syncNewShieldCharges bug fix

  private waveCompleteTimer: number = 0;
  private isChoosingUpgrade: boolean = false;
  private gameOver: boolean = false;
  private lastSwarmStage: number = 0;  // Track stage changes for transition effects
  private shootingBlocked: boolean = false;  // Prevents accidental shots after upgrade selection
  private effectsOpacity: number = 1;

  // Burrower exclamation mark containers
  private burrowerExclamations: Map<Enemy, Phaser.GameObjects.Container> = new Map();

  // Bomber danger zones
  private bombZones: Array<{
    x: number;
    y: number;
    timer: number;
    phase: 'warning' | 'active';
    warningVisual: Phaser.GameObjects.Graphics;
    damageDealt: boolean;
  }> = [];

  // Cumulative session stats (for game over display)
  private sessionKills: number = 0;
  private sessionKillsByType: Record<string, number> = {};
  private sessionEliteKillsByType: Record<string, number> = {};
  private totalDamageTaken: number = 0;
  private totalShieldsUsed: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameOver = false;
    this.isChoosingUpgrade = false;
    this.waveCompleteTimer = 0;

    // Initialize systems
    this.upgradeManager = new UpgradeManager();
    this.progressionManager = new ProgressionManager(this.upgradeManager);
    this.quillManager = new QuillManager(this, this.upgradeManager);

    this.effectsOpacity = SaveManager.getEffectsOpacity();

    SessionManager.startSession();

    // Create XP orbs, treasure chest, and pinecone groups
    this.xpOrbs = this.add.group({ runChildUpdate: true });
    this.treasureChests = this.add.group({ runChildUpdate: true });
    this.pinecones = this.add.group({ runChildUpdate: true });

    // Set world bounds to match game area (prevent going off screen)
    this.physics.world.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

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
    this.waveManager.setProgressionManager(this.progressionManager);
    this.waveManager.setUpgradeManager(this.upgradeManager);

    // Give quill manager access to enemies for homing quills
    this.quillManager.setEnemiesGroup(this.waveManager.enemies);

    // Create enemy projectile group (no gravity so projectiles fly straight)
    this.enemyProjectiles = this.physics.add.group({
      allowGravity: false,
      collideWorldBounds: false
    });

    // Create HUD
    this.hud = new HUD(this, this.player, this.quillManager, this.waveManager, this.upgradeManager);
    this.hud.setProgressionManager(this.progressionManager);

    // Create stats panel (Tab to toggle)
    this.statsPanel = new StatsPanel(this, this.upgradeManager);

    // Set up collisions
    this.setupCollisions();

    // Set up input
    this.setupInput();

    // Start first wave
    this.time.delayedCall(1000, () => {
      this.player.resetShieldsForWave();
      this.player.resetPerf();
      this.updateCompanions();
      SessionManager._mw();
      SessionManager._sw(1);
      this.waveManager.startWave();
    });

    // Listen for resume from upgrade scene
    this.events.on('resume', this.onResumeFromUpgrade, this);
  }

  private getStageColors(wave: number): { platform: number; background: number } {
    // Determine stage based on wave (changes after each boss: 5, 10, 15, 20)
    const stageIndex = Math.min(Math.floor((wave - 1) / 5), COLORS.stages.length - 1);
    return COLORS.stages[stageIndex];
  }

  private createPlatforms(wave: number = 1): void {
    this.platforms = this.physics.add.staticGroup();

    // Get stage colors based on wave
    const stageColors = this.getStageColors(wave);

    // Update background color
    this.cameras.main.setBackgroundColor(stageColors.background);

    // Ground (always present)
    const ground = this.add.rectangle(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - 30,
      GAME_CONFIG.width,
      60,
      stageColors.platform
    );
    this.platforms.add(ground);

    // Get platforms from level generator based on current wave
    const platformData = LevelGenerator.getPlatformsForWave(wave);

    platformData.forEach(({ x, y, width }) => {
      const platform = this.add.rectangle(x, y, width, 20, stageColors.platform);
      this.platforms.add(platform);
    });
  }

  private regeneratePlatforms(wave: number): void {
    // Ground floor position (always exists in all layouts)
    const groundY = GAME_CONFIG.height - 40;

    // Move all collectibles to a safe position above ground floor before clearing platforms
    // This prevents items from falling through during the transition
    const safeY = groundY - 50;

    this.treasureChests.getChildren().forEach((chest) => {
      const chestBody = (chest as TreasureChest).body as Phaser.Physics.Arcade.Body;
      if (chestBody) {
        chestBody.setVelocity(0, 0);
        (chest as TreasureChest).y = safeY;
      }
    });

    this.xpOrbs.getChildren().forEach((orb) => {
      const orbBody = (orb as XPOrb).body as Phaser.Physics.Arcade.Body;
      if (orbBody) {
        orbBody.setVelocity(0, 0);
        (orb as XPOrb).y = safeY;
      }
    });

    this.pinecones.getChildren().forEach((pinecone) => {
      const pineconeBody = (pinecone as Pinecone).body as Phaser.Physics.Arcade.Body;
      if (pineconeBody) {
        pineconeBody.setVelocity(0, 0);
        (pinecone as Pinecone).y = safeY;
      }
    });

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
        // Flying boss never collides with platforms
        if (enemy.enemyType === 'flyingBoss') {
          return false;
        }
        if (enemy.enemyType === 'healer') {
          return false;
        }
        if (enemy.isBurrowed) {
          return false;
        }
        return true;
      },
      this
    );

    // Re-establish collision for existing treasure chests
    this.treasureChests.getChildren().forEach((chest) => {
      this.physics.add.collider(chest, this.platforms);
    });

    // Re-establish collision for existing XP orbs
    this.xpOrbs.getChildren().forEach((orb) => {
      this.physics.add.collider(orb, this.platforms);
    });

    // Re-establish collision for existing pinecones
    this.pinecones.getChildren().forEach((pinecone) => {
      this.physics.add.collider(pinecone, this.platforms);
    });
  }

  private setupCollisions(): void {
    // Player collides with platforms
    this.physics.add.collider(this.player, this.platforms);

    // Enemies collide with platforms (exceptions for flying/burrowed enemies)
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
        // Flying boss never collides with platforms
        if (enemy.enemyType === 'flyingBoss') {
          return false;
        }
        // Healers float, no platform collision
        if (enemy.enemyType === 'healer') {
          return false;
        }
        // Burrowed enemies phase through platforms
        if (enemy.isBurrowed) {
          return false;
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
      if (this.gameOver || this.isChoosingUpgrade || this.shootingBlocked) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.player.shoot(worldPoint.x, worldPoint.y)) {
        AudioManager.playShoot();
      }
    });

    // Hold to shoot continuously
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || this.gameOver || this.isChoosingUpgrade || this.shootingBlocked) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.player.shoot(worldPoint.x, worldPoint.y)) {
        AudioManager.playShoot();
      }
    });

    // Escape to pause
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gameOver || this.isChoosingUpgrade) return;
      this.scene.pause();
      this.scene.launch('PauseScene', { upgradeManager: this.upgradeManager });
    });

    // M to toggle mute
    this.input.keyboard?.on('keydown-M', () => {
      const muted = AudioManager.toggleMute();
      this.showMuteIndicator(muted);
    });

    // R to quick restart
    this.input.keyboard?.on('keydown-R', () => {
      if (this.isChoosingUpgrade) return;
      this.scene.restart();
    });

    // Tab to toggle stats panel
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault(); // Prevent browser tab switching
      if (this.gameOver || this.isChoosingUpgrade) return;
      this.statsPanel.toggle();
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
    this.statsPanel.update();

    // Update companions
    this.companions.forEach((companion) => {
      companion.update(time, delta, this.waveManager.enemies);
    });

    // Handle enemy shooting
    this.handleEnemyShooting();

    // Handle new enemy mechanics (burrower AOE, healer sounds, shellback roll sounds)
    this.handleNewEnemyMechanics();

    // Check for infinite swarm stage changes
    if (this.waveManager.isInfiniteSwarm()) {
      const currentStage = this.progressionManager.getCurrentStage();
      if (currentStage !== this.lastSwarmStage) {
        this.onSwarmStageChange(currentStage);
        this.lastSwarmStage = currentStage;
      }
    }

    // Check for wave completion (not in infinite swarm mode)
    if (!this.isChoosingUpgrade && !this.waveManager.isInfiniteSwarm() && this.waveManager.isWaveComplete()) {
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

          // Add to group FIRST, then set velocity (group can reset body properties)
          this.enemyProjectiles.add(projectile);

          const body = projectile.body as Phaser.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

          // Destroy after timeout
          this.time.delayedCall(3000, () => {
            if (projectile.active) projectile.destroy();
          });
        }
      }
    });
  }

  private handleNewEnemyMechanics(): void {
    this.waveManager.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (enemy.isDead()) return;

      // Burrower warning - show dirt particles before surfacing
      if (enemy._showingWarning) {
        enemy._showingWarning = false;
        this.spawnDirtWarning(enemy.x, enemy.y + 30);
      }

      // Burrower surfacing AOE
      if (enemy._justSurfaced) {
        enemy._justSurfaced = false;
        AudioManager.playBurrowSurface();
        const config = ENEMY_CONFIG.burrower;

        // AOE damage to player if in range
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist <= config.surfaceRadius) {
          if (this.player._uf(config.surfaceDamage)) {
            AudioManager.playPlayerDamage();
          }
        }

        // Visual: dirt burst effect
        this.spawnBurrowEffect(enemy.x, enemy.y, config.surfaceRadius);
      }

      // Healer heal sound
      if (enemy._justHealed) {
        enemy._justHealed = false;
        AudioManager.playHeal();
      }

      // Burrower exclamation mark management
      if (enemy.isBurrower()) {
        if (enemy._showingExclamation && !this.burrowerExclamations.has(enemy)) {
          const excl = this.createExclamationMark(enemy.x, enemy.y - 20);
          this.burrowerExclamations.set(enemy, excl);
        } else if (!enemy._showingExclamation && this.burrowerExclamations.has(enemy)) {
          this.burrowerExclamations.get(enemy)!.destroy();
          this.burrowerExclamations.delete(enemy);
        }
        // Update position if still showing
        const excl = this.burrowerExclamations.get(enemy);
        if (excl) {
          excl.setPosition(enemy.x, enemy.y - 20);
        }
      }

      // Bomber bomb drop
      if (enemy._droppingBomb) {
        enemy._droppingBomb = false;
        this.createBombZone(enemy._bombDropX, enemy._bombDropY);
      }
    });

    // Clean up exclamation marks for dead/destroyed enemies
    this.burrowerExclamations.forEach((excl, enemy) => {
      if (enemy.isDead() || !enemy.active) {
        excl.destroy();
        this.burrowerExclamations.delete(enemy);
      }
    });

    // Update bomb zones
    this.updateBombZones();
  }

  private spawnBurrowEffect(x: number, y: number, radius: number): void {
    // Dirt burst particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dirt = this.add.circle(x, y, 5, 0x8b6914);

      this.tweens.add({
        targets: dirt,
        x: x + Math.cos(angle) * radius * 0.8,
        y: y + Math.sin(angle) * radius * 0.6 - 20,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => dirt.destroy(),
      });
    }

    // Ground ring
    const ring = this.add.circle(x, y, 10, 0x8b6914, 0);
    ring.setStrokeStyle(3, 0x654321);
    this.tweens.add({
      targets: ring,
      scale: radius / 10,
      alpha: 0,
      duration: 350,
      ease: 'Power1',
      onComplete: () => ring.destroy(),
    });
  }

  private spawnDirtWarning(x: number, y: number): void {
    // Small dirt particles bubbling up to warn player
    for (let i = 0; i < 4; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      const dirt = this.add.circle(x + offsetX, y, 4, 0x8b6914);

      this.tweens.add({
        targets: dirt,
        y: y - 15 - Math.random() * 10,
        alpha: 0,
        scale: 0.5,
        duration: 300 + Math.random() * 200,
        ease: 'Power1',
        onComplete: () => dirt.destroy(),
      });
    }

    // Rumble indicator on ground
    const rumble = this.add.ellipse(x, y, 40, 10, 0x654321, 0.4);
    this.tweens.add({
      targets: rumble,
      scaleX: 1.2,
      scaleY: 0.8,
      yoyo: true,
      repeat: 2,
      duration: 150,
      onComplete: () => rumble.destroy(),
    });
  }

  private createExclamationMark(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const gfx = this.add.graphics();

    // Red exclamation mark: vertical bar + dot
    gfx.fillStyle(0xff2222);
    gfx.fillRect(-3, -18, 6, 14);
    gfx.fillCircle(0, 2, 4);

    // White outline for visibility
    gfx.lineStyle(1.5, 0xffffff, 0.7);
    gfx.strokeRect(-3, -18, 6, 14);
    gfx.strokeCircle(0, 2, 4);

    container.add(gfx);

    // Pulse animation
    this.tweens.add({
      targets: container,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      repeat: -1,
      duration: 250,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  private createBombZone(x: number, y: number): void {
    const gfx = this.add.graphics();

    this.bombZones.push({
      x,
      y,
      timer: 0,
      phase: 'warning',
      warningVisual: gfx,
      damageDealt: false,
    });
  }

  private updateBombZones(): void {
    const config = ENEMY_CONFIG.bomber;
    const delta = this.game.loop.delta;

    for (let i = this.bombZones.length - 1; i >= 0; i--) {
      const zone = this.bombZones[i];
      zone.timer += delta;

      if (zone.phase === 'warning') {
        // Warning phase: pulsing red circle outline
        zone.warningVisual.clear();
        const pulse = 0.3 + 0.3 * Math.sin(zone.timer * 0.015);
        zone.warningVisual.lineStyle(2, 0xff4400, pulse);
        zone.warningVisual.strokeCircle(zone.x, zone.y, config.bombRadius);
        // Inner dashed effect
        const innerPulse = 0.15 + 0.15 * Math.sin(zone.timer * 0.02);
        zone.warningVisual.fillStyle(0xff4400, innerPulse);
        zone.warningVisual.fillCircle(zone.x, zone.y, config.bombRadius * 0.3);

        if (zone.timer >= config.bombWarningDuration) {
          zone.phase = 'active';
          zone.timer = 0;
        }
      } else if (zone.phase === 'active') {
        // Active phase: filled danger zone
        zone.warningVisual.clear();
        const fade = 1 - (zone.timer / config.bombActiveDuration);
        zone.warningVisual.fillStyle(0xff4400, 0.35 * fade);
        zone.warningVisual.fillCircle(zone.x, zone.y, config.bombRadius);
        zone.warningVisual.lineStyle(2, 0xff6600, 0.6 * fade);
        zone.warningVisual.strokeCircle(zone.x, zone.y, config.bombRadius);

        // Deal damage once on activation
        if (!zone.damageDealt) {
          zone.damageDealt = true;
          const dist = Phaser.Math.Distance.Between(zone.x, zone.y, this.player.x, this.player.y);
          if (dist <= config.bombRadius) {
            if (this.player._uf(config.bombDamage)) {
              AudioManager.playPlayerDamage();
            }
          }
          // Burst ring effect
          const ring = this.add.circle(zone.x, zone.y, 10, 0xff4400, 0);
          ring.setStrokeStyle(3, 0xff6600);
          this.tweens.add({
            targets: ring,
            scale: config.bombRadius / 10,
            alpha: 0,
            duration: 300,
            ease: 'Power1',
            onComplete: () => ring.destroy(),
          });
        }

        if (zone.timer >= config.bombActiveDuration) {
          zone.warningVisual.destroy();
          this.bombZones.splice(i, 1);
        }
      }
    }
  }

  private cleanupBomberAndBurrowerEffects(): void {
    // Clean up burrower exclamation marks
    this.burrowerExclamations.forEach((excl) => excl.destroy());
    this.burrowerExclamations.clear();

    // Clean up bomb zones
    for (const zone of this.bombZones) {
      zone.warningVisual.destroy();
    }
    this.bombZones = [];
  }

  private onQuillHitEnemy(quillObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const quill = quillObj as Quill;
    const enemy = enemyObj as Enemy;

    if (quill.isDead() || enemy.isDead()) return;

    // Calculate hit angle for shellback blocking
    const hitAngle = Math.atan2(enemy.y - quill.y, enemy.x - quill.x);

    // Deal damage (apply elite damage bonus if target is elite)
    let damage = quill.getDamage();
    if (enemy.isElite) {
      const eliteDmgBonus = this.upgradeManager.getModifier('eliteDamageBonus');
      if (eliteDmgBonus > 0) {
        damage = Math.floor(damage * (1 + eliteDmgBonus));
      }
    }
    const killed = enemy._uf(damage, hitAngle);

    // Vampirism - stack-based proc chance and flat healing (uses rollProc for Fate's Favor)
    const vampStacks = this.upgradeManager.getModifier('vampirismStrength');
    if (vampStacks > 0) {
      const procChance = vampStacks / (vampStacks + VAMPIRISM_CONFIG.procDivisor);
      if (this.rollProc(procChance)) {
        const healAmount = VAMPIRISM_CONFIG.healBase + (vampStacks * VAMPIRISM_CONFIG.healPerStack);
        this.player.heal(healAmount);
      }
    }

    // Knockback from quill hit
    const knockbackMod = this.upgradeManager.getModifier('knockback');
    if (knockbackMod > 0 && !killed) {
      const kbForce = knockbackMod * KNOCKBACK_CONFIG.baseForceMult;
      enemy.applyKnockback(
        Math.cos(hitAngle) * kbForce,
        Math.sin(hitAngle) * kbForce,
        KNOCKBACK_CONFIG.duration
      );
    }

    // Explosion AOE - damage nearby enemies (capped at maxExplosionRadius)
    const rawExplosionRadius = this.upgradeManager.getModifier('explosionRadius');
    const explosionRadius = Math.min(rawExplosionRadius, QUILL_CONFIG.maxExplosionRadius);
    if (explosionRadius > 0) {
      this.spawnExplosionEffect(enemy.x, enemy.y, explosionRadius);
      // Damage all enemies within radius (except the one we just hit)
      this.waveManager.enemies.getChildren().forEach((otherEnemyObj) => {
        const otherEnemy = otherEnemyObj as Enemy;
        if (otherEnemy === enemy || otherEnemy.isDead()) return;
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, otherEnemy.x, otherEnemy.y);
        if (dist <= explosionRadius) {
          otherEnemy._uf(damage * 0.5); // AOE does 50% damage
          // Push enemies away from explosion center
          if (knockbackMod > 0) {
            const pushAngle = Math.atan2(otherEnemy.y - enemy.y, otherEnemy.x - enemy.x);
            const kbForce = knockbackMod * KNOCKBACK_CONFIG.baseForceMult;
            otherEnemy.applyKnockback(
              Math.cos(pushAngle) * kbForce,
              Math.sin(pushAngle) * kbForce,
              KNOCKBACK_CONFIG.duration
            );
          }
        }
      });
    }

    // Elemental procs (only on surviving enemies)
    if (!killed) {
      this.applyElementalProcs(enemy, quill.isEmpowered);
    }

    if (killed) {
      this.handleEnemyKill(enemy);
    } else {
      AudioManager.playHit();
    }

    // Handle quill (may pierce or die)
    quill.onHitEnemy();
  }

  private handleEnemyKill(enemy: Enemy): void {
    if (enemy.isElite) {
      AudioManager.playEliteKill();
    } else {
      AudioManager.playEnemyDeath();
    }

    // Apply danger score multiplier to points
    const dangerLevel = this.upgradeManager.getModifier('dangerLevel');
    const dangerScoreMult = 1 + dangerLevel * DANGER_CONFIG.scoreMultiplierPerStack;
    const points = Math.floor(enemy.points * dangerScoreMult);
    this.hud.addScore(points);

    this.spawnDeathParticles(enemy.x, enemy.y);
    SessionManager._rk(enemy.enemyType, enemy.isElite);
    this.recordSessionKill(enemy.enemyType, enemy.isElite);

    // Splitter splits into 2 splitlings on death
    if (enemy.isSplitter()) {
      AudioManager.playSplit();
      this.waveManager.spawnSplitlings(enemy.x, enemy.y);
    }

    // On-death elemental effects
    this.handleElementalOnDeath(enemy);

    // Chance to drop quill pickup
    if (Math.random() < 0.3) {
      this.spawnQuillPickup(enemy.x, enemy.y);
    }

    // Spawn XP orb (elites give bonus XP)
    this.spawnXPOrb(enemy.x, enemy.y, enemy.isBoss(), enemy.isElite);

    // Chance to drop treasure chest (affected by prosperity)
    const chestDropChance = this.progressionManager.getEffectiveChestDropChance();
    if (Math.random() < chestDropChance) {
      this.spawnTreasureChest(enemy.x, enemy.y);
    }

    // Pinecone drops - guaranteed from bosses, chance from regular enemies
    if (enemy.isBoss()) {
      const pineconeCount = Phaser.Math.Between(PINECONE_CONFIG.bossDropMin, PINECONE_CONFIG.bossDropMax);
      for (let i = 0; i < pineconeCount; i++) {
        this.spawnPinecone(enemy.x + (i - 1) * 20, enemy.y);
      }
    } else {
      const pineconeDropChance = this.progressionManager.getEffectivePineconeDropChance();
      if (Math.random() < pineconeDropChance) {
        this.spawnPinecone(enemy.x, enemy.y);
      }
    }
  }

  private onEnemyHitPlayer(_playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObj as Enemy;

    if (enemy.isDead()) return;

    // Burrowed enemies don't deal contact damage
    if (enemy.isBurrowed) return;

    // Rolling shellback deals roll damage and knockback
    if (enemy.isRolling) {
      const damage = enemy.getRollDamage();
      if (this.player._uf(damage)) {
        AudioManager.playPlayerDamage();
        // Strong knockback from roll attack
        const knockbackDir = this.player.x > enemy.x ? 1 : -1;
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setVelocity(knockbackDir * 400, -200);
        // Screen shake for impact
        this.cameras.main.shake(100, 0.01);
        // Thorns damage reflection
        this.applyThorns(enemy);
      } else if (this.player._lastDodged) {
        this.player._lastDodged = false;
        this.handleDodgeCounter(enemy);
      }
      return;
    }

    if (this.player._uf(enemy.damage)) {
      AudioManager.playPlayerDamage();
      // Thorns damage reflection
      this.applyThorns(enemy);
    } else if (this.player._lastDodged) {
      this.player._lastDodged = false;
      this.handleDodgeCounter(enemy);
    }
  }

  private handleDodgeCounter(enemy: Enemy): void {
    const tier = this.upgradeManager.getHighestEvasionTier();
    if (!tier) return;

    const executeChance = DODGE_COUNTER_CONFIG.executeChances[tier] ?? 0;
    if (executeChance <= 0 || Math.random() >= executeChance) return;

    const isEliteOrBoss = enemy.isElite || enemy.isBoss();

    if (isEliteOrBoss) {
      // Chunk elites/bosses for 25% max HP (scales with damage modifier)
      const damageMod = this.upgradeManager.getModifier('damage');
      const chunkDamage = Math.floor(enemy.maxHealth * DODGE_COUNTER_CONFIG.eliteDamagePercent * (1 + damageMod));
      const killed = enemy._uf(chunkDamage);
      this.spawnCounterText(enemy.x, enemy.y, `COUNTER! ${chunkDamage}`);
      if (killed) {
        this.handleEnemyKill(enemy);
      }
    } else {
      // Instant kill normal enemies
      const killed = enemy._uf(enemy.health + 1);
      this.spawnCounterText(enemy.x, enemy.y, 'EXECUTE!');
      if (killed) {
        this.handleEnemyKill(enemy);
      }
    }
  }

  private spawnCounterText(x: number, y: number, msg: string): void {
    const opacity = this.effectsOpacity;
    if (opacity <= 0) return;

    const text = this.add.text(x, y - 30, msg, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(opacity);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  private onProjectileHitPlayer(_playerObj: Phaser.GameObjects.GameObject, projectileObj: Phaser.GameObjects.GameObject): void {
    const projectile = projectileObj as Phaser.GameObjects.Arc;

    if (this.player._uf(15)) {
      AudioManager.playPlayerDamage();
    }
    projectile.destroy();
  }

  private spawnDeathParticles(x: number, y: number): void {
    if (this.effectsOpacity <= 0) return;

    // Simple particle effect
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 4, 0xff4444);
      particle.setAlpha(this.effectsOpacity);
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

  private spawnExplosionEffect(x: number, y: number, radius: number): void {
    if (this.effectsOpacity <= 0) return;

    // Expanding ring
    const ring = this.add.circle(x, y, 10, 0xff8800, 0);
    ring.setStrokeStyle(4, 0xff4400, this.effectsOpacity);

    this.tweens.add({
      targets: ring,
      scale: radius / 10,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });

    // Inner flash
    const flash = this.add.circle(x, y, radius * 0.3, 0xffff00, 0.6 * this.effectsOpacity);
    this.tweens.add({
      targets: flash,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Spark particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spark = this.add.circle(x, y, 3, 0xff6600);
      spark.setAlpha(this.effectsOpacity);

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * radius * 0.8,
        y: y + Math.sin(angle) * radius * 0.8,
        alpha: 0,
        duration: 250,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
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

  private spawnXPOrb(x: number, y: number, isBoss: boolean, isElite: boolean = false): void {
    let xpValue = this.progressionManager.getEnemyXPValue(isBoss, this.waveManager.currentWave);
    // Elites give bonus XP, danger level also boosts XP
    if (isElite) {
      xpValue = Math.floor(xpValue * ELITE_CONFIG.xpMultiplier);
    }
    const dangerLevel = this.upgradeManager.getModifier('dangerLevel');
    if (dangerLevel > 0) {
      xpValue = Math.floor(xpValue * (1 + dangerLevel * DANGER_CONFIG.xpMultiplierPerStack));
    }
    const orb = new XPOrb(this, x, y, xpValue);
    orb.setMagnetTarget(this.player);
    this.xpOrbs.add(orb);

    // Platform collision
    this.physics.add.collider(orb, this.platforms);

    // Player collection
    this.physics.add.overlap(this.player, orb, () => {
      if (!orb.active) return;
      AudioManager.playXPCollect();

      const levelUp = this.progressionManager.addXP(orb.getXPValue());
      orb.destroy();

      // Check for level up
      if (levelUp) {
        this.handleLevelUp(levelUp.newLevel);
      }
    });
  }

  private spawnTreasureChest(x: number, y: number): void {
    const chest = new TreasureChest(this, x, y);
    this.treasureChests.add(chest);

    // Platform collision
    this.physics.add.collider(chest, this.platforms);

    // Player collection
    this.physics.add.overlap(this.player, chest, () => {
      if (chest.isCollected()) return;
      AudioManager.playChestOpen();

      chest.collect();

      // Trigger chest upgrade selection
      this.showChestUpgradeSelection();

      // Bonus pinecone from chests
      if (PINECONE_CONFIG.chestBonus > 0) {
        this.spawnPinecone(chest.x, chest.y);
      }
    });
  }

  private spawnPinecone(x: number, y: number, value: number = 1): void {
    const pinecone = new Pinecone(this, x, y, value);
    pinecone.setMagnetTarget(this.player);
    this.pinecones.add(pinecone);

    // Platform collision
    this.physics.add.collider(pinecone, this.platforms);

    // Player collection
    this.physics.add.overlap(this.player, pinecone, () => {
      if (!pinecone.active) return;
      AudioManager.playPineconeCollect();

      this.progressionManager.addPinecones(pinecone.getValue());
      this.spawnPineconeCollectParticles(pinecone.x, pinecone.y);
      pinecone.destroy();
    });
  }

  private spawnPineconeCollectParticles(x: number, y: number): void {
    // Burst of golden particles on pinecone collection
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.add.circle(x, y, 3, 0xdaa520);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0,
        duration: 250,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private handleLevelUp(newLevel: number): void {
    this.upgradeManager.setPlayerLevel(newLevel);
    this.hud.showLevelUp(newLevel);
    AudioManager.playLevelUp();

    // Queue up level up upgrade selection
    // Will be processed after current upgrade flow completes
    if (!this.isChoosingUpgrade) {
      this.showLevelUpUpgradeSelection();
    }
    // If already choosing, the pending level ups will be consumed later
  }

  private activateInfiniteSwarm(): void {
    // Show infinite swarm start notification
    this.hud.showInfiniteSwarmStart();
    AudioManager.playInfiniteSwarmStart();

    // Activate infinite swarm in wave manager
    this.waveManager.activateInfiniteSwarm(this.time.now);

    // Reset shields and enable time-based regen for infinite swarm
    this.player.resetShieldsForWave();
    this.player.enableInfiniteSwarmShieldRegen();

    // Initialize stage tracking
    this.lastSwarmStage = 0;
  }

  private onSwarmStageChange(newStage: number): void {
    const stage = INFINITE_SWARM_CONFIG.stages[newStage];
    if (!stage) return;

    // Brief screen flash in stage color (subtle - 200ms)
    if (stage.tint !== null) {
      this.cameras.main.flash(
        200,
        (stage.tint >> 16) & 0xff,
        (stage.tint >> 8) & 0xff,
        stage.tint & 0xff,
        true
      );
    }

    // Play stage change sound
    AudioManager.playStageChange();

    // Show stage name briefly
    this.hud.showStageTransition(stage.name, stage.tint);
  }

  private showChestUpgradeSelection(): void {
    this.isChoosingUpgrade = true;
    this.pendingUpgradeSource = 'chest';
    this.previousMaxShields = this.upgradeManager.getModifier('shieldCharges');

    // Pause game and show upgrade scene with chest settings
    this.scene.pause();
    this.scene.launch('UpgradeScene', {
      upgradeManager: this.upgradeManager,
      progressionManager: this.progressionManager,
      playerStats: {
        health: this.player.health,
        maxHealth: this.player.maxHealth,
      },
      wave: this.waveManager.currentWave,
      source: 'chest',
      customWeights: CHEST_CONFIG.rarityWeights,
      guaranteeRareOrBetter: this.progressionManager.isRiggedChest(),
    });
  }

  private showLevelUpUpgradeSelection(): void {
    if (!this.progressionManager.consumeLevelUp()) return;

    this.isChoosingUpgrade = true;
    this.pendingUpgradeSource = 'levelup';
    this.previousMaxShields = this.upgradeManager.getModifier('shieldCharges');

    // Pause game and show upgrade scene
    this.scene.pause();
    this.scene.launch('UpgradeScene', {
      upgradeManager: this.upgradeManager,
      progressionManager: this.progressionManager,
      playerStats: {
        health: this.player.health,
        maxHealth: this.player.maxHealth,
      },
      wave: this.waveManager.currentWave,
      source: 'levelup',
    });
  }

  private showUpgradeSelection(): void {
    this.isChoosingUpgrade = true;
    this.previousMaxShields = this.upgradeManager.getModifier('shieldCharges');
    this.hud.showWaveComplete();

    const wavePerf = this.player.getPerf();
    SessionManager._sp(wavePerf);
    SessionManager._dl(this.upgradeManager.getModifier('dangerLevel'));
    SessionManager._ss(
      this.player.maxHealth,
      this.quillManager.maxQuills,
      this.upgradeManager.getModifier('prosperity')
    );
    SessionManager._dd(
      this.upgradeManager.getModifier('armor'),
      this.upgradeManager.getModifier('evasion')
    );
    SessionManager._ms(this.upgradeManager);
    SessionManager._rw(this.waveManager.currentWave, this.hud.score);

    // Accumulate session damage stats
    this.totalDamageTaken += wavePerf.d;
    this.totalShieldsUsed += wavePerf.b;

    // Clear any remaining enemy projectiles (they shouldn't persist between waves)
    this.enemyProjectiles.clear(true, true);

    const currentWave = this.waveManager.currentWave;
    const isBossWave = currentWave % WAVE_CONFIG.bossWaveInterval === 0;

    if (isBossWave) {
      // Boss wave: show two-phase boss reward choice first
      this.pendingUpgradeSource = 'bossReward';
      this.scene.pause();
      this.scene.launch('BossRewardScene', {
        wave: currentWave,
        playerHealth: this.player.health,
        playerMaxHealth: this.player.maxHealth,
        currentQuills: this.quillManager.currentQuills,
        maxQuills: this.quillManager.maxQuills,
      });
    } else {
      // Normal wave: grant quill bonus, then show upgrade selection
      this.quillManager.addQuills(BOSS_REWARD_CONFIG.waveQuillBonus);
      this.pendingUpgradeSource = 'wave';
      this.scene.pause();
      this.scene.launch('UpgradeScene', {
        upgradeManager: this.upgradeManager,
        progressionManager: this.progressionManager,
        playerStats: {
          health: this.player.health,
          maxHealth: this.player.maxHealth,
        },
        wave: currentWave,
        source: 'wave',
      });
    }
  }

  private onResumeFromUpgrade(): void {
    // Re-read effects opacity in case it was changed in pause menu
    this.effectsOpacity = SaveManager.getEffectsOpacity();

    // Only proceed if we were actually choosing an upgrade (not resuming from pause)
    if (!this.isChoosingUpgrade) return;

    // Block shooting briefly to prevent the upgrade-select click from firing a shot
    this.shootingBlocked = true;
    this.time.delayedCall(50, () => {
      this.shootingBlocked = false;
    });

    const source = this.pendingUpgradeSource;
    this.isChoosingUpgrade = false;
    this.pendingUpgradeSource = null;

    // Apply any health upgrades
    const healthBonus = this.upgradeManager.getModifier('maxHealth');
    this.player.maxHealth = PLAYER_CONFIG.maxHealth + healthBonus;

    // Grant any new shield charges immediately (so mid-wave shield pickups work)
    this.player.syncNewShieldCharges(this.previousMaxShields);

    // Update companions immediately if a companion upgrade was selected
    this.updateCompanions();

    // Handle different upgrade sources
    if (source === 'bossReward') {
      // Boss reward: read the player's choice from registry
      const choice = this.registry.get('bossRewardChoice') as
        | { type: 'restoration'; option: 'health' | 'quills' | 'balance'; balancePercent?: number }
        | { type: 'power' }
        | undefined;
      this.registry.remove('bossRewardChoice');

      if (choice?.type === 'power') {
        // Player chose Power: show normal upgrade selection
        this.isChoosingUpgrade = true;
        this.pendingUpgradeSource = 'wave';
        this.scene.pause();
        this.scene.launch('UpgradeScene', {
          upgradeManager: this.upgradeManager,
          progressionManager: this.progressionManager,
          playerStats: {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
          },
          wave: this.waveManager.currentWave,
          source: 'wave',
        });
        return;
      }

      if (choice?.type === 'restoration') {
        // Apply the chosen restoration
        if (choice.option === 'health') {
          this.player.heal(this.player.maxHealth); // Full heal
        } else if (choice.option === 'quills') {
          this.quillManager.addQuills(this.quillManager.maxQuills); // Full quills
        } else if (choice.option === 'balance') {
          const pct = choice.balancePercent ?? 0.45;
          this.player.heal(Math.round(this.player.maxHealth * pct));
          this.quillManager.addQuills(Math.round(this.quillManager.maxQuills * pct));
        }
        AudioManager.playPickup();
      }

      // Proceed to next wave (no upgrade selection)
      this.player.heal(20); // Standard between-wave heal still applies
      this.advanceToNextWave();
      return;
    }

    if (source === 'chest') {
      // Chest: mark as collected for rigged tracking, resume gameplay
      this.progressionManager.collectChest();
      this.player.heal(10); // Small heal from chest
      // Check for pending level ups
      if (this.progressionManager.hasPendingLevelUp()) {
        this.showLevelUpUpgradeSelection();
      }
      return;
    }

    if (source === 'levelup') {
      // Level up: check for more pending level ups
      if (this.progressionManager.hasPendingLevelUp()) {
        this.showLevelUpUpgradeSelection();
      }
      return;
    }

    // Wave complete: proceed to next wave or infinite swarm
    this.player.heal(20); // Heal between waves
    this.advanceToNextWave();
  }

  private advanceToNextWave(): void {
    const currentWave = this.waveManager.currentWave;

    // Check for infinite swarm activation after wave 20 (4th boss)
    if (this.progressionManager.canActivateInfiniteSwarm(currentWave)) {
      this.time.delayedCall(500, () => {
        this.activateInfiniteSwarm();
      });
      return; // Don't start another wave - infinite swarm takes over
    }

    // Check if layout should change (after boss waves: 5, 10, 15, etc.)
    if (LevelGenerator.shouldChangeLayout(currentWave)) {
      // Show layout change notification
      this.showLayoutChange(currentWave + 1);
      // Regenerate platforms for next wave
      this.regeneratePlatforms(currentWave + 1);
    }

    // Check if next wave is a boss wave
    const nextWave = currentWave + 1;
    const isBossWave = nextWave % WAVE_CONFIG.bossWaveInterval === 0;

    // Start next wave
    this.time.delayedCall(500, () => {
      this.player.resetShieldsForWave();
      this.player.resetPerf();
      this.updateCompanions();
      SessionManager._mw();
      SessionManager._sw(nextWave);
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

  private recordSessionKill(enemyType: string, isElite: boolean = false): void {
    this.sessionKills++;
    this.sessionKillsByType[enemyType] = (this.sessionKillsByType[enemyType] || 0) + 1;
    if (isElite) {
      this.sessionEliteKillsByType[enemyType] = (this.sessionEliteKillsByType[enemyType] || 0) + 1;
    }
  }

  private onPlayerDeath(): void {
    this.gameOver = true;
    AudioManager.playGameOver();
    this.cleanupBomberAndBurrowerEffects();

    // Snapshot score and wave at time of death so they don't change during the delay
    const finalScore = this.hud.score;
    const finalWave = this.waveManager.currentWave;

    const deathPerf = this.player.getPerf();
    SessionManager._sp(deathPerf);
    SessionManager._dl(this.upgradeManager.getModifier('dangerLevel'));
    SessionManager._ss(
      this.player.maxHealth,
      this.quillManager.maxQuills,
      this.upgradeManager.getModifier('prosperity')
    );
    SessionManager._dd(
      this.upgradeManager.getModifier('armor'),
      this.upgradeManager.getModifier('evasion')
    );
    SessionManager._ms(this.upgradeManager);
    SessionManager._rg(finalWave, finalScore);

    // Accumulate final wave's damage stats
    this.totalDamageTaken += deathPerf.d;
    this.totalShieldsUsed += deathPerf.b;

    // Submit score
    const isNewHighScore = SaveManager.submitRun(finalScore, finalWave);

    // Get session pinecones before transitioning
    const sessionPinecones = this.progressionManager.getSessionPinecones();

    // Show game over screen
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        score: finalScore,
        wave: finalWave,
        victory: false,
        isNewHighScore,
        highScore: SaveManager.getHighScore(),
        highestWave: SaveManager.getHighestWave(),
        sessionPinecones,
        upgradeManager: this.upgradeManager,
        sessionStats: {
          totalKills: this.sessionKills,
          killsByType: { ...this.sessionKillsByType },
          eliteKillsByType: { ...this.sessionEliteKillsByType },
          damageTaken: this.totalDamageTaken,
          shieldsUsed: this.totalShieldsUsed,
        },
      });
    });
  }

  private updateCompanions(): void {
    const desiredCount = Math.floor(this.upgradeManager.getModifier('companionCount'));

    // Remove excess companions
    while (this.companions.length > desiredCount) {
      const companion = this.companions.pop();
      companion?.destroy();
    }

    // Add new companions
    while (this.companions.length < desiredCount) {
      const index = this.companions.length;
      const companion = new Companion(
        this,
        this.player.x,
        this.player.y - 30,
        this.player,
        index
      );

      // Set up shooting callback
      companion.onShoot = (x, y, targetX, targetY) => {
        this.companionShoot(x, y, targetX, targetY);
      };

      this.companions.push(companion);
    }
  }

  private companionShoot(x: number, y: number, targetX: number, targetY: number): void {
    // Create a mini quill from companion position
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);

    // Create simple projectile (smaller, less damage than player)
    const quill = this.add.graphics();
    quill.fillStyle(0x00ffff);
    quill.fillTriangle(8, 0, -4, -3, -4, 3);

    const container = this.add.container(x, y, [quill]);
    container.rotation = angle;

    this.physics.add.existing(container);
    const body = container.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 8);
    body.setAllowGravity(false);

    const speed = 400;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    AudioManager.playShoot();

    // Add collision with enemies
    this.physics.add.overlap(container, this.waveManager.enemies, (_, enemyObj) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.isDead()) {
        // Companion quills do base damage (less than player upgraded quills)
        const damage = 10 * (1 + this.upgradeManager.getModifier('damage') * 0.5);
        const killed = enemy._uf(damage);

        // Elemental procs from companion quills
        if (!killed) {
          this.applyElementalProcs(enemy);
        }

        if (killed) {
          if (enemy.isElite) {
            AudioManager.playEliteKill();
          } else {
            AudioManager.playEnemyDeath();
          }
          const dangerLevel = this.upgradeManager.getModifier('dangerLevel');
          const dangerScoreMult = 1 + dangerLevel * DANGER_CONFIG.scoreMultiplierPerStack;
          this.hud.addScore(Math.floor(enemy.points * dangerScoreMult));
          this.spawnDeathParticles(enemy.x, enemy.y);
          SessionManager._rk(enemy.enemyType, enemy.isElite);
          this.recordSessionKill(enemy.enemyType, enemy.isElite);
          // Splitter splits on death from companion quills too
          if (enemy.isSplitter()) {
            AudioManager.playSplit();
            this.waveManager.spawnSplitlings(enemy.x, enemy.y);
          }
          // On-death elemental effects from companion kills too
          this.handleElementalOnDeath(enemy);
        } else {
          AudioManager.playHit();
        }
        container.destroy();
      }
    });

    // Destroy after timeout
    this.time.delayedCall(2000, () => {
      if (container.active) container.destroy();
    });
  }

  // --- Proc & Elemental Systems ---

  /** Roll a proc chance with Fate's Favor reroll support */
  private rollProc(chance: number): boolean {
    if (Math.random() < chance) return true;
    const rerollChance = this.upgradeManager.getModifier('rerollChance');
    return rerollChance > 0 && Math.random() < rerollChance && Math.random() < chance;
  }

  /** Calculate elemental proc chance from strength using diminishing returns formula */
  private getElementalChance(strength: number): number {
    if (strength <= 0) return 0;
    const x = strength * 0.1;
    return x / (1 + x);
  }

  /** Apply elemental status effects from quill hit. Empowered quills (Apotheosis) auto-proc all elements. */
  private applyElementalProcs(enemy: Enemy, empowered: boolean = false): void {
    // Lightning - shock (stun) — strength-based proc chance
    const shockStrength = this.upgradeManager.getModifier('shockStrength');
    const shockChance = this.getElementalChance(shockStrength);
    if (shockStrength > 0 && (empowered || this.rollProc(shockChance))) {
      enemy.applyShock(STATUS_EFFECT_CONFIG.shock.defaultDuration);

      // Chain lightning - arcs to nearby enemies on shock proc
      const chainCount = Math.floor(this.upgradeManager.getModifier('chainLightning'));
      if (chainCount > 0) {
        this.triggerChainLightning(enemy, chainCount, STATUS_EFFECT_CONFIG.shock.defaultDuration);
      }
    }

    // Ice - freeze (immobilize) — strength-based proc chance
    const freezeStrength = this.upgradeManager.getModifier('freezeStrength');
    const freezeChance = this.getElementalChance(freezeStrength);
    if (freezeStrength > 0 && (empowered || this.rollProc(freezeChance))) {
      enemy.applyFreeze(STATUS_EFFECT_CONFIG.freeze.defaultDuration);
    }

    // Fire - burn (stacking DoT) — DPS = strength * 8 * damageMult
    const burnStrength = this.upgradeManager.getModifier('burnStrength');
    const burnChance = this.getElementalChance(burnStrength);
    if (burnStrength > 0 && (empowered || this.rollProc(burnChance))) {
      const damageMult = 1 + this.upgradeManager.getModifier('damage');
      const scaledDPS = burnStrength * 8 * damageMult;
      enemy.applyBurn(scaledDPS, STATUS_EFFECT_CONFIG.burn.defaultDuration);
    }

    // Poison - venom (stacking damage amp) — amp = strength * 5%
    const poisonStrength = this.upgradeManager.getModifier('poisonStrength');
    const poisonChance = this.getElementalChance(poisonStrength);
    if (poisonStrength > 0 && (empowered || this.rollProc(poisonChance))) {
      const poisonAmp = poisonStrength * 0.05;
      enemy.applyPoison(poisonAmp, STATUS_EFFECT_CONFIG.poison.defaultDuration);
    }
  }

  /** Chain lightning arcs from source to nearby enemies */
  private triggerChainLightning(source: Enemy, chainCount: number, shockDuration: number): void {
    const range = STATUS_EFFECT_CONFIG.shock.chainRange;
    let currentSource = source;
    const hitEnemies = new Set<Enemy>([source]);

    for (let i = 0; i < chainCount; i++) {
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;

      this.waveManager.enemies.getChildren().forEach((obj) => {
        const e = obj as Enemy;
        if (e.isDead() || hitEnemies.has(e)) return;
        const dist = Phaser.Math.Distance.Between(currentSource.x, currentSource.y, e.x, e.y);
        if (dist < range && dist < nearestDist) {
          nearestDist = dist;
          nearest = e;
        }
      });

      if (!nearest) break;

      (nearest as Enemy).applyShock(shockDuration);
      this.spawnChainLightningEffect(currentSource.x, currentSource.y, (nearest as Enemy).x, (nearest as Enemy).y);
      hitEnemies.add(nearest as Enemy);
      currentSource = nearest as Enemy;
    }
  }

  /** Visual arc for chain lightning between two points */
  private spawnChainLightningEffect(x1: number, y1: number, x2: number, y2: number): void {
    if (this.effectsOpacity <= 0) return;

    const graphics = this.add.graphics();
    graphics.lineStyle(2, STATUS_EFFECT_CONFIG.shock.color, this.effectsOpacity);

    // Jagged lightning bolt (3-5 segments)
    const segments = 4;
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const midX = Phaser.Math.Linear(x1, x2, t) + (Math.random() - 0.5) * 20;
      const midY = Phaser.Math.Linear(y1, y2, t) + (Math.random() - 0.5) * 20;
      graphics.lineTo(midX, midY);
    }
    graphics.lineTo(x2, y2);
    graphics.strokePath();

    // Fade and destroy
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => graphics.destroy(),
    });
  }

  /** Handle on-death elemental effects for a killed enemy */
  private handleElementalOnDeath(enemy: Enemy): void {
    const ex = enemy.x;
    const ey = enemy.y;

    // Fire explosion - burning enemies explode on death
    const fireExplosionRadius = this.upgradeManager.getModifier('fireExplosion');
    if (fireExplosionRadius > 0 && enemy.isBurning()) {
      // Scale explosion with burn stack count
      const stacks = enemy.getBurnStackCount();
      const radius = fireExplosionRadius * (1 + stacks * 0.15);
      const burnStrength = this.upgradeManager.getModifier('burnStrength');
      const damageMult = 1 + this.upgradeManager.getModifier('damage');
      const scaledDPS = burnStrength * 8 * damageMult;
      const explosionDamage = scaledDPS * stacks * 2; // Burst damage based on active burn stacks

      this.waveManager.enemies.getChildren().forEach((obj) => {
        const e = obj as Enemy;
        if (e === enemy || e.isDead()) return;
        const dist = Phaser.Math.Distance.Between(ex, ey, e.x, e.y);
        if (dist <= radius) {
          e._uf(explosionDamage);
          // Spread a burn stack to nearby enemies
          e.applyBurn(scaledDPS, STATUS_EFFECT_CONFIG.burn.defaultDuration);
        }
      });

      this.spawnFireExplosionEffect(ex, ey, radius);
    }

    // Poison spread - poisoned enemies spread poison on death
    const hasPoisonSpread = this.upgradeManager.getModifier('poisonSpread') > 0;
    const poisonCloudRadius = this.upgradeManager.getModifier('poisonCloud');

    if (enemy.isPoisoned() && (hasPoisonSpread || poisonCloudRadius > 0)) {
      const spreadRange = hasPoisonSpread ? STATUS_EFFECT_CONFIG.poison.spreadRange : 0;
      const poisonStrength = this.upgradeManager.getModifier('poisonStrength');
      const poisonAmp = poisonStrength * 0.05;
      const poisonDur = STATUS_EFFECT_CONFIG.poison.defaultDuration;

      if (hasPoisonSpread) {
        // Spread poison to nearby enemies
        this.waveManager.enemies.getChildren().forEach((obj) => {
          const e = obj as Enemy;
          if (e === enemy || e.isDead()) return;
          const dist = Phaser.Math.Distance.Between(ex, ey, e.x, e.y);
          if (dist <= spreadRange) {
            e.applyPoison(poisonAmp, poisonDur);
          }
        });
        this.spawnPoisonSpreadEffect(ex, ey, spreadRange);
      }

      if (poisonCloudRadius > 0) {
        // Lingering poison cloud that ticks poison on nearby enemies
        this.spawnPoisonCloud(ex, ey, poisonCloudRadius, poisonAmp, poisonDur);
      }
    }

    // Ice shatter - frozen enemies deal AOE damage on death
    const shatterDamage = this.upgradeManager.getModifier('shatterDamage');
    if (shatterDamage > 0 && enemy.isFreezeActive()) {
      const shatterRadius = STATUS_EFFECT_CONFIG.freeze.shatterRange;
      const shatterDmg = enemy.maxHealth * shatterDamage; // % of max HP as AOE

      this.waveManager.enemies.getChildren().forEach((obj) => {
        const e = obj as Enemy;
        if (e === enemy || e.isDead()) return;
        const dist = Phaser.Math.Distance.Between(ex, ey, e.x, e.y);
        if (dist <= shatterRadius) {
          e._uf(shatterDmg);
        }
      });

      this.spawnShatterEffect(ex, ey, shatterRadius);
    }
  }

  /** Fire explosion visual */
  private spawnFireExplosionEffect(x: number, y: number, radius: number): void {
    if (this.effectsOpacity <= 0) return;

    // Orange expanding ring
    const ring = this.add.circle(x, y, 10, 0xff6600, 0);
    ring.setStrokeStyle(4, STATUS_EFFECT_CONFIG.burn.color, this.effectsOpacity);

    this.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });

    // Flame particles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const dist = radius * 0.6 * Math.random();
      const particle = this.add.circle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        3 + Math.random() * 3,
        Phaser.Math.Between(0, 1) ? 0xff6600 : 0xff4400
      );
      particle.setAlpha(this.effectsOpacity);

      this.tweens.add({
        targets: particle,
        y: particle.y - 20 - Math.random() * 20,
        alpha: 0,
        scale: 0,
        duration: 300 + Math.random() * 200,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Poison spread tendrils visual */
  private spawnPoisonSpreadEffect(x: number, y: number, range: number): void {
    if (this.effectsOpacity <= 0) return;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const particle = this.add.circle(x, y, 4, STATUS_EFFECT_CONFIG.poison.color);
      particle.setAlpha(this.effectsOpacity);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * range,
        y: y + Math.sin(angle) * range,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Lingering poison cloud that ticks poison on nearby enemies */
  private spawnPoisonCloud(x: number, y: number, radius: number, poisonAmp: number, poisonDuration: number): void {
    // Visual cloud
    const cloudGraphics = this.add.graphics();
    if (this.effectsOpacity > 0) {
      cloudGraphics.fillStyle(STATUS_EFFECT_CONFIG.poison.color, this.effectsOpacity * 0.3);
      cloudGraphics.fillCircle(x, y, radius);
    }

    // Tick timer - apply poison to enemies in range periodically
    const tickRate = STATUS_EFFECT_CONFIG.poison.cloudTickRate;
    const cloudLife = STATUS_EFFECT_CONFIG.poison.cloudDuration;
    let elapsed = 0;

    const tickEvent = this.time.addEvent({
      delay: tickRate,
      repeat: Math.floor(cloudLife / tickRate) - 1,
      callback: () => {
        elapsed += tickRate;
        this.waveManager.enemies.getChildren().forEach((obj) => {
          const e = obj as Enemy;
          if (e.isDead()) return;
          const dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
          if (dist <= radius) {
            e.applyPoison(poisonAmp, poisonDuration);
          }
        });
      },
    });

    // Fade out and destroy cloud
    this.tweens.add({
      targets: cloudGraphics,
      alpha: 0,
      duration: cloudLife,
      onComplete: () => {
        tickEvent.destroy();
        cloudGraphics.destroy();
      },
    });
  }

  /** Ice shatter visual */
  private spawnShatterEffect(x: number, y: number, radius: number): void {
    if (this.effectsOpacity <= 0) return;

    // Blue expanding ring
    const ring = this.add.circle(x, y, 10, 0x88ccff, 0);
    ring.setStrokeStyle(3, STATUS_EFFECT_CONFIG.freeze.color, this.effectsOpacity);

    this.tweens.add({
      targets: ring,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });

    // Ice shard particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      const shard = this.add.rectangle(x, y, 4, 8, STATUS_EFFECT_CONFIG.freeze.color);
      shard.setAlpha(this.effectsOpacity);
      shard.rotation = angle;

      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 400,
        onComplete: () => shard.destroy(),
      });
    }
  }

  /** Apply thorns damage reflection to an attacking enemy (scales with damage modifier) */
  private applyThorns(enemy: Enemy): void {
    const baseThorns = this.upgradeManager.getModifier('thorns');
    if (baseThorns > 0 && !enemy.isDead()) {
      const damageModifier = this.upgradeManager.getModifier('damage');
      const thornsDamage = baseThorns * (1 + damageModifier);
      enemy._uf(thornsDamage);
    }
  }

  shutdown(): void {
    this.events.off('resume', this.onResumeFromUpgrade, this);
    this.cleanupBomberAndBurrowerEffects();
  }
}
