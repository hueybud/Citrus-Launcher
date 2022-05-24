// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')
const os = require('os');
const expressApp = require('./server');
const fs = require('fs');
var mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'assets', 'citrus logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  settingsWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    show: false
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
    // Open the DevTools.
  mainWindow.webContents.openDevTools()
  settingsWindow.loadFile('settings.html');
  mainWindow.maximize();
  mainWindow.show();
  
  mainWindow.on('closed', function(e){
    console.log("closing our window")
    console.log("closing electron")
    expressApp.killServer();
    app.quit()
  })




}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  createSettingsJSON('settings.json')

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  expressApp.startServer();
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log("closing electron")
    expressApp.killServer();
    app.quit()
  }
})

function createSettingsJSON(filename) {
  fs.open(filename,'r',function(err, fd){
    if (err) {
      var data = {
        "pathToISO": "",
        "pathToDolphin": "",
        "pathToReplays": path.join(os.homedir(), 'Documents', 'Citrus Replays')
      }
      fs.writeFile(filename, JSON.stringify(data), function(err) {
          if(err) {
              console.log(err);
          }
          console.log("The file was saved!");
      });
    } else {
      console.log("The file exists!");
    }
  });
}
