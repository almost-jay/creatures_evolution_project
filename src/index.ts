const electron = require('electron');
const { app, BrowserWindow } = electron;

export var mainWindow: Electron.BrowserWindow | null;

if (require('electron-squirrel-startup')) app.quit();

function createWindow() { //creates a new window! using electron!
	mainWindow = new BrowserWindow({ 
		width: 1280, 
		height: 720,
		show: false,
		icon:'./assets/favicon.ico',
		fullscreen: true,
		fullscreenable: true,
		webPreferences: {
			webSecurity: false,
			nodeIntegration: true,
			contextIsolation: false
		}
	});
	mainWindow.loadFile(__dirname + "../../index.html");
	mainWindow.maximize();
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