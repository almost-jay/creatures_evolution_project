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
	//mainWindow.webContents.openDevTools();
	mainWindow.show();
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
	// let quit_button = document.getElementById("quit_button") as HTMLButtonElement;
	// if (quit_button != null) {
	// 	quit_button.addEventListener("click", event => {
	// 		console.log(Electron);
	// 	});
	// }
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