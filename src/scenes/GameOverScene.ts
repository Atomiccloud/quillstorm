import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { LeaderboardManager, SubmissionResult } from '../systems/LeaderboardManager';
import { NameInputModal } from '../ui/NameInputModal';

interface GameOverData {
  score: number;
  wave: number;
  victory: boolean;
  isNewHighScore?: boolean;
  highScore?: number;
  highestWave?: number;
}

export class GameOverScene extends Phaser.Scene {
  private gameData!: GameOverData;
  private nameModal!: NameInputModal;
  private rankText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private buttonsContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.gameData = data;
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    const title = data.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = data.victory ? '#ffaa00' : '#ff4444';

    // Title
    this.add.text(centerX, centerY - 150, title, {
      fontSize: '64px',
      fontFamily: 'Arial Black, sans-serif',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // New high score banner
    if (data.isNewHighScore) {
      const banner = this.add.text(centerX, centerY - 80, 'NEW HIGH SCORE!', {
        fontSize: '32px',
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

    // Stats
    this.add.text(centerX, centerY - 20, `Wave Reached: ${data.wave}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 20, `Score: ${data.score.toLocaleString()}`, {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Rank display (hidden initially)
    this.rankText = this.add.text(centerX, centerY + 60, '', {
      fontSize: '20px',
      color: '#88ff88',
    });
    this.rankText.setOrigin(0.5);

    // Status text for submission
    this.statusText = this.add.text(centerX, centerY + 90, '', {
      fontSize: '16px',
      color: '#666666',
    });
    this.statusText.setOrigin(0.5);

    // High score display
    if (data.highScore !== undefined) {
      this.add.text(centerX, centerY + 120, `High Score: ${data.highScore.toLocaleString()}`, {
        fontSize: '18px',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      this.add.text(centerX, centerY + 145, `Best Wave: ${data.highestWave}`, {
        fontSize: '18px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    }

    // Buttons container
    this.buttonsContainer = this.add.container(0, 0);
    this.createButtons();

    // Name input modal
    this.nameModal = new NameInputModal(this, (name) => this.onNameSubmitted(name));
    this.add.existing(this.nameModal);

    // Quick restart hint
    this.add.text(centerX, centerY + 260, 'Press R to quick restart', {
      fontSize: '14px',
      color: '#555555',
    }).setOrigin(0.5);

    // R key to restart
    this.input.keyboard?.on('keydown-R', () => {
      AudioManager.playButtonClick();
      this.nameModal.destroy();
      this.scene.start('GameScene');
    });

    // Check if we need name input
    this.checkNameAndSubmit();
  }

  private createButtons(): void {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Retry button
    const retryButton = this.add.rectangle(centerX - 150, centerY + 200, 130, 45, 0x4a6741)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX - 150, centerY + 200, 'RETRY', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.buttonsContainer.add(retryButton);

    // Leaderboard button
    const leaderboardButton = this.add.rectangle(centerX, centerY + 200, 130, 45, 0x444477)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX, centerY + 200, 'RANKS', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.buttonsContainer.add(leaderboardButton);

    // Menu button
    const menuButton = this.add.rectangle(centerX + 150, centerY + 200, 130, 45, 0x555555)
      .setInteractive({ useHandCursor: true });
    this.add.text(centerX + 150, centerY + 200, 'MENU', {
      fontSize: '20px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.buttonsContainer.add(menuButton);

    // Button interactions
    retryButton.on('pointerover', () => retryButton.setFillStyle(0x5a7751));
    retryButton.on('pointerout', () => retryButton.setFillStyle(0x4a6741));
    retryButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.nameModal.destroy();
      this.scene.start('GameScene');
    });

    leaderboardButton.on('pointerover', () => leaderboardButton.setFillStyle(0x555588));
    leaderboardButton.on('pointerout', () => leaderboardButton.setFillStyle(0x444477));
    leaderboardButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.nameModal.destroy();
      this.scene.start('LeaderboardScene');
    });

    menuButton.on('pointerover', () => menuButton.setFillStyle(0x666666));
    menuButton.on('pointerout', () => menuButton.setFillStyle(0x555555));
    menuButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.nameModal.destroy();
      this.scene.start('MenuScene');
    });
  }

  private async checkNameAndSubmit(): Promise<void> {
    // Check if we have a saved name
    if (!SaveManager.hasPlayerName()) {
      // Show name input modal
      this.statusText.setText('Enter your name for the leaderboard');
      this.nameModal.show();
    } else {
      // Submit with existing name
      await this.submitScore(SaveManager.getPlayerName());
    }
  }

  private async onNameSubmitted(name: string): Promise<void> {
    SaveManager.setPlayerName(name);
    await this.submitScore(name);
  }

  private async submitScore(playerName: string): Promise<void> {
    this.statusText.setText('Submitting score...');

    const result = await LeaderboardManager.submitScore(
      playerName,
      this.gameData.score,
      this.gameData.wave
    );

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

  shutdown(): void {
    if (this.nameModal) {
      this.nameModal.destroy();
    }
  }
}
