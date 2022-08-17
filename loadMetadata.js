import {captainIDToName, sidekickIDToName, stadiumIDToName} from './clientUtilities.js'

async function initialLoad(refreshBool) {
    var htmlCollectionArr = []
    var decrementer = 0;
    var queryParams = new URLSearchParams(window.location.search)
    var rowParam = await getRowParam(queryParams);
    var pageParam = await getPageParam(queryParams);
    var end;
    return new Promise(function(resolve, reject){
        axios.post('http://127.0.0.1:8082/collectCitrusNames', {
            refresh: refreshBool,
            rowParam: rowParam,
            pageParam: pageParam
        })
        .then(async result => {
            if (result.data[1].length == 0) {
                $('#rowFilterColumn').hide()
                resolve(noCitrusFilesFound())
            } else if (result.data[1] == "ENOENT") {
                $('#rowFilterColumn').hide()
                resolve(invalidReplayFolder())
            } else {
                end = (rowParam*pageParam)
                // check if names are same as last time
                if (result.data[0]) {
                    // this means we didn't update the names list and that we can use the collection
                    // that is on the server so go ahead and get it
                    axios.get('http://127.0.0.1:8082/getReplaysHTMLCollectionString')
                    .then(collectionResult => {
                        resolve(collectionResult.data)
                    })
                    .catch(collectionErr => {
                        console.log(collectionErr)
                    })
                } else {
                    // slice here so that we know what we are showing out of
                    var refinedFileCollection = result.data[1].slice(end-rowParam, end)
                    decrementer = refinedFileCollection.length
                    refinedFileCollection.map(function(entry, index){
                        axios.get(`http://127.0.0.1:8082/getMatchSummary?fileName=${entry}`)
                        .then(jsonResult => {
                            let htmlInstance = transformReplayIntoElement(jsonResult.data);
                            var desiredIndex = refinedFileCollection.indexOf(jsonResult.data['File Name'])
                            htmlCollectionArr[desiredIndex] = htmlInstance
                            //htmlCollection += htmlInstance;
                            displayLoadProgress(index + 1, refinedFileCollection.length)
                        })
                        .catch(jsonErr => {
                            console.log(jsonErr)
                        })
                        .then(function(){
                            decrementer--
                            if (decrementer == 0) {
                                let stringifyCollection = htmlCollectionArr.join("")
                                resolve(stringifyCollection);
                                // post to server our html json collection
                                axios.post('http://127.0.0.1:8082/setReplaysHTMLCollectionString', {
                                    collection: stringifyCollection 
                                })
                                .catch(postCollectingStringErr => {
                                    console.log(postCollectingStringErr)
                                })
                                axios.post('http://127.0.0.1:8082/setRowParam', {
                                    rowParam: rowParam
                                })
                                .catch(postRowErr => {
                                    console.log(postRowErr)
                                })
                                axios.post('http://127.0.0.1:8082/setPageParam', {
                                    pageParam: pageParam
                                })
                                .catch(postPageErr => {
                                    console.log(postPageErr)
                                })
                            }
                        })
                    })
                }        
                // move all this into a function once we have what we need
                console.log(end)
                $('#subsetOfTotalReplay').text(`Showing ${end-rowParam + 1} - ${Math.min(end, result.data[1].length)} of ${result.data[1].length}`)
                $('#rowFilterColumn').show()
                $('#replayRowsDropdownButton').text(rowParam)
                let paginationElement = createPaginationElement(rowParam, pageParam, result.data[1].length)
                document.getElementById('someUL').innerHTML = paginationElement
            }
          //console.log(result.data);
        })
        .catch(err => {
          console.log(err)
        })
    })
}

function getRowParam(queryParams) {
    return new Promise(function(resolve, reject){
        // we might not have provided it if we are coming from a page that isn't index (settings)
        if (!queryParams.get('row')) {
            axios.get('http://127.0.0.1:8082/getGlobalRowParam')
            .then(resultRowParam => {
                resolve(resultRowParam.data.rowParam)
            })
            .catch(err => {
                console.log(err)
                resolve(25)
            })
        } else {
            resolve(queryParams.get('row'))
        }
    })
}

function getPageParam(queryParams) {
    return new Promise(function(resolve, reject){
        // we might not have provided it if we are coming from a page that isn't index (settings)
        if (!queryParams.get('page')) {
            axios.get('http://127.0.0.1:8082/getGlobalPageParam')
            .then(resultPageParam => {
                resolve(resultPageParam.data.pageParam)
            })
            .catch(err => {
                console.log(err)
                resolve(1)
            })
        } else {
            resolve(queryParams.get('page'))
        }
    })
}

function createPaginationElement(rowParam, pageParam, totalAmountOfReplays) {
    rowParam = parseInt(rowParam)
    pageParam = parseInt(pageParam)
    totalAmountOfReplays = parseInt(totalAmountOfReplays)
    var maxPageAmount = Math.ceil(totalAmountOfReplays/rowParam)
    var paginationElement = ``
    if (pageParam != 1) {
        paginationElement += `
            <li class="page-item">
            <a class="page-link" href="index.html?row=${rowParam}&page=${pageParam-1}" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
            </a>
            </li>
        `
    }
    if (pageParam > 2) {
        paginationElement += `
            <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=1">1</a></li>
        `
        paginationElement += `
            <li class="page-item"><a class="page-link">...</a></li>
        `
    }
    if (pageParam == maxPageAmount) {
        // try to add two before it
        if (pageParam - 2 >= 1) {
            paginationElement += `
                <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam - 2}">${pageParam - 2}</a></li>
            `
        }
        if (pageParam - 1 >= 1) {
            paginationElement += `
                <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam - 1}">${pageParam - 1}</a></li>
            `
        }
        paginationElement += `
            <li class="page-item active"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam}">${pageParam}</a></li>
        `
    } else {
    // add the three links
    let placement = pageParam % 3
    let counter = 0;
    switch (placement) {
        case 1:
            if (pageParam != 1) {
                paginationElement += `
                    <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam - 1}">${pageParam - 1}</a></li>
                `
            }
            paginationElement += `
                <li class="page-item active"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam}">${pageParam}</a></li>
            `
            console.log(maxPageAmount, pageParam + 1)
            if (pageParam + 1 <= maxPageAmount) {
                paginationElement += `
                    <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam + 1}">${pageParam + 1}</a></li>
                `
            }
            if (pageParam == 1 && maxPageAmount >= 3) {
                paginationElement += `
                    <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam + 2}">${pageParam + 2}</a></li>
                `
            }
            break;
        case 2:
            paginationElement += `
                <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam - 1}">${pageParam - 1}</a></li>
            `
            paginationElement += `
                <li class="page-item active"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam}">${pageParam}</a></li>
            `
            console.log(maxPageAmount, pageParam + 1)
            if (pageParam + 1 <= maxPageAmount) {
                paginationElement += `
                    <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam + 1}">${pageParam + 1}</a></li>
                `
            }
            break;
        case 0:
            paginationElement += `
                <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam - 1}">${pageParam - 1}</a></li>
            `
            paginationElement += `
                <li class="page-item active"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam}">${pageParam}</a></li>
            `
            if (pageParam + 1 <= maxPageAmount) {
                paginationElement += `
                    <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${pageParam + 1}">${pageParam + 1}</a></li>
                `
            }
            break;
    }
    }
    if (pageParam <= maxPageAmount - 2) {
        paginationElement += `
            <li class="page-item"><a class="page-link">...</a></li>
        `
        paginationElement += `
            <li class="page-item"><a class="page-link" href="index.html?row=${rowParam}&page=${maxPageAmount}">${maxPageAmount}</a></li>
        `
    }
    if (pageParam != maxPageAmount) {
        paginationElement += `
            <li class="page-item">
            <a class="page-link" href="index.html?row=${rowParam}&page=${pageParam+1}" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
            </a>
            </li>
        `
    }
    return paginationElement
}

function displayLoadProgress(currentProgress, denominator) {
    $('#loadPercentText').text(`${currentProgress}\\${denominator} files loaded ...`)
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

    $('.rowFilterOption').click(function(e){
        let rowAmount = parseInt(e.currentTarget.innerText)
        window.location.href = `index.html?row=${rowAmount}&page=1`
    })

});

function handleCircleClick() {

}