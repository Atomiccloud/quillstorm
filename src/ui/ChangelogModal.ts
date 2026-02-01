import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { CHANGELOG, GAME_VERSION } from '../data/version';

export class ChangelogModal extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private scrollContainer: Phaser.GameObjects.Container;
  private scrollMask: Phaser.GameObjects.Graphics;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private contentHeight: number = 0;
  private onCloseCallback: () => void;

  constructor(scene: Phaser.Scene, onClose: () => void) {
    super(scene, 0, 0);

    this.onCloseCallback = onClose;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;
    const panelWidth = 500;
    const panelHeight = 450;

    // Semi-transparent background
    this.background = scene.add.rectangle(
      centerX,
      centerY,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.7
    );
    this.background.setInteractive();
    this.background.on('pointerdown', () => this.close());
    this.add(this.background);

    // Modal panel
    this.panel = scene.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e);
    this.panel.setStrokeStyle(2, 0x4a6741);
    this.panel.setInteractive(); // Prevent clicks from passing through
    this.add(this.panel);

    // Title
    const title = scene.add.text(centerX, centerY - panelHeight / 2 + 30, `Changelog - v${GAME_VERSION}`, {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
    this.add(title);

    // Close button (X)
    const closeButton = scene.add.text(centerX + panelWidth / 2 - 25, centerY - panelHeight / 2 + 15, '✕', {
      fontSize: '24px',
      color: '#888888',
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerover', () => closeButton.setColor('#ffffff'));
    closeButton.on('pointerout', () => closeButton.setColor('#888888'));
    closeButton.on('pointerdown', () => this.close());
    this.add(closeButton);

    // Scrollable content area
    const contentX = centerX - panelWidth / 2 + 20;
    const contentY = centerY - panelHeight / 2 + 60;
    const contentWidth = panelWidth - 40;
    const contentVisibleHeight = panelHeight - 100;

    // Create scroll container
    this.scrollContainer = scene.add.container(contentX, contentY);
    this.add(this.scrollContainer);

    // Create mask for scrolling (hidden, only used for masking geometry)
    this.scrollMask = scene.add.graphics();
    this.scrollMask.fillStyle(0xffffff);
    this.scrollMask.fillRect(contentX, contentY, contentWidth, contentVisibleHeight);
    this.scrollMask.setVisible(false); // Hide the mask graphics itself
    const mask = this.scrollMask.createGeometryMask();
    this.scrollContainer.setMask(mask);

    // Build changelog content
    let yOffset = 0;
    CHANGELOG.forEach((entry, index) => {
      // Version header
      const versionText = scene.add.text(0, yOffset, `v${entry.version}`, {
        fontSize: '18px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffd700',
      });
      this.scrollContainer.add(versionText);

      const dateText = scene.add.text(80, yOffset + 2, entry.date, {
        fontSize: '14px',
        color: '#888888',
      });
      this.scrollContainer.add(dateText);

      yOffset += 28;

      // Changes list
      entry.changes.forEach((change) => {
        const bullet = scene.add.text(10, yOffset, '•', {
          fontSize: '14px',
          color: '#88ff88',
        });
        this.scrollContainer.add(bullet);

        const changeText = scene.add.text(25, yOffset, change, {
          fontSize: '14px',
          color: '#cccccc',
          wordWrap: { width: contentWidth - 40 },
        });
        this.scrollContainer.add(changeText);

        // Calculate actual height of wrapped text
        yOffset += Math.max(20, changeText.height + 4);
      });

      // Add spacing between versions
      if (index < CHANGELOG.length - 1) {
        yOffset += 15;

        // Divider line
        const divider = scene.add.graphics();
        divider.lineStyle(1, 0x333333);
        divider.beginPath();
        divider.moveTo(0, yOffset);
        divider.lineTo(contentWidth - 20, yOffset);
        divider.strokePath();
        this.scrollContainer.add(divider);

        yOffset += 15;
      }
    });

    this.contentHeight = yOffset;
    this.maxScrollY = Math.max(0, this.contentHeight - contentVisibleHeight);

    // Scroll hint if content is scrollable
    if (this.maxScrollY > 0) {
      const scrollHint = scene.add.text(centerX, centerY + panelHeight / 2 - 25, 'Scroll to see more ↓', {
        fontSize: '12px',
        color: '#666666',
      });
      scrollHint.setOrigin(0.5);
      this.add(scrollHint);
    }

    // Mouse wheel scrolling
    scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (this.visible) {
        this.scroll(deltaY * 0.5);
      }
    });

    // Initially hidden
    this.setVisible(false);
  }

  private scroll(delta: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, this.maxScrollY);
    this.scrollContainer.y = (GAME_CONFIG.height / 2 - 450 / 2 + 60) - this.scrollY;
  }

  show(): void {
    this.setVisible(true);
    this.scrollY = 0;
    this.scrollContainer.y = GAME_CONFIG.height / 2 - 450 / 2 + 60;
  }

  close(): void {
    AudioManager.playButtonClick();
    this.setVisible(false);
    this.onCloseCallback();
  }

  destroy(): void {
    this.scrollMask.destroy();
    super.destroy();
  }
}
