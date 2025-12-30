const suffix = "sendqtevent -kqt ";
const altSuffix = "sendqtevent -a -kqt "; // for keys that require ALT modifier

const constants = Object.freeze({
    
    commands: Object.freeze({

    "0": suffix + "48",
    "1": suffix + "49",
    "2": suffix + "50",
    "3": suffix + "51",
    "4": suffix + "52",
    "5": suffix + "53",
    "6": suffix + "54",
    "7": suffix + "55",
    "8": suffix + "56",
    "9": suffix + "57",

    UP:    suffix + "0x01000013",
    DOWN:  suffix + "0x01000015",
    LEFT:  suffix + "0x01000012",
    RIGHT: suffix + "0x01000014",

    OK:     suffix + "0x01000004",
    OK2:    suffix + "0x01000005",

    // Back/Exit/Menu
    BACK:   suffix + "0x01000003",
    RETURN: suffix + "0x01000003", // alias (UI uses RETURN)
    EXIT:   suffix + "0x01000000",
    HOME:   suffix + "0x01000000", // alias (UI uses HOME)
    MENU:   suffix + "0x0100003a",
    CH_PLUS:  suffix + "0x01000001",
    CH_MINUS: suffix + "0x01000002",
    VOL_MINUS: suffix + "0x01000070",
    VOL_PLUS:  suffix + "0x01000072",
    MUTE:      altSuffix + "96",
    MUTE_ALT:  altSuffix + "126",

    RED:    suffix + "0x01000030",
    GREEN:  suffix + "0x01000031",
    YELLOW: suffix + "0x01000032",
    BLUE:   suffix + "0x01000033",

    // =========================
    // Extra operations
    // =========================
    REFRESH:       suffix + "0x01000034",
    SCREEN_RESIZE: suffix + "0x01000035",
    PAGE_UP:       suffix + "0x01000016",
    PAGE_DOWN:     suffix + "0x01000017",

    // =========================
    // EPG / TV
    // =========================
    EPG: suffix + "0x01000037",
    TV:  suffix + "0x01000039",

    // =========================
    // Media / Info / Power (ALT-modified)
    // =========================
    INFO:       altSuffix + "89",
    PLAY_PAUSE: altSuffix + "82",
    STOP:       altSuffix + "83",

    // POWER appears as 85 (0x55) with ALT
    POWER: altSuffix + "85",
    }),


    ssh: Object.freeze({
        port: 22,
        username: "root",
        password: "930920",
    }),
});


export default constants;