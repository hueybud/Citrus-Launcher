$(document).ready(function(){

    settingsLoad();

    $('#replayFolder').change(function(){
        updateReplayFolder();
    })

    $('#replayFolderButton').click(function(){
        // fires the dialog box by imitating a click on the input
        $('#replayFolder').click()
    })

    $('#smsISOFile').change(function(){
        updateISOFile();
    })

    $('#smsISOFileButton').click(function(){
        $('#smsISOFile').click();
    })

    $('#dolphinFile').change(function(){
        updateDolphinFile();
    })

    $('#dolphinFileButton').click(function(){
        $('#dolphinFile').click();
    })

    function settingsLoad() {
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8082/getSettingsJSON',
            success: function(data) {
                console.log(data);
                var settingsJSON = data;
                if (settingsJSON['pathToISO'] != "") {
                    $('#smsISOFilePath').val(settingsJSON['pathToISO'])
                }
                if (settingsJSON['pathToDolphin'] != "") {
                    $('#dolphinFilePath').val(settingsJSON['pathToDolphin'])
                }
                if (settingsJSON['pathToReplays'] != "") {
                    $('#replayFolderPath').val(settingsJSON['pathToReplays'])
                }
            },
            error: function(err) {
                console.log(err);
            }
        })
    }

    function updateReplayFolder() {
        var replaysPathFiles = document.getElementById('replayFolder').files
        console.log(replaysPathFiles);
        if (replaysPathFiles.length == 0) {
            alert('Must select a non-empty folder')
            return;
        }
        var replaysPathString = replaysPathFiles[0].path;
        replaysPathArr = replaysPathString.split('\\')
        var replaysPath= ""
        for (var i =0; i < replaysPathArr.length - 1; i++) {
            if (i != replaysPathArr.length - 2) {
                replaysPath += replaysPathArr[i] + "\\"
            } else {
                replaysPath += replaysPathArr[i]
            }
        }
        console.log(document.getElementById('replayFolder').files[0].path)
        $('#replayFolderPath').val(replaysPath)
        axios.post('http://127.0.0.1:8082/updateReplaysFolder', {
            replaysPath: replaysPath
        })
        .then(function (response) {
    
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    function updateISOFile() {
        var isoFile = document.getElementById('smsISOFile').files[0].path
        $('#smsISOFilePath').val(isoFile)
        console.log(isoFile);
        axios.post('http://127.0.0.1:8082/updateISOFile', {
            isoFile: isoFile
        })
        .then(function (response) {
    
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    function updateDolphinFile() {
        var dolphinFile = document.getElementById('dolphinFile').files[0].path
        $('#dolphinFilePath').val(dolphinFile)
        console.log(dolphinFile);
        axios.post('http://127.0.0.1:8082/updateDolphinFile', {
            dolphinFile: dolphinFile
        })
        .then(function (response) {
    
        })
        .catch(function (error) {
            console.log(error);
        });
    }
})