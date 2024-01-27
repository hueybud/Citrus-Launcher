const path = require('path');
const os = require("os");

var remoteProcessArgs = []
// C:\Users\Brian\AppData\Roaming\citruslauncher
var userDataPath = "";
// C:\Users\Brian\AppData\Roaming
var appDataPath = "";

module.exports.setProcessArgs = function(processParams) {
    remoteProcessArgs = processParams;
}

module.exports.setUserDataPath = function(userDataParams) {
    userDataPath = userDataParams;
}

module.exports.setAppDataPath = function(appDataParams) {
    appDataPath = appDataParams;
}

function isDev() {
    return remoteProcessArgs[3] == "--dev"
}

module.exports.getDolphinFolderPath = function() {
    if (isDev()) {
        return "./dolphin"
    } else {
        return path.join(userDataPath, "dolphin")
    }
}

module.exports.getSettingsPath = function() {
    if (isDev()) {
        return "settings.json"
    } else {
        const settingsPath = path.join(userDataPath, "settings.json");
        console.log("settings path: " + settingsPath);
        return settingsPath;
    }
}

module.exports.getErrorsPath = function() {
    if (isDev()) {
        return "errors.json"
    } else {
        const errorsPath = path.join(userDataPath, "errors.json");
        return errorsPath;
    }
}

module.exports.getUserConfigPath = function() {
    if (isDev()) {
        return "user.json"
    } else {
        const userConfigPath = path.join(userDataPath, "user.json");
        return userConfigPath;
    }
}

module.exports.getCitrusWebBaseEndpoint = function() {
    //return "https://api.mariostrikers.gg/citrus"
    if (isDev()) {
        return "https://localhost:3000/citrus"
    } else {
        return "http://23.22.39.40:8080/citrus"
    }
}

module.exports.getDolphinINIPaths = function() {
    const paths = [
        path.join(os.homedir(), 'Documents', 'Dolphin Emulator', 'Config', 'Dolphin.ini'),
        path.join(appDataPath, 'Dolphin Emulator', 'Config', 'Dolphin.ini')
    ]
    return paths;
}

module.exports.getProcessArgs = function() {
    return remoteProcessArgs;
}

module.exports.isDev = isDev;