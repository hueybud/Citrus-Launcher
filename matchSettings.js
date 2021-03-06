import {captainIDToName, sidekickIDToName, stadiumIDToName, compareStatEquality, itemIDToName, itemIDAndAmountToName, timeToString, matchDifficultyToString, isCitrusISO} from './clientUtilities.js'

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
        $('#glanceStadium').text(`Stadium : ${stadiumIDToName(statsJSON['Stadium ID'])}`)
        $('#glanceNetplay').text(`NetPlay : ${parseInt(statsJSON['Netplay Match']) ? "Yes" : "No"}`)
        var suddenDeath = parseInt(statsJSON['Overtime Not Reached'])
        var timeAlotted = statsJSON['Match Time Allotted'];
        var timeElapsed = statsJSON['Match Time Elapsed']
        var suddenDeathBool = false;
        // there is a scenario we don't cover through all of this where they quit in sudden death *sad face*
        // translate our jank way of tracking suddeen death to a meaningful boolean
        // if our json reports that 'Overtime Not Reached' is 1, we definitely did not do sudden death
        if (suddenDeath) {
            suddenDeathBool = false;
        } else {
            // however, if it reports 0, saying that we did reach overtime, we need to double check that
            // when quitting, our flag has no chance of being set to 1, so we need to check our time allotted and elapsed to make the executive decision
            if (Math.floor(timeElapsed) >= timeAlotted) {
                suddenDeathBool = true;
            }
        }
        $('#glanceOvertime').text(`Sudden Death : ${suddenDeathBool ? "Yes" : "No"}`)
        if (suddenDeathBool) {
            $('#glanceDuration').text(`Duration : ${timeToString(timeElapsed)}`)
        } else {
            // if we quit, we want to show the true amount of time the game was played for
            // if we played a normal match and it wasn't sudden death, time alotted is always smaller than elapsed
            // we leave out the scenario where they quit in sudden death
            $('#glanceDuration').text(`Duration : ${timeToString(Math.min(timeElapsed, timeAlotted))}`)
        }



        var leftSideCaptain = captainIDToName(statsJSON['Left Side Captain ID'])
        var leftSideSidekick = sidekickIDToName(statsJSON['Left Side Sidekick ID'])
        $('#leftSideCaptainName').attr('src', `./assets/images/Captains/${leftSideCaptain}.png`)
        if (statsJSON['Left Side Captain ID'] == 8) {
            $('#leftSideSidekickName').attr('src', `./assets/images/Sidekicks/${leftSideCaptain}.png`)
        } else {
            $('#leftSideSidekickName').attr('src', `./assets/images/Sidekicks/${leftSideSidekick}.png`)
        }

        var rightSideCaptain = captainIDToName(statsJSON['Right Side Captain ID'])
        var rightSideSidekick = sidekickIDToName(statsJSON['Right Side Sidekick ID'])
        $('#rightSideCaptainName').attr('src', `./assets/images/Captains/${rightSideCaptain}.png`)
        if (statsJSON['Right Side Captain ID'] == 8) {
            $('#rightSideSidekickName').attr('src', `./assets/images/Sidekicks/${rightSideCaptain}.png`)
        } else {
            $('#rightSideSidekickName').attr('src', `./assets/images/Sidekicks/${rightSideSidekick}.png`)
        }

        if (statsJSON['Left Team Player Info']) {
            for (var i =0; i < statsJSON['Left Team Player Info'].length; i++) {
                var pElement = document.createElement('p');
                pElement.innerHTML = statsJSON['Left Team Player Info'][i];
                pElement.className = "playerName surplusStat";
                document.getElementById("leftTeamCharacterContainer").append(pElement);
            }
        }

        if (statsJSON['Right Team Player Info']) {
            for (var i =0; i < statsJSON['Right Team Player Info'].length; i++) {
                var pElement = document.createElement('p');
                pElement.innerHTML = statsJSON['Right Team Player Info'][i];
                pElement.className = "playerName surplusStat";
                document.getElementById("rightTeamCharacterContainer").append(pElement);
            }
        }

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
        } else if (compareResult == -1) {
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
        setRuleset()
        setGoalGraph()
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
        var mostUsedItemQuantity = sortedItemArr[0][1]
        var arrOfMostUsedItems = sortedItemArr.filter(item => item[1] == mostUsedItemQuantity)
        console.log(arrOfMostUsedItems)
        var resultArr = []
        arrOfMostUsedItems.map(function(item){
            console.log(item)
            var mostUsedItemArr = item[0];
            var splitMostUsedItemArr = mostUsedItemArr.split('-')
            var mostUsedItemType = itemIDAndAmountToName(splitMostUsedItemArr[0], splitMostUsedItemArr[1]);
            resultArr.push(`${mostUsedItemType} (${mostUsedItemQuantity} Times)`)
        })
        $('#leftTeamMostUsedItem').text(`${resultArr.join(", ")}`)

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
        var mostUsedItemQuantity = sortedItemArr[0][1]
        var arrOfMostUsedItems = sortedItemArr.filter(item => item[1] == mostUsedItemQuantity)
        console.log(arrOfMostUsedItems)
        var resultArr = []
        arrOfMostUsedItems.map(function(item){
            console.log(item)
            var mostUsedItemArr = item[0];
            var splitMostUsedItemArr = mostUsedItemArr.split('-')
            var mostUsedItemType = itemIDAndAmountToName(splitMostUsedItemArr[0], splitMostUsedItemArr[1]);
            resultArr.push(`${mostUsedItemType} (${mostUsedItemQuantity} Times)`)
        })
        $('#rightTeamMostUsedItem').text(`${resultArr.join(", ")}`)

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
            var timeString = timeToString(jsonStats['Left Team Goal Info'][i][0])
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
            var timeString = timeToString(jsonStats['Right Team Goal Info'][i][0])
            goalTimeTD.innerHTML = timeString;
            localTR.append(goalNumberTD);
            localTR.append(goalTimeTD);
            document.getElementById("rightTeamGoalTableBody").append(localTR)
        }
    }

    function setRuleset() {
        $('#rulsetModalDifficulty').text(`${matchDifficultyToString(jsonStats['Match Difficulty'])}`);
        $('#rulsetModalMatchTime').text(`${timeToString(jsonStats['Match Time Allotted'])}`);
        $('#rulsetModalItems').text(`${parseInt(jsonStats['Match Items']) ? "On" : "Off"}`)
        $('#rulsetModalSuperStrikes').text(`${parseInt(jsonStats['Match Super Strikes']) ? "On" : "Off"}`)
        if (isCitrusISO(jsonStats['Game Hash'])) {
            $('#rulesetIsCitrusISO').text('Citrus Build ISO')
            $('#rulesetIsCitrusISO').show();
            $('#rulsetModalBowser').html(`<span class="text-danger">First To 7 : </span><b>${parseInt(jsonStats['Match Bowser or FTX']) ? "On" : "Off"}</b>`)
        } else {
            $('#rulsetModalBowser').html(`<span>Bowser Attack : </span><b>${parseInt(jsonStats['Match Bowser or FTX']) ? "On" : "Off"}</b>`)
        }
    }

    function setGoalGraph() {
        if (jsonStats['Left Team Missed Shots Info'] && jsonStats['Right Team Missed Shots Info']) {
            var goalCoordinates = jsonStats["Left Team Goal Info"].concat(jsonStats['Right Team Goal Info'])
            console.log(goalCoordinates);
            var missedShotCoordinates = jsonStats['Left Team Missed Shots Info'].concat(jsonStats['Right Team Missed Shots Info'])
            console.log(missedShotCoordinates)
            var canvas = document.getElementById("myCanvas");
            var ctx = canvas.getContext("2d");
            for (var i = 0; i < missedShotCoordinates.length; i++) {
                ctx.beginPath();
                ctx.fillStyle = "#FF0000";
                ctx.arc(transformX(missedShotCoordinates[i][1]),transformY(missedShotCoordinates[i][2]),5,0,2*Math.PI);
                ctx.stroke();
                ctx.fill();
            }
            for (var i = 0; i < goalCoordinates.length; i++) {
                ctx.beginPath();
                ctx.fillStyle = "#00FF00";
                ctx.arc(transformX(goalCoordinates[i][1]),transformY(goalCoordinates[i][2]),5,0,2*Math.PI);
                ctx.stroke();
                ctx.fill();
            }
            ctx.strokeStyle = "#BBBBBB";
            ctx.moveTo(300, 0);
            ctx.lineTo(300, 348);
            ctx.stroke();
            ctx.beginPath();
            // if we change dimensions this has to be updated by ratioing area
            ctx.arc(300,174,51.7,0,2*Math.PI);
            ctx.stroke();
            // outer left box
            ctx.moveTo(transformX(-20.2), transformY(5.2));
            ctx.lineTo(transformX(-13.5), transformY(5.2));
            ctx.stroke();
            ctx.moveTo(transformX(-20.2), transformY(-5.2));
            ctx.lineTo(transformX(-13.5), transformY(-5.2));
            ctx.stroke();
            ctx.moveTo(transformX(-13.5), transformY(-5.2));
            ctx.lineTo(transformX(-13.5), transformY(5.2));
            ctx.stroke();
            // inner left box
            ctx.moveTo(transformX(-20.2), transformY(2.6));
            ctx.lineTo(transformX(-17.5), transformY(2.6));
            ctx.stroke();
            ctx.moveTo(transformX(-20.2), transformY(-2.6));
            ctx.lineTo(transformX(-17.5), transformY(-2.6));
            ctx.stroke();
            ctx.moveTo(transformX(-17.5), transformY(2.6));
            ctx.lineTo(transformX(-17.5), transformY(-2.6));
            ctx.stroke();
            // needs to be adjusted
            // outer right box
            // outer left box
            ctx.moveTo(transformX(20.2), transformY(5.2));
            ctx.lineTo(transformX(13.5), transformY(5.2));
            ctx.stroke();
            ctx.moveTo(transformX(20.2), transformY(-5.2));
            ctx.lineTo(transformX(13.5), transformY(-5.2));
            ctx.stroke();
            ctx.moveTo(transformX(13.5), transformY(-5.2));
            ctx.lineTo(transformX(13.5), transformY(5.2));
            ctx.stroke();
            // inner left box
            ctx.moveTo(transformX(20.2), transformY(2.6));
            ctx.lineTo(transformX(17.5), transformY(2.6));
            ctx.stroke();
            ctx.moveTo(transformX(20.2), transformY(-2.6));
            ctx.lineTo(transformX(17.5), transformY(-2.6));
            ctx.stroke();
            ctx.moveTo(transformX(17.5), transformY(2.6));
            ctx.lineTo(transformX(17.5), transformY(-2.6));
            ctx.stroke();
        } else {
            $('#goalCanvasRow').hide()
        }
        //ctx.font = "20px Helvetica Neue";
        //ctx.strokeText("1", 295, 105);
    }

    // match stage is 40.62x23.56 (so -20.31 to +20.31 x -11.78 to +11.78)
    function transformX(input) {
        // x dimension is 20.31
        // x factor is (width of canvas / 2) / 20.31
        // additive is width / 2
        var additive = (document.getElementById('myCanvas').offsetWidth / 2);
        var weight = additive / 20.31
        return (input * weight) + additive
    }
    function transformY(input) {
        // y dimension is 11.78
        // x factor is (height of canvas / 2) / 11.78
        // additive is height / 2
        var additive = (document.getElementById('myCanvas').offsetHeight / 2);
        var weight = additive / 11.78
        return (input * -weight) + additive
    }

    $('#rulesetElement').on('click', function(){
        var myModal = new bootstrap.Modal(document.getElementById('rulesetModal'))
        myModal.show();
    })

    $(document).on('click', '.circleIconOuter', function(){
        var fileName = jsonStats['File Name'];
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
    })
})