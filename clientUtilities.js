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