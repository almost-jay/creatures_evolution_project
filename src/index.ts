const electron = require('electron');
const { app, BrowserWindow } = electron;

export let mainWindow: Electron.BrowserWindow | null;
if (require('electron-squirrel-startup')) app.quit();
function createWindow() {

	mainWindow = new BrowserWindow({ 
		width: 1280, 
		height: 720,
		show: false,
		icon:'./assets/favicon.ico',
		webPreferences: {
			webSecurity: false,
			nodeIntegration: true,
			contextIsolation: false
		}
	});
	mainWindow.loadFile(__dirname + "../../index.html");
	mainWindow.maximize();
	//mainWindow.webContents.openDevTools();
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