import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';

export class NameInputModal extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private panel: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private inputContainer: HTMLDivElement;
  private inputElement: HTMLInputElement;
  private submitButton: Phaser.GameObjects.Rectangle;
  private submitText: Phaser.GameObjects.Text;
  private errorText: Phaser.GameObjects.Text;
  private onSubmitCallback: (name: string) => void;

  constructor(scene: Phaser.Scene, onSubmit: (name: string) => void) {
    super(scene, 0, 0);

    this.onSubmitCallback = onSubmit;

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

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
    this.panel = scene.add.rectangle(centerX, centerY, 400, 200, 0x2a2a3a);
    this.panel.setStrokeStyle(2, 0x4a6741);
    this.add(this.panel);

    // Title
    this.titleText = scene.add.text(centerX, centerY - 60, 'Enter Your Name', {
      fontSize: '24px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Create DOM input element
    this.inputContainer = document.createElement('div');
    this.inputContainer.style.position = 'absolute';
    this.inputContainer.style.width = '280px';
    this.inputContainer.style.height = '40px';

    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.maxLength = 20;
    this.inputElement.placeholder = 'Your name...';
    this.inputElement.style.width = '100%';
    this.inputElement.style.height = '100%';
    this.inputElement.style.fontSize = '18px';
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

    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      }
    });

    this.inputContainer.appendChild(this.inputElement);
    document.body.appendChild(this.inputContainer);

    // Submit button
    this.submitButton = scene.add.rectangle(centerX, centerY + 50, 120, 40, 0x4a6741);
    this.submitButton.setInteractive({ useHandCursor: true });
    this.add(this.submitButton);

    this.submitText = scene.add.text(centerX, centerY + 50, 'SUBMIT', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    });
    this.submitText.setOrigin(0.5);
    this.add(this.submitText);

    // Error text (hidden by default)
    this.errorText = scene.add.text(centerX, centerY + 85, '', {
      fontSize: '14px',
      color: '#ff6666',
    });
    this.errorText.setOrigin(0.5);
    this.add(this.errorText);

    // Button interactions
    this.submitButton.on('pointerover', () => {
      this.submitButton.setFillStyle(0x5a7751);
    });

    this.submitButton.on('pointerout', () => {
      this.submitButton.setFillStyle(0x4a6741);
    });

    this.submitButton.on('pointerdown', () => {
      this.handleSubmit();
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

    const inputX = rect.left + (centerX - 140) * scaleX;
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
