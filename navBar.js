// navBarIndex has the refresh icon whereas navBar does not
var navBarIndex = `
    <nav class="navbar navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
    <a class="navbar-brand">
    <img src='./assets/images/citrus logo.png' width='64px' height='64px'>
    <img src='./assets/images/dolphin icon.png' id='dolphinNavLogo' width='64px' height='64px' title='Open Citrus Dolphin'>
    </a>
    <div id="dolphinUpdateProgresContainer" class="w-75" style="display: none;">
        <h5 style="color: white" id="updatingCitrusDolphinHeader">Updating Citrus Dolphin ...</h5>
        <div class="progress w-50 float-left">
            <div id="dolphinUpdateProgresBar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 1%"></div>
        </div>
    </div>
    <form class="d-flex">
        <span class="me-2" id="refreshIconOuter"><i class="fa-solid fa-arrows-rotate fa-2x" id="refreshIcon"></i>></span>
        <span class="me-3" id="homeIconOuter"><i class="fa-solid fa-house fa-2x" id="homeIcon"></i></span>
        <span class="me-3" id="settingsIconOuter"><i class="fa-solid fa-gear fa-2x" id="settingsIcon"></i></span>
        <div id="outerLoginDiv">
            <button type="button" class="btn btn-secondary" id="loginButton">Login with Discord</button>
        </div>
    </form>
    </div>
    </nav>
`

var navBar = `
    <nav class="navbar navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
    <a class="navbar-brand">
    <img src='./assets/images/citrus logo.png' width='64px' height='64px'>
    <img src='./assets/images/dolphin icon.png' id='dolphinNavLogo' width='64px' height='64px' title='Open Citrus Dolphin'>
    </a>
    <div id="dolphinUpdateProgresContainer" class="w-75" style="display: none;">
        <h5 style="color: white" id="updatingCitrusDolphinHeader">Updating Citrus Dolphin ...</h5>
        <div class="progress w-50 float-left">
            <div id="dolphinUpdateProgresBar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 1%"></div>
        </div>
    </div>
    <form class="d-flex">
        <span class="me-3" id="homeIconOuter"><i class="fa-solid fa-house fa-2x" id="homeIcon"></i></span>
        <span class="me-3" id="settingsIconOuter"><i class="fa-solid fa-gear fa-2x" id="settingsIcon"></i></span>
        <div id="outerLoginDiv">
            <button type="button" class="btn btn-secondary" id="loginButton">Login with Discord</button>
        </div>
    </form>
    </div>
    </nav>
`
$(document).ready(function(){

    var haveShownSuccessfullUpdateDialog = false;
    var haveShownErrorUpdateDialog = false;
    var currentPage = window.location.href.split('/');
    currentPage = currentPage[currentPage.length - 1];
    if (currentPage == "index.html") {
        $('body').prepend(navBarIndex)
    } else {
        $('body').prepend(navBar)
    }

    // try to get current user
    axios.get('http://127.0.0.1:8082/getCurrentUser')
    .then(function (response) {
        console.log(response.data);
        const {discordId, discordGlobalName, discordAvatar} = response.data
        if (discordId.length < 17 || discordId.length > 20) {
            // not a valid/logged in discord id (default is empty string)

        } else {
            $('#outerLoginDiv').html(`
            <img class="img-fluid rounded" src="https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}?size=32"/>
            <span style="color: white">
                ${discordGlobalName}
            </span>
            `)
        }
    })
    .catch(function (error) {
        console.log(error);
    });

    $("body").css({'padding-top': $('nav.navbar').height() + 15});
    $('#homeIconOuter').click(function(){
        if (currentPage != "index.html") {
            window.location.href = "index.html";
        }
    })
    $('#settingsIconOuter').click(function(){
        if (currentPage != "settings.html") {
            window.location.href = "settings.html";
        }
    })
    $('#loginButton').click(async function() {
        await window.api.login()
    })
    $('#dolphinNavLogo').click(function(){
        // call API to open dolphin if we can
        // if it fails, show an error dialog
        axios.get('http://127.0.0.1:8082/openDolphin')
        .then(async function (response) {
            console.log(response.data);
            if (response.data != "Success") {
                const errorOptions = {
                    title: "Error opening Citrus Dolphin",
                    message: `We were unable to open Citrus Dolphin. Make sure you aren't trying to open Citrus Dolphin while it is being updated.\n\nWe looked for the Citrus Dolphin.exe file at ${response.data.pathToDolphin}. If this is not correct, please go to the Settings page in the top right corner and update the Dolphin path.`
                }
                await window.api.showDialog({
                    dialogType: "error",
                    options: errorOptions
                })
            }
          })
        .catch(function (error) {
            console.log(error);
        });
    })

    async function updateDolphinProgessBar(stats) {
        const currentAmount = stats.currentBytes;
        const totalAmount = stats.totalBytes;
        const errorMessage = stats.errorMessage;
        $('#dolphinUpdateProgresContainer').show();
        if (stats.status == "ACTIVE") {
            $('#dolphinNavLogo').hide();
            $('#updatingCitrusDolphinHeader').text('Updating Citrus Dolphin ...')
            $('#dolphinUpdateProgresBar').attr('class', 'progress-bar progress-bar-striped progress-bar-animated')
            if (currentAmount == totalAmount) {
                const percent = 99;
                $("#dolphinUpdateProgresBar").css({width: `${percent}%`})
                $("#dolphinUpdateProgresBar").text(`${percent}%`)
            } else {
                const percent = Math.ceil((currentAmount/totalAmount)*100);
                $("#dolphinUpdateProgresBar").css({width: `${percent}%`})
                $("#dolphinUpdateProgresBar").text(`${percent}%`)
            }
        }
        if (stats.status == "ERROR") {
            $('#dolphinNavLogo').hide();
            $('#updatingCitrusDolphinHeader').text('Error Updating Citrus Dolphin ...')
            $('#dolphinUpdateProgresBar').attr('class', 'progress-bar bg-danger')
            const errorOptions = {
                title: "Error updating Citrus Dolphin",
                message: `We were unable to update Citrus Dolphin. Please make sure Citrus Dolphin is closed while it is being updated.\n\nIf Citrus Dolphin was open during the update, please close it and then restart Citrus Launcher.\n\nThe error code is ${errorMessage}.`
            }

            if (!haveShownErrorUpdateDialog) {
                await window.api.showDialog({
                    dialogType: "error",
                    options: errorOptions
                })
                haveShownErrorUpdateDialog = true;
            }
        }
        if (stats.status == "DONE") {
            const percent = 100;
            $('#dolphinNavLogo').show();
            $("#dolphinUpdateProgresBar").css({width: `${percent}%`})
            $("#dolphinUpdateProgresBar").text(`${percent}%`)
            $('#dolphinUpdateProgresBar').attr('class', 'progress-bar bg-success')
            $('#updatingCitrusDolphinHeader').text('Done Updating Citrus Dolphin!')
            $("#dolphinUpdateProgresBar").html(`<i class="fa-solid fa-check progressCheckMark"></i>`)
            // let's prompt the user to open the newly updated dolphin
            const generalOptions = {
                message: 'Citrus Dolphin has finished updating. Would you like to open it?',
                type: 'question',
                title: 'Would you like to open Citrus Dolphin?',
                buttons: ['Yes, please', 'No, thanks'],
                defaultId: 0
            }

            // this is beyond smelly but technically, since we only try to update once per session, only call the dialog if we haven't tried before
            if (!haveShownSuccessfullUpdateDialog) {
                await window.api.showDialog({
                    dialogType: "general",
                    options: generalOptions,
                    callback: {
                        0: "openDolphin"
                    }
                })
                haveShownSuccessfullUpdateDialog = true;
            }
        }
    }

    // poll for update status
    const timer = ms => new Promise(res => setTimeout(res, ms))

    async function dolphinProgressBar() {
        var pollActive = false;
        var updateStatus = "";
        var pollCounter = 0;
        while (!pollActive && pollCounter < 30) {
            axios.get('http://127.0.0.1:8082/getDolphinUpdateStats')
            .then(stats => {
                console.log("polling for status is: " + JSON.stringify(stats.data));
                pollActive = (stats.data.status == "ACTIVE")
            })
            .catch(statsErr => {
                console.log(statsErr)
            }).finally(function(){
                pollCounter++;
            })
            await timer(100);
        }
        while ((updateStatus != "DONE" && updateStatus != "ERROR") && pollActive) {
            axios.get('http://127.0.0.1:8082/getDolphinUpdateStats')
            .then(async (stats) => {
                console.log(stats.data)
                updateDolphinProgessBar(stats.data)
                updateStatus = stats.data.status;
            })
            .catch(statsErr => {
                console.log(statsErr)
            })
            await timer(100);
        }
    }
    
    dolphinProgressBar();
})