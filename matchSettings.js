import {captainIDToName, sidekickIDToName, stadiumIDToName, compareStatEquality, itemIDToName, itemIDAndAmountToName, timeToString} from './clientUtilities.js'

$(document).ready(function(){

    var jsonStats;
    var leftTeamItemToggle = "basic";
    var rightTeamItemToggle = "basic";
    getSummary()

    function getSummary() {
        var fileName = window.location.search.split('?fileName=')[1];
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8082/getMatchSummary?fileName=' + fileName,
            success: function(data){
                console.log(data);
                jsonStats = data;
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
        $('#leftSideItemAmount').text(`${statsJSON['Left Team Item Count']}`);
        $('#leftSideHits').text(statsJSON['Left Side Match Stats']['Hits']);
        $('#leftSideSteals').text(statsJSON['Left Side Match Stats']['Steals']);
        $('#leftSideSuperStrikes').text(statsJSON['Left Side Match Stats']['Super Strikes']);
        $('#leftSidePerfectPasses').text(statsJSON['Left Side Match Stats']['Perfect Passes']);

        $('#rightSideGoals').text(statsJSON['Right Side Match Stats']['Goals']);
        $('#rightSideShots').text(statsJSON['Right Side Match Stats']['Shots']);
        $('#rightSideItemAmount').text(`${statsJSON['Right Team Item Count']}`);
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

        compareResult = compareStatEquality(statsJSON['Left Team Item Count'], statsJSON['Right Team Item Count'])
        if (compareResult == 1) {
            $('#leftSideItemAmount').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSideItemAmount').addClass('surplusStat')
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

        setBasicLeftItemTable()
        setBasicRightItemTable()
        setBasicLeftGoalTable()
        setBasicRightGoalTable()
    }

    function setBasicLeftItemTable() {
        document.getElementById("leftTeamItemTableBody").innerHTML = "";
        $('#leftTeamItemUseColumn').text('# Of Times Used')
        $('#toggleLeftTeamItemView').text("Toggle to Detailed View")

        if (!jsonStats['Left Team Item Info'].length) {
            $('#leftTeamMostUsedItem').text(`No Items Were Used`)
            return;
        }
        
        var ourItemMap = new Map();
        for (var i=0; i < jsonStats['Left Team Item Info'].length; i++) {
            var specificItemType = jsonStats['Left Team Item Info'][i][0] + "-" + jsonStats['Left Team Item Info'][i][1]
            if (ourItemMap.has(specificItemType)) {
                var timesSeen = ourItemMap.get(specificItemType)
                timesSeen++;
                ourItemMap.set(specificItemType, timesSeen);
            } else {
                ourItemMap.set(specificItemType, 1);
            }
        }
        var sortedItemMap = new Map([...ourItemMap.entries()].sort((a, b) => b[1] - a[1]));
        var sortedItemArr = Array.from(sortedItemMap);
        console.log(sortedItemArr)
        var mostUsedItemArr = sortedItemArr[0];
        var splitMostUsedItemArr = mostUsedItemArr[0].split('-')
        var mostUsedItemType = itemIDAndAmountToName(splitMostUsedItemArr[0], splitMostUsedItemArr[1]);
        $('#leftTeamMostUsedItem').text(`${mostUsedItemType} (${mostUsedItemArr[1]} Times)`)

        for (var i = 0; i < sortedItemArr.length; i++) {
            var currentArrayElement = sortedItemArr[i];
            var itemUsedArr = currentArrayElement[0].split('-');
            var localTR = document.createElement("tr");
            var itemTD = document.createElement("td");
            var itemString = itemIDAndAmountToName(itemUsedArr[0], itemUsedArr[1])
            itemTD.innerHTML = itemString;
            var amountUsedTD = document.createElement("td");
            amountUsedTD.innerHTML = currentArrayElement[1];
            localTR.append(itemTD);
            localTR.append(amountUsedTD);
            document.getElementById("leftTeamItemTableBody").append(localTR)
        }
    }

    function setBasicRightItemTable() {
        document.getElementById("rightTeamItemTableBody").innerHTML = "";
        $('#rightTeamItemUseColumn').text('# Of Times Used')
        $('#toggleRightTeamItemView').text("Toggle to Detailed View")

        if (!jsonStats['Right Team Item Info'].length) {
            $('#rightTeamMostUsedItem').text(`No Items Were Used`)
            return;
        }

        var ourItemMap = new Map();
        for (var i=0; i < jsonStats['Right Team Item Info'].length; i++) {
            var specificItemType = jsonStats['Right Team Item Info'][i][0] + "-" + jsonStats['Right Team Item Info'][i][1]
            if (ourItemMap.has(specificItemType)) {
                var timesSeen = ourItemMap.get(specificItemType)
                timesSeen++;
                ourItemMap.set(specificItemType, timesSeen);
            } else {
                ourItemMap.set(specificItemType, 1);
            }
        }
        var sortedItemMap = new Map([...ourItemMap.entries()].sort((a, b) => b[1] - a[1]));
        var sortedItemArr = Array.from(sortedItemMap);
        var mostUsedItemArr = sortedItemArr[0];
        var splitMostUsedItemArr = mostUsedItemArr[0].split('-')
        var mostUsedItemType = itemIDAndAmountToName(splitMostUsedItemArr[0], splitMostUsedItemArr[1]);
        $('#rightTeamMostUsedItem').text(`${mostUsedItemType} (${mostUsedItemArr[1]} Times)`)

        for (var i = 0; i < sortedItemArr.length; i++) {
            var currentArrayElement = sortedItemArr[i];
            var itemUsedArr = currentArrayElement[0].split('-');
            var localTR = document.createElement("tr");
            var itemTD = document.createElement("td");
            var itemString = itemIDAndAmountToName(itemUsedArr[0], itemUsedArr[1])
            itemTD.innerHTML = itemString;
            var amountUsedTD = document.createElement("td");
            amountUsedTD.innerHTML = currentArrayElement[1];
            localTR.append(itemTD);
            localTR.append(amountUsedTD);
            document.getElementById("rightTeamItemTableBody").append(localTR)
        }
    }

    function setDetailedLeftItemTable() {
        document.getElementById("leftTeamItemTableBody").innerHTML = "";
        $('#leftTeamItemUseColumn').text('Time Used')
        $('#toggleLeftTeamItemView').text("Toggle to Basic View")

        for (var i=0; i < jsonStats['Left Team Item Info'].length; i++) {
            var localTR = document.createElement("tr");
            var itemTD = document.createElement("td");
            var itemString = itemIDAndAmountToName(jsonStats['Left Team Item Info'][i][0], jsonStats['Left Team Item Info'][i][1])
            itemTD.innerHTML = itemString;
            var timeTD = document.createElement("td");
            var timeString = timeToString(jsonStats['Left Team Item Info'][i][2])
            timeTD.innerHTML = timeString;
            localTR.append(itemTD);
            localTR.append(timeTD);
            document.getElementById("leftTeamItemTableBody").append(localTR)
        }


    }

    function setDetailedRightItemTable() {
        document.getElementById("rightTeamItemTableBody").innerHTML = "";
        $('#rightTeamItemUseColumn').text('Time Used')
        $('#toggleRightTeamItemView').text("Toggle to Basic View")

        for (var i=0; i < jsonStats['Right Team Item Info'].length; i++) {
            var localTR = document.createElement("tr");
            var itemTD = document.createElement("td");
            var itemString = itemIDAndAmountToName(jsonStats['Right Team Item Info'][i][0], jsonStats['Right Team Item Info'][i][1])
            itemTD.innerHTML = itemString;
            var timeTD = document.createElement("td");
            var timeString = timeToString(jsonStats['Right Team Item Info'][i][2])
            timeTD.innerHTML = timeString;
            localTR.append(itemTD);
            localTR.append(timeTD);
            document.getElementById("rightTeamItemTableBody").append(localTR)
        }
    }

    $('#toggleLeftTeamItemView').click(function(){
        if (leftTeamItemToggle == "basic") {
            leftTeamItemToggle = "detailed";
            setDetailedLeftItemTable();
        } else {
            leftTeamItemToggle = "basic";
            setBasicLeftItemTable();
        }
    })

    $('#toggleRightTeamItemView').click(function(){
        if (rightTeamItemToggle == "basic") {
            rightTeamItemToggle = "detailed";
            setDetailedRightItemTable();
        } else {
            rightTeamItemToggle = "basic";
            setBasicRightItemTable();
        }
    })

    function setBasicLeftGoalTable() {
        if (!jsonStats['Left Team Goal Info'].length) {
            $('#leftTeamGoalMessage').text(`No Goals Were Scored By ${captainIDToName(jsonStats['Left Side Captain ID'])}`)
            $('#leftTeamGoalMessage').show()
            return;
        }
        for (var i = 0; i < jsonStats['Left Team Goal Info'].length; i++) {
            var localTR = document.createElement("tr");
            var goalNumberTD = document.createElement("td");
            goalNumberTD.innerHTML = i + 1;
            var goalTimeTD = document.createElement("td");
            var timeString = timeToString(jsonStats['Left Team Goal Info'][i])
            goalTimeTD.innerHTML = timeString;
            localTR.append(goalNumberTD);
            localTR.append(goalTimeTD);
            document.getElementById("leftTeamGoalTableBody").append(localTR)
        }
    }

    function setBasicRightGoalTable() {
        if (!jsonStats['Right Team Goal Info'].length) {
            $('#rightTeamGoalMessage').text(`No Goals Were Scored By ${captainIDToName(jsonStats['Right Side Captain ID'])}`)
            $('#rightTeamGoalMessage').show()
            return;
        }
        for (var i = 0; i < jsonStats['Right Team Goal Info'].length; i++) {
            var localTR = document.createElement("tr");
            var goalNumberTD = document.createElement("td");
            goalNumberTD.innerHTML = i + 1;
            var goalTimeTD = document.createElement("td");
            var timeString = timeToString(jsonStats['Right Team Goal Info'][i])
            goalTimeTD.innerHTML = timeString;
            localTR.append(goalNumberTD);
            localTR.append(goalTimeTD);
            document.getElementById("rightTeamGoalTableBody").append(localTR)
        }
    }
})