import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as url from 'url';

let mainWindow: Electron.BrowserWindow | null;

function createWindow() {

    mainWindow = new BrowserWindow({ width: 1280, height: 720, show: false });
	mainWindow.maximize();
    mainWindow.loadURL(url.format({
        pathname: ("index.html"),
        protocol: 'file:',
        slashes: true
    }));
	
	mainWindow.show();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});