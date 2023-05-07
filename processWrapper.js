const path = require('path');

var remoteProcessArgs = []

module.exports.setProcessArgs = function(processParams) {
    remoteProcessArgs = processParams;
}

function isDev() {
    return remoteProcessArgs[3] == "--dev"
}

module.exports.getSettingsPath = function() {
    if (isDev()) {
        return "settings.json"
    } else {
        const executableDirectory = remoteProcessArgs[0];
        const settingsPath = path.join(path.dirname(executableDirectory), "settings.json");
        console.log("settings path: " + settingsPath);
        return settingsPath;
    }
}

module.exports.getProcessArgs = function() {
    return remoteProcessArgs;
}

module.exports.isDev = isDev;