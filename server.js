const express = require('express');
var app = express();
app.use(express.json());
const api = require('./api');
const path = require('path');
const fs = require('fs')
const os = require('os');
var serverVar;
var globalCitrusCollection;

function startServer() {
    serverVar = app.listen(8082, () => console.log(`Express server listening on port 8082`));
}
function killServer() {
    console.log("Stopping server")
    req.session.destroy();
    serverVar.close();
}
app.get('/', function(req, res){
    res.send('Server is ready!');
});
app.get('/test', function(req, res){
    console.log("we received the test")
    res.send('Test received');
})
app.post('/collectCitrusFiles', async function(req, res){
    //console.log(req.session.citrusJSONCollection)
    console.log(req.body.refresh == true)
    if (req.body.refresh == true) {
        var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
        var citrusJSONCollection = await api.collectCitrusFiles(settingsJSON['pathToReplays'], '.cit');
        globalCitrusCollection = citrusJSONCollection;
    } else {
        if (!globalCitrusCollection) {
            var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
            var citrusJSONCollection = await api.collectCitrusFiles(settingsJSON['pathToReplays'], '.cit');
            //console.log(JSON.parse(citrusJSONCollection[0]))
            //console.log(citrusJSONCollection);
            globalCitrusCollection = citrusJSONCollection;
        }
    }
    res.send(globalCitrusCollection);
})
app.post('/startPlayback', async function(req,res){
    var result = await api.startPlayback(req.body.fileName);
    res.send(result);
})
app.get('/getSettingsJSON', function(req, res){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    res.send(settingsJSON);
})
app.post('/updateReplaysFolder', function(req, res){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    console.log(req.body);
    var updatedReplayFolder = req.body.replaysPath;
    console.log(updatedReplayFolder)
    settingsJSON['pathToReplays'] = updatedReplayFolder;
    fs.writeFile('settings.json', JSON.stringify(settingsJSON), function(err){
        if (err) {
            console.log(err)
        }
    });
    res.end();
})
app.post('/updateISOFile', function(req, res){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    var updatedISOFile = req.body.isoFile;
    console.log(updatedISOFile)
    settingsJSON['pathToISO'] = updatedISOFile;
    fs.writeFile('settings.json', JSON.stringify(settingsJSON), async function(err){
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
app.post('/updateDolphinFile', function(req, res){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    console.log(req.body);
    var updatedDolphinFile = req.body.dolphinFile;
    console.log(updatedDolphinFile)
    settingsJSON['pathToDolphin'] = updatedDolphinFile;
    fs.writeFile('settings.json', JSON.stringify(settingsJSON), function(err){
        if (err) {
            console.log(err)
        }
    });
    res.end();
})
app.get('/getMatchSummary', async function(req, res){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    var singularJSONCollection = [];
    await api.getCitrusFileJSON(settingsJSON['pathToReplays'], req.query.fileName, singularJSONCollection);
    console.log(singularJSONCollection[0]);
    res.send(singularJSONCollection[0]);
})
module.exports.startServer = startServer;
module.exports.killServer = killServer;