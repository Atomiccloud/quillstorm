import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { MobileDetector } from '../systems/MobileDetector';

export class NameInputModal extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private inputContainer: HTMLDivElement;
  private inputElement: HTMLInputElement;
  private submitButton: Phaser.GameObjects.Rectangle;
  private submitText: Phaser.GameObjects.Text;
  private skipButton: Phaser.GameObjects.Rectangle;
  private skipText: Phaser.GameObjects.Text;
  private errorText: Phaser.GameObjects.Text;
  private onSubmitCallback: (name: string) => void;
  private onSkipCallback: (() => void) | null;

  constructor(scene: Phaser.Scene, onSubmit: (name: string) => void, onSkip?: () => void) {
    super(scene, 0, 0);

    this.onSubmitCallback = onSubmit;
    this.onSkipCallback = onSkip || null;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;
    const m = MobileDetector.showVirtualControls;

    // Semi-transparent background
    this.background = scene.add.rectangle(
      centerX,
      centerY,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
      0x000000,
      0.7
    );
    this.background.setInteractive(); // Block clicks behind
    this.add(this.background);

    // Modal panel
    this.panel = scene.add.rectangle(centerX, centerY, m ? 500 : 400, m ? 280 : 230, 0x2a2a3a);
    this.panel.setStrokeStyle(2, 0x4a6741);
    this.add(this.panel);

    // Title
    this.titleText = scene.add.text(centerX, centerY - (m ? 90 : 70), 'Submit to Leaderboard', {
      fontSize: m ? '30px' : '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Create DOM input element
    this.inputContainer = document.createElement('div');
    this.inputContainer.style.position = 'absolute';
    this.inputContainer.style.width = m ? '360px' : '280px';
    this.inputContainer.style.height = m ? '52px' : '40px';

    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.maxLength = 20;
    this.inputElement.placeholder = 'Your name...';
    this.inputElement.style.width = '100%';
    this.inputElement.style.height = '100%';
    this.inputElement.style.fontSize = m ? '24px' : '18px';
    this.inputElement.style.padding = '8px 12px';
    this.inputElement.style.border = '2px solid #4a6741';
    this.inputElement.style.borderRadius = '4px';
    this.inputElement.style.backgroundColor = '#1a1a2e';
    this.inputElement.style.color = '#ffffff';
    this.inputElement.style.outline = 'none';
    this.inputElement.style.textAlign = 'center';
    this.inputElement.style.boxSizing = 'border-box';

    this.inputElement.addEventListener('focus', () => {
      this.inputElement.style.borderColor = '#6a8761';
    });

    this.inputElement.addEventListener('blur', () => {
      this.inputElement.style.borderColor = '#4a6741';
    });

    // Stop propagation on all key events to prevent Phaser from capturing WASD, etc.
    this.inputElement.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this.handleSubmit();
      }
    });

    this.inputElement.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    this.inputElement.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    this.inputContainer.appendChild(this.inputElement);
    document.body.appendChild(this.inputContainer);

    // Submit button
    const btnY = centerY + (m ? 70 : 50);
    const btnW = m ? 160 : 120;
    const btnH = m ? 56 : 40;
    this.submitButton = scene.add.rectangle(centerX - (m ? 90 : 70), btnY, btnW, btnH, 0x4a6741);
    this.submitButton.setInteractive({ useHandCursor: true });
    this.add(this.submitButton);

    this.submitText = scene.add.text(centerX - (m ? 90 : 70), btnY, 'SUBMIT', {
      fontSize: m ? '26px' : '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    });
    this.submitText.setOrigin(0.5);
    this.add(this.submitText);

    // Skip button
    this.skipButton = scene.add.rectangle(centerX + (m ? 90 : 70), btnY, btnW, btnH, 0x555555);
    this.skipButton.setInteractive({ useHandCursor: true });
    this.add(this.skipButton);

    this.skipText = scene.add.text(centerX + (m ? 90 : 70), btnY, 'SKIP', {
      fontSize: m ? '26px' : '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#aaaaaa',
    });
    this.skipText.setOrigin(0.5);
    this.add(this.skipText);

    // Error text (hidden by default)
    this.errorText = scene.add.text(centerX, btnY + (m ? 45 : 35), '', {
      fontSize: m ? '20px' : '14px',
      color: '#ff6666',
    });
    this.errorText.setOrigin(0.5);
    this.add(this.errorText);

    // Button interactions
    if (!MobileDetector.isTouchDevice) {
      this.submitButton.on('pointerover', () => {
        this.submitButton.setFillStyle(0x5a7751);
      });
      this.submitButton.on('pointerout', () => {
        this.submitButton.setFillStyle(0x4a6741);
      });
    }

    this.submitButton.on('pointerdown', () => {
      this.handleSubmit();
    });

    if (!MobileDetector.isTouchDevice) {
      this.skipButton.on('pointerover', () => {
        this.skipButton.setFillStyle(0x666666);
      });
      this.skipButton.on('pointerout', () => {
        this.skipButton.setFillStyle(0x555555);
      });
    }

    this.skipButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.hide();
      if (this.onSkipCallback) {
        this.onSkipCallback();
      }
    });

    // Position input over canvas
    this.updateInputPosition();

    // Handle resize
    scene.scale.on('resize', () => this.updateInputPosition());

    // Initially hidden
    this.setVisible(false);
    this.inputContainer.style.display = 'none';
  }

  private updateInputPosition(): void {
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();

    // Calculate position relative to canvas
    const scaleX = rect.width / GAME_CONFIG.width;
    const scaleY = rect.height / GAME_CONFIG.height;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    const inputW = MobileDetector.showVirtualControls ? 180 : 140;
    const inputX = rect.left + (centerX - inputW) * scaleX;
    const inputY = rect.top + (centerY - 20) * scaleY;

    this.inputContainer.style.left = `${inputX}px`;
    this.inputContainer.style.top = `${inputY}px`;
    this.inputContainer.style.transform = `scale(${scaleX}, ${scaleY})`;
    this.inputContainer.style.transformOrigin = 'top left';
  }

  private handleSubmit(): void {
    const name = this.inputElement.value.trim();

    // Validate
    if (name.length < 3) {
      this.showError('Name must be at least 3 characters');
      return;
    }

    if (name.length > 20) {
      this.showError('Name must be 20 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
      this.showError('Letters, numbers, and spaces only');
      return;
    }

    AudioManager.playButtonClick();
    this.onSubmitCallback(name);
    this.hide();
  }

  private showError(message: string): void {
    this.errorText.setText(message);
    this.inputElement.style.borderColor = '#ff6666';

    this.scene.time.delayedCall(2000, () => {
      this.errorText.setText('');
      this.inputElement.style.borderColor = '#4a6741';
    });
  }

  show(defaultName = ''): void {
    this.setVisible(true);
    this.inputContainer.style.display = 'block';
    this.inputElement.value = defaultName;
    this.errorText.setText('');
    this.updateInputPosition();

    // Focus input after a short delay
    this.scene.time.delayedCall(100, () => {
      this.inputElement.focus();
      this.inputElement.select();
    });
  }

  hide(): void {
    this.setVisible(false);
    this.inputContainer.style.display = 'none';
    this.inputElement.blur();
  }

  destroy(): void {
    this.inputContainer.remove();
    super.destroy();
  }
}
