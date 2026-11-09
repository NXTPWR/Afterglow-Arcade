const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const appName = 'Afterglow Arcade Club';
app.setName(appName);
if (process.env.AFTERGLOW_QA === '1') app.disableHardwareAcceleration();
app.setAppUserModelId('com.afterglow.arcade');
app.setPath('userData', process.env.AFTERGLOW_USER_DATA_DIR || path.join(app.getPath('appData'), appName));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow;
  const createWindow = () => {
    mainWindow = new BrowserWindow({
      title: appName,
      width: 1360,
      height: 900,
      minWidth: 900,
      minHeight: 650,
      backgroundColor: '#090b12',
      autoHideMenuBar: true,
      icon: path.join(__dirname, '../assets/icon.ico'),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
    if (process.env.AFTERGLOW_QA === '1') mainWindow.webContents.once('did-finish-load', () => require(path.join(__dirname, '../tests/electron-smoke.cjs'))({ app, window: mainWindow }));
    mainWindow.on('closed', () => { mainWindow = null; });
  };

  app.whenReady().then(createWindow);
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
