import {captainIDToName, sidekickIDToName, stadiumIDToName} from './clientUtilities.js'

function initialLoad() {
    var htmlCollection = "";
    return new Promise(function(resolve, reject){
        axios.get('http://127.0.0.1:8082/collectCitrusFiles')
        .then(result => {
            if (result.data.length == 0) {
                htmlCollection = noCitrusFilesFound()
                resolve(htmlCollection)
            } else if (result.data == "ENOENT") {
                htmlCollection = invalidReplayFolder()
                resolve(htmlCollection)
            } else {
                result.data.map(function(entry, index){
                    console.log(entry);
                    var htmlInstance = transformReplayIntoElement(entry);
                    console.log(htmlInstance);
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
    let markup =  `
        <div class='row metadataObj'>
            <div class='col-lg mb-2'>
                <div class='row'>
                    <div class='col-md-1'>
                        <div class='characterContainer'>
                            <img class='captainBannerPhoto' src='./assets/Captains/${captainIDToName(metadataJSON['Left Side Captain ID'])}.png'><img class='sidekickBannerPhoto' src='./assets/Sidekicks/${sidekickIDToName(metadataJSON['Left Side Sidekick ID'])}.png'>
                            <span class="versusTextBanner">vs</span>
                        </div>
                    </div>
                    <div class='col-md-1'>
                        <div class='characterContainer'>
                            <img class='captainBannerPhoto' src='./assets/Captains/${captainIDToName(metadataJSON['Right Side Captain ID'])}.png'><img class='sidekickBannerPhoto' src='./assets/Sidekicks/${sidekickIDToName(metadataJSON['Right Side Sidekick ID'])}.png'>
                        </div>
                    </div>
                    <div class='col-md-8'>

                    </div>
                    <div class='col-md-2'>
                        <div class='iconsContainerOuter'>
                            <div class='iconsContainerInner'>
                                <span class="threeDotsIconOuter"><i class="fas fa-ellipsis-h fa-2x threeDotsIcon"></i></span>
                                <span class="chartIconOuter"><i class="fa-solid fa-chart-simple fa-2x chartIcon"></i></span>
                                <span class="circleIconOuter"><i class="far fa-play-circle fa-2x circleIcon"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class='row miscButtons'>
                    <div class='col-md'>
                        <span class='whiteText dateBanner'><i class="far fa-calendar"></i> ${ourDate} ${ourTime}</span>
                        <span class='whiteText stadiumBannerText'><i class="fas fa-globe"></i> ${stadiumIDToName(metadataJSON['Stadium ID'])}</span>
                        <span class='whiteText fileName'>${metadataJSON['File Name']}</span>
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
                <h3 class="text-warning">Please select the folder that contains your desired Citrus Replay file(s) via the Settings tab. This page can be accessed by clicking the gear icon in the top right corner.</h3>
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
    var metadataBlock = await initialLoad()
    document.getElementById('container').innerHTML = metadataBlock;

    $('.circleIconOuter').click(function(){
        var fileName = $(this).closest('.row').next('.row').find('.fileName').text();
        var myModal = new bootstrap.Modal(document.getElementById('myModal'))
        myModal.show();

        setTimeout(() => {
          myModal.hide();
        }, 2000);

        axios.post('http://127.0.0.1:8082/startPlayback', {
            fileName: fileName
        })
        .then(function (response) {
            console.log(response);
            if (response.data != "Success") {
                myModal.hide();
                $('#playbackErrorMessage').text(response.data);
                var playbackErrorModal = new bootstrap.Modal(document.getElementById('playbackErrorModal'));
                playbackErrorModal.show();
            }
          })
        .catch(function (error) {
            console.log(error);
        });
        console.log($(this).closest('.row').next('.row').find('.fileName').text())
    })

    $('.threeDotsIconOuter').click(function(){
        window.location.href = "settings.html";
    })

});

function handleCircleClick() {

}