import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { AuthManager, AuthUser } from '../systems/AuthManager';

export class LoginScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private loginButton!: Phaser.GameObjects.Rectangle;
  private loginButtonText!: Phaser.GameObjects.Text;
  private userInfoContainer!: Phaser.GameObjects.Container;
  private unsubscribeAuth: (() => void) | null = null;

  constructor() {
    super({ key: 'LoginScene' });
  }

  create(): void {
    // Initialize Firebase Auth
    AuthManager.initialize();

    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    // Title
    this.add
      .text(centerX, centerY - 180, 'ACCOUNT', {
        fontSize: '48px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(centerX, centerY - 120, 'Sign in to sync your progress across devices', {
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Status text
    this.statusText = this.add
      .text(centerX, centerY - 80, '', {
        fontSize: '14px',
        color: '#ffaa00',
      })
      .setOrigin(0.5);

    // Create login button
    this.createLoginButton(centerX, centerY);

    // Create user info container (shown when signed in)
    this.createUserInfoContainer(centerX, centerY);

    // Back button
    const backButton = this.add
      .rectangle(centerX, centerY + 200, 120, 40, 0x555555)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(centerX, centerY + 200, 'BACK', {
        fontSize: '18px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0x666666));
    backButton.on('pointerout', () => backButton.setFillStyle(0x555555));
    backButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.cleanup();
      this.scene.start('MenuScene');
    });

    // Guest mode info
    this.add
      .text(
        centerX,
        centerY + 260,
        'Guest mode: Your progress is saved locally on this device.',
        {
          fontSize: '12px',
          color: '#666666',
        }
      )
      .setOrigin(0.5);

    // Subscribe to auth state changes
    this.unsubscribeAuth = AuthManager.onAuthStateChanged((user) => {
      this.updateUI(user);
    });
  }

  private createLoginButton(centerX: number, centerY: number): void {
    // Google Sign In button
    this.loginButton = this.add
      .rectangle(centerX, centerY, 250, 50, 0x4285f4)
      .setInteractive({ useHandCursor: true });

    // Google icon (simplified G)
    const iconBg = this.add.rectangle(centerX - 100, centerY, 40, 40, 0xffffff);

    const iconG = this.add
      .text(centerX - 100, centerY, 'G', {
        fontSize: '24px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#4285f4',
      })
      .setOrigin(0.5);

    this.loginButtonText = this.add
      .text(centerX + 10, centerY, 'Sign in with Google', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.loginButton.on('pointerover', () => {
      this.loginButton.setFillStyle(0x357abd);
    });

    this.loginButton.on('pointerout', () => {
      this.loginButton.setFillStyle(0x4285f4);
    });

    this.loginButton.on('pointerdown', async () => {
      AudioManager.playButtonClick();
      await this.handleSignIn();
    });

    // Store icon elements for hiding later
    (this.loginButton as Phaser.GameObjects.Rectangle & { iconBg?: Phaser.GameObjects.Rectangle; iconG?: Phaser.GameObjects.Text }).iconBg = iconBg;
    (this.loginButton as Phaser.GameObjects.Rectangle & { iconBg?: Phaser.GameObjects.Rectangle; iconG?: Phaser.GameObjects.Text }).iconG = iconG;
  }

  private createUserInfoContainer(centerX: number, centerY: number): void {
    this.userInfoContainer = this.add.container(centerX, centerY);
    this.userInfoContainer.setVisible(false);

    // User avatar placeholder
    const avatarBg = this.add.circle(0, -30, 40, 0x4a6741);
    this.userInfoContainer.add(avatarBg);

    // User icon
    const userIcon = this.add
      .text(0, -30, '👤', {
        fontSize: '40px',
      })
      .setOrigin(0.5);
    this.userInfoContainer.add(userIcon);

    // User name (will be updated)
    const userName = this.add
      .text(0, 20, '', {
        fontSize: '20px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    userName.setName('userName');
    this.userInfoContainer.add(userName);

    // User email (will be updated)
    const userEmail = this.add
      .text(0, 45, '', {
        fontSize: '14px',
        color: '#888888',
      })
      .setOrigin(0.5);
    userEmail.setName('userEmail');
    this.userInfoContainer.add(userEmail);

    // Sync status
    const syncStatus = this.add
      .text(0, 75, 'Progress synced', {
        fontSize: '14px',
        color: '#88ff88',
      })
      .setOrigin(0.5);
    syncStatus.setName('syncStatus');
    this.userInfoContainer.add(syncStatus);

    // Sign out button
    const signOutButton = this.add
      .rectangle(0, 120, 120, 35, 0x884444)
      .setInteractive({ useHandCursor: true });
    this.userInfoContainer.add(signOutButton);

    const signOutText = this.add
      .text(0, 120, 'Sign Out', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.userInfoContainer.add(signOutText);

    signOutButton.on('pointerover', () => signOutButton.setFillStyle(0xaa5555));
    signOutButton.on('pointerout', () => signOutButton.setFillStyle(0x884444));
    signOutButton.on('pointerdown', async () => {
      AudioManager.playButtonClick();
      await this.handleSignOut();
    });
  }

  private async handleSignIn(): Promise<void> {
    this.statusText.setText('Signing in...');
    this.loginButton.disableInteractive();

    try {
      const user = await AuthManager.signInWithGoogle();

      if (user) {
        this.statusText.setText('Signed in successfully!');
        this.statusText.setColor('#88ff88');
      } else {
        this.statusText.setText('Sign in cancelled');
        this.statusText.setColor('#ffaa00');
        this.loginButton.setInteractive({ useHandCursor: true });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      this.statusText.setText('Sign in failed. Please try again.');
      this.statusText.setColor('#ff8888');
      this.loginButton.setInteractive({ useHandCursor: true });
    }
  }

  private async handleSignOut(): Promise<void> {
    try {
      await AuthManager.signOut();
      this.statusText.setText('Signed out');
      this.statusText.setColor('#ffaa00');
    } catch (error) {
      console.error('Sign out error:', error);
      this.statusText.setText('Sign out failed');
      this.statusText.setColor('#ff8888');
    }
  }

  private updateUI(user: AuthUser | null): void {
    if (user) {
      // Hide login button
      this.loginButton.setVisible(false);
      this.loginButtonText.setVisible(false);
      const iconBg = (this.loginButton as Phaser.GameObjects.Rectangle & { iconBg?: Phaser.GameObjects.Rectangle }).iconBg;
      const iconG = (this.loginButton as Phaser.GameObjects.Rectangle & { iconG?: Phaser.GameObjects.Text }).iconG;
      if (iconBg) iconBg.setVisible(false);
      if (iconG) iconG.setVisible(false);

      // Show user info
      this.userInfoContainer.setVisible(true);

      // Update user info
      const userName = this.userInfoContainer.getByName('userName') as Phaser.GameObjects.Text;
      const userEmail = this.userInfoContainer.getByName('userEmail') as Phaser.GameObjects.Text;

      if (userName) {
        userName.setText(user.displayName || 'Player');
      }
      if (userEmail) {
        userEmail.setText(user.email || '');
      }
    } else {
      // Show login button
      this.loginButton.setVisible(true);
      this.loginButton.setInteractive({ useHandCursor: true });
      this.loginButtonText.setVisible(true);
      const iconBg = (this.loginButton as Phaser.GameObjects.Rectangle & { iconBg?: Phaser.GameObjects.Rectangle }).iconBg;
      const iconG = (this.loginButton as Phaser.GameObjects.Rectangle & { iconG?: Phaser.GameObjects.Text }).iconG;
      if (iconBg) iconBg.setVisible(true);
      if (iconG) iconG.setVisible(true);

      // Hide user info
      this.userInfoContainer.setVisible(false);
    }
  }

  private cleanup(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }
  }

  shutdown(): void {
    this.cleanup();
  }
}
