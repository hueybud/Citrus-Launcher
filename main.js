// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const os = require('os');
const expressApp = require('./server');
const fs = require('fs');
const { exec } = require('child_process');
const { default: axios } = require('axios');
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const { URLSearchParams } = require('url');
const setProcessArgs = require("./processWrapper").setProcessArgs;
const setUserDataPath = require("./processWrapper").setUserDataPath;
const createSettingsJSON = require("./api").createSettingsJSON;
const createErrorsJSON = require("./api").createErrorsJSON;
const installDolphin = require("./api").installDolphin;
const openDolphin = require("./api").openDolphin;
const https = require('https');
const { createUserJSON } = require('./api');
var mainWindow;

console.log(process.argv);
setProcessArgs(process.argv);
setUserDataPath(app.getPath("userData"))

ipcMain.handle("showDialog", async (event, ...args) => {
  console.log(`Dialog main: ${JSON.stringify(args)}`)
  if (args[0].dialogType == "general") {
    // add any callbacks here
    // every showMessageBox should have an object like this even if we don't provide a callback
    /**
     * {
          dialogType: "general",
          options: generalOptions,
          callback: {
            (optional) 0: name of function that corresponds to callbackMap
        }
    */
    const callbackMap = {
      "openDolphin": openDolphin
    };
    const result = await dialog.showMessageBox(null, args[0].options);
    console.log(result.response);
    if (result.response == 0) {
      // the original use case for this was to pass openDolphin to the 0 index (yes, open dolphin)
      if (args[0].callback['0']) {
        const callbackValue = args[0].callback['0'];
        console.log(`We are going to execute: ${callbackValue}`)
        callbackMap[callbackValue].call(this);
      }
    }
  }
  if (args[0].dialogType == "error") {
    dialog.showErrorBox(args[0].options.title, args[0].options.message);
  }
})

ipcMain.handle("login", async () => {
  authWindow();
})

class AppUpdater {
  constructor() {
    log.transports.file.level = "info";
    autoUpdater.on('checking-for-update', function() {
      console.log("checking for update")
    })
    autoUpdater.on('update-available', function(info) {
      console.log("update is available")
      console.log(info)
    });
    autoUpdater.on('update-not-available', function(info) {
      console.log("update is not available")
      console.log(info)
    });
    autoUpdater.on('update-downloaded', function(info) {
      console.log("update downloaded")
      console.log(info)
    });
    autoUpdater.on('error', function(err) {
      console.log("error fetching update")
      console.err(err);
    })
    autoUpdater.logger = log;
    autoUpdater.autoDownload = true;
    autoUpdater.checkForUpdatesAndNotify()
  }
}

function authWindow() {
  var authWindow = new BrowserWindow({
    width: 800, 
    height: 600, 
    show: false, 
    'node-integration': false,
    'web-security': false
  });
  // This is just an example url - follow the guide for whatever service you are using
  const DISCORD_HOST = "https://discord.com";
  const OAUTH_CLIENT_ID = "976164178203123732";
  const OAUTH_CLIENT_SECRET = "6DI96hoqna2WjJhUpuzNY1rM9Vrz2tv4";
  let redirection = DISCORD_HOST + "/api/oauth2/authorize?client_id=" + OAUTH_CLIENT_ID +
  "&redirect_uri=" + "&response_type=code" +
  "&scope=guilds.members.read%20identify%20guilds%20guilds.join";
  authWindow.loadURL(redirection);
  authWindow.show();
  // 'will-navigate' is an event emitted when the window.location changes
  // newUrl should contain the tokens you need
  authWindow.webContents.on('will-navigate', async function (event, newUrl) {
      console.log(newUrl);
      const code = newUrl.split("?code=")[1];
      console.log(code)
      // More complex code to handle tokens goes here
      const API_ENDPOINT = DISCORD_HOST + "/api/v10";
      const baseUrl = "http://localhost:3001"
      const data = {
          'client_id': OAUTH_CLIENT_ID,
          'client_secret': OAUTH_CLIENT_SECRET,
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': baseUrl
      };
      const headers = {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      };
      let oAuthToken;
      try {
        const oAuthResult = await axios.post(`${API_ENDPOINT}/oauth2/token`, new URLSearchParams(data), headers)
        oAuthToken = oAuthResult.data
        console.log(oAuthToken)
        // post to mariostrikers.gg server for them to validate us via bearer
      } catch (err) {
        console.log(err.code)
        return;
      }

      let jwtRequest;
      try {
        // we should only disabled if we are doing this in dev cuz in reality the mariostrikers.gg endpoint is signed
        jwtRequest = await axios.post(`https://localhost:3000/citrus/setupUser`, oAuthToken, {httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })})
        console.log(`Received userId and JWT from server: ${JSON.stringify(jwtRequest.data)}`)
      } catch (err) {
        console.log(err.message)
      }

      try {
        const userConfigData = {
          userConfig: {
            discordId: jwtRequest.data.discordId,
            discordGlobalName: jwtRequest.data.discordGlobalName,
            discordAvatar: jwtRequest.data.discordAvatar,
            jwt: jwtRequest.data.jwt,
          }
        }
        await axios.post(`http://localhost:8082/updateUserConfig`, userConfigData)
      } catch (err) {
        console.log(err)
      } finally {
        authWindow.close();
      }
      
  });

  authWindow.on('closed', function() {
      authWindow = null;
      console.log(`Reloading after logging in`)
      mainWindow.reload();
  });
}

const createWindow = () => {
  // Create the browser window.
  console.log(path.join(app.getAppPath(), 'preload.js'))
  mainWindow = new BrowserWindow({
    minWidth: 1100,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'assets', 'images', 'citrus_32x32.png'),
    title: `Citrus Launcher ${app.getVersion()}`,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(app.getAppPath(), "preload.js")
    }
  })

  if (process.argv[3] == '--dev') {
    if (process.argv[2] == 'wesArg') {
      mainWindow.loadFile("matchSummary.html", {query: {fileName: 'Game_April_27_2023_23_10_53.cit', autoStartReplay: true, onFileClick: false}})
    } else {
      // and load the index.html of the app.
      mainWindow.loadFile('index.html')
    }
  }
   else {
    if (fs.existsSync(process.argv[1]) && path.extname(process.argv[1]) == ".cit") {
      mainWindow.loadFile("matchSummary.html", {query: {fileName: process.argv[1], autoStartReplay: true, onFileClick: true}})
    } else {
      mainWindow.loadFile('index.html')
    }
  }

  //mainWindow.loadFile('index.html')
    // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  mainWindow.maximize();
  mainWindow.show();
  new AppUpdater();
  
  mainWindow.on('closed', function(e){
    console.log("closing our window")
    console.log("closing electron")
    expressApp.killServer();
    app.quit()
  })
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Print out data received from the second instance.
    console.log(commandLine)

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (fs.existsSync(commandLine[2]) && path.extname(commandLine[2]) == ".cit") {
        mainWindow.loadFile("matchSummary.html", {query: {fileName: commandLine[2], autoStartReplay: true, onFileClick: true}})
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // try to start a server
    let serverResult = await expressApp.startServer();
    if (serverResult != "server created") {
      dialog.showErrorBox("Port Error", "Error when trying to listen to port 8082. Please close any applications using it. Citrus Launcher will close after you accept this message.")
      app.quit();
    } else {
      console.log(`version: ${app.getVersion()}`)
      await Promise.all([createSettingsJSON(), createErrorsJSON(), createUserJSON()])
      createWindow();
      installDolphin();
    }
  })
}

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
  
function doDialog() {
  dialog.showErrorBox(`Lol you're dumb`)
}

module.exports.doDialog = doDialog;