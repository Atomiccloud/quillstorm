import Phaser from 'phaser';
import { GAME_CONFIG, COLORS } from '../config';
import { Player } from '../entities/Player';
import { QuillManager } from '../systems/QuillManager';
import { WaveManager } from '../systems/WaveManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SaveManager } from '../systems/SaveManager';

export class HUD {
  private scene: Phaser.Scene;
  private player: Player;
  private quillManager: QuillManager;
  private waveManager: WaveManager;

  private healthBar!: Phaser.GameObjects.Graphics;
  private quillBar!: Phaser.GameObjects.Graphics;
  private waveText!: Phaser.GameObjects.Text;
  private enemyText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private aimLine!: Phaser.GameObjects.Graphics;

  public score: number = 0;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    quillManager: QuillManager,
    waveManager: WaveManager,
    _upgradeManager: UpgradeManager
  ) {
    this.scene = scene;
    this.player = player;
    this.quillManager = quillManager;
    this.waveManager = waveManager;

    this.createUI();
  }

  private createUI(): void {
    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.healthBar.setScrollFactor(0);
    this.healthBar.setDepth(100);

    // Quill bar
    this.quillBar = this.scene.add.graphics();
    this.quillBar.setScrollFactor(0);
    this.quillBar.setDepth(100);

    // Wave text
    this.waveText = this.scene.add.text(GAME_CONFIG.width / 2, 20, 'Wave 1', {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Enemy count
    this.enemyText = this.scene.add.text(GAME_CONFIG.width / 2, 55, 'Enemies: 0', {
      fontSize: '18px',
      color: '#ff6666',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Score
    this.scoreText = this.scene.add.text(GAME_CONFIG.width - 20, 20, 'Score: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffff00',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // High score
    const highScore = SaveManager.getHighScore();
    this.highScoreText = this.scene.add.text(GAME_CONFIG.width - 20, 50, `Best: ${highScore}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Quill state text
    this.stateText = this.scene.add.text(20, 90, '', {
      fontSize: '16px',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(100);

    // Aim line
    this.aimLine = this.scene.add.graphics();
    this.aimLine.setDepth(50);
  }

  update(): void {
    this.drawHealthBar();
    this.drawQuillBar();
    this.updateTexts();
    this.drawAimLine();
  }

  private drawHealthBar(): void {
    this.healthBar.clear();

    const x = 20;
    const y = 20;
    const width = 200;
    const height = 20;

    // Background
    this.healthBar.fillStyle(0x333333);
    this.healthBar.fillRect(x, y, width, height);

    // Health
    const healthPercent = this.player.health / this.player.maxHealth;
    const healthColor = healthPercent > 0.5 ? 0x44ff44 : healthPercent > 0.25 ? 0xffff44 : 0xff4444;
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(x, y, width * healthPercent, height);

    // Border
    this.healthBar.lineStyle(2, 0xffffff);
    this.healthBar.strokeRect(x, y, width, height);

  }

  private drawQuillBar(): void {
    this.quillBar.clear();

    const x = 20;
    const y = 50;
    const width = 200;
    const height = 16;

    // Background
    this.quillBar.fillStyle(COLORS.ui.quillBarBg);
    this.quillBar.fillRect(x, y, width, height);

    // Quills
    const quillPercent = this.quillManager.getQuillPercent();
    const state = this.player.getQuillState();
    let quillColor = COLORS.ui.quillBar;

    if (state === 'naked') {
      quillColor = 0xff4444;
    } else if (state === 'sparse') {
      quillColor = 0xffaa44;
    }

    this.quillBar.fillStyle(quillColor);
    this.quillBar.fillRect(x, y, width * quillPercent, height);

    // Individual quill marks
    const maxQuills = this.quillManager.maxQuills;
    const quillWidth = width / maxQuills;
    this.quillBar.lineStyle(1, 0x555555);
    for (let i = 1; i < maxQuills; i++) {
      this.quillBar.beginPath();
      this.quillBar.moveTo(x + i * quillWidth, y);
      this.quillBar.lineTo(x + i * quillWidth, y + height);
      this.quillBar.strokePath();
    }

    // Border
    this.quillBar.lineStyle(2, 0xffffff);
    this.quillBar.strokeRect(x, y, width, height);

    // Draw quill icon
    this.quillBar.fillStyle(0xffffff);
    this.quillBar.fillTriangle(x - 15, y + height / 2, x - 5, y + 2, x - 5, y + height - 2);
  }

  private updateTexts(): void {
    // Show boss indicator for boss waves
    if (this.waveManager.isBossWave()) {
      this.waveText.setText(`BOSS - Wave ${this.waveManager.currentWave}`);
      this.waveText.setColor('#ff4444');
    } else {
      this.waveText.setText(`Wave ${this.waveManager.currentWave}`);
      this.waveText.setColor('#ffffff');
    }
    this.enemyText.setText(`Enemies: ${this.waveManager.getEnemyCount()}`);
    this.scoreText.setText(`Score: ${this.score}`);

    // State indicator
    const state = this.player.getQuillState();
    if (state === 'naked') {
      this.stateText.setText('NAKED! Cannot shoot!');
      this.stateText.setColor('#ff4444');
    } else if (state === 'sparse') {
      this.stateText.setText('Low on quills...');
      this.stateText.setColor('#ffaa44');
    } else {
      this.stateText.setText('');
    }

    // Show current quill count
    const currentQuills = Math.floor(this.quillManager.currentQuills);
    const maxQuills = this.quillManager.maxQuills;
    this.stateText.setText(this.stateText.text + `\nQuills: ${currentQuills}/${maxQuills}`);
  }

  private drawAimLine(): void {
    this.aimLine.clear();

    const state = this.player.getQuillState();
    if (state === 'naked') return;

    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Draw dotted line from player to cursor
    this.aimLine.lineStyle(2, 0xffffff, 0.3);

    const dx = worldPoint.x - this.player.x;
    const dy = worldPoint.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.min(20, Math.floor(dist / 15));

    for (let i = 0; i < steps; i++) {
      if (i % 2 === 0) {
        const startX = this.player.x + (dx / steps) * i;
        const startY = this.player.y + (dy / steps) * i;
        const endX = this.player.x + (dx / steps) * (i + 1);
        const endY = this.player.y + (dy / steps) * (i + 1);

        this.aimLine.beginPath();
        this.aimLine.moveTo(startX, startY);
        this.aimLine.lineTo(endX, endY);
        this.aimLine.strokePath();
      }
    }

    // Crosshair at cursor
    const size = 10;
    this.aimLine.lineStyle(2, 0xffffff, 0.5);
    this.aimLine.beginPath();
    this.aimLine.moveTo(worldPoint.x - size, worldPoint.y);
    this.aimLine.lineTo(worldPoint.x + size, worldPoint.y);
    this.aimLine.strokePath();
    this.aimLine.beginPath();
    this.aimLine.moveTo(worldPoint.x, worldPoint.y - size);
    this.aimLine.lineTo(worldPoint.x, worldPoint.y + size);
    this.aimLine.strokePath();
  }

  addScore(points: number): void {
    this.score += points;
  }

  showWaveComplete(): void {
    const text = this.scene.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 - 50,
      'WAVE COMPLETE!',
      {
        fontSize: '48px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#44ff44',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: GAME_CONFIG.height / 2 - 100,
      duration: 2000,
      onComplete: () => text.destroy(),
    });
  }

  showBossWarning(): void {
    const text = this.scene.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      'BOSS INCOMING!',
      {
        fontSize: '64px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 8,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.scene.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          duration: 500,
          onComplete: () => text.destroy(),
        });
      },
    });

    // Screen shake
    this.scene.cameras.main.shake(500, 0.01);
  }

  destroy(): void {
    this.healthBar.destroy();
    this.quillBar.destroy();
    this.waveText.destroy();
    this.enemyText.destroy();
    this.scoreText.destroy();
    this.highScoreText.destroy();
    this.stateText.destroy();
    this.aimLine.destroy();
  }
}
