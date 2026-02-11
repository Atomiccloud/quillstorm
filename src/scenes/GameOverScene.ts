import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { LeaderboardManager, SubmissionResult } from '../systems/LeaderboardManager';
import { SessionManager } from '../systems/SessionManager';
import { getCosmeticManager } from '../systems/CosmeticManager';
import { PlayerDataManager } from '../systems/PlayerDataManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { AchievementManager } from '../systems/AchievementManager';
import { Achievement } from '../data/achievements';
import { NameInputModal } from '../ui/NameInputModal';
import { StatsPanel } from '../ui/StatsPanel';

interface SessionStats {
  totalKills: number;
  killsByType: Record<string, number>;
  eliteKillsByType: Record<string, number>;
  damageTaken: number;
  shieldsUsed: number;
}

interface GameOverData {
  score: number;
  wave: number;
  victory: boolean;
  isNewHighScore?: boolean;
  highScore?: number;
  highestWave?: number;
  sessionPinecones?: number;
  newAchievements?: Achievement[];
  upgradeManager?: UpgradeManager;
  sessionStats?: SessionStats;
  isReturn?: boolean;
}

function formatEnemyName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export class GameOverScene extends Phaser.Scene {
  private gameData!: GameOverData;
  private nameModal!: NameInputModal;
  private statsPanel: StatsPanel | null = null;
  private killsPanel: Phaser.GameObjects.Container | null = null;
  private rankText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private buttonsContainer!: Phaser.GameObjects.Container;
  // statsHintText removed - using combined hint line instead
  private inputEnabled: boolean = false; // Prevent input until name submitted
  private rKeyHandler: ((event: KeyboardEvent) => void) | null = null;
  private tabKeyHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.gameData = data;
    this.inputEnabled = false; // Disable input until name is submitted
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Add session pinecones to player's total (only on first visit, not when returning from leaderboard)
    if (!data.isReturn && data.sessionPinecones && data.sessionPinecones > 0) {
      const cosmeticManager = getCosmeticManager();
      cosmeticManager.addPinecones(data.sessionPinecones);
      // Sync updated balance to server (fire-and-forget)
      PlayerDataManager.syncToServer();
    }

    const title = data.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.victory ? '#ffaa00' : '#ff4444';

    // Dark overlay background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    // Title with glow effect
    this.add.text(centerX + 3, centerY - 165 + 3, title, {
      fontSize: '64px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.5);

    this.add.text(centerX, centerY - 165, title, {
      fontSize: '64px',
      fontFamily: 'Arial Black, sans-serif',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // New high score banner
    if (data.isNewHighScore) {
      const banner = this.add.text(centerX, centerY - 95, 'NEW HIGH SCORE!', {
        fontSize: '28px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: banner,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // --- This Run Stats Panel ---
    const panelWidth = 280;
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - 60;
    const hasStats = !!data.sessionStats;
    const panelHeight = hasStats ? 145 : 100;

    // Panel background
    const statsPanelBg = this.add.graphics();
    statsPanelBg.fillStyle(0x1a1a2e, 0.9);
    statsPanelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    statsPanelBg.lineStyle(2, 0x4a6741, 0.8);
    statsPanelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);

    // Panel header
    this.add.text(centerX, panelY + 16, 'THIS RUN', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    // Wave and Score side by side
    this.add.text(centerX - 60, panelY + 45, 'WAVE', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    this.add.text(centerX - 60, panelY + 68, `${data.wave}`, {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX + 60, panelY + 45, 'SCORE', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    this.add.text(centerX + 60, panelY + 68, `${data.score.toLocaleString()}`, {
      fontSize: '28px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Session stats (kills, damage) — summary row in center panel
    if (data.sessionStats) {
      const stats = data.sessionStats;

      // Divider line
      const dividerG = this.add.graphics();
      dividerG.lineStyle(1, 0x444444, 0.4);
      dividerG.lineBetween(panelX + 20, panelY + 90, panelX + panelWidth - 20, panelY + 90);

      // Kills
      this.add.text(centerX - 60, panelY + 105, 'KILLS', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#888888',
      }).setOrigin(0.5);

      this.add.text(centerX - 60, panelY + 125, `${stats.totalKills}`, {
        fontSize: '24px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ff8844',
      }).setOrigin(0.5);

      // Damage taken
      const dmgLabel = stats.shieldsUsed > 0 ? 'DMG / SHIELDS' : 'DAMAGE';
      const dmgValue = stats.shieldsUsed > 0
        ? `${Math.round(stats.damageTaken)} / ${stats.shieldsUsed}`
        : `${Math.round(stats.damageTaken)}`;

      this.add.text(centerX + 60, panelY + 105, dmgLabel, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#888888',
      }).setOrigin(0.5);

      this.add.text(centerX + 60, panelY + 125, dmgValue, {
        fontSize: '24px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ff4444',
      }).setOrigin(0.5);

      // Kill breakdown — left side pane (mirrors StatsPanel on the right)
      this.createKillsPanel(data.sessionStats);
    }

    // Pinecones earned (golden accent)
    if (data.sessionPinecones && data.sessionPinecones > 0) {
      const pineY = panelY + panelHeight + 20;

      // Pinecone icon (simple triangle shape)
      const pineIcon = this.add.graphics();
      pineIcon.fillStyle(0xdaa520, 1);
      pineIcon.fillCircle(centerX - 35, pineY, 8);
      pineIcon.fillTriangle(
        centerX - 35, pineY - 12,
        centerX - 41, pineY + 4,
        centerX - 29, pineY + 4
      );

      this.add.text(centerX - 15, pineY, `+${data.sessionPinecones}`, {
        fontSize: '22px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#daa520',
      }).setOrigin(0, 0.5);
    }

    // Achievement unlocks
    let achievementOffset = 0;
    if (data.newAchievements && data.newAchievements.length > 0 && !data.isReturn) {
      const achBaseY = panelY + panelHeight + (data.sessionPinecones ? 55 : 25);
      achievementOffset = data.newAchievements.length * 28 + 10;

      for (let i = 0; i < data.newAchievements.length; i++) {
        const ach = data.newAchievements[i];
        const achY = achBaseY + i * 28;

        const achText = this.add.text(centerX, achY, `ACHIEVEMENT: ${ach.name}`, {
          fontSize: '15px',
          fontFamily: 'Arial Black, sans-serif',
          color: '#ffdd00',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5);

        // Pulse animation
        this.tweens.add({
          targets: achText,
          scale: 1.05,
          duration: 600,
          yoyo: true,
          repeat: 2,
          delay: i * 200,
        });
      }
    }

    // Rank display (hidden initially)
    const rankY = panelY + panelHeight + (data.sessionPinecones ? 50 : 20) + achievementOffset;
    this.rankText = this.add.text(centerX, rankY, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#88ff88',
    });
    this.rankText.setOrigin(0.5);

    // Status text for submission
    this.statusText = this.add.text(centerX, rankY + 25, '', {
      fontSize: '14px',
      color: '#666666',
    });
    this.statusText.setOrigin(0.5);

    // --- Personal Best Section ---
    if (data.highScore !== undefined) {
      const bestY = rankY + 55;

      // Subtle divider line
      const divider = this.add.graphics();
      divider.lineStyle(1, 0x444444, 0.5);
      divider.lineBetween(centerX - 100, bestY - 10, centerX + 100, bestY - 10);

      this.add.text(centerX, bestY, 'PERSONAL BEST', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#666666',
      }).setOrigin(0.5);

      this.add.text(centerX - 50, bestY + 22, `${data.highScore.toLocaleString()}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      this.add.text(centerX + 50, bestY + 22, `Wave ${data.highestWave}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Buttons container
    this.buttonsContainer = this.add.container(0, 0);
    this.createButtons();

    // Name input modal
    this.nameModal = new NameInputModal(
      this,
      (name) => this.onNameSubmitted(name),
      () => this.onNameSkipped()
    );
    this.add.existing(this.nameModal);

    // Achievement progress counter
    const achCount = AchievementManager.getEarnedCount();
    const achTotal = AchievementManager.getTotalCount();
    this.add.text(GAME_CONFIG.width - 16, 16, `Achievements: ${achCount}/${achTotal}`, {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(1, 0);

    // Hints at bottom (combined into one line)
    const hintsY = GAME_CONFIG.height - 40;
    const hints = data.upgradeManager
      ? 'R: Restart  |  TAB: Toggle Panels'
      : 'R: Restart';

    this.add.text(centerX, hintsY, hints, {
      fontSize: '15px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Stats panel (shown by default on game over, Tab to toggle)
    if (data.upgradeManager) {
      this.statsPanel = new StatsPanel(this, data.upgradeManager);
      this.statsPanel.show();

      // Tab key to toggle stats
      this.tabKeyHandler = () => {
        if (this.statsPanel) {
          this.statsPanel.toggle();
        }
        if (this.killsPanel) {
          this.killsPanel.setVisible(!this.killsPanel.visible);
        }
      };
      this.input.keyboard?.on('keydown-TAB', this.tabKeyHandler);
    }

    // R key to restart (only when input is enabled)
    this.rKeyHandler = () => {
      if (this.inputEnabled) {
        AudioManager.playButtonClick();
        this.cleanup();
        this.scene.start('GameScene');
      }
    };
    this.input.keyboard?.on('keydown-R', this.rKeyHandler);

    // Check if we need name input (skip on return from leaderboard)
    if (data.isReturn) {
      this.inputEnabled = true;
    } else {
      this.checkNameAndSubmit();
    }
  }

  private createButtons(): void {
    const centerX = GAME_CONFIG.width / 2;
    const buttonY = GAME_CONFIG.height - 100;

    // Retry button (green accent)
    const retryButton = this.add.rectangle(centerX - 120, buttonY, 100, 40, 0x4a6741)
      .setInteractive({ useHandCursor: true });
    retryButton.setStrokeStyle(2, 0x6a8761);
    this.add.text(centerX - 120, buttonY, 'RETRY', {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.buttonsContainer.add(retryButton);

    // Leaderboard button (blue accent)
    const leaderboardButton = this.add.rectangle(centerX, buttonY, 100, 40, 0x444477)
      .setInteractive({ useHandCursor: true });
    leaderboardButton.setStrokeStyle(2, 0x5555aa);
    this.add.text(centerX, buttonY, 'RANKS', {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.buttonsContainer.add(leaderboardButton);

    // Menu button (gray)
    const menuButton = this.add.rectangle(centerX + 120, buttonY, 100, 40, 0x555555)
      .setInteractive({ useHandCursor: true });
    menuButton.setStrokeStyle(2, 0x777777);
    this.add.text(centerX + 120, buttonY, 'MENU', {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.buttonsContainer.add(menuButton);

    // Button interactions (only work when input is enabled)
    retryButton.on('pointerover', () => retryButton.setFillStyle(0x5a7751));
    retryButton.on('pointerout', () => retryButton.setFillStyle(0x4a6741));
    retryButton.on('pointerdown', () => {
      if (!this.inputEnabled) return;
      AudioManager.playButtonClick();
      this.cleanup();
      this.scene.start('GameScene');
    });

    leaderboardButton.on('pointerover', () => leaderboardButton.setFillStyle(0x555588));
    leaderboardButton.on('pointerout', () => leaderboardButton.setFillStyle(0x444477));
    leaderboardButton.on('pointerdown', () => {
      if (!this.inputEnabled) return;
      AudioManager.playButtonClick();
      this.cleanup();
      this.scene.start('LeaderboardScene', {
        returnScene: 'GameOverScene',
        gameData: { ...this.gameData, isReturn: true },
      });
    });

    menuButton.on('pointerover', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x555555));
    menuButton.on('pointerdown', () => {
      if (!this.inputEnabled) return;
      AudioManager.playButtonClick();
      this.cleanup();
      this.scene.start('MenuScene');
    });
  }

  private async checkNameAndSubmit(): Promise<void> {
    // Must reach wave 5 to submit to leaderboard
    if (this.gameData.wave < 5) {
      SessionManager.clearSession();
      this.statusText.setText('Reach wave 5 to submit to the leaderboard');
      this.statusText.setColor('#888888');
      this.inputEnabled = true;
      return;
    }

    // Always show name input modal, pre-filled with saved name if available
    // This lets players change their name between runs
    const savedName = SaveManager.hasPlayerName() ? SaveManager.getPlayerName() : '';
    this.statusText.setText('');
    this.nameModal.show(savedName);
  }

  private async onNameSubmitted(name: string): Promise<void> {
    SaveManager.setPlayerName(name);
    await this.submitScore(name);

    // Enable buttons and R key after name is submitted
    this.inputEnabled = true;
  }

  private onNameSkipped(): void {
    // Clear session since we're not submitting
    SessionManager.clearSession();
    this.statusText.setText('Score not submitted');
    this.statusText.setColor('#888888');
    this.inputEnabled = true;
  }

  private async submitScore(playerName: string): Promise<void> {
    this.statusText.setText('Submitting score...');

    const result = await LeaderboardManager.submitScore(
      playerName,
      this.gameData.score,
      this.gameData.wave,
      SessionManager.getToken()
    );

    // Clear session after submission
    SessionManager.clearSession();

    this.displayResult(result);
  }

  private displayResult(result: SubmissionResult): void {
    if (result.success) {
      const ranks: string[] = [];

      if (result.globalRank && result.globalRank <= 100) {
        ranks.push(`Global: #${result.globalRank}`);
      }
      if (result.weeklyRank && result.weeklyRank <= 100) {
        ranks.push(`Weekly: #${result.weeklyRank}`);
      }

      if (ranks.length > 0) {
        this.rankText.setText(ranks.join('  |  '));
        this.statusText.setText('Score submitted!');

        // Highlight if top 10
        if ((result.globalRank && result.globalRank <= 10) ||
            (result.weeklyRank && result.weeklyRank <= 10)) {
          this.rankText.setColor('#ffff00');
          this.tweens.add({
            targets: this.rankText,
            scale: 1.1,
            duration: 300,
            yoyo: true,
            repeat: 2,
          });
        }
      } else {
        this.statusText.setText('Score submitted! Keep playing to reach the top 100.');
      }
    } else {
      this.statusText.setText(result.error || 'Offline - score saved locally');
      this.statusText.setColor('#ff8888');
    }

    // Clear status after delay
    this.time.delayedCall(5000, () => {
      this.statusText.setText('');
    });
  }

  private cleanup(): void {
    if (this.nameModal) {
      this.nameModal.destroy();
    }
    if (this.statsPanel) {
      this.statsPanel.destroy();
      this.statsPanel = null;
    }
    if (this.killsPanel) {
      this.killsPanel.destroy();
      this.killsPanel = null;
    }
    if (this.rKeyHandler) {
      this.input.keyboard?.off('keydown-R', this.rKeyHandler);
      this.rKeyHandler = null;
    }
    if (this.tabKeyHandler) {
      this.input.keyboard?.off('keydown-TAB', this.tabKeyHandler);
      this.tabKeyHandler = null;
    }
  }

  private createKillsPanel(stats: SessionStats): void {
    const PANEL_WIDTH = 200;
    const PANEL_PADDING = 16;
    const LINE_HEIGHT = 22;

    const killedTypes = Object.entries(stats.killsByType)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);

    if (killedTypes.length === 0) return;

    // Gather elite kills
    const eliteTypes = Object.entries(stats.eliteKillsByType || {})
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a);
    const totalEliteKills = eliteTypes.reduce((sum, [, c]) => sum + c, 0);

    // Calculate panel height: kills header + kill rows + optional elite section
    const headerHeight = 40;
    const killRows = killedTypes.length * LINE_HEIGHT;
    const eliteSection = totalEliteKills > 0 ? headerHeight + eliteTypes.length * LINE_HEIGHT : 0;
    const panelHeight = headerHeight + killRows + eliteSection + PANEL_PADDING;

    this.killsPanel = this.add.container(16, 80);
    this.killsPanel.setDepth(200);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(0, 0, PANEL_WIDTH, panelHeight, 8);
    bg.lineStyle(2, 0xcc8833, 0.8);
    bg.strokeRoundedRect(0, 0, PANEL_WIDTH, panelHeight, 8);
    this.killsPanel.add(bg);

    // Title
    const title = this.add.text(PANEL_PADDING, 12, 'KILLS', {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff8844',
    });
    this.killsPanel.add(title);

    // Total kills (right-aligned in header)
    const totalText = this.add.text(PANEL_WIDTH - PANEL_PADDING, 14, `${stats.totalKills}`, {
      fontSize: '14px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(1, 0);
    this.killsPanel.add(totalText);

    // Per-type breakdown (normal kills only — subtract elites)
    let y = headerHeight;
    for (const [type, count] of killedTypes) {
      const eliteCount = stats.eliteKillsByType?.[type] || 0;
      const normalCount = count - eliteCount;
      if (normalCount <= 0) continue;

      const nameText = this.add.text(PANEL_PADDING + 4, y, formatEnemyName(type), {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#aaaaaa',
      });
      this.killsPanel.add(nameText);

      const countText = this.add.text(PANEL_WIDTH - PANEL_PADDING, y, `${normalCount}`, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#ff8844',
      }).setOrigin(1, 0);
      this.killsPanel.add(countText);

      y += LINE_HEIGHT;
    }

    // Elite kills section
    if (totalEliteKills > 0) {
      y += 6;

      // Divider line
      bg.lineStyle(1, 0xcc8833, 0.4);
      bg.beginPath();
      bg.moveTo(PANEL_PADDING, y);
      bg.lineTo(PANEL_WIDTH - PANEL_PADDING, y);
      bg.strokePath();
      y += 8;

      // Elite header
      const eliteTitle = this.add.text(PANEL_PADDING, y, `ELITES \u2605`, {
        fontSize: '16px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffd700',
      });
      this.killsPanel.add(eliteTitle);

      const eliteTotalText = this.add.text(PANEL_WIDTH - PANEL_PADDING, y + 2, `${totalEliteKills}`, {
        fontSize: '14px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff',
      }).setOrigin(1, 0);
      this.killsPanel.add(eliteTotalText);

      y += 26;

      for (const [type, count] of eliteTypes) {
        const nameText = this.add.text(PANEL_PADDING + 4, y, formatEnemyName(type), {
          fontSize: '13px',
          fontFamily: 'Arial',
          color: '#aaaaaa',
        });
        this.killsPanel.add(nameText);

        const countText = this.add.text(PANEL_WIDTH - PANEL_PADDING, y, `${count}`, {
          fontSize: '13px',
          fontFamily: 'Arial',
          color: '#ffd700',
        }).setOrigin(1, 0);
        this.killsPanel.add(countText);

        y += LINE_HEIGHT;
      }
    }
  }

  shutdown(): void {
    this.cleanup();
  }
}
