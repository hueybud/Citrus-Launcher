import {captainIDToName, sidekickIDToName, stadiumIDToName, compareStatEquality} from './clientUtilities.js'

$(document).ready(function(){

    getSummary()

    function getSummary() {
        var fileName = window.location.search.split('?fileName=')[1];
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8082/getMatchSummary?fileName=' + fileName,
            success: function(data){
                console.log(data);
                setMatchSummary(data)
            },
            error: function(err) {
                console.log(err);
            }
        })
    }

    function setMatchSummary(statsJSON) {
        var leftSideCaptain = captainIDToName(statsJSON['Left Side Captain ID'])
        var leftSideSidekick = sidekickIDToName(statsJSON['Left Side Sidekick ID'])
        $('#leftSideCaptainName').attr('src', `./assets/images/Captains/${leftSideCaptain}.png`)
        $('#leftSideSidekickName').attr('src', `./assets/images/Sidekicks/${leftSideSidekick}.png`)

        var rightSideCaptain = captainIDToName(statsJSON['Right Side Captain ID'])
        var rightSideSidekick = sidekickIDToName(statsJSON['Right Side Sidekick ID'])
        $('#rightSideCaptainName').attr('src', `./assets/images/Captains/${rightSideCaptain}.png`)
        $('#rightSideSidekickName').attr('src', `./assets/images/Sidekicks/${rightSideSidekick}.png`)

        $('#leftSideGoals').text(statsJSON['Left Side Match Stats']['Goals']);
        $('#leftSideShots').text(statsJSON['Left Side Match Stats']['Shots']);
        $('#leftSideHits').text(statsJSON['Left Side Match Stats']['Hits']);
        $('#leftSideSteals').text(statsJSON['Left Side Match Stats']['Steals']);
        $('#leftSideSuperStrikes').text(statsJSON['Left Side Match Stats']['Super Strikes']);
        $('#leftSidePerfectPasses').text(statsJSON['Left Side Match Stats']['Perfect Passes']);

        $('#rightSideGoals').text(statsJSON['Right Side Match Stats']['Goals']);
        $('#rightSideShots').text(statsJSON['Right Side Match Stats']['Shots']);
        $('#rightSideHits').text(statsJSON['Right Side Match Stats']['Hits']);
        $('#rightSideSteals').text(statsJSON['Right Side Match Stats']['Steals']);
        $('#rightSideSuperStrikes').text(statsJSON['Right Side Match Stats']['Super Strikes']);
        $('#rightSidePerfectPasses').text(statsJSON['Right Side Match Stats']['Perfect Passes']);

        var compareResult = compareStatEquality(statsJSON['Left Side Match Stats']['Goals'], statsJSON['Right Side Match Stats']['Goals'])
        if (compareResult == 1) {
            $('#leftSideGoals').addClass('surplusStat')
        } else {
            $('#rightSideGoals').addClass('surplusStat')
        }

        compareResult = compareStatEquality(statsJSON['Left Side Match Stats']['Shots'], statsJSON['Right Side Match Stats']['Shots'])
        if (compareResult == 1) {
            $('#leftSideShots').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSideShots').addClass('surplusStat')
        }

        compareResult = compareStatEquality(statsJSON['Left Side Match Stats']['Hits'], statsJSON['Right Side Match Stats']['Hits'])
        if (compareResult == 1) {
            $('#leftSideHits').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSideHits').addClass('surplusStat')
        }

        compareResult = compareStatEquality(statsJSON['Left Side Match Stats']['Steals'], statsJSON['Right Side Match Stats']['Steals'])
        if (compareResult == 1) {
            $('#leftSideSteals').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSideSteals').addClass('surplusStat')
        }

        compareResult = compareStatEquality(statsJSON['Left Side Match Stats']['Super Strikes'], statsJSON['Right Side Match Stats']['Super Strikes'])
        if (compareResult == 1) {
            $('#leftSideSuperStrikes').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSideSuperStrikes').addClass('surplusStat')
        }

        compareResult = compareStatEquality(statsJSON['Left Side Match Stats']['Perfect Passes'], statsJSON['Right Side Match Stats']['Perfect Passes'])
        if (compareResult == 1) {
            $('#leftSidePerfectPasses').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSidePerfectPasses').addClass('surplusStat')
        }
    }
})