const express = require('express');
var app = express();
app.use(express.json({limit: '3mb'}));
const api = require('./api');
const path = require('path');
const fs = require('fs')
const os = require('os');
const ini = require('ini')
const { getUserConfigPath, getSettingsPath, getDolphinINIPaths } = require('./processWrapper');
var serverVar;
var globalCitrusNames;
var globalCitrusCollection;
// initialize the row and page filters to 25 and 1 respectively
var globalRowParam = 25;
var globalPageParam = 1;
var citrusDolphinUpdateStats = {status: "INACTIVE", currentBytes: 0, totalBytes: 0}

function startServer() {
    return new Promise(function(resolve, reject){
        serverVar = app.listen(8082);
        serverVar.on('listening', function(){
            console.log(`Express server listening on port 8082`);
            resolve("server created")
        })
        serverVar.on('error', function(err){
            if (err.code == "EADDRINUSE") {
                console.log("port is already in use");
                resolve("server port error")
            } else {
                resolve("server error listening")
            }
        })
    })
}
function killServer() {
    console.log("Stopping server")
    serverVar.close();
}
app.get('/', function(req, res){
    res.send('Server is ready!');
});
app.get('/test', function(req, res){
    console.log("we received the test")
    res.send('Test received');
})
app.post('/collectCitrusNames', async function(req, res){
    // first value in returned array is telling the client if we can use the same htmlCollectionArr as last time
    if (req.body.refresh == true || (globalRowParam != req.body.rowParam) || (globalPageParam != req.body.pageParam)) {
        var settingsJSON = await api.readSettingsFile();
        var citrusNamesList = await api.collectCitrusNames(settingsJSON['pathToReplays'], '.cit')
        globalCitrusNames = citrusNamesList;
        globalRowParam = req.body.rowParam;
        globalPageParam = req.body.pageParam;
        res.send([false, globalCitrusNames]);
    } else {
        if (!globalCitrusNames) {
            var settingsJSON = await api.readSettingsFile();
            var citrusNamesList = await api.collectCitrusNames(settingsJSON['pathToReplays'], '.cit')
            globalCitrusNames = citrusNamesList;
            globalRowParam = req.body.rowParam;
            globalPageParam = req.body.pageParam;
            res.send([false, globalCitrusNames]);
        } else {
            res.send([true, globalCitrusNames]);
        }
    }
})
app.post('/setReplaysHTMLCollectionString', function(req, res){
    globalCitrusCollection = req.body.collection
    res.end()
})
app.get('/getReplaysHTMLCollectionString', function(req, res){
    res.send(globalCitrusCollection)
})
app.post('/setRowParam', function(req, res){
    globalRowParam = req.body.rowParam
})
app.get('/getGlobalRowParam', function(req, res){
    res.send({"rowParam": globalRowParam || 5})
})
app.post('/setPageParam', function(req, res){
    globalPageParam = req.body.pageParam
})
app.get('/getGlobalPageParam', function(req, res){
    res.send({"pageParam": globalPageParam || 1})
})

app.post('/startPlayback', async function(req,res){
    var result = await api.startPlayback(req.body.fileName, req.body.onFileClick);
    res.send(result);
})

app.get('/getSettingsJSON', async function(req, res){
    var settingsJSON = await api.readSettingsFile();
    res.send(settingsJSON);
})

app.post('/updateReplaysFolder', async function(req, res){
    var settingsJSON = await api.readSettingsFile();
    console.log(req.body);
    var updatedReplayFolder = req.body.replaysPath;
    console.log(updatedReplayFolder)
    settingsJSON['pathToReplays'] = updatedReplayFolder;
    fs.writeFile(getSettingsPath(), JSON.stringify(settingsJSON), function(err){
        if (err) {
            console.log(err)
        }
    });
    globalCitrusNames = undefined;
    //globalCitrusCollection = undefined;
    res.end();
})

app.post('/updateISOFile', async function(req, res){
    var settingsJSON = await api.readSettingsFile();
    var updatedISOFile = req.body.isoFile;
    console.log(updatedISOFile)
    settingsJSON['pathToISO'] = updatedISOFile;
    fs.writeFile(getSettingsPath(), JSON.stringify(settingsJSON), async function(err){
        if (err) {
            console.log(err)
        } else {
            // now we need to update the md5 hash of the iso
            var ourHash = await api.getMD5ISO(updatedISOFile);
            settingsJSON['isoHash'] = ourHash;
            fs.writeFile('settings.json', JSON.stringify(settingsJSON), function(err){
                if (err) {
                    console.log(err)
                }
            })
        }
    });
    res.end();
})

app.post('/updateDolphinFile', async function(req, res){
    var settingsJSON = await api.readSettingsFile();
    console.log(req.body);
    var updatedDolphinFile = req.body.dolphinFile;
    console.log(updatedDolphinFile)
    settingsJSON['pathToDolphin'] = updatedDolphinFile;
    fs.writeFile(getSettingsPath(), JSON.stringify(settingsJSON), function(err){
        if (err) {
            console.log(err)
        }
    });
    res.end();
})

app.post('/updateUserConfig', async function(req, res){
    await api.createUserJSON();
    // req.body.userConfig should be a JSON that looks like:
    /*
    {
        discordId: 123,
        jwt: 'ey...'
        discordGlobalName: 'PoolBoi'
    }
    */
    fs.writeFile(getUserConfigPath(), JSON.stringify(req.body.userConfig), function(err){
        if (err) {
            console.log(err)
        }
    });
    console.log("Updated the user config file")
    res.end();
})

app.get('/getCurrentUser', async function(req, res){
    const {discordId, discordGlobalName, discordAvatar} = await api.readUserConfigFile();
    res.send({discordId, discordGlobalName, discordAvatar});
})

// not implemented yet
app.get('/logout', async function(req, res) {
    // we need to reset the user json to empty
    // so just delete it and remake it
    try {
        await api.createUserJSON();
        const data = {
            "discordId": "",
            "discordGlobalName": "",
            "discordAvatar": "",
            "jwt": ""
          }
        fs.writeFileSync(getUserConfigPath(), JSON.stringify(data));
        console.log(`Successfully logged user out`)
        res.send({error: undefined})
    } catch (err) {
        console.log(`Failed to log out the user: ${err}`)
        res.send({error: err})
    }
})

app.get('/getMatchSummary', async function(req, res){
    var settingsJSON = await api.readSettingsFile();
    var singularJSONCollection = [];
    await api.getCitrusFileJSON(settingsJSON['pathToReplays'], req.query.fileName, singularJSONCollection, req.query.onFileClick);
    res.send(singularJSONCollection[0]);
})

app.post('/setCitrusDolphinUpdateStats', function(req, res){
    citrusDolphinUpdateStats = {
        status: req.body.status,
        currentBytes: req.body.currentBytes ?? citrusDolphinUpdateStats.currentBytes,
        totalBytes: req.body.totalBytes ?? citrusDolphinUpdateStats.totalBytes,
        errorMessage: req.body.errorMessage ?? "Error"
    }
})

app.get('/getDolphinUpdateStats', function(req, res){
    res.send(citrusDolphinUpdateStats);
});

app.get('/openDolphin', async function(req, res){
    const result = await api.openDolphin();
    res.send(result);
})

app.get('/getAssumedReplaysFolderPath', async function(req, res){
    // we technically have to look for the ini at documents and app data
    // while both might exist, only one should have the field we want
    const paths = getDolphinINIPaths();
    let resultingPath = "";
    for (var i =0; i < paths.length; i++) {
        let config;
        console.log(`Searching at path: ${paths[i]}`)
        try {
            config = ini.parse(fs.readFileSync(paths[i], 'utf-8'));
        } catch (err) {
            console.log(`Failed to read dolphin ini config file at: ${paths[i]} due to ${err}`)
        }
        if (config && config['General'] && config['General']['CitrusReplaysPath'] && config['CitrusReplaysPath'] != "") {
            resultingPath = config['General']['CitrusReplaysPath'];
            break;
        }
    }
    res.send(resultingPath)
})

module.exports.startServer = startServer;
module.exports.killServer = killServer;