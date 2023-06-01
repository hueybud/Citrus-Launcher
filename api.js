const { default: axios } = require('axios');
const fs = require('fs');
const unzipper = require('unzipper');
const unzipStream = require('unzip-stream');
const etl = require('etl');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { createHash } = require('crypto');
const { Stream } = require('stream');
const { isDev, getProcessArgs, getSettingsPath } = require("./processWrapper");
const sqlite3 = require('sqlite3');

async function getCitrusFilesNames(citrusReplaysPath, extension) {
  let listOfCitrusFiles;
  try {
    listOfCitrusFiles = fs.readdirSync(citrusReplaysPath);

    listOfCitrusFiles = listOfCitrusFiles.map(fileName => ({
      name: fileName,
      time: fs.statSync(`${citrusReplaysPath}/${fileName}`).mtime.getTime(),
      size: fs.statSync(`${citrusReplaysPath}/${fileName}`).size
    }))
      .sort((a, b) => b.time - a.time)

  } catch (error) {
    return error.code
  }
  listOfCitrusFiles = listOfCitrusFiles.filter(file => file.name.match(new RegExp(`.*\.(${extension})$`, 'ig')) && file.size > 300000);
  listOfCitrusFiles = listOfCitrusFiles.map(file => file.name);
  //console.log(listOfCitrusFiles);
  return listOfCitrusFiles
}

function getCitrusFileJSON(citrusReplaysPath, citrusFile, citrusJSONCollection, onFileClick, useRaw) {
  const expectedAmountOfFiles = 3;
  var seenFiles = 0;
  let foundJson = false;
  let pathToCitrusFile;
  console.log("onFileClick:" + onFileClick)
  if (onFileClick == "true") {
    // user is using a CIT file as a command line arg
    // could be coming from anywhere so read in where it's coming from
    pathToCitrusFile = getProcessArgs()[1];
  } else {
    pathToCitrusFile = path.join(citrusReplaysPath, citrusFile);
  }
  return new Promise(function (resolve, reject) {
    fs.createReadStream(pathToCitrusFile)
      .pipe(unzipStream.Parse())
      .on('error', function (unzipError) {
        console.log(unzipError)
        resolve("could not unzip cit file")
      })
      .on('end', function () {
        if (seenFiles == 0 || seenFiles != 3) {
          console.log(`could not verify this CIT has JSON file. seenFiles is ${seenFiles} for ${citrusFile}`)
          resolve("could not verify this CIT has JSON file")
        }
      })
      .pipe(Stream.Transform({
        objectMode: true,
        transform: async function (entry, e, cb) {
          seenFiles++;
          if (entry.path == "output.json") {
            foundJson = true;
            var content = ""
            entry.on('data', function (chunk) {
              content += chunk;
            })
            entry.on('end', function () {
              try {
                if (useRaw == "true") {
                  citrusJSONCollection.push(content.toString('utf-8'));
                }
                else {
                  citrusJSONCollection.push(JSON.parse(content.toString('utf-8')));
                }
                resolve("done")
              } catch (err) {
                resolve("could not parse json")
              }
            })
          }
          else {
            entry.autodrain();
            cb();
            // resolve to keep the code going but let us know no json was found
            if (seenFiles == expectedAmountOfFiles && !foundJson) {
              console.log("done but no json found")
              resolve("done but no json found")
            }
          }
        }
      }))
  })
}

function startPlayback(fileName, onFileClick) {

  // fileName is vague as it can be a relative file name or it can be a command-line full path file name
  // if onFileClick is true, fileName is a full file name. otherwise, it's relative

  return new Promise(async function (resolve, reject) {
    var settingsJSON = readSettingsFile();
    // check for blank fields
    for (elem in settingsJSON) {
      if (settingsJSON[elem] == "" && elem != "isoHash") {
        // the user is not able to do anything about a missing hash so no point in stopping it
        resolve(settingsJSONPropsToErrorNames(elem));
        return;
      }
    }
    // handle dank case where hash doesn't get set from dolphin and gets set to 00s
    if (settingsJSON["isoHash"] == "0000000000000000") {

    }

    // comapre hashes now

    // get hash from DTM file
    let pathToCitrusFile;
    if (onFileClick == "true") {
      pathToCitrusFile = fileName
    } else {
      pathToCitrusFile = path.join(settingsJSON['pathToReplays'], fileName);
    }
    var dtmHash = await getReplayHash(pathToCitrusFile);

    // get hash from iso file
    var isoHash = await getMD5ISO(settingsJSON['pathToISO'])
    if ((dtmHash != isoHash) && (dtmHash != "0000000000000000")) {
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

    // check to see if the dolphin.exe they provided exists (people delete folders)
    if (!fs.existsSync(settingsJSON['pathToDolphin'])) {
      console.log("dolphin path does not exist")
      var errorMessage = `The Dolphin path in Settings does not exist. Did you delete it?
      <p class="mt-2"> Please provide an existing path to Citrus Dolphin via the Settings tab. 
      This page can be accessed by clicking the gear icon in the top right corner.</p>`
      resolve(errorMessage);
      return;
    }

    var combinedFileName = '"' + pathToCitrusFile + '"';
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

function getReplayHash(pathToCitrusFile) {
  var seenFiles = 0;
  let jsonFound = false;
  return new Promise(function (resolve, reject) {
    var dtmHash;
    fs.createReadStream(pathToCitrusFile)
      .pipe(unzipStream.Parse())
      .on('error', function (unzipError) {
        console.log(unzipError)
        resolve("could not unzip cit file")
      })
      .pipe(Stream.Transform({
        objectMode: true,
        transform: function (entry, e, cb) {
          seenFiles++;
          if (entry.path == "output.json") {
            foundJson = true;
            var content = ""
            entry.on('data', function (chunk) {
              content += chunk;
            })
            entry.on('end', function () {
              try {
                content = JSON.parse(content.toString('utf-8'))
              } catch (err) {
                resolve("could not parse json")
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
            if (seenFiles == 3 && !foundJson) {
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
  return new Promise(function (resolve, reject) {
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

function readSettingsFile() {
  try {
    return JSON.parse(fs.readFileSync(getSettingsPath()))
  } catch (err) {
    console.error("Error reading settings file");
    throw new Error(err);
  }
}

async function syncCitDataToMssql(localDb) {
  // get list of files in the database with is_uploaded = 0
  const x = localDb.prepare("SELECT * FROM cit_files WHERE is_uploaded = 0");
  x.each(function (err, row) {
    uploadJsonToMssql(row.file_name, row.json_data, localDb);
  }, function (err, count) {
    x.finalize();
  });
}

async function uploadJsonToMssql(filename, jsondata, localDb) {
  const data = JSON.parse(jsondata);

  try {
    await axios.post('https://api.mariostrikers.gg/citrus/uploadStats', data);
    await localDb.run("UPDATE cit_files SET is_uploaded = 1 WHERE file_name = ?", [filename]);
  } catch (err) {
    console.log("syncToGlobalDb: " + err);
  }
}

async function uploadCitrusStats() {
  const settingsJSON = readSettingsFile();
  const dbname = settingsJSON['pathToReplays'] + '\\citrus.db';
  console.log('hello!');

  await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbname, sqlite3.OPEN_READWRITE, (err) => {
      if (err && err.code === "SQLITE_CANTOPEN") {
        createDatabase(resolve);
        return;
      } else if (err) {
        console.log("Getting error " + err);
        reject(err);
      }
      resolve(db);
    });
  })
    .then(async (db) => {
      const fileList = await getCitrusFilesNames(settingsJSON['pathToReplays'], '.cit');
      await runQueriesAndSync(db, fileList, settingsJSON['pathToReplays']);
    })
    .catch((err) => {
      console.log('Error: ' + err);
      exit(1);
    });
}

function createDatabase(callback) {
  const settingsJSON = readSettingsFile();
  const dbname = settingsJSON['pathToReplays'] + '\\citrus.db';
  const newdb = new sqlite3.Database(dbname, (err) => {
    if (err) {
      console.log("Getting error " + err);
      exit(1);
    }
    createTable(newdb);
    if (typeof callback === 'function') {
      callback(newdb); // Pass the newdb instance as an argument to the callback
    }
  });
}

function createTable(newdb) {
  newdb.exec(`
    CREATE TABLE IF NOT EXISTS cit_files (
      file_name TEXT PRIMARY KEY NOT NULL,
      is_uploaded BIT,
      json_data TEXT
    );`, () => {
    // Optional: Do something after creating the table
  });
}

async function runQueriesAndSync(db, fileList, replayPath) {
  await dumpCitFilesToSqlite(db, fileList, replayPath);
  syncCitDataToMssql(db);
}

async function dumpCitFilesToSqlite(db, fileList, replayPath) {
  let i = 0;
  while (i < fileList.length) {
    await insertJsonToSqliteWhereNotExists(db, replayPath, fileList[i]);
    i++;
  };
  console.log('Queries executed.');
}

async function insertJsonToSqliteWhereNotExists(db, replayPath, filename) {
  try {
    const row = await new Promise((resolve, reject) => {
      db.get(
        "SELECT is_uploaded FROM cit_files WHERE file_name = '" + filename + "'",
        async function (err, row) {
          if (err) {
            console.log('error getting uploaded cit file ' + err);
            reject(err);
          } else {
            if (!row) {
              let x = [];
              await getCitrusFileJSON(replayPath, filename, x, "false", "true");
              await db.run(
                "INSERT OR IGNORE INTO cit_files (file_name, is_uploaded, json_data) VALUES (?, ?, ?)",
                [filename, 0, x[0]]
              );
            }
            resolve(row);
          }
        }
      );
    });

    // Continue with the rest of your code if needed
  } catch (err) {
    console.log("runQuery: " + err);
  }
}


async function createSettingsJSON() {
  const settingsPath = getSettingsPath();
  return new Promise(function (resolve, reject) {
    fs.open(settingsPath, 'r', function (err, fd) {
      if (err) {
        var data = {
          "pathToISO": "",
          "isoHash": "",
          "pathToDolphin": "",
          "pathToReplays": "",
          "processStuff": JSON.stringify(process.argv)
        }
        fs.writeFile(settingsPath, JSON.stringify(data), function (err) {
          if (err) {
            console.log(err);
            resolve("done")
          }
          console.log("The settings file was created");
          resolve("done")
        });
      } else {
        console.log("The settings file already exists");
        resolve("done")
      }
    });
  })
}

module.exports.collectCitrusNames = getCitrusFilesNames;
module.exports.getCitrusFileJSON = getCitrusFileJSON;
module.exports.startPlayback = startPlayback;
module.exports.getMD5ISO = getMD5ISO;
module.exports.readSettingsFile = readSettingsFile;
module.exports.createSettingsJSON = createSettingsJSON;
module.exports.uploadCitrusStats = uploadCitrusStats;
module.exports.syncFiles = syncCitDataToMssql;

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

//getCitrusFilesNames(path.join(os.homedir(), 'Documents', 'Dolphin Emulator', 'CitrusReplays'), '.cit');

async function test() {
  let someCollection = []
  console.log(await getCitrusFileJSON(path.join(os.homedir(), 'Documents', 'Dolphin Emulator', 'Citrus Replays'), 'Game_March_13_2023_17_15_59.cit', someCollection))
  console.log("and the result is")
  console.log(someCollection)
}
//test()