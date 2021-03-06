const fs = require('fs');
const unzipper = require('unzipper');
const unzipStream = require('unzip-stream');
const etl = require('etl');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { createHash } = require('crypto');
const { Stream } = require('stream');
var StringDecoder = require('string_decoder').StringDecoder;

async function collectCitrusFiles(citrusReplaysPath, extension) {
    let listOfCitrusFiles;
    try {
      listOfCitrusFiles = fs.readdirSync(citrusReplaysPath);
      //console.log(listOfCitrusFiles);
      listOfCitrusFiles = listOfCitrusFiles.map(fileName => ({
        name: fileName,
        time: fs.statSync(`${citrusReplaysPath}/${fileName}`).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)
      .map(file => file.name);
      //console.log(listOfCitrusFiles);
      
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
    //console.log(citrusJSONCollection);
    return citrusJSONCollection;
    //return mockedCollectionJSON;
}

function getCitrusFileJSON(citrusReplaysPath, citrusFile, citrusJSONCollection) {
    const expectedAmountOfFiles = 3;
    var seenFiles = 0;
    console.log(citrusFile)
    return new Promise(function(resolve, reject){
        fs.createReadStream(path.join(citrusReplaysPath, citrusFile))
        .pipe(unzipStream.Parse())
        .on('error', function(unzipError){
          console.log(unzipError)
          resolve("could not unzip cit file")
        })
        .pipe(Stream.Transform({
          objectMode: true,
          transform: async function(entry, e, cb) {
            seenFiles++;
            if (entry.path == "output.json") {
              var content = ""
              entry.on('data', function(chunk){
                content += chunk;
              })
              entry.on('end', function(){
                try {
                  citrusJSONCollection.push(JSON.parse(content.toString('utf-8')));
                } catch (err) {
                  resolve("could not parse json")
                }
                resolve("done");
              })
            }
            else {
              entry.autodrain();
              cb();
                // resolve to keep the code going but let us know no json was found
              if (seenFiles == expectedAmountOfFiles) {
                resolve("done but no json found")
              }
            }
          }
        }))
    })
}

function startPlayback(fileName){
  return new Promise(async function(resolve, reject){
    var settingsJSON = JSON.parse(fs.readFileSync('settings.json'));
    for (elem in settingsJSON) {
      if (settingsJSON[elem] == "" && elem != "isoHash") {
        // the user is not able to do anything about a missing hash so no point in stopping it
        resolve(settingsJSONPropsToErrorNames(elem));
        return;
      }
    }
    // comapre hashes now

    // get hash from DTM file
    var dtmHash = await getReplayHash(settingsJSON, fileName);

    // get hash from iso file
    var isoHash = await getMD5ISO(settingsJSON['pathToISO'])
    if (dtmHash != isoHash) {
      // mistmatched hashes which could mess with playback
      var errorMessage = `
      Mismatched hashes between your replay file ISO and your selected playback ISO.
      Your replay file was played on an ISO with a hash of ${dtmHash} <b>(${hashToISOName(dtmHash)})</b> and your playback ISO has a hash
      of ${isoHash} <b>(${hashToISOName(isoHash)})</b>. <p class="mt-2">Please select the appropriate ISO for this replay 
      via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner.</p>
      `
      resolve(errorMessage);
      return;
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

function getReplayHash(settingsJSON, fileName) {
  var seenFiles = 0;
  return new Promise(function(resolve, reject){
    var dtmHash;
    fs.createReadStream(path.join(settingsJSON['pathToReplays'], fileName))
    .pipe(unzipStream.Parse())
    .on('error', function(unzipError){
      console.log(unzipError)
      resolve("could not unzip cit file")
    })
    .pipe(Stream.Transform({
        objectMode: true,
        transform: function(entry, e, cb) {
          seenFiles++;
          if (entry.path == "output.json") {
            var content = ""
            entry.on('data', function(chunk){
              console.log("here")
              content += chunk;
            })
            entry.on('end', function(){
              try {
                content = JSON.parse(content.toString('utf-8'))
              } catch (err) {
                resolve ("could not parse json")
              }
              dtmHash = content['Game Hash']
              console.log(dtmHash);
              resolve(dtmHash)
            })
          }
          else {
            entry.autodrain();
            cb();
            // resolve to keep the code going but let us know no json was found
            if (seenFiles == 3) {
              resolve("done but no json found")
            }
          }
        }
    }))
  })
}

function settingsJSONPropsToErrorNames(propertyName) {
  switch (propertyName) {
    case "pathToISO":
      return "Please select a Super Mario Strikers ISO via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner."
    case "pathToDolphin":
      return "Please select the path to your Citrus Dolphin executable (.exe) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner."
    case "pathToReplays":
      return "Please select the folder that contains your desired Citrus Replay file(s) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner."
  }
}

function getMD5ISO(filePath) {
  return new Promise(function(resolve, reject){
    const hash = createHash('md5')
    const input = fs.createReadStream(filePath);
    input.on('readable', () => {
    // Only one element is going to be produced by the
    // hash stream.
    const data = input.read();
    if (data)
      hash.update(data);
    else {
      resolve(hash.digest('hex'))
      //console.log(`${hash.digest('hex')} ${filePath}`);
    }
  });
  })
}

function hashToISOName(hash) {
  switch (hash) {
    case "a8d8fcc0c15bfec539398be32b40a69d":
      return "Vanilla Super Mario Strikers GCM"
    case "f34aae896bbbba8380282b722bb3a092":
      return "Citrus Build Super Mario Strikers ISO"
    default:
      return "Non-Documented ISO"
  }
}

module.exports.collectCitrusFiles = collectCitrusFiles;
module.exports.getCitrusFileJSON = getCitrusFileJSON;
module.exports.startPlayback = startPlayback;
module.exports.getMD5ISO = getMD5ISO;

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
/*
async function test() {
  var result = await getCitrusFileJSON(path.join(os.homedir(), 'Documents', 'Citrus Replays'), 'Game_July_22_2022_17_24_34.cit', [])
  console.log(result)
}
test()
*/