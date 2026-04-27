const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        frame: true,
        icon: path.join(__dirname, 'assets/icon.ico')
    });

    mainWindow.loadFile('public/splash.html');

    // Server başlat
    serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    // Server hazır olduğunda ana sayfayı yükle
    const tryLoad = (attempt = 0) => {
        const http = require('http');
        http.get('http://localhost:3456', (res) => {
            mainWindow.loadURL('http://localhost:3456');
        }).on('error', () => {
            if (attempt < 20) {
                setTimeout(() => tryLoad(attempt + 1), 300);
            } else {
                mainWindow.loadURL('http://localhost:3456');
            }
        });
    };
    setTimeout(() => tryLoad(), 500);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
