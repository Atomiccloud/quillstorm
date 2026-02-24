import Phaser from 'phaser';
import { inject } from '@vercel/analytics';
import { GAME_CONFIG } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PauseScene } from './scenes/PauseScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { ShopScene } from './scenes/ShopScene';
import { LoginScene } from './scenes/LoginScene';
import { BossRewardScene } from './scenes/BossRewardScene';

// Render text at native display resolution (fixes blur from canvas upscaling)
const _origText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  x: number, y: number, text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const obj = _origText.call(this, x, y, text, style);
  const canvasScale = Math.min(
    window.innerWidth / GAME_CONFIG.width,
    window.innerHeight / GAME_CONFIG.height
  );
  obj.setResolution(Math.min(Math.ceil(canvasScale * window.devicePixelRatio), 3));
  return obj;
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: GAME_CONFIG.backgroundColor,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false, // Set to true to see hitboxes
    },
  },
  scene: [BootScene, MenuScene, GameScene, UpgradeScene, BossRewardScene, GameOverScene, PauseScene, LeaderboardScene, ShopScene, LoginScene],
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
  },
  input: {
    activePointers: 3, // Enable multi-touch (joystick + aim + extra)
  },
};

new Phaser.Game(config);

// Attempt landscape lock on mobile
if ((screen.orientation as any)?.lock) {
  (screen.orientation as any).lock('landscape').catch(() => {});
}

inject();
