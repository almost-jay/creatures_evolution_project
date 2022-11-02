"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const url = require("url");
let mainWindow;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({ width: 1280, height: 720, show: false });
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
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
//# sourceMappingURL=buildApp.js.map