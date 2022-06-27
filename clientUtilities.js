export function captainIDToName(captainID) {
    switch (parseInt(captainID)) {
        case 0:
           return "Daisy"
        case 1:
            return "DK"
        case 2:
            return "Luigi"
        case 3:
            return "Mario"
        case 4:
            return "Peach"
        case 5:
            return "Waluigi"
        case 6:
            return "Wario"
        case 7:
            return "Yoshi"
        case 8:
            return "Super Team"
        default:
            return "N/A"
    }
}

export function sidekickIDToName(sidekickID) {
    switch(parseInt(sidekickID)) {
        case 0:
            return "Toad"
        case 1:
            return "Koopa"
        case 2:
            return "Hammer Bro"
        case 3:
            return "Birdo"
        case 8:
            return "Super Team"
        default:
            return "N/A"
    }
}

export function stadiumIDToName(stadiumID) {
    switch (parseInt(stadiumID)) {
        case 0:
            return "Pipeline Central"
        case 1:
            return "The Palace"
        case 2:
            return "Konga Coliseum"
        case 3:
            return "The Underground"
        case 4:
            return "Crater Field"
        case 5:
            return "The Battle Dome"
        case 6:
            return "Bowser Stadium"
        default:
            return "N/A"
    }
}

export function compareStatEquality(stat1, stat2) {
    stat1 = parseInt(stat1);
    stat2 = parseInt(stat2);
    if (stat1 > stat2) {
        return 1
    } else if (stat1 < stat2) {
        return -1
    } else {
        return 0
    }
}

export function itemIDToName(itemID) {
    switch (parseInt(itemID)) {
        case 0:
            return "Green Shell"
        case 1:
            return "Red Shell"
        case 2:
            return "Spiky Shell"
        case 3:
            return "Blue Shell"
        case 4:
            return "Banana"
        case 5:
            return "Bomb"
        case 6:
            return "Chain Chomp"
        case 7:
            return "Mushroom"
        case 8:
            return "Star"
    }
}

export function itemIDAndAmountToName(itemID, itemAmount) {
    var itemType = itemIDToName(itemID);
    itemAmount = parseInt(itemAmount);
    if (itemAmount == 1) {
        return `Single ${itemType}`
    }
    if (itemAmount == 3) {
        return `Triple ${itemType}s`
    }
    if (itemAmount == 5) {
        return `Five ${itemType}s`
    }
}

export function timeToString(timeParam) {
    timeParam = Math.floor(timeParam)
    var minutes = parseInt(timeParam/60);
    var seconds = parseInt(timeParam % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`
}

export function matchDifficultyToString(difficultyLevel) {
    switch (parseInt(difficultyLevel)) {
        case 1:
            return "Rookie"
        case 2:
            return "Professional"
        case 3:
            return "Superstar"
        case 4:
            return "Legend"
        default:
            return "Unsure"
    }
}

export function isCitrusISO(hash) {
    if (hash == "f34aae896bbbba8380282b722bb3a092") {
        return true
    }
    return false
}