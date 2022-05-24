import {captainIDToName, sidekickIDToName, stadiumIDToName} from './clientUtilities.js'

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
        $('#leftSideCaptainName').attr('src', `./assets/Captains/${leftSideCaptain}.png`)
        $('#leftSideSidekickName').attr('src', `./assets/Sidekicks/${leftSideSidekick}.png`)

        var rightSideCaptain = captainIDToName(statsJSON['Right Side Captain ID'])
        var rightSideSidekick = sidekickIDToName(statsJSON['Right Side Sidekick ID'])
        $('#rightSideCaptainName').attr('src', `./assets/Captains/${rightSideCaptain}.png`)
        $('#rightSideSidekickName').attr('src', `./assets/Sidekicks/${rightSideSidekick}.png`)

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
    }
})