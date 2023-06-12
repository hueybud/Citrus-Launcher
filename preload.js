const {contextBridge, ipcRenderer} = require("electron")

contextBridge.exposeInMainWorld(
    "api", {
        showDialog(dialogArgs){
          console.log(`Inside preload, dialogargs are: ${JSON.stringify(dialogArgs)}`)
          ipcRenderer.invoke("showDialog", dialogArgs)
        }
    }
);