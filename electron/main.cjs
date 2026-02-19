const { app, BrowserWindow, globalShortcut, Menu, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const GAME_URL = 'https://playquillstorm.com/play';
const isDev = !app.isPackaged;

let mainWindow = null;
let updateWindow = null;

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    resizable: false,
    show: false,
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
  });

  updateWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
    <body style="margin:0;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#1a1a2e;color:#ccc;font-family:system-ui,sans-serif;">
      <h2 style="margin:0 0 16px;color:#e8d5a3;font-size:20px;">Updating Quillstorm...</h2>
      <div style="width:260px;height:8px;background:#2a2a4a;border-radius:4px;overflow:hidden;">
        <div id="bar" style="width:0%;height:100%;background:#6a8a5a;border-radius:4px;transition:width 0.3s;"></div>
      </div>
      <p id="status" style="margin:12px 0 0;font-size:13px;color:#888;">Checking for updates...</p>
    </body>
    </html>
  `);

  updateWindow.once('ready-to-show', () => updateWindow.show());
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Remove the application menu
  Menu.setApplicationMenu(null);

  mainWindow.loadURL(isDev ? 'http://localhost:3003' : GAME_URL);

  // F11 toggles fullscreen
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  // Make game container fill the entire screen (override browser CSS)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      #game-container {
        width: 100vw !important;
        height: 100vh !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        aspect-ratio: auto !important;
      }
    `);
  });

  // Disable right-click context menu
  mainWindow.webContents.on('context-menu', (e) => e.preventDefault());

  // Block browser shortcuts in production
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Block Ctrl+R, Ctrl+Shift+I, Ctrl+W
      if (input.control && (input.key === 'r' || input.key === 'w')) {
        event.preventDefault();
      }
      if (input.control && input.shift && input.key === 'I') {
        event.preventDefault();
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Auto-updater setup
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', () => {
    if (updateWindow) {
      updateWindow.webContents.executeJavaScript(
        `document.getElementById('status').textContent = 'Downloading update...'`
      );
    }
    autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-not-available', () => {
    if (updateWindow) {
      updateWindow.close();
      updateWindow = null;
    }
    createMainWindow();
  });

  autoUpdater.on('download-progress', (progress) => {
    if (updateWindow) {
      const percent = Math.round(progress.percent);
      updateWindow.webContents.executeJavaScript(`
        document.getElementById('bar').style.width = '${percent}%';
        document.getElementById('status').textContent = 'Downloading... ${percent}%';
      `);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  autoUpdater.on('error', () => {
    // Update check failed (offline, etc.) — proceed to game anyway
    if (updateWindow) {
      updateWindow.close();
      updateWindow = null;
    }
    createMainWindow();
  });
}

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.on('set-fullscreen', (_, flag) => {
  if (mainWindow) mainWindow.setFullScreen(flag);
});

ipcMain.handle('get-fullscreen', () => {
  return mainWindow?.isFullScreen() ?? true;
});

app.whenReady().then(() => {
  if (isDev) {
    // Skip auto-updater in dev mode
    createMainWindow();
  } else {
    createUpdateWindow();
    setupAutoUpdater();
    autoUpdater.checkForUpdates();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
