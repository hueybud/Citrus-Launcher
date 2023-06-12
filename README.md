# Citrus Launcher

Citrus Launcher is a Windows-based desktop application designed to launch Citrus Replay Files (.CITs) and view statistics of matches played through Super Mario Strikers (GameCube). The application is built from the Electron framework.

# Downloading

The application can be downloaded from the [Releases](https://github.com/hueybud/Citrus-Launcher/releases) tab on GitHub. After unzipping the zip file, the executable can be launched via Citrus Launcher.exe.

# Development

Developers can run the application by cloning the package, installing the dependencies via `npm install`, and running `npm start`.

# Usage

The application loads replay files (.CIT file extension) that are created from the Citrus Dolphin build. This is a custom version of Dolphin Emulator, a popular emulator used to play games from the Nintendo GameCube and Wii consoles. A link to the releases for Citrus Dolphin can be found here.

The default path that the application scans for the replay files is C:\Users\\*Your Username*\Documents\Dolphin Emulator\Citrus Replays. This can be changed at any time through the [Settings](#settings) tab located in the right corner.

Replays allow users to watch a match back in Citrus Dolphin as well as drill down to see detailed statistics about the match.

## Home

Users can see a snapshot of all their matches here. Clicking the play icon starts the replay in a Citrus Dolphin window. Clicking the chart icon directs the user to the statistics page, where they will see both general and detailed statistics about the match. The navigation bar contains a link to the [Settings](#settings) page and a refresh button.

![red citrus home screen](https://user-images.githubusercontent.com/7491600/180340190-1a58785c-901b-44cf-9e2a-ee7fe022370f.png)

## Replays

Replays are played back in a Citrus Dolphin window. It's encouraged to not have any other replay instances of Citrus Dolphin open while watching a replay back.

![replay](https://user-images.githubusercontent.com/7491600/178565695-be0c9d1c-3bcb-43d1-9001-9915cece9da9.gif)

## Statistics

Statistics that users can enjoy include:

### Match Summary

Fields are highlighted to indicate which team performed more of them. A ruleset of the match is also provided via clicking the Ruleset link.

![Match Summary](https://user-images.githubusercontent.com/7491600/178559188-394a8ae8-4e5d-47a7-8239-c6437ba4b8b8.PNG)

### Goals

A table is provided of when each team made a goal, along with a plot of their goals and missed shots. Goals are represented by green circles, and missed shots are represented by red circles.

![Goals Made](https://user-images.githubusercontent.com/7491600/178559216-9f155b0b-dfd2-4fbe-9a76-f958fd65da01.PNG)

### Items Used

Users can toggle between a basic view and detailed view of the table to see the amount of times an item was used versus the exact time it was used in a game. Users are also privy to knowing which item a team used most that match.

![Items Used](https://user-images.githubusercontent.com/7491600/178572607-0a3b9fd1-1f03-4ee3-9c66-97dd90cb49a5.PNG)

## Settings

The Settings page can be accessed at any time by clicking on the gear icon in the right corner of the navigation bar.

![settings bar](https://user-images.githubusercontent.com/7491600/178569095-8d723480-1ea7-490c-b66a-5af1ad1e27ff.PNG)

The page is composed of three **required** fields. The path to the Super Mario Strikers ISO you played your desired replay on, the path to your Citrus Dolphin.exe (it needs to be the actual executable file, not just the folder), and the folder that contains your replays. The replay folder field is defaulted to C:\Users\\*Your Username*\Documents\Dolphin Emulator\Citrus Replays.

![settings page](https://user-images.githubusercontent.com/7491600/178570440-5ec2b013-b073-4a6a-8e4e-5044da26cc5f.png)

### Mismatch Game ISO

If you try to play a replay on a different ISO then the one it was recorded with you will receive this error. To fix it, make sure the **Super Mario Strikers ISO** field in Settings has the path to the correct ISO in it.

![image](https://user-images.githubusercontent.com/7491600/178571362-42524a76-f6d5-44c1-bea2-504e87e5d951.png)
