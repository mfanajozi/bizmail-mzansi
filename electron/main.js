const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow = null;

console.log('Starting BizMail Pro...');
console.log('App path:', app.getAppPath());
console.log('Is packaged:', app.isPackaged);

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    title: 'BizMail Pro'
  });

  const distPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading:', distPath);
  
  mainWindow.loadFile(distPath).then(() => {
    console.log('Loaded successfully');
  }).catch(err => {
    console.log('Load error:', err.message);
    mainWindow.loadURL('data:text/html,<h1>BizMail Pro</h1><p>Loaded from fallback</p>');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  console.log('Window created');
}

app.whenReady().then(() => {
  console.log('App.whenReady');
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});