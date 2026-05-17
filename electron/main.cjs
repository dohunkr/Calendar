const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let isQuitting = false;
let alarmWindows = [];

// Ensure icon exists
const iconPath = path.join(__dirname, 'icon.png');
if (!fs.existsSync(iconPath)) {
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AYFEgQxM5DqOAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAdElEQVRYw+2WwQoAIAhD2///6B0EQUTtEnqpBy8iM6eKqgA6Zk93h9gLsBdgL8BegL0AewH2AmxdgPvk8wN8wBvY14v0WAGu919LwPX+6wm43n89Adf7ryfgev/1BFzvv56A6/3XE3C9/3oCrvdfT8D1/us/8APu2S5v3W9y/AAAAABJRU5ErkJggg==';
  try {
    fs.writeFileSync(iconPath, Buffer.from(base64Data, 'base64'));
  } catch (e) {
    // Fail silent
  }
}

// Get loaded app icon helper
function getAppIcon() {
  try {
    if (fs.existsSync(iconPath)) {
      const img = nativeImage.createFromPath(iconPath);
      if (!img.isEmpty()) return img;
    }
  } catch (e) {}
  return nativeImage.createEmpty();
}

// Set up startup registration
function configureStartup(enable) {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: ['--hidden']
    });
  }
}

// Register by default on first launch
configureStartup(true);

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'DohunCalender',
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Hide default menu bar
  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Prevent app closing completely on close click, instead minimize to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  let trayIcon = getAppIcon();
  if (trayIcon.isEmpty()) {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'DohunCalender 열기', click: () => mainWindow.show() },
    { 
      label: '부팅 시 자동 시작', 
      type: 'checkbox', 
      checked: process.platform === 'win32' ? app.getLoginItemSettings().openAtLogin : false,
      click: (item) => {
        configureStartup(item.checked);
      }
    },
    { type: 'separator' },
    { 
      label: '완전 종료', 
      click: () => {
        isQuitting = true;
        alarmWindows.forEach(w => {
          if (!w.isDestroyed()) w.close();
        });
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('DohunCalender');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

// Alarm IPC listener
ipcMain.on('show-alarm', (event, alarmData) => {
  const { title, time, description } = alarmData;
  
  const alarmWin = new BrowserWindow({
    width: 440,
    height: 290,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const queryParams = `?alarm=true&title=${encodeURIComponent(title)}&time=${encodeURIComponent(time)}&desc=${encodeURIComponent(description || '')}`;
  
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    alarmWin.loadURL(`http://localhost:5173/${queryParams}`);
  } else {
    alarmWin.loadFile(path.join(__dirname, '../dist/index.html'), { query: { alarm: 'true', title, time, desc: description || '' } });
  }

  // Position at bottom right corner
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  alarmWin.setPosition(width - 460, height - 310);

  alarmWin.show();
  alarmWindows.push(alarmWin);
});

ipcMain.on('close-alarm-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
    alarmWindows = alarmWindows.filter(w => w !== win);
  }
});

// Snooze feature
ipcMain.on('snooze-alarm', (event, data) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
    alarmWindows = alarmWindows.filter(w => w !== win);
  }
  
  // Forward to main window to reschedule in 5 minutes
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('reschedule-snooze', data);
  }
});

app.whenReady().then(() => {
  createMainWindow();
  createTray();

  const isHidden = process.argv.includes('--hidden');
  if (isHidden) {
    mainWindow.hide();
  } else {
    mainWindow.show();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
