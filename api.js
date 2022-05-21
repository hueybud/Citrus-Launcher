const fs = require('fs');
const unzipper = require('unzipper');
const etl = require('etl');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

async function collectCitrusFiles(citrusReplaysPath, extension) {
    let listOfCitrusFiles;
    try {
      listOfCitrusFiles = fs.readdirSync(citrusReplaysPath);
    } catch (error) {
      return error.code
    }
    listOfCitrusFiles = listOfCitrusFiles.filter(file => file.match(new RegExp(`.*\.(${extension})$`, 'ig')));
    var citrusJSONCollection = [];
    for (var i = 0; i < listOfCitrusFiles.length; i++) {
        // pass citrusJSONCollection by reference
        var result = await getCitrusFileJSON(citrusReplaysPath, listOfCitrusFiles[i], citrusJSONCollection)
        if (result == "done but no json found") {
            // create HTMl banner element of blanks
        } else {
            // create HTML banner based off of basic JSON info (time, chars, port, score)
        }
    }
    // we need to get the JSON into a readable format. right now it has missing quotes and unnecessary commas!
    //console.log(citrusJSONCollection[0]);
    return citrusJSONCollection;
    //return mockedCollectionJSON;
}

function getCitrusFileJSON(citrusReplaysPath, citrusFile, citrusJSONCollection) {
    const expectedAmountOfFiles = 3;
    var seenFiles = 0;
    return new Promise(function(resolve, reject){
        fs.createReadStream(path.join(citrusReplaysPath, citrusFile))
        .pipe(unzipper.Parse())
        .pipe(etl.map(async entry => {
            seenFiles++;
            if (entry.path == "output.json") {
                const content = await entry.buffer();
                //console.log(content.toString('utf-8'));
                citrusJSONCollection.push(JSON.parse(content.toString('utf-8')));
                resolve("done");
            }
            else {
                entry.autodrain();
            }
            // resolve to keep the code going but let us know no json was found
            if (seenFiles == expectedAmountOfFiles) {
                resolve("done but no json found")
            }
        }))
    })
}

function startPlayback(fileName){
  return new Promise(function(resolve, reject){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    for (elem in settingsJSON) {
      if (settingsJSON[elem] == "") {
        resolve(settingsJSONPropsToErrorNames(elem));
        return;
      }
    }
    var combinedFileName = '"' + path.join(settingsJSON['pathToReplays'], fileName) + '"';
    var pathToDolphin = '"' + settingsJSON['pathToDolphin'] + '"';
    var pathToISO = '"' + settingsJSON['pathToISO'] + '"';
    pathToDolphin += " -m " + combinedFileName;
    pathToDolphin += " -e " + pathToISO;
    console.log(pathToDolphin);
    exec(pathToDolphin, [], (error, stdout, stderr) => {
      console.log(stdout);
    })
    resolve("Success")
  })
}

function settingsJSONPropsToErrorNames(propertyName) {
  switch (propertyName) {
    case "pathToISO":
      return "Please select a Super Mario Strikers ISO via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner."
    case "pathToDolphin":
      return "Please select the path to your Project Citrus Dolphin executable (.exe) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner."
    case "pathToReplays":
      return "Please select the folder that contains your desired Citrus Replay file(s) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner."
  }
}

module.exports.collectCitrusFiles = collectCitrusFiles;
module.exports.startPlayback = startPlayback;

var mockedCollectionJSON = [
    {
      "File Name": "Game_May_17_2022_14_35_37.cit",
      "Date": "May 17 2022 14:35:37",
      "Controller Port Info": {
        "Controller Port 0": 0,
        "Controller Port 1": 65535,
        "Controller Port 2": 65535,
        "Controller Port 3": 65535
      },
      "Left Side Captain ID": "6",
      "Left Side Sidekick ID": "3",
      "Right Side Captain ID": "3",
      "Right Side Sidekick ID": "0",
      "Score": "1-0",
      "Stadium ID": "1",
      "Left Side Match Stats": {
        "Goals": "1",
        "Shots": "1",
        "Hits": "0",
        "Steals": "0",
        "Super Strikes": "0",
        "Perfect Passes": "0"
      },
      "Right Side Match Stats": {
        "Goals": "0",
        "Shots": "0",
        "Hits": "0",
        "Steals": "0",
        "Super Strikes": "0",
        "Perfect Passes": "0"
      }
    },
    {
      "File Name": "Game_May_17_2022_14_36_21.cit",
      "Date": "May 17 2022 14:36:21",
      "Controller Port Info": {
        "Controller Port 0": 0,
        "Controller Port 1": 65535,
        "Controller Port 2": 65535,
        "Controller Port 3": 65535
      },
      "Left Side Captain ID": "6",
      "Left Side Sidekick ID": "3",
      "Right Side Captain ID": "3",
      "Right Side Sidekick ID": "0",
      "Score": "1-0",
      "Stadium ID": "1",
      "Left Side Match Stats": {
        "Goals": "1",
        "Shots": "1",
        "Hits": "0",
        "Steals": "0",
        "Super Strikes": "0",
        "Perfect Passes": "0"
      },
      "Right Side Match Stats": {
        "Goals": "0",
        "Shots": "0",
        "Hits": "0",
        "Steals": "0",
        "Super Strikes": "0",
        "Perfect Passes": "0"
      }
    },
    {
      "File Name": "Game_May_18_2022_09_18_47.cit",
      "Date": "May 18 2022 09:18:47",
      "Controller Port Info": {
        "Controller Port 0": 0,
        "Controller Port 1": 65535,
        "Controller Port 2": 65535,
        "Controller Port 3": 65535
      },
      "Left Side Captain ID": "1",
      "Left Side Sidekick ID": "3",
      "Right Side Captain ID": "7",
      "Right Side Sidekick ID": "1",
      "Score": "6-7",
      "Stadium ID": "2",
      "Left Side Match Stats": {
        "Goals": "6",
        "Shots": "24",
        "Hits": "20",
        "Steals": "11",
        "Super Strikes": "0",
        "Perfect Passes": "2"
      },
      "Right Side Match Stats": {
        "Goals": "7",
        "Shots": "45",
        "Hits": "27",
        "Steals": "15",
        "Super Strikes": "0",
        "Perfect Passes": "14"
      }
    }
  ]

//collectCitrusFiles(path.join(os.homedir(), 'Documents', 'Citrus Replays'), '.cit');