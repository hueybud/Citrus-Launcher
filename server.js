const express = require('express');
var app = express();
app.use(express.json());
const api = require('./api');
const path = require('path');
const fs = require('fs')
const os = require('os');
var serverVar;

function startServer() {
    serverVar = app.listen(8082, () => console.log(`Express server listening on port 8082`));
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
app.get('/collectCitrusFiles', async function(req, res){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    var citrusJSONCollection = await api.collectCitrusFiles(settingsJSON['pathToReplays'], '.cit');
    //console.log(JSON.parse(citrusJSONCollection[0]))
    console.log(citrusJSONCollection);
    res.send(citrusJSONCollection);
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
    console.log(req.body);
    var updatedISOFile = req.body.isoFile;
    console.log(updatedISOFile)
    settingsJSON['pathToISO'] = updatedISOFile;
    fs.writeFile('settings.json', JSON.stringify(settingsJSON), function(err){
        if (err) {
            console.log(err)
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
module.exports.startServer = startServer;
module.exports.killServer = killServer;