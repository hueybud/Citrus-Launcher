// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const os = require('os');
const expressApp = require('./server');
const fs = require('fs');
var mainWindow;



const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 1100,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'assets', 'images', 'citrus_32x32.png')
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
    // Open the DevTools.
  //mainWindow.webContents.openDevTools()
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
app.whenReady().then(async () => {
  let serverResult = await expressApp.startServer();
  if (serverResult != "server created") {
    dialog.showErrorBox("Port Error", "Error when trying to listen to port 8082. Please close any applications using it. Citrus Launcher will close after you accept this message.")
    app.quit();
  } else {
    await createSettingsJSON('settings.json')
    createWindow()
  
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  }
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
  return new Promise(function(resolve, reject){
    fs.open(filename,'r',function(err, fd){
      if (err) {
        var data = {
          "pathToISO": "",
          "isoHash": "",
          "pathToDolphin": "",
          "pathToReplays": path.join(os.homedir(), 'Documents', 'Citrus Replays')
        }
        fs.writeFile(filename, JSON.stringify(data), function(err) {
            if(err) {
                console.log(err);
                resolve("done")
            }
            console.log("The settings file was created");
            resolve("done")
        });
      } else {
        console.log("The settings file already exists");
        resolve("done")
      }
    });
  })
}
