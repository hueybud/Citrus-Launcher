import {captainIDToName, sidekickIDToName, stadiumIDToName} from './clientUtilities.js'

function initialLoad(refreshBool) {
    var htmlCollection = "";
    return new Promise(function(resolve, reject){
        axios.post('http://127.0.0.1:8082/collectCitrusFiles', {
            refresh: refreshBool
        })
        .then(result => {
            if (result.data.length == 0) {
                htmlCollection = noCitrusFilesFound()
                resolve(htmlCollection)
            } else if (result.data == "ENOENT") {
                htmlCollection = invalidReplayFolder()
                resolve(htmlCollection)
            } else {
                result.data.map(function(entry, index){
                    let htmlInstance = transformReplayIntoElement(entry);
                    htmlCollection += htmlInstance;
                    if (index == result.data.length - 1) {
                        resolve(htmlCollection);
                    }
                })
            }
          //console.log(result.data);
        })
        .catch(err => {
          console.log(err)
        })
    })
}

function transformReplayIntoElement(metadataJSON) {
    //console.log(metadataJSON)
    let rawDate = new Date(metadataJSON['Date']);
    let ourDate = rawDate.toLocaleString('default', {month: 'short', day: 'numeric', year: 'numeric'});
    let ourTime = rawDate.toLocaleTimeString('default', {timeStyle: 'short'})
    var leftPlayerNamesString = "";
    var rightPlayerNamesString = ""
    if (metadataJSON['Left Team Player Info']) {
        for (var i =0; i < metadataJSON['Left Team Player Info'].length; i++) {
            leftPlayerNamesString += `<p class="playerName surplusStat">${metadataJSON['Left Team Player Info'][i]}</p>`
        }
    }
    if (metadataJSON['Right Team Player Info']) {
        for (var i =0; i < metadataJSON['Right Team Player Info'].length; i++) {
            rightPlayerNamesString += `<p class="playerName surplusStat">${metadataJSON['Right Team Player Info'][i]}</p>`
        }
    }
    let markup =  `
        <div class='row metadataObj'>
            <div class='col-lg mb-2'>
                <div class='row'>
                    <div class='col-md-4'>
                        <div class="row mb-4">
                            <div class="col-md-5">
                                <div class='characterContainer'>
                                    <img class='captainBannerPhoto' src='./assets/images/Captains/${captainIDToName(metadataJSON['Left Side Captain ID'])}.png'><img class='sidekickBannerPhoto' src='./assets/images/Sidekicks/${metadataJSON['Left Side Captain ID'] == 8 ? sidekickIDToName(8) : sidekickIDToName(metadataJSON['Left Side Sidekick ID'])}.png'> 
                                    ${leftPlayerNamesString}
                                </div>
                            </div>
                            <div class="col-md-5">
                                <div class='characterContainer'>
                                    <img class='captainBannerPhoto' src='./assets/images/Captains/${captainIDToName(metadataJSON['Right Side Captain ID'])}.png'><img class='sidekickBannerPhoto' src='./assets/images/Sidekicks/${metadataJSON['Right Side Captain ID'] == 8 ? sidekickIDToName(8) : sidekickIDToName(metadataJSON['Right Side Sidekick ID'])}.png'>
                                    ${rightPlayerNamesString}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class='col-md-6'>

                    </div>
                    <div class='col-lg-2 align-self-center'>
                        <div class='iconsContainerOuter'>
                            <div class='iconsContainerInner'>
                                <span class="threeDotsIconOuter"><i class="fas fa-ellipsis-h fa-2x threeDotsIcon"></i></span>
                                <span class="chartIconOuter"><i title="Statistics" class="fa-solid fa-chart-simple fa-2x chartIcon"></i></span>
                                <span class="circleIconOuter"><i title="Start Replay" class="far fa-play-circle fa-2x circleIcon"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class='row miscButtons'>
                    <div class='col-md-2'>
                        <span class='whiteText dateBanner'><i title="Date" class="far fa-calendar"></i> ${ourDate} ${ourTime}</span>
                    </div>
                    <div class='col-md-2'>
                        <span class='whiteText stadiumBannerText'><i title="Stadium" class="fas fa-globe"></i> ${stadiumIDToName(metadataJSON['Stadium ID'])}</span>
                    </div>
                    <div class='col-md-1'>
                        <span class='whiteText scoreBannerText'><i title="Score" class="fa-solid fa-chalkboard"></i> ${metadataJSON['Score']}</span>
                    </div>
                    <div class='col-md-4'>
                    </div>
                    <div class='col-md-3'>
                        <span class='whiteText fileName me-3'>${metadataJSON['File Name']}</span>
                    </div>
                </div>
            </div>
        </div>
    `
    return markup;
}

function noCitrusFilesFound() {
    let markup = `
    <div class='row metadataObj'>
        <div class='col-lg mb-2'>
            <div class='row'>
                <h1 class="whiteText">No Records Found!</h1>
                <h3 class="text-warning">We could not find any records in your designated replay folder.</h3>
                <h4 class="text-warning mt-4">This might be because you haven't played any matches yet on the Citrus Dolphin client. If that's the case, once you play a match, replays will appear in your Documents -> Citrus Replays folder. This folder is automatically created for you.</h4>
                <h4 class="text-warning mt-4">If you have played matches on the Citrus Dolphin client, please select the folder that contains your desired Citrus Replay file(s) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner. By default, replays are saved in Documents -> Citrus Replays.</h4>
            </div>
        </div>
    </div>
    `
    return markup
}

function invalidReplayFolder() {
    let markup = `
    <div class='row metadataObj'>
        <div class='col-lg mb-2'>
            <div class='row'>
                <h1 class="whiteText">Unable to find replays folder!</h1>
                <h3 class="text-warning">Please select an existing folder for your desired Citrus Replay file(s) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner.</h3>
            </div>
        </div>
    </div>
    `
    return markup
}

document.addEventListener("DOMContentLoaded", async function() {
    var myModal = new bootstrap.Modal(document.getElementById('myModal'))
    myModal.show();
    // never refresh when we come to index.html
    // only refresh if they hit the refresh button
    // however, always store the global citrus collection on the server so that we can return it if it doesn't exist
    // saves time by giving the user the possibly un-updated info, and if they want it updated, they can refresh
    // all of this makes going between pages quicker
    var metadataBlock = await initialLoad(false)
    myModal.hide();
    document.getElementById('container').innerHTML = metadataBlock;

    async function refresh() {
        var myModal = new bootstrap.Modal(document.getElementById('myModal'))
        myModal.show();
        var metadataBlock = await initialLoad(true)
        myModal.hide();
        document.getElementById('container').innerHTML = metadataBlock;
    }

    $(document).on('click', '.circleIconOuter', function(){
        var fileName = $(this).closest('.row').next('.row').find('.fileName').text();
        var myModal = new bootstrap.Modal(document.getElementById('loadIndividualReplayModal'))
        myModal.show();

        axios.post('http://127.0.0.1:8082/startPlayback', {
            fileName: fileName
        })
        .then(function (response) {
            console.log(response);
            myModal.hide();
            if (response.data != "Success") {
                $('#playbackErrorMessage').html(response.data);
                var playbackErrorModal = new bootstrap.Modal(document.getElementById('playbackErrorModal'));
                playbackErrorModal.show();
            }
          })
        .catch(function (error) {
            console.log(error);
        });
        console.log($(this).closest('.row').next('.row').find('.fileName').text())
    })

    $(document).on('click', '.chartIconOuter', function(){
        var fileName = $(this).closest('.row').next('.row').find('.fileName').text()
        console.log(fileName);
        window.location.href = "matchSummary.html?fileName=" + fileName;
    })

    $(document).on('click', '.threeDotsIconOuter', function(){
        window.location.href = "settings.html";
    })

    $('#refreshIconOuter').click(function(){
        refresh();
    })

});

function handleCircleClick() {

}