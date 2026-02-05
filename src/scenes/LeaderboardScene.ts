import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { LeaderboardManager } from '../systems/LeaderboardManager';
import { LeaderboardPanel } from '../ui/LeaderboardPanel';
import { AudioManager } from '../systems/AudioManager';

type TabType = 'global' | 'weekly' | 'notable';

interface LeaderboardSceneData {
  returnScene?: string;
  gameData?: any;
}

export class LeaderboardScene extends Phaser.Scene {
  private panel!: LeaderboardPanel;
  private currentTab: TabType = 'global';
  private globalButton!: Phaser.GameObjects.Container;
  private weeklyButton!: Phaser.GameObjects.Container;
  private notableButton!: Phaser.GameObjects.Container;
  private resetTimerText!: Phaser.GameObjects.Text;
  private weeklyResetsIn = 0;
  private returnScene: string = 'MenuScene';
  private returnData: any = undefined;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(data?: LeaderboardSceneData): void {
    this.returnScene = data?.returnScene || 'MenuScene';
    this.returnData = data?.gameData;
    const centerX = GAME_CONFIG.width / 2;

    // Background
    this.add.rectangle(
      centerX,
      GAME_CONFIG.height / 2,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x1a1a2e
    );

    // Title
    this.add.text(centerX, 40, 'LEADERBOARD', {
      fontSize: '36px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Back button
    const backButton = this.add.rectangle(80, 40, 120, 40, 0x555555);
    backButton.setInteractive({ useHandCursor: true });
    this.add.text(80, 40, '< BACK', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0x666666));
    backButton.on('pointerout', () => backButton.setFillStyle(0x555555));
    backButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      if (this.returnScene === 'GameOverScene' && this.returnData) {
        this.scene.start('GameOverScene', this.returnData);
      } else {
        this.scene.start('MenuScene');
      }
    });

    // Tab buttons (3 tabs: global, weekly, notable)
    this.globalButton = this.createTabButton(centerX - 150, 100, 'GLOBAL', 'global');
    this.weeklyButton = this.createTabButton(centerX, 100, 'WEEKLY', 'weekly');
    this.notableButton = this.createTabButton(centerX + 150, 100, 'NOTABLE', 'notable');
    this.add.existing(this.globalButton);
    this.add.existing(this.weeklyButton);
    this.add.existing(this.notableButton);

    // Weekly reset timer
    this.resetTimerText = this.add.text(centerX, 135, '', {
      fontSize: '14px',
      color: '#666666',
    });
    this.resetTimerText.setOrigin(0.5);

    // Leaderboard panel
    const panelWidth = 500;
    const panelHeight = 380;
    this.panel = new LeaderboardPanel(
      this,
      centerX - panelWidth / 2,
      160,
      panelWidth,
      panelHeight
    );

    // No entries hint
    this.add.text(centerX, GAME_CONFIG.height - 50, 'Play to get on the leaderboard!', {
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);

    // Load initial data
    this.updateTabStyles();
    this.loadData();

    // Update timer every second
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateResetTimer(),
      loop: true,
    });
  }

  private createTabButton(x: number, y: number, label: string, tab: TabType): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 140, 36, 0x333333);
    bg.setInteractive({ useHandCursor: true });
    container.add(bg);

    const text = this.add.text(0, 0, label, {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    container.add(text);

    bg.on('pointerdown', () => {
      if (this.currentTab !== tab) {
        AudioManager.playButtonClick();
        this.currentTab = tab;
        this.updateTabStyles();
        this.loadData();
      }
    });

    // Store references for styling
    container.setData('bg', bg);
    container.setData('text', text);

    return container;
  }

  private updateTabStyles(): void {
    const activeColor = 0x4a6741;
    const inactiveColor = 0x333333;

    const globalBg = this.globalButton.getData('bg') as Phaser.GameObjects.Rectangle;
    const weeklyBg = this.weeklyButton.getData('bg') as Phaser.GameObjects.Rectangle;
    const notableBg = this.notableButton.getData('bg') as Phaser.GameObjects.Rectangle;

    globalBg.setFillStyle(this.currentTab === 'global' ? activeColor : inactiveColor);
    weeklyBg.setFillStyle(this.currentTab === 'weekly' ? activeColor : inactiveColor);
    notableBg.setFillStyle(this.currentTab === 'notable' ? activeColor : inactiveColor);

    // Show/hide reset timer
    this.resetTimerText.setVisible(this.currentTab === 'weekly');
  }

  // Hardcoded notable entries (cheaters/exploiters hall of shame)
  private static readonly NOTABLE_ENTRIES = [
    { rank: 1, playerName: 'Adamz (Unbalanced Patch)', score: 14377267, wave: 20, timestamp: 0 },
    { rank: 2, playerName: 'JONISNTGAMING (QoL Hax)', score: 976519, wave: 20, timestamp: 0 },
    { rank: 3, playerName: 'PROGOONER (Bug Abuse)', score: 1230622, wave: 20, timestamp: 0 },
    { rank: 4, playerName: 'Zezimareal (HP and Quill Hax)', score: 100698, wave: 20, timestamp: 0 },
    { rank: 5, playerName: 'Josh (Honeypotted)', score: 69420, wave: 20, timestamp: 0 },
  ];

  private async loadData(): Promise<void> {
    this.panel.showLoading();

    if (this.currentTab === 'global') {
      const data = await LeaderboardManager.getGlobalLeaderboard();
      if (this.currentTab === 'global') { // Still on this tab
        this.panel.setEntries(data.entries);
      }
    } else if (this.currentTab === 'weekly') {
      const data = await LeaderboardManager.getWeeklyLeaderboard();
      if (this.currentTab === 'weekly') {
        this.panel.setEntries(data.entries);
        this.weeklyResetsIn = data.resetsIn;
        this.updateResetTimer();
      }
    } else if (this.currentTab === 'notable') {
      // Sort by score descending and re-rank
      const sorted = [...LeaderboardScene.NOTABLE_ENTRIES]
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      this.panel.setEntries(sorted);
    }
  }

  private updateResetTimer(): void {
    if (this.currentTab !== 'weekly') return;

    if (this.weeklyResetsIn > 0) {
      this.weeklyResetsIn--;
      const timeStr = LeaderboardManager.formatTimeRemaining(this.weeklyResetsIn);
      this.resetTimerText.setText(`Resets in: ${timeStr}`);
    } else {
      this.resetTimerText.setText('Resetting soon...');
    }
  }
}
