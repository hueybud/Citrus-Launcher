const path = require('path');

var remoteProcessArgs = []
// C:\Users\Brian\AppData\Roaming\citruslauncher
var userDataPath = "";

module.exports.setProcessArgs = function(processParams) {
    remoteProcessArgs = processParams;
}

module.exports.setUserDataPath = function(userDataParams) {
    userDataPath = userDataParams;
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
        const settingsPath = path.join(userDataPath, "errors.json");
        return settingsPath;
    }
}

module.exports.getProcessArgs = function() {
    return remoteProcessArgs;
}

module.exports.isDev = isDev;