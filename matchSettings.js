import {captainIDToName, sidekickIDToName, stadiumIDToName, compareStatEquality, itemIDToName, itemIDAndAmountToName, timeToString, matchDifficultyToString, isCitrusISO} from './clientUtilities.js'

$(document).ready(function(){

    $('#madeOrMissedDropdown').multiselect({
        nonSelectedText: 'None Selected',
        allSelectedText: 'Made & Missed',
        templates: {
          button: '<button type="button" class="multiselect dropdown-toggle btn btn-primary" data-bs-toggle="dropdown" aria-expanded="false"><span class="multiselect-selected-text"></span></button>',
        },
        onChange: function(option, checked, select) {
            /*
            let selectedValues = $('#madeOrMissedDropdown').val()
            if (selectedValues.length == 0) {
                $('#madeOrMissedDropdown').multiselect('select', option[0]['value'])
                alert("Cannot have no shots selected")
            }
            */
            updateGoalGraph()
        }           
    });
    $("#madeOrMissedDropdown").multiselect('selectAll', false);
    $("#madeOrMissedDropdown").multiselect('updateButtonText');
    
    $('#shotTypeDropdown').multiselect({
        nonSelectedText: 'None Selected',
        allSelectedText: 'All Shot Types',
        templates: {
          button: '<button type="button" class="multiselect dropdown-toggle btn btn-primary" data-bs-toggle="dropdown" aria-expanded="false"><span class="multiselect-selected-text"></span></button>',
        },    
        onChange: function() {
            updateGoalGraph();
        }         
    });
    $("#shotTypeDropdown").multiselect('selectAll', false);
    $("#shotTypeDropdown").multiselect('updateButtonText');

    var shotInfoMap = new Map([
        ["Corner", {
            "title": "Corner Shot",
            "videoURL": `<div style='position:relative; padding-bottom:calc(55.43% + 44px)'><iframe src='https://gfycat.com/ifr/GreatPiercingLaughingthrush' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>`,
            "description": "A fully charged shot taken from the corners near the midfield. Higher percentage success rate than most shots due to the trajectory of the ball getting around Kritter"
        }],
        ["Box Chip", {
            "title": "Box Chip",
            "videoURL": `<div style='position:relative; padding-bottom:calc(55.89% + 44px)'><iframe src='https://gfycat.com/ifr/GracefulMarriedAffenpinscher' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>`,
            "description": "A shot taken from the corner of the goalie box. The shooter faces away from the goalie and then does a lob shot, aiming for the opposite post from where they are standing. <br><br> Very high percentage shot on all maps so long as you shoot from the right place. Palace and Konga have the most strict positioning requirements."
        }],
        ["Slide", {
            "title": "Slide Shot",
            "videoURL": `<div style='position:relative; padding-bottom:calc(55.43% + 44px)'><iframe src='https://gfycat.com/ifr/BothAppropriateArchaeopteryx' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>`,
            "description": "A charged shot taken in the goalie box by sliding while charging the shot. Kritter does not move while the ball is charging so the objective is to make an opening while charging."
        }],
        ["LAB", {
            "title": "LAB (Dinker)",
            "videoURL": `<div style='position:relative; padding-bottom:calc(55.89% + 44px)'><iframe src='https://gfycat.com/ifr/DisguisedOddballAzurevase' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>`,
            "description": "L+A -> B. A lob pass to a teammate which is shot in midair. Low-percentage shot but is relatively safe. The location of the shot is important as LABs done closer to the goal have a better chance of going in."
        }],
        ["European", {
            "title": "European",
            "videoURL": `<div style='position:relative; padding-bottom:calc(55.33% + 44px)'><iframe src='https://gfycat.com/ifr/HastyThoseIvorygull' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>`,
            "description": "A lob shot taken from the corner near the midfield. The goal is to get the ball to bounce off the post or wall near the goalie and have a nearby teammate kick a goal in."
        }],
        ["Dirty European", {
            "title": "Dirty European",
            "videoURL": `<div style='position:relative; padding-bottom:calc(55.70% + 44px)'><iframe src='https://gfycat.com/ifr/GlitteringGlossyGartersnake' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0;' allowfullscreen></iframe></div>`,
            "description": "A European that goes straight into the goal without needing a rebound."
        }],

    ]);


    var filteredArr = [];

    var jsonStats;
    var leftTeamItemToggle = "basic";
    var rightTeamItemToggle = "basic";
    class ShotObject {
        constructor(side, madeOrMissed, specificShotType, genericShotType, timestamp, xyVel, xPos, yPos, zPos, xVel, yVel, zVel, chargeAmount) {
            this.side = side;
            this.madeOrMissed = madeOrMissed;
            this.specificShotType = specificShotType;
            this.genericShotType = genericShotType;
            this.timestamp = timestamp;
            this.xyVel = xyVel;
            this.xPos = xPos;
            this.yPos = yPos;
            this.zPos = zPos;
            this.xVel = xVel;
            this.yVel = yVel;
            this.zVel = zVel;
            this.chargeAmount = chargeAmount;
        }
    }
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

        let leftTeamGoalToShotRatio = Math.round((statsJSON['Left Side Match Stats']['Goals']/statsJSON['Left Side Match Stats']['Shots']) * 100)
        if (isNaN(leftTeamGoalToShotRatio)) {
            leftTeamGoalToShotRatio = 0;
        }
        let rightTeamGoalToShotRatio = Math.round((statsJSON['Right Side Match Stats']['Goals']/statsJSON['Right Side Match Stats']['Shots']) * 100)
        if (isNaN(rightTeamGoalToShotRatio)) {
            rightTeamGoalToShotRatio = 0;
        }

        $('#leftSideGoals').text(statsJSON['Left Side Match Stats']['Goals']);
        $('#leftSideShots').text(statsJSON['Left Side Match Stats']['Shots']);
        $('#leftSideShotPercentage').text(statsJSON['Left Side Match Stats']['Goals'] + "/" + statsJSON['Left Side Match Stats']['Shots'] + " (" + leftTeamGoalToShotRatio + "%)")
        $('#leftSideItemAmount').text(`${statsJSON['Left Team Item Count']}`);
        $('#leftSideHits').text(statsJSON['Left Side Match Stats']['Hits']);
        $('#leftSideSteals').text(statsJSON['Left Side Match Stats']['Steals']);
        $('#leftSideSuperStrikes').text(statsJSON['Left Side Match Stats']['Super Strikes']);
        $('#leftSidePerfectPasses').text(statsJSON['Left Side Match Stats']['Perfect Passes']);
        if (statsJSON.hasOwnProperty('Left Team Frames Possessed Ball') && statsJSON.hasOwnProperty('Right Team Frames Possessed Ball')) {
            let possessionIntObj = {leftTeam: parseInt(statsJSON['Left Team Frames Possessed Ball']), rightTeam: parseInt(statsJSON['Right Team Frames Possessed Ball']), total: parseInt(statsJSON['Left Team Frames Possessed Ball']) + parseInt(statsJSON['Right Team Frames Possessed Ball'])}
            
            let leftTeamOwnershipPercent = (possessionIntObj.leftTeam / possessionIntObj.total);
            let leftTeamOwnershipSeconds = leftTeamOwnershipPercent * timeElapsed;
            let leftTeamTimePossessedString = timeToString(leftTeamOwnershipSeconds)

            let rightTeamOwnershipPercent = (possessionIntObj.rightTeam / possessionIntObj.total);
            let rightTeamOwnershipSeconds = rightTeamOwnershipPercent * timeElapsed;
            let rightTeamTimePossessedString = timeToString(rightTeamOwnershipSeconds)

            $('#leftSideOwnershipTime').text(leftTeamTimePossessedString + " " + "(" + Math.round(((leftTeamOwnershipPercent)*100)) + "%)")
            $('#rightSideOwnershipTime').text(rightTeamTimePossessedString + " " + "(" + Math.round(((rightTeamOwnershipPercent)*100)) + "%)")
        } else {
            $('#ownershipRow').hide()
        }

        $('#rightSideGoals').text(statsJSON['Right Side Match Stats']['Goals']);
        $('#rightSideShots').text(statsJSON['Right Side Match Stats']['Shots']);
        $('#rightSideShotPercentage').text(statsJSON['Right Side Match Stats']['Goals'] + "/" + statsJSON['Right Side Match Stats']['Shots'] + " (" + rightTeamGoalToShotRatio + "%)")
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

        compareResult = compareStatEquality(leftTeamGoalToShotRatio, rightTeamGoalToShotRatio);
        if (compareResult == 1) {
            $('#leftSideShotPercentage').addClass('surplusStat')
        } else if (compareResult == -1) {
            $('#rightSideShotPercentage').addClass('surplusStat')
        }

        if (statsJSON.hasOwnProperty('Left Team Frames Possessed Ball') && statsJSON.hasOwnProperty('Right Team Frames Possessed Ball')) {
            compareResult = compareStatEquality(statsJSON['Left Team Frames Possessed Ball'], statsJSON['Right Team Frames Possessed Ball']);
            if (compareResult == 1) {
                $('#leftSideOwnershipTime').addClass('surplusStat')
            } else if (compareResult == -1) {
                $('#rightSideOwnershipTime').addClass('surplusStat')
            }
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

        let ourVersion;
        if (statsJSON.hasOwnProperty('Version')) {
            ourVersion = parseInt(statsJSON['Version'].split(".").join(""))
        } else {
            ourVersion = 0;
        }
        if (ourVersion >= 14) {
            // replace that for when version 0.1.4 is released
            statsJSON['enhancedGraph'] = true

            for (var elem in statsJSON["Left Team Missed Shots Info"]) {
                statsJSON["Left Team Missed Shots Info"][elem].push("missed")
            }

            for (var elem in statsJSON["Left Team Goal Info"]) {
                statsJSON["Left Team Goal Info"][elem].push("made")
            }

            for (var elem in statsJSON["Right Team Missed Shots Info"]) {
                statsJSON["Right Team Missed Shots Info"][elem].push("missed")
            }

            for (var elem in statsJSON["Right Team Goal Info"]) {
                statsJSON["Right Team Goal Info"][elem].push("made")
            }

            let allLeftTeamShotsSorted = statsJSON["Left Team Missed Shots Info"].concat(statsJSON["Left Team Goal Info"])
            allLeftTeamShotsSorted.sort(function(a,b){
                return a[0] - b[0];
            })
            statsJSON['All Left Team Shots'] = allLeftTeamShotsSorted;

            let allRightTeamShotsSorted = statsJSON["Right Team Missed Shots Info"].concat(statsJSON["Right Team Goal Info"])
            allRightTeamShotsSorted.sort(function(a,b){
                return a[0] - b[0];
            })
            statsJSON['All Right Team Shots'] = allRightTeamShotsSorted;

            // do some conditional to check how we decide to do new stuff. time based maybe idk
            // do stuff with new shot type info
            let prevShot = null;
            for (var i =0; i < allLeftTeamShotsSorted.length; i++) {
                let thisObj = allLeftTeamShotsSorted[i];
                let shotObj = transformShotObject("left", thisObj[thisObj.length - 1], prevShot, ...thisObj)
                statsJSON['All Left Team Shots'][i] = shotObj;
                prevShot = shotObj;
            }

            prevShot = null;
            for (var i =0; i < allRightTeamShotsSorted.length; i++) {
                let thisObj = allRightTeamShotsSorted[i];
                let shotObj = transformShotObject("right", thisObj[thisObj.length - 1], prevShot, ...thisObj)
                statsJSON['All Right Team Shots'][i] = shotObj;
                prevShot = shotObj;
            }
            statsJSON['All Shots'] = statsJSON['All Left Team Shots'].concat(statsJSON['All Right Team Shots'])
            setBasicLeftGoalTable(true)
            setBasicRightGoalTable(true)
            setLeftShotTypeTable()
            setRightShotTypeTable()
            setEnhancedGoalGraph()
            enableShotDescriptions()
        } else {
            statsJSON['enhancedGraph'] = false
            $('.shotTypeColumn').hide()
            $('#shotTypeRow').hide()
            setBasicLeftGoalTable(false)
            setBasicRightGoalTable(false)
            $('#goalCanvasButtonsRow').hide()
            setGoalGraph()
        }
        setBasicLeftItemTable()
        setBasicRightItemTable()
        setRuleset()
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

    function setBasicLeftGoalTable(shotTypeBool) {
        if (!jsonStats['Left Team Goal Info'].length) {
            $('#leftTeamGoalMessage').text(`No Goals Were Scored By ${captainIDToName(jsonStats['Left Side Captain ID'])}`)
            $('#leftTeamGoalMessage').show()
            return;
        }
        let enhancedLeftShotGoals;
        if (shotTypeBool) {
            enhancedLeftShotGoals = jsonStats['All Left Team Shots'].filter(item => item['madeOrMissed'] =='made')
        }
        for (var i = 0; i < jsonStats['Left Team Goal Info'].length; i++) {
            var localTR = document.createElement("tr");
            var goalNumberTD = document.createElement("td");
            goalNumberTD.innerHTML = i + 1;
            var goalTimeTD = document.createElement("td");
            var goalShotTypeTD = document.createElement("td");
            var timeString = timeToString(jsonStats['Left Team Goal Info'][i][0])
            goalTimeTD.innerHTML = timeString;
            localTR.append(goalNumberTD);
            localTR.append(goalTimeTD);
            var shotType;
            if (shotTypeBool) {
                shotType = enhancedLeftShotGoals[i]['specificShotType'];
                // if shot type isnt' a community specific move, let's be a little more specific and tell them the kind of shot
                if (shotType == 'Other') {
                    shotType = enhancedLeftShotGoals[i]['genericShotType'];
                }
                goalShotTypeTD.innerHTML = shotType;
                localTR.append(goalShotTypeTD);
            }
            document.getElementById("leftTeamGoalTableBody").append(localTR)
        }
    }

    function setBasicRightGoalTable(shotTypeBool) {
        if (!jsonStats['Right Team Goal Info'].length) {
            $('#rightTeamGoalMessage').text(`No Goals Were Scored By ${captainIDToName(jsonStats['Right Side Captain ID'])}`)
            $('#rightTeamGoalMessage').show()
            return;
        }
        let enhancedRightShotGoals;
        if (shotTypeBool) {
            enhancedRightShotGoals = jsonStats['All Right Team Shots'].filter(item => item['madeOrMissed'] =='made')
        }
        for (var i = 0; i < jsonStats['Right Team Goal Info'].length; i++) {
            var localTR = document.createElement("tr");
            var goalNumberTD = document.createElement("td");
            goalNumberTD.innerHTML = i + 1;
            var goalTimeTD = document.createElement("td");
            var goalShotTypeTD = document.createElement("td");
            var timeString = timeToString(jsonStats['Right Team Goal Info'][i][0])
            goalTimeTD.innerHTML = timeString;
            localTR.append(goalNumberTD);
            localTR.append(goalTimeTD);
            var shotType;
            if (shotTypeBool) {
                shotType = enhancedRightShotGoals[i]['specificShotType'];
                // if shot type isnt' a community specific move, let's be a little more specific and tell them the kind of shot
                if (shotType == 'Other') {
                    shotType = enhancedRightShotGoals[i]['genericShotType'];
                }
                goalShotTypeTD.innerHTML = shotType;
                localTR.append(goalShotTypeTD);
            }
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

    function setEnhancedGoalGraph() {
        if (jsonStats['Left Team Missed Shots Info'] && jsonStats['Right Team Missed Shots Info']) {
            filteredArr = []
            var selectedMadeOrMissedOptions = $('#madeOrMissedDropdown').val();
            var selectedShotTypeOptions = $('#shotTypeDropdown').val();
            for (var i =0; i < jsonStats['All Shots'].length; i++) {
                if (!selectedMadeOrMissedOptions.includes(jsonStats['All Shots'][i]['madeOrMissed'])) {
                    continue;
                }
                if (!selectedShotTypeOptions.includes(jsonStats['All Shots'][i]['specificShotType'])) {
                    continue;
                }
                filteredArr.push(jsonStats['All Shots'][i])
            }
            console.log('filtered array')
            console.log(filteredArr)
            var canvas = document.getElementById("myCanvas");
            var ctx = canvas.getContext("2d");
            for (var i = 0; i < filteredArr.length; i++) {
                ctx.beginPath();
                if (filteredArr[i]['madeOrMissed'] == "made") {
                    ctx.fillStyle = "#00FF00";
                } else {
                    ctx.fillStyle = "#FF0000";
                }
                ctx.arc(transformX(filteredArr[i]['xPos']),transformY(filteredArr[i]['yPos']),5,0,2*Math.PI);
                ctx.fill();
            }
            drawGraphBasis();
        } else {
            $('#goalCanvasRow').hide()
        }
    }

    function setGoalGraph() {
        if (jsonStats['Left Team Missed Shots Info'] && jsonStats['Right Team Missed Shots Info']) {
            // i failed to reset the missed shot offsets after each game in the gecko code up to citrus dolphin 0.1.4
            // so in order to properly display shots taken in versions before then, we should be looping by the amount of missed shots we took
            // versus trusting the array's size
            let leftTeamMissedShotsAmount = jsonStats['Left Side Match Stats']['Shots'] - jsonStats['Left Side Match Stats']['Goals']
            let rightTeamMissedShotsAmount = jsonStats['Right Side Match Stats']['Shots'] - jsonStats['Right Side Match Stats']['Goals']
            let leftTeamMadeShotsAmount = jsonStats['Left Side Match Stats']['Goals']
            let rightTeamMadeShotsAmount = jsonStats['Right Side Match Stats']['Goals']
            var canvas = document.getElementById("myCanvas");
            var ctx = canvas.getContext("2d");
            for (var i =0; i < leftTeamMissedShotsAmount; i++) {
                ctx.beginPath();
                ctx.fillStyle = "#FF0000";
                ctx.arc(transformX(jsonStats['Left Team Missed Shots Info'][i][1]),transformY(jsonStats['Left Team Missed Shots Info'][i][2]),5,0,2*Math.PI);
                ctx.fill();
            }
            for (var i =0; i < rightTeamMissedShotsAmount; i++) {
                ctx.beginPath();
                ctx.fillStyle = "#FF0000";
                ctx.arc(transformX(jsonStats['Right Team Missed Shots Info'][i][1]),transformY(jsonStats['Right Team Missed Shots Info'][i][2]),5,0,2*Math.PI);
                ctx.fill();
            }
            for (var i = 0; i < leftTeamMadeShotsAmount; i++) {
                ctx.beginPath();
                ctx.fillStyle = "#00FF00";
                ctx.arc(transformX(jsonStats["Left Team Goal Info"][i][1]),transformY(jsonStats["Left Team Goal Info"][i][2]),5,0,2*Math.PI);
                ctx.fill();
            }
            for (var i = 0; i < rightTeamMadeShotsAmount; i++) {
                ctx.beginPath();
                ctx.fillStyle = "#00FF00";
                ctx.arc(transformX(jsonStats['Right Team Goal Info'][i][1]),transformY(jsonStats['Right Team Goal Info'][i][2]),5,0,2*Math.PI);
                ctx.fill();
            }
            ctx.strokeStyle = "#BBBBBB";
            drawGraphBasis();
        } else {
            $('#goalCanvasRow').hide()
        }
    }

    function drawGraphBasis() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.strokeStyle = "#BBBBBB";
        ctx.moveTo(430, 0);
        ctx.lineTo(430, 500);
        ctx.stroke();
        ctx.beginPath();
        // if we change dimensions this has to be updated by ratioing area
        ctx.arc(430,250,51.7,0,2*Math.PI);
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
        // outer right box
        ctx.moveTo(transformX(20.2), transformY(5.2));
        ctx.lineTo(transformX(13.5), transformY(5.2));
        ctx.stroke();
        ctx.moveTo(transformX(20.2), transformY(-5.2));
        ctx.lineTo(transformX(13.5), transformY(-5.2));
        ctx.stroke();
        ctx.moveTo(transformX(13.5), transformY(-5.2));
        ctx.lineTo(transformX(13.5), transformY(5.2));
        ctx.stroke();
        // outer right box
        ctx.moveTo(transformX(20.2), transformY(2.6));
        ctx.lineTo(transformX(17.5), transformY(2.6));
        ctx.stroke();
        ctx.moveTo(transformX(20.2), transformY(-2.6));
        ctx.lineTo(transformX(17.5), transformY(-2.6));
        ctx.stroke();
        ctx.moveTo(transformX(17.5), transformY(2.6));
        ctx.lineTo(transformX(17.5), transformY(-2.6));
        ctx.stroke();
    }

    // match stage is 40.62x23.56 (so -20.31 to +20.31 x -11.78 to +11.78)
    function transformX(input) {
        // x dimension is 20.31
        // x factor is (width of canvas / 2) / 20.31
        // additive is width / 2
        var additive = (document.getElementById("myCanvas").offsetWidth / 2);
        var weight = additive / 20.31
        return (input * weight) + additive
    }
    function transformY(input) {
        // y dimension is 11.78
        // x factor is (height of canvas / 2) / 11.78
        // additive is height / 2
        var additive = (document.getElementById("myCanvas").offsetHeight / 2);
        var weight = additive / 11.78
        return (input * -weight) + additive
    }

    function transformShotObject(side, madeOrMissed, prevShot, timestamp, xPos, yPos, zPos, xVel, yVel, zVel, chargeAmount) {
        let xyVelocity = calculateXYVelocity(xVel, yVel);
        let genericShotType = convertMetricsToGenericShotType(zPos, xyVelocity);
        let specificShotType = convertGenericShotToSpecificShot(genericShotType, xPos, yPos, chargeAmount, timestamp, madeOrMissed, prevShot)
        let shotObj = new ShotObject(side, madeOrMissed, specificShotType, genericShotType, timestamp, xyVelocity, xPos, yPos, zPos, xVel, yVel, zVel, chargeAmount);
        return shotObj;
    }

    function calculateXYVelocity(xVel, yVel) {
        return Math.sqrt(Math.pow(xVel, 2) + Math.pow(yVel, 2))
    }

    function convertMetricsToGenericShotType(zPos, xyVel) {
        if (zPos > 1.25) {
            return "Air"
        }
        if (xyVel > 20.5) {
            return "Ground"
        } else {
            return "Chip"
        }
    }

    function convertGenericShotToSpecificShot(genericShotType, xPos, yPos, chargeAmount, timestamp, madeOrMissed, prevShot) {
        if (prevShot) {
            // we tried taking a european on the previous shot but missed
            // so let's see if on this shot we knocked the rebound attempt in to make this a successful european
            if (prevShot['specificShotType'] == 'Dirty European' && prevShot['madeOrMissed'] == "missed") {
                if (genericShotType == "Chip" || genericShotType == "Ground") {
                    if (timestamp - prevShot['timestamp'] <= 5 && (Math.abs(xPos) >= 12) && (yPos >= -9 && yPos <=9)) {
                        return "European"
                    }
                }
            }
        }

        // stereotypical corner shot is x:1, y:11.5
        if (genericShotType == "Chip") {
            if ((xPos >= -3.5 && xPos <= 3.5) && (yPos >= 8 || yPos <= -8)) {
                return "Dirty European"
            }

            if ((Math.abs(xPos) >= 11.5 && Math.abs(xPos) <= 14) && (yPos >= -6.5 && yPos <= 6.5)) {
                return "Box Chip"
            }

            return "Other"
        }

        if (genericShotType == "Ground") {
            if ((xPos >= -4.5 && xPos <= 4.5) && (yPos >= 8 || yPos <= -8) && chargeAmount >=28) {
                return "Corner"
            }

            if ((Math.abs(xPos) >= 13.75 && Math.abs(xPos) <= 16.5) && (yPos >= -6.5 && yPos <= 6.5) && chargeAmount >=12) {
                return "Slide"
            }

            return "Other"
        }

        if (genericShotType == "Air") {
            return "LAB"
        }

        return "Other"
    }

    function setLeftShotTypeTable() {
        let allLeftShotsArr = jsonStats['All Left Team Shots'];
        let allLeftShotsMap = new Map();
        for (var i =0; i < allLeftShotsArr.length; i++) {
            let specificShotType = allLeftShotsArr[i]['specificShotType'];
            let madeOrMissed = allLeftShotsArr[i]['madeOrMissed'];
            let attemptInfo = [];
            if (!allLeftShotsMap.has(specificShotType)) {
                if (madeOrMissed == "made") {
                    attemptInfo = [1,1];
                } else {
                    attemptInfo = [0,1];
                }
                allLeftShotsMap.set(specificShotType, attemptInfo)
            } else {
                attemptInfo = allLeftShotsMap.get(specificShotType);
                if (madeOrMissed == "made") {
                    attemptInfo[0]++
                    attemptInfo[1]++
                } else {
                    attemptInfo[1]++
                }
            }
        }
        let allLeftShotsMapSorted = new Map([...allLeftShotsMap.entries()].sort(function(a,b) {
            return b[1][1] - a[1][1]
        }))
        for (const [key, value] of allLeftShotsMapSorted) {
            let localTR = document.createElement("tr");
            let shotTypeTD = document.createElement("td");
            if (key != "Other") {
                shotTypeTD.innerHTML = key + ` <i class="fas fa-info-circle fa-xs shotInfoTooltip" id="shotType-${key}"></i>`;
            } else {
                shotTypeTD.innerHTML = key;
            }
            //shotTypeTD.className = "surplusStat";
            let attemptInfoTD = document.createElement("td");
            // i'm so sorry lol
            let attemptInfo = `${value[0]}/${value[1]} (${Math.round(((value[0]/value[1])*100))}%)`;
            attemptInfoTD.innerHTML = attemptInfo;
            localTR.append(shotTypeTD);
            localTR.append(attemptInfoTD);
            document.getElementById('leftTeamShotTypeTableBody').append(localTR)
        }
        console.log(allLeftShotsMapSorted)
    }

    function setRightShotTypeTable() {
        let allRightShotsArr = jsonStats['All Right Team Shots']
        let allRightShotsMap = new Map();
        for (var i =0; i < allRightShotsArr.length; i++) {
            let specificShotType = allRightShotsArr[i]['specificShotType'];
            let madeOrMissed = allRightShotsArr[i]['madeOrMissed'];
            let attemptInfo = [];
            if (!allRightShotsMap.has(specificShotType)) {
                if (madeOrMissed == "made") {
                    attemptInfo = [1,1];
                } else {
                    attemptInfo = [0,1];
                }
                allRightShotsMap.set(specificShotType, attemptInfo)
            } else {
                attemptInfo = allRightShotsMap.get(specificShotType);
                if (madeOrMissed == "made") {
                    attemptInfo[0]++
                    attemptInfo[1]++
                } else {
                    attemptInfo[1]++
                }
            }
        }
        let allRightShotsMapSorted = new Map([...allRightShotsMap.entries()].sort(function(a,b) {
            return b[1][1] - a[1][1]
        }))
        for (const [key, value] of allRightShotsMapSorted) {
            let localTR = document.createElement("tr");
            let shotTypeTD = document.createElement("td");
            if (key != "Other") {
                shotTypeTD.innerHTML = key + ` <i class="fas fa-info-circle fa-xs shotInfoTooltip" id="shotType-${key}"></i>`;
            } else {
                shotTypeTD.innerHTML = key;
            }
            let attemptInfoTD = document.createElement("td");
            // i'm so sorry lol
            let attemptInfo = `${value[0]}/${value[1]} (${Math.round(((value[0]/value[1])*100))}%)`;
            attemptInfoTD.innerHTML = attemptInfo;
            localTR.append(shotTypeTD);
            localTR.append(attemptInfoTD);
            document.getElementById('rightTeamShotTypeTableBody').append(localTR)
        }
        console.log(allRightShotsMapSorted)
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

    $(document).on('click', '.shotInfoTooltip', function(e){
        //get all required info and fill shotTypeInfoCard with it
        let shotType = e.currentTarget.id.split("-")[1]
        let ourShotInfo = shotInfoMap.get(shotType);
        if (ourShotInfo == undefined) {
            return
        }
        $('#shotInfoVideoURL').html(ourShotInfo['videoURL'])
        $('#shotInfoTitle').text(ourShotInfo['title'])
        $('#shotInfoDesc').html(ourShotInfo['description'])
        $('#shotTypeInfoCard').css({
            top: e.pageY - 60,
            left: e.pageX + 50
        })
        $('#shotTypeInfoCard').show()
    })

    $('#closeShotTypeInfoCard').click(function(){
        $('#shotTypeInfoCard').hide()
    })

    $(document).mouseup(function(e) {
        // check if we have clicked outside the shot type info card and if so hide it (even tho it might not be visible)
        if (!$(e.target).is("#shotTypeInfoCard,#shotTypeInfoCard *")) {
            $('#shotTypeInfoCard').hide();
        }
    });

    function selectAllGoalGraph() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        $("#madeOrMissedDropdown").multiselect('selectAll', false);
        $('#madeOrMissedDropdown').multiselect('refresh')
        $("#shotTypeDropdown").multiselect('selectAll', false);
        $('#shotTypeDropdown').multiselect('refresh')
        setEnhancedGoalGraph();
    }

    function deselectAllGoalGraph() {
        $('#madeOrMissedDropdown').multiselect("deselectAll", false)
        $('#madeOrMissedDropdown').multiselect('refresh')
        $('#shotTypeDropdown').multiselect("deselectAll", false)
        $('#shotTypeDropdown').multiselect('refresh')
        updateGoalGraph();
    }

    function updateGoalGraph() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setEnhancedGoalGraph();
    }

    $('#deselectAllGraphButton').on('click', deselectAllGoalGraph)
    $('#selectAllGraphButton').on('click', selectAllGoalGraph)

    function enableShotDescriptions() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        var hit = false;
        var markedObj = {x: 0, y: 0, madeOrMissed: "blank"}
        // https://stackoverflow.com/questions/17064913/display-tooltip-in-canvas-graph
        $("#myCanvas").mousemove(function(e){
            $('#shotInfoCard').hide()
            var canvasOffset = $('#myCanvas').offset()
            let mouseX = parseInt(e.pageX - canvasOffset.left);
            let mouseY = parseInt(e.pageY - canvasOffset.top);

            if (hit) {
                // let's see if we are still in the hit area of our marked dot to know if we should unhighlight it
                var dot = markedObj;
                var dx = mouseX - dot.x;
                var dy = mouseY - dot.y;
                if (!(dx * dx + dy * dy < dot.tooltipRadius)) {
                    // we are no longer in the marked object's range and should unhighlight it
                    // undraw current highlighted circle to prevent stacking
                    ctx.beginPath();
                    ctx.globalCompositeOperation = 'destination-out'
                    ctx.arc(dot.x,dot.y, 5, 0, Math.PI*2, true);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.globalCompositeOperation = 'source-over'
                    if (dot.madeOrMissed == "missed") {
                        ctx.fillStyle = "#FF0000";
                    } else {
                        ctx.fillStyle = "#00FF00";
                    }
                    ctx.arc(dot.x,dot.y,5,0,2*Math.PI);
                    ctx.fill();
                    hit = false;
                }
            }

            
            for (var i = 0; i < filteredArr.length; i++) {
                //var dot = dots[i];
                let ourShot = filteredArr[i]
                var dot = {
                    x: transformX(ourShot['xPos']),
                    y: transformY(ourShot['yPos']),
                    madeOrMissed: ourShot['madeOrMissed'],
                    timestamp: ourShot['timestamp'],
                    specificShotType: ourShot['specificShotType'],
                    genericShotType: ourShot['genericShotType'],
                    tooltipRadius: 7*7
                }
                var dx = mouseX - dot.x;
                var dy = mouseY - dot.y;
                if (dx * dx + dy * dy < dot.tooltipRadius) {
                    hit = true;
                    // show tooltip to the right and below the cursor
                    // mark this dot in markedObj for un-highlighting purposes
                    $('#shotCardInfo1').text(`${dot['madeOrMissed'].charAt(0).toUpperCase() + dot['madeOrMissed'].slice(1)}`)
                    $('#shotCardInfo1').css('color', dot['madeOrMissed'] == "made" ? '#00FF00' : '#FF0000')
                    $('#shotCardInfo2').text(`${timeToString(dot['timestamp'])}`)
                    $('#shotCardInfo3').text(`${dot['specificShotType']}`)
                    $('#shotInfoCard').show();
                    $('#shotInfoCard').css({
                        top: e.pageY - 10,
                        left: e.pageX + 20
                    });
                    // undraw current made/missed circle to prevent stacking
                    ctx.beginPath();
                    ctx.globalCompositeOperation = 'destination-out'
                    ctx.arc(dot.x,dot.y, 5, 0, Math.PI*2, true);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.globalCompositeOperation = 'source-over'
                    ctx.fillStyle = "#FFE900";
                    ctx.arc(dot.x,dot.y,5,0,2*Math.PI);
                    ctx.fill();
                    markedObj = {
                        x: dot.x,
                        y: dot.y,
                        madeOrMissed: dot.madeOrMissed
                    }
                    break;
                }
            }

        })
    }

})