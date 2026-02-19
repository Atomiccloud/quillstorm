import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { AuthManager } from '../systems/AuthManager';
import { PlayerDataManager } from '../systems/PlayerDataManager';
import { GAME_VERSION } from '../data/version';
import { ChangelogModal } from '../ui/ChangelogModal';
import { SettingsModal } from '../ui/SettingsModal';
import { MobileDetector } from '../systems/MobileDetector';

export class MenuScene extends Phaser.Scene {
  private changelogModal!: ChangelogModal;
  private settingsModal!: SettingsModal;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    AudioManager.initialize();
    AuthManager.initialize();
    PlayerDataManager.initialize();
    PlayerDataManager.syncIfNeeded();

    const w = GAME_CONFIG.width;
    const h = GAME_CONFIG.height;
    const centerX = w / 2;
    const m = MobileDetector.showVirtualControls;

    // ─── ATMOSPHERIC BACKGROUND ───
    this.drawBackground(w, h);

    // ─── FLOATING PARTICLES ───
    this.createParticles(w, h);

    if (m) {
      this.createMobileLayout(centerX, w, h);
    } else {
      this.createDesktopLayout(w, h);
    }

    // ─── ACCOUNT BUTTON (top right, both layouts) ───
    const acctX = m ? w - 100 : w - 80;
    const accountButton = this.add.rectangle(acctX, 35, m ? 160 : 140, m ? 50 : 42, 0x2a2a44, 0.7)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    accountButton.setStrokeStyle(1, 0x5a5a7a);

    const accountText = this.add.text(acctX, 35,
      AuthManager.isSignedIn() ? AuthManager.getDisplayName() : 'Account', {
      fontSize: m ? '22px' : '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#bbbbcc',
    }).setOrigin(0.5).setDepth(11);

    if (!MobileDetector.isTouchDevice) {
      accountButton.on('pointerover', () => { accountButton.setFillStyle(0x3a3a5a, 0.9); accountText.setColor('#ddddee'); });
      accountButton.on('pointerout', () => { accountButton.setFillStyle(0x2a2a44, 0.7); accountText.setColor('#bbbbcc'); });
    }
    accountButton.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.scene.start('LoginScene');
    });

    AuthManager.onAuthStateChanged((user) => {
      if (user) {
        accountText.setText(user.displayName?.split(' ')[0] || 'Account');
      } else {
        accountText.setText('Account');
      }
    });

    // ─── CONTROLS HINT (bottom center) ───
    const controlsHint = m
      ? 'Joystick: Move  |  Touch: Aim & Shoot'
      : 'WASD / Arrows: Move  |  Space: Jump  |  Mouse: Aim & Shoot  |  Tab: Stats  |  M: Mute';
    this.add.text(centerX, h - 40, controlsHint, {
      fontSize: m ? '20px' : '15px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888aa',
    }).setOrigin(0.5);

    if (m) {
      this.createRoundedButton(80, h - 40, 140, 40, 8, 0x444444, 0x555555, 'FULLSCREEN', '16px', () => {
        document.documentElement.requestFullscreen?.().catch(() => { });
      });
    }

    // ─── VERSION (bottom right, clickable) ───
    const versionText = this.add.text(w - 15, h - 15, `v${GAME_VERSION}`, {
      fontSize: m ? '20px' : '15px',
      fontFamily: 'Arial, sans-serif',
      color: '#8888aa',
    }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

    if (!MobileDetector.isTouchDevice) {
      versionText.on('pointerover', () => versionText.setColor('#bbbbdd'));
      versionText.on('pointerout', () => versionText.setColor('#8888aa'));
    }
    versionText.on('pointerdown', () => {
      AudioManager.playButtonClick();
      this.changelogModal.show();
    });

    // ─── MODALS ───
    this.changelogModal = new ChangelogModal(this, () => { });
    this.add.existing(this.changelogModal);
    this.settingsModal = new SettingsModal(this, () => { });
    this.add.existing(this.settingsModal);

    this.input.keyboard?.on('keydown-M', () => {
      AudioManager.toggleMute();
    });
  }

  private drawBackground(w: number, h: number): void {
    const bg = this.add.graphics();

    // Gradient sky: dark blue top → slightly warmer bottom
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.round(0x10 + t * 0x08);
      const g = Math.round(0x10 + t * 0x06);
      const b = Math.round(0x1e + t * 0x08);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }

    // Ground layer: dark earth tone at the very bottom
    bg.fillStyle(0x0e0e16);
    bg.fillRect(0, h - 80, w, 80);
    bg.fillStyle(0x111119);
    bg.fillRect(0, h - 80, w, 2);

    // Distant forest silhouettes (back layer - darkest)
    this.drawTreeLine(bg, w, h - 80, 0x0c0c18, 100, 200, 0.7);
    // Mid forest layer
    this.drawTreeLine(bg, w, h - 80, 0x0e0e1a, 70, 150, 1.0);
    // Front forest layer
    this.drawTreeLine(bg, w, h - 80, 0x10101e, 40, 100, 1.4);

    // Subtle stars
    const starGfx = this.add.graphics();
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * (h * 0.5);
      const brightness = 0.08 + Math.random() * 0.15;
      const size = 0.5 + Math.random() * 1;
      starGfx.fillStyle(0xccccdd, brightness);
      starGfx.fillCircle(sx, sy, size);
    }

    // Vignette overlay
    const vig = this.add.graphics();
    vig.fillStyle(0x000000, 0.3);
    vig.fillRect(0, 0, w, 60);
    vig.fillStyle(0x000000, 0.15);
    vig.fillRect(0, 60, w, 40);
    vig.fillStyle(0x000000, 0.25);
    vig.fillRect(0, h - 60, w, 60);
    vig.setDepth(0);
  }

  private drawTreeLine(gfx: Phaser.GameObjects.Graphics, w: number, groundY: number, color: number, minH: number, maxH: number, density: number): void {
    gfx.fillStyle(color);
    let x = -20;
    while (x < w + 20) {
      const treeH = minH + Math.random() * (maxH - minH);
      const treeW = 15 + Math.random() * 25;
      // Simple triangular tree
      gfx.fillTriangle(
        x, groundY,
        x + treeW / 2, groundY - treeH,
        x + treeW, groundY
      );
      // Slight trunk fill at base
      gfx.fillRect(x + treeW * 0.35, groundY - 5, treeW * 0.3, 5);
      x += treeW * (0.4 + Math.random() * 0.5) / density;
    }
  }

  private createParticles(w: number, h: number): void {
    // Create a tiny glowing circle texture for particles
    const gfx = this.add.graphics();
    gfx.fillStyle(0xddcc88, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('menuParticle', 8, 8);
    gfx.destroy();

    this.add.particles(0, 0, 'menuParticle', {
      x: { min: 0, max: w },
      y: { min: h * 0.3, max: h - 100 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.3, end: 0 },
      speed: { min: 5, max: 15 },
      angle: { min: 250, max: 290 },
      lifespan: { min: 3000, max: 6000 },
      frequency: 400,
      blendMode: 'ADD',
    });
  }

  private createDesktopLayout(w: number, h: number): void {
    const menuX = 120;
    const mascotX = w * 0.58;

    // ─── TITLE (left-aligned, upper area) ───
    // Glow layer behind title
    this.add.text(menuX, 110, 'QUILLSTORM', {
      fontSize: '76px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#e8d5a3',
      stroke: '#e8d5a3',
      strokeThickness: 12,
    }).setOrigin(0, 0.5).setAlpha(0.08);

    // Main title
    this.add.text(menuX, 110, 'QUILLSTORM', {
      fontSize: '76px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#e8d5a3',
      stroke: '#1a1a2e',
      strokeThickness: 4,
    }).setOrigin(0, 0.5);

    // Subtitle
    this.add.text(menuX + 4, 160, 'A Porcupine Roguelike', {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'Arial, sans-serif',
      letterSpacing: 3,
    }).setOrigin(0, 0.5);

    // Thin decorative line under subtitle
    const lineGfx = this.add.graphics();
    lineGfx.fillStyle(0x6a6a8a, 0.5);
    lineGfx.fillRect(menuX, 182, 260, 1);

    // ─── SCENE VIGNETTE (right side: mascot on platform with enemies) ───
    this.drawMenuScene(mascotX, w, h);

    // ─── MENU BUTTONS (left-aligned, vertical list) ───
    const startY = 260;
    const spacing = 68;

    this.createMenuButton(menuX, startY, 'PLAY', '32px', 260, 54, 0x5a7a51, 0x6a8a61, true, () => {
      AudioManager.resume();
      AudioManager.playButtonClick();
      this.scene.start('GameScene');
    });

    this.createMenuButton(menuX, startY + spacing, 'SHOP', '20px', 200, 44, 0x9b5523, 0xb0623d, false, () => {
      AudioManager.playButtonClick();
      this.scene.start('ShopScene');
    });

    this.createMenuButton(menuX, startY + spacing * 2, 'LEADERBOARD', '20px', 200, 44, 0x555588, 0x666699, false, () => {
      AudioManager.playButtonClick();
      this.scene.start('LeaderboardScene', { returnScene: 'MenuScene' });
    });

    this.createMenuButton(menuX, startY + spacing * 3, 'SETTINGS', '20px', 200, 44, 0x4a4a5a, 0x5a5a6a, false, () => {
      AudioManager.playButtonClick();
      this.settingsModal.show();
    });

    // QUIT button — only in Electron desktop app
    if ((window as any).electronAPI?.isElectron) {
      this.createMenuButton(menuX, startY + spacing * 4, 'QUIT', '20px', 200, 44, 0x5a3a3a, 0x6a4a4a, false, () => {
        AudioManager.playButtonClick();
        (window as any).electronAPI.quit();
      });
    }
  }

  private createMobileLayout(centerX: number, _w: number, h: number): void {
    const centerY = h / 2;

    // Title (centered for mobile)
    this.add.text(centerX, centerY - 310, 'QUILLSTORM', {
      fontSize: '90px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#e8d5a3',
      stroke: '#1a1a2e',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 250, 'A Porcupine Roguelike', {
      fontSize: '34px',
      color: '#888888',
    }).setOrigin(0.5);

    // Mascot (centered for mobile)
    this.add.image(centerX, centerY - 50, 'mascot').setScale(0.33);

    // Buttons (centered for mobile)
    const playBtnY = centerY + 155;
    this.createRoundedButton(centerX, playBtnY, 280, 70, 12, 0x4a6741, 0x5a7751, 'PLAY', '40px', () => {
      AudioManager.resume();
      AudioManager.playButtonClick();
      this.scene.start('GameScene');
    });

    const secondRowY = playBtnY + 95;
    const btnWidth = 240;
    const btnHeight = 56;
    const gap = 20;

    this.createRoundedButton(centerX - btnWidth / 2 - gap / 2, secondRowY, btnWidth, btnHeight, 10, 0x8b4513, 0xa0522d, 'SHOP', '28px', () => {
      AudioManager.playButtonClick();
      this.scene.start('ShopScene');
    });

    this.createRoundedButton(centerX + btnWidth / 2 + gap / 2, secondRowY, btnWidth, btnHeight, 10, 0x444477, 0x555588, 'LEADERBOARD', '28px', () => {
      AudioManager.playButtonClick();
      this.scene.start('LeaderboardScene', { returnScene: 'MenuScene' });
    });

    const settingsY = secondRowY + 85;
    this.createRoundedButton(centerX, settingsY, 220, btnHeight, 10, 0x555555, 0x666666, 'SETTINGS', '28px', () => {
      AudioManager.playButtonClick();
      this.settingsModal.show();
    });
  }

  private drawMenuScene(mascotX: number, _w: number, h: number): void {
    // Mascot in original position (center of right side)
    this.add.image(mascotX, h * 0.52, 'mascot')
      .setScale(0.35)
      .setDepth(3)
      .setAlpha(0.95);

    // Green platform under the mascot's feet, matching in-game style
    const platW = 200;
    const platH = 20;
    const platY = h * 0.62;
    this.add.rectangle(mascotX, platY, platW, platH, 0x4a6741).setDepth(2);

    // Enemy renders using actual in-game draw methods
    const groundY = h - 80;

    // Scurrier (left of platform, on ground) — facing right towards mascot
    this.drawStaticScurrier(mascotX - 170, groundY - 13, 1.5, 0.85, 1);
    // Second scurrier further back (smaller, dimmer)
    this.drawStaticScurrier(mascotX - 280, groundY - 10, 1.1, 0.55, 1);

    // Swooper (flying, upper right)
    this.drawStaticSwooper(mascotX + 170, h * 0.20, 1.7, 0.7);
    // Second swooper (further back, higher)
    this.drawStaticSwooper(mascotX + 310, h * 0.14, 1.3, 0.45);

    // Shellback (right of platform, on ground) — facing left towards mascot
    this.drawStaticShellback(mascotX + 150, groundY - 18, 1.5, 0.8, -1);
  }

  /** Draws a scurrier using exact Enemy.drawScurrier() primitives */
  private drawStaticScurrier(x: number, y: number, scale: number, alpha: number, dir: number): void {
    const gfx = this.add.graphics().setPosition(x, y).setScale(scale).setAlpha(alpha).setDepth(1);
    const w = 30; // ENEMY_CONFIG.scurrier.width
    const h = 25; // ENEMY_CONFIG.scurrier.height
    const color = 0x8b4513;

    // Body
    gfx.fillStyle(color);
    gfx.fillEllipse(0, 0, w, h);
    // Ears
    gfx.fillCircle(-w * 0.3 * dir, -h * 0.4, 5);
    gfx.fillCircle(-w * 0.1 * dir, -h * 0.45, 5);
    // Eye
    gfx.fillStyle(0xff0000);
    gfx.fillCircle(w * 0.2 * dir, -h * 0.1, 4);
    // Teeth
    gfx.fillStyle(0xffffff);
    gfx.fillRect(w * 0.3 * dir - 2, h * 0.1, 4, 6);
  }

  /** Draws a swooper using exact Enemy.drawSwooper() primitives */
  private drawStaticSwooper(x: number, y: number, scale: number, alpha: number): void {
    const gfx = this.add.graphics().setPosition(x, y).setScale(scale).setAlpha(alpha).setDepth(1);
    const w = 35; // ENEMY_CONFIG.swooper.width
    const h = 20; // ENEMY_CONFIG.swooper.height
    const color = 0x4b0082;

    // Body
    gfx.fillStyle(color);
    gfx.fillEllipse(0, 0, w * 0.5, h);
    // Wings
    gfx.fillTriangle(-w * 0.5, -h * 0.3, 0, 0, -w * 0.5, h * 0.3);
    gfx.fillTriangle(w * 0.5, -h * 0.3, 0, 0, w * 0.5, h * 0.3);
    // Ears
    gfx.fillTriangle(-5, -h * 0.5, -8, -h * 0.8, -2, -h * 0.5);
    gfx.fillTriangle(5, -h * 0.5, 8, -h * 0.8, 2, -h * 0.5);
    // Eyes
    gfx.fillStyle(0xff0000);
    gfx.fillCircle(-4, -h * 0.2, 3);
    gfx.fillCircle(4, -h * 0.2, 3);
  }

  /** Draws a shellback using exact Enemy.drawShellback() primitives (non-rolling) */
  private drawStaticShellback(x: number, y: number, scale: number, alpha: number, dir: number): void {
    const gfx = this.add.graphics().setPosition(x, y).setScale(scale).setAlpha(alpha).setDepth(1);
    const w = 45; // ENEMY_CONFIG.shellback.width
    const h = 35; // ENEMY_CONFIG.shellback.height
    const color = 0x696969;

    // Shell (back)
    gfx.fillStyle(color - 0x222222);
    gfx.fillEllipse(-w * 0.1 * dir, 0, w * 0.9, h);
    // Shell pattern
    gfx.lineStyle(2, color);
    for (let i = -2; i <= 2; i++) {
      gfx.beginPath();
      gfx.arc(-w * 0.1 * dir, 0, h * 0.3 + Math.abs(i) * 5, -Math.PI / 2, Math.PI / 2);
      gfx.strokePath();
    }
    // Head
    gfx.fillStyle(color + 0x111111);
    gfx.fillEllipse(w * 0.3 * dir, 0, w * 0.35, h * 0.5);
    // Eye
    gfx.fillStyle(0x000000);
    gfx.fillCircle(w * 0.35 * dir, -h * 0.1, 4);
    // Legs
    gfx.fillStyle(color + 0x111111);
    gfx.fillRect(-w * 0.3, h * 0.3, 10, 8);
    gfx.fillRect(w * 0.1, h * 0.3, 10, 8);
  }

  private createMenuButton(
    x: number, y: number, label: string, fontSize: string,
    w: number, h: number, color: number, hoverColor: number,
    primary: boolean, onClick: () => void
  ): void {
    const gfx = this.add.graphics();
    const drawBtn = (c: number, alpha: number) => {
      gfx.clear();
      gfx.fillStyle(c, alpha);
      gfx.fillRoundedRect(x, y - h / 2, w, h, 6);
      // Left accent bar for primary button
      if (primary) {
        gfx.fillStyle(0x8acc7a, 1.0);
        gfx.fillRect(x, y - h / 2 + 4, 3, h - 8);
      }
    };
    drawBtn(color, primary ? 0.8 : 0.5);

    const hitZone = this.add.zone(x + w / 2, y, w, h).setInteractive({ useHandCursor: true });

    const textColor = primary ? '#ffffff' : '#dddddd';
    const txt = this.add.text(x + (primary ? 24 : 20), y, label, {
      fontSize,
      fontFamily: 'Arial Black, sans-serif',
      color: textColor,
    }).setOrigin(0, 0.5);

    if (!MobileDetector.isTouchDevice) {
      hitZone.on('pointerover', () => {
        drawBtn(hoverColor, primary ? 0.95 : 0.65);
        txt.setColor('#ffffff');
      });
      hitZone.on('pointerout', () => {
        drawBtn(color, primary ? 0.8 : 0.5);
        txt.setColor(textColor);
      });
    }
    hitZone.on('pointerdown', onClick);
  }

  private createRoundedButton(
    x: number, y: number, w: number, h: number, radius: number,
    color: number, hoverColor: number,
    label: string, fontSize: string,
    onClick: () => void
  ): void {
    const gfx = this.add.graphics();
    const drawBtn = (c: number) => {
      gfx.clear();
      gfx.fillStyle(c);
      gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, radius);
    };
    drawBtn(color);

    const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontSize,
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    if (!MobileDetector.isTouchDevice) {
      hitZone.on('pointerover', () => drawBtn(hoverColor));
      hitZone.on('pointerout', () => drawBtn(color));
    }
    hitZone.on('pointerdown', onClick);
  }
}
