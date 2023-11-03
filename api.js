const fs = require('fs');
const unzipStream = require('unzip-stream');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { createHash } = require('crypto');
const { Stream } = require('stream');
const { isDev, getDolphinFolderPath, getProcessArgs, getSettingsPath, getErrorsPath, getUserConfigPath } = require("./processWrapper");
const wgetDownload = require("wget-improved");
const fsExtra = require("fs-extra");
const { default: axios } = require('axios');
const AsyncStreamZip = require("node-stream-zip").async;
const createDesktopShortcut = require('create-desktop-shortcuts');
// real api: "https://api.github.com/repos/hueybud/Project-Citrus/releases/latest"
// fake api: "https://api.github.com/repos/hueybud/Fake_Project_Citrus/releases/latest"
const projectCitrusGitHubAPI = "https://api.github.com/repos/hueybud/Project-Citrus/releases/latest"

async function getCitrusFilesNames(citrusReplaysPath, extension) {
  let listOfCitrusFiles;
  try {
    listOfCitrusFiles = fs.readdirSync(citrusReplaysPath);
    //console.log(listOfCitrusFiles);
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

function getCitrusFileJSON(citrusReplaysPath, citrusFile, citrusJSONCollection, onFileClick) {
    const expectedAmountOfFiles = 3;
    var seenFiles = 0;
    let foundJson = false;
    let pathToCitrusFile;
    if (onFileClick == "true") {
      console.log(`on file click is true`);
      console.log(`citrusFile param is: ${citrusFile}`)
      console.log(`process args are: ${getProcessArgs()}`)
      // user is using a CIT file as a command line arg
      // could be coming from anywhere so read in where it's coming from
      pathToCitrusFile = path.normalize(citrusFile);
      console.log(`lookup path is: ${pathToCitrusFile}`)
    } else {
      pathToCitrusFile = path.join(citrusReplaysPath, citrusFile);
    }
    return new Promise(function(resolve, reject){
        fs.createReadStream(pathToCitrusFile)
        .pipe(unzipStream.Parse())
        .on('error', function(unzipError){
          console.log(unzipError)
          resolve("could not unzip cit file")
        })
        .on('end', function(){
          if (seenFiles == 0 || seenFiles != 3) {
            console.log(`could not verify this CIT has JSON file. seenFiles is ${seenFiles} for ${citrusFile}`)
            resolve("could not verify this CIT has JSON file")
          }
        })
        .pipe(Stream.Transform({
          objectMode: true,
          transform: async function(entry, e, cb) {
            seenFiles++;
            if (entry.path == "output.json") {
              foundJson = true;
              var content = ""
              entry.on('data', function(chunk){
                content += chunk;
              })
              entry.on('end', function(){
                try {
                  citrusJSONCollection.push(JSON.parse(content.toString('utf-8')));
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

function startPlayback(fileName, onFileClick){

  // fileName is vague as it can be a relative file name or it can be a command-line full path file name
  // if onFileClick is true, fileName is a full file name. otherwise, it's relative

  return new Promise(async function(resolve, reject){
    var settingsJSON = await readSettingsFile();
    // check for blank fields
    for (elem in settingsJSON) {
      if (settingsJSON[elem] == "" && elem != "isoHash") {
        // the user is not able to do anything about a missing hash so no point in stopping it
        resolve(settingsJSONPropsToErrorNames(elem));
        return;
      }
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
      <p>Mismatched hashes between the match's replay file ISO and your selected playback ISO.</p>
      <p class="mt-2">Please set the Playback ISO in the Settings tab to the <b>${hashToISOName(dtmHash)}</b> in order to play this replay.
      This page can be accessed by clicking the gear icon in the top right corner.</p>
      <button class="btn btn-primary" type="button"data-bs-toggle="collapse" data-bs-target="#isoCollapse" aria-expanded="false" aria-controls="isoCollapse">
      Info for nerds
      </button>
      <div class="collapse" id="isoCollapse">
        <p class="mt-2">
        <span>The selected match was played with an ISO that has a hash of <b>${dtmHash}</b> : <em>${hashToISOName(dtmHash)}</em></span>
        </p>
        <p class="mt-2">
        <span>The current Playback ISO in Settings has a hash of <b>${isoHash}</b> : <em>${hashToISOName(isoHash)}</em></span>
        </p>
      </div>
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
  return new Promise(function(resolve, reject){
    var dtmHash;
    fs.createReadStream(pathToCitrusFile)
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
            foundJson = true;
            var content = ""
            entry.on('data', function(chunk){
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
      return "Super Mario Strikers GCM"
    case "f34aae896bbbba8380282b722bb3a092":
      return "Citrus Build Super Mario Strikers ISO"
    case "8788cfdf60258c975fcb8632eb295f58":
      return "Super Mario Strikers ISO"
    default:
      return "Non-Documented ISO"
  }
}

async function readErrorsFile() {
  return new Promise(async function(resolve, reject){
    try {
      resolve(JSON.parse(fs.readFileSync(getErrorsPath())))
    } catch (err) {
      console.error(`Error reading errors file: ${err}`);
      if (err.code == "ENOENT") {
        await createErrorsJSON();
        resolve(JSON.parse(fs.readFileSync(getErrorsPath())))
      } else {
        throw new Error(err);
      }
    }
  })
}

async function readSettingsFile() {
  return new Promise(async function(resolve, reject){
    try {
      resolve(JSON.parse(fs.readFileSync(getSettingsPath()))) 
    } catch (err) {
      console.error(`Error reading settings file: ${err}`);
      if (err.code == "ENOENT") {
        await createSettingsJSON();
        resolve(JSON.parse(fs.readFileSync(getSettingsPath()))) 
      } else {
        throw new Error(err);
      }
    }
  })
}

async function readUserConfigFile() {
  return new Promise(async function(resolve, reject){
    try {
      resolve(JSON.parse(fs.readFileSync(getUserConfigPath()))) 
    } catch (err) {
      console.error(`Error reading user file: ${err}`);
      if (err.code == "ENOENT") {
        await createUserJSON();
        resolve(JSON.parse(fs.readFileSync(getUserConfigPath()))) 
      } else {
        throw new Error(err);
      }
    }
  })
}

async function createSettingsJSON() {
  const settingsPath = getSettingsPath();
  return new Promise(function(resolve, reject){
    fs.open(settingsPath,'r',function(err, fd){
      if (err) {
        var data = {
          "pathToISO": "",
          "isoHash": "",
          "pathToDolphin": "",
          "pathToReplays": "",
          "processStuff": JSON.stringify(process.argv)
        }
        fs.writeFile(settingsPath, JSON.stringify(data), function(err) {
            if(err) {
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

async function createErrorsJSON() {
  const errorsPath = getErrorsPath();
  return new Promise(function(resolve, reject){
    fs.open(errorsPath,'r',function(err, fd){
      if (err) {
        var data = [];
        fs.writeFile(errorsPath, JSON.stringify(data), function(err) {
            if(err) {
                console.log(err);
                resolve("done")
            }
            console.log("The errors file was created");
            resolve("done")
        });
      } else {
        // in the future, let's overhaul this function to be responsible for creating and writing to it
        // same with settings file, but don't wanna mess it up before big release
        console.log("The errors file already exists");
        resolve("done")
      }
    });
  })
}

async function createUserJSON() {
  const userConfigPath = getUserConfigPath();
  return new Promise(function(resolve, reject){
    fs.open(userConfigPath,'r',function(err, fd){
      if (err) {
        var data = {
          "discordId": "",
          "discordGlobalName": "",
          "discordAvatar": "",
          "jwt": ""
        }
        fs.writeFile(userConfigPath, JSON.stringify(data), function(err) {
            if(err) {
                console.log(err);
                resolve("done")
            }
            console.log("The user config file was created");
            resolve("done")
        });
      } else {
        console.log("The user config file already exists");
        resolve("done")
      }
    });
  })
}

async function download(url, destinationFile) {
  await fsExtra.ensureDir(path.dirname(destinationFile));

  // slippi-launcher code
  return new Promise((resolve, reject) => {
    let totalBytes = 0;
    const downloader = wgetDownload.download(url, destinationFile);
    downloader.on("error", (err) => {
      fs.unlink(destinationFile, () => {
        reject(err);
      });
    });
    downloader.on("start", (fileSize) => {
      if (fileSize !== null) {
        totalBytes = fileSize;
      }
    });
    downloader.on("end", () => {
      resolve();
    });
    downloader.on("bytes", (transferredBytes) => {
      // post that we are actively downloading to the server and the progress
      axios.post('http://127.0.0.1:8082/setCitrusDolphinUpdateStats', {
        status: "ACTIVE",
        currentBytes: transferredBytes,
        totalBytes: totalBytes
      })
      //console.log(`transferredBytes: ${transferredBytes}. totalBytes: ${totalBytes}`)
    });
  });
}

async function downloadDolphin() {
  return new Promise(async function(resolve, reject){
    const downloadURL = await getDolphinAsset();
    // C:\Users\Brian\Documents\Citrus Launcher\dolphin\Citrus.Dolphin.0.1.6.2.zip
    const destinationLocation = path.join(getDolphinFolderPath(), path.basename(downloadURL))
    console.log(`Downloading Dolphin to ${destinationLocation}`);
    await download(downloadURL, destinationLocation)
    resolve(destinationLocation);
  })
}

async function getDolphinAsset() {
  return new Promise(function(resolve, reject){
    axios.get(projectCitrusGitHubAPI).then(response => {
      const assets = response.data['assets']
      resolve(assets[0]["browser_download_url"])
    }).catch(err => {
      console.log(err)
      reject("Failed to read remote version")
    })
  })
}

async function getLatestDolphinVersion() {
  return new Promise(function(resolve, reject){
    axios.get(projectCitrusGitHubAPI).then(response => {
      resolve(response.data['tag_name'])
    }).catch(err => {
      console.log(err)
      resolve("Failed to read remote version")
    })
  })
}

async function installDolphin() {
  const versionPath = path.join(getDolphinFolderPath(), 'x64', 'version.txt');
  let localDolphinVersion = "";
  console.log(`Reading in version.txt at ${versionPath}`)
  try {
    localDolphinVersion = fs.readFileSync(versionPath);
    console.log(`Local dolphin version: ${localDolphinVersion}`)
  } catch (err) {
    if (err.code === "ENOENT") {
      // version file doesn't exist
      console.error("Dolphin version file doesn't exist")
    } else {
      console.error(err);
    }
  }

  // check if returned version should be updated
  const latestDolphinVersion = await getLatestDolphinVersion();
  if (localDolphinVersion == latestDolphinVersion) {
    console.log(`Local and Remote Dolphin versions are already up to date at version ${latestDolphinVersion}`)
    return;
  }

  console.log(`Beginning to update to Citrus Dolphin ${latestDolphinVersion}`)
  
  try {
    // delete current dolphin. download and install latest dolphin
    console.log(`Deleting existing Dolphin folder`)
    fs.rmSync(getDolphinFolderPath(), { recursive: true, force: true })

    console.log(`Downloading latest Dolphin`)
    const assetPath = await downloadDolphin();
    // C:\Users\Brian\Documents\Citrus Launcher\dolphin\Citrus.Dolphin.0.1.6.2.zip
    const zip = new AsyncStreamZip({ file: assetPath });
  
    console.log(`Extracting latest Dolphin`)
    await zip.extract(null, getDolphinFolderPath());
    await zip.close();

    console.log(`Deleting downloaded zip file`)
    fs.rmSync(assetPath, { recursive: true, force: true })

    if (!isDev()) {
      const dolphinExePath = path.join(getDolphinFolderPath(), 'x64', 'Citrus Dolphin.exe');
      console.log(`Creating Desktop shortcut`)
      const prodVBSPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'create-desktop-shortcuts', 'src', 'windows.vbs')
      createDesktopShortcut({
        windows: {
          filePath: dolphinExePath,
          VBScriptPath: prodVBSPath
        }
      });

      console.log(`Update settings.json with Dolphin exe`)
      const settingsJSON = await readSettingsFile();
      settingsJSON['pathToDolphin'] = dolphinExePath;
      fs.writeFileSync(getSettingsPath(), JSON.stringify(settingsJSON))
    }

    // post that we are done to the server
    axios.post('http://127.0.0.1:8082/setCitrusDolphinUpdateStats', {
      status: "DONE"
    })

    console.log("Done updating Dolphin")

  } catch (err) {
    // post that we encountered an error to the server
    axios.post('http://127.0.0.1:8082/setCitrusDolphinUpdateStats', {
      status: "ERROR",
      errorMessage: JSON.stringify(err)
    })
    console.log(`Error updating Dolphin: ${JSON.stringify(err)}`);
    const errorsJSON = await readErrorsFile();
    errorsJSON.push({
      time: new Date().toLocaleString(),
      error: err
    })
    fs.writeFileSync(getErrorsPath(), JSON.stringify(errorsJSON));
  }
}

async function openDolphin() {
  const settingsJSON = await readSettingsFile();
  const rawPathToDolphin = settingsJSON['pathToDolphin']
  console.log(`Looking to open dolphin at: ${rawPathToDolphin}`)
  return new Promise(function(resolve, reject){
    // check to see if the dolphin.exe they provided exists (people delete folders)
    if (!fs.existsSync(rawPathToDolphin)) {
      console.log("dolphin path does not exist")
      resolve({
        errorMessage: 'dolphin path does not exist',
        pathToDolphin: rawPathToDolphin
      })
      return;
    }

    var pathToDolphin = '"' + rawPathToDolphin + '"';
    console.log(`Formatted Dolphin path for opening is: ${pathToDolphin}`);
    exec(pathToDolphin, [], (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        resolve({
          errorMessage: error,
          pathToDolphin: rawPathToDolphin
        })
      }
      console.log(stdout);
    })
    resolve("Success")
  })
}

module.exports.collectCitrusNames = getCitrusFilesNames;
module.exports.getCitrusFileJSON = getCitrusFileJSON;
module.exports.startPlayback = startPlayback;
module.exports.getMD5ISO = getMD5ISO;
module.exports.readSettingsFile = readSettingsFile;
module.exports.readUserConfigFile = readUserConfigFile;
module.exports.createSettingsJSON = createSettingsJSON;
module.exports.createErrorsJSON = createErrorsJSON;
module.exports.createUserJSON = createUserJSON;
module.exports.installDolphin = installDolphin;
module.exports.openDolphin = openDolphin;

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