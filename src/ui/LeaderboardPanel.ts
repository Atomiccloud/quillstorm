import Phaser from 'phaser';
import { LeaderboardEntry } from '../systems/LeaderboardManager';

const ROW_HEIGHT = 32;
const VISIBLE_ROWS = 10;

export class LeaderboardPanel extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private header: Phaser.GameObjects.Container;
  private rowsContainer: Phaser.GameObjects.Container;
  private scrollOffset = 0;
  private entries: LeaderboardEntry[] = [];
  private playerRank?: number;
  private loadingText: Phaser.GameObjects.Text;
  private errorText: Phaser.GameObjects.Text;

  private panelWidth: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    super(scene, x, y);

    this.panelWidth = width;

    // Background
    this.background = scene.add.rectangle(0, 0, width, height, 0x1a1a2e);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0x4a6741);
    this.add(this.background);

    // Header row
    this.header = scene.add.container(0, 0);
    const headerBg = scene.add.rectangle(0, 0, width, ROW_HEIGHT, 0x2a2a3a);
    headerBg.setOrigin(0, 0);
    this.header.add(headerBg);

    const headerStyle = { fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial, sans-serif' };
    this.header.add(scene.add.text(10, 8, '#', headerStyle));
    this.header.add(scene.add.text(50, 8, 'NAME', headerStyle));
    this.header.add(scene.add.text(width - 130, 8, 'SCORE', headerStyle));
    this.header.add(scene.add.text(width - 50, 8, 'WAVE', headerStyle));
    this.add(this.header);

    // Rows container (scrollable)
    this.rowsContainer = scene.add.container(0, ROW_HEIGHT);
    this.add(this.rowsContainer);

    // Create mask for scrolling using Graphics
    const maskGraphics = scene.make.graphics({ x: x, y: y + ROW_HEIGHT });
    maskGraphics.fillStyle(0xffffff);
    maskGraphics.fillRect(0, 0, width, height - ROW_HEIGHT);
    const mask = new Phaser.Display.Masks.GeometryMask(scene, maskGraphics);
    this.rowsContainer.setMask(mask);

    // Loading text
    this.loadingText = scene.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '18px',
      color: '#666666',
    });
    this.loadingText.setOrigin(0.5);
    this.add(this.loadingText);

    // Error text
    this.errorText = scene.add.text(width / 2, height / 2, '', {
      fontSize: '16px',
      color: '#ff6666',
    });
    this.errorText.setOrigin(0.5);
    this.errorText.setVisible(false);
    this.add(this.errorText);

    // Mouse wheel scrolling
    this.background.setInteractive();
    scene.input.on('wheel', (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number
    ) => {
      if (this.visible && this.entries.length > VISIBLE_ROWS) {
        this.scroll(deltaY > 0 ? 1 : -1);
      }
    });

    scene.add.existing(this);
  }

  private scroll(direction: number): void {
    const maxScroll = Math.max(0, this.entries.length - VISIBLE_ROWS);
    this.scrollOffset = Phaser.Math.Clamp(
      this.scrollOffset + direction,
      0,
      maxScroll
    );
    this.renderRows();
  }

  setEntries(entries: LeaderboardEntry[], playerRank?: number): void {
    this.entries = entries;
    this.playerRank = playerRank;
    this.scrollOffset = 0;
    this.loadingText.setVisible(false);
    this.errorText.setVisible(false);

    if (entries.length === 0) {
      this.showError('No entries yet. Be the first!');
      return;
    }

    this.renderRows();
  }

  showLoading(): void {
    this.rowsContainer.removeAll(true);
    this.loadingText.setVisible(true);
    this.loadingText.setText('Loading...');
    this.errorText.setVisible(false);
  }

  showError(message: string): void {
    this.rowsContainer.removeAll(true);
    this.loadingText.setVisible(false);
    this.errorText.setText(message);
    this.errorText.setVisible(true);
  }

  private renderRows(): void {
    this.rowsContainer.removeAll(true);

    const visibleEntries = this.entries.slice(
      this.scrollOffset,
      this.scrollOffset + VISIBLE_ROWS
    );

    visibleEntries.forEach((entry, index) => {
      const rowY = index * ROW_HEIGHT;
      const isPlayerRow = entry.rank === this.playerRank;

      // Row background
      const rowBg = this.scene.add.rectangle(
        0,
        rowY,
        this.panelWidth,
        ROW_HEIGHT - 2,
        isPlayerRow ? 0x3a4a3a : (index % 2 === 0 ? 0x222233 : 0x1a1a2e)
      );
      rowBg.setOrigin(0, 0);
      this.rowsContainer.add(rowBg);

      const textStyle = {
        fontSize: '14px',
        color: isPlayerRow ? '#88ff88' : '#ffffff',
        fontFamily: 'Arial, sans-serif',
      };

      // Rank with medal for top 3
      const rankText = `${entry.rank}`;

      const rankDisplay = this.scene.add.text(10, rowY + 8, rankText, textStyle);
      this.rowsContainer.add(rankDisplay);

      // Medal icons for top 3
      if (entry.rank <= 3) {
        const medalColors = [0xffd700, 0xc0c0c0, 0xcd7f32]; // Gold, Silver, Bronze
        const medal = this.scene.add.circle(25, rowY + 15, 8, medalColors[entry.rank - 1]);
        this.rowsContainer.add(medal);
      }

      // Name (truncate if too long)
      let displayName = entry.playerName;
      if (displayName.length > 15) {
        displayName = displayName.substring(0, 14) + '...';
      }
      const nameText = this.scene.add.text(50, rowY + 8, displayName, textStyle);
      this.rowsContainer.add(nameText);

      // Score
      const scoreText = this.scene.add.text(
        this.panelWidth - 130,
        rowY + 8,
        entry.score.toLocaleString(),
        textStyle
      );
      this.rowsContainer.add(scoreText);

      // Wave
      const waveText = this.scene.add.text(
        this.panelWidth - 50,
        rowY + 8,
        `${entry.wave}`,
        textStyle
      );
      this.rowsContainer.add(waveText);

      // Highlight marker for player
      if (isPlayerRow) {
        const marker = this.scene.add.text(
          this.panelWidth - 15,
          rowY + 8,
          '<',
          { fontSize: '14px', color: '#88ff88' }
        );
        this.rowsContainer.add(marker);
      }
    });
  }
}
