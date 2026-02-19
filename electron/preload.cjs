try {
  const { contextBridge, ipcRenderer } = require('electron');

  let appVersion = '0.0.0';
  try { appVersion = require('../package.json').version; } catch { /* ignore */ }

  contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    version: appVersion,
    quit: () => ipcRenderer.send('quit-app'),
    setFullscreen: (flag) => ipcRenderer.send('set-fullscreen', flag),
    isFullscreen: () => ipcRenderer.invoke('get-fullscreen'),
  });
} catch (err) {
  console.error('Preload script failed:', err);
}
