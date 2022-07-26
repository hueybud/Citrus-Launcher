// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const os = require('os');
const expressApp = require('./server');
const fs = require('fs');
const { exec } = require('child_process');
const { default: axios } = require('axios');
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
  checkVersions()
  
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

async function checkVersions() {
  var localVersion = await readLocalVersion();
  var remoteVersion = await getRemoteVersion();
  console.log(`Local version: ${localVersion}`)
  console.log(`Remote version: ${remoteVersion}`)
  if (localVersion != remoteVersion) {
    promptUpdate(localVersion, remoteVersion)
  }
}

function readLocalVersion() {
  return new Promise(function(resolve, reject){
    fs.readFile('version.txt', 'utf-8', function(err, data){
      if (err) {
        console.log(err)
        localVersion = "Failed to read local version"
      } else {
        localVersion = data.toString();
      }
      resolve(localVersion)
    })
  })
}

function getRemoteVersion() {
  return new Promise(function(resolve, reject){
    axios.get('https://api.github.com/repos/hueybud/Citrus-Launcher/releases/latest').then(response => {
      resolve(response.data['tag_name'])
    }).catch(err => {
      console.log(err)
      resolve("Failed to read remote version")
    })
  })
}

function promptUpdate(localVersion, remoteVersion) {
   options = {
    type: 'info',
    icon: './Citrus_256x256.ico',
    buttons: ['Cancel', 'Yes, please', 'No, thanks'],
    defaultId: 2,
    title: 'Citrus Launcher Update',
    message: 'There is a new version of Citrus Launcher.',
    detail: `Your version: ${localVersion}\nCurrent version: ${remoteVersion}\n\nTo prevent unwanted errors, it is recommended that you update to the latest version. Would you like to download the latest version?`
  };
  
  dialog.showMessageBox(null, options).then(result => {
    if (result.response == 1) {
      // Yes
      var targetURL = 'https://github.com/hueybud/Citrus-Launcher/releases/latest'
      var ourCommand = `start microsoft-edge:${targetURL}`;
      exec(ourCommand)
    }
  })
  
}

function createSettingsJSON(filename) {
  return new Promise(function(resolve, reject){
    fs.open(filename,'r',function(err, fd){
      if (err) {
        var data = {
          "pathToISO": "",
          "isoHash": "",
          "pathToDolphin": "",
          "pathToReplays": ""
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
