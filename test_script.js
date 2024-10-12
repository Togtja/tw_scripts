/*
* Script Name: Togtja's Test Script
* Version: v0.1
* Last Updated: 2024-10-12
* Author: RedAlert
* Author URL: https://github.com/Togtja/
* Author Contact: togtja (Discord)
* Approved: N/A
* Approved Date: N/A
* Mod: N/A
*/
// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// CONSTANTS
var DUMMY_CONSTANT = 0;


// Script Config
var scriptConfig = {
    scriptData: {
        name: 'Togtja\'s Test Script',
        version: 'v0.1',
        author: 'Togtja',
        authorUrl: 'https://github.com/Togtja/',
        helpLink: '#',
    },
    translations: {
        en_DK: {
            'Script Template': 'Script Template',
            Help: 'Help',
            'Invalid game mode!': 'Invalid game mode!',
        },
        en_US: {
            'Script Template': 'Script Template',
            Help: 'Help',
            'Invalid game mode!': 'Invalid game mode!',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['overview_villages'],
    allowedModes: ['incomings'],
    isDebug: DEBUG,
    enableCountApi: true,
};

// Init Debug
initDebug();

// Init Translations Notice
initTranslationsNotice();

// Helper: Get parameter by name
function getParameterByName(name, url = window.location.href) {
    return new URL(url).searchParams.get(name);
}

// Helper: Generates script info
function scriptInfo() {
    return `[${scriptData.name} ${scriptData.version}]`;
}

// Helper: Prints universal debug information
function initDebug() {
    console.debug(`${scriptInfo()} It works !`);
    console.debug(`${scriptInfo()} HELP:`, scriptData.helpLink);
    if (DEBUG) {
        console.debug(`${scriptInfo()} Market:`, game_data.market);
        console.debug(`${scriptInfo()} World:`, game_data.world);
        console.debug(`${scriptInfo()} Screen:`, game_data.screen);
        console.debug(`${scriptInfo()} Game Version:`, game_data.majorVersion);
        console.debug(`${scriptInfo()} Game Build:`, game_data.version);
        console.debug(`${scriptInfo()} Locale:`, game_data.locale);
        console.debug(`${scriptInfo()} Premium:`, game_data.features.Premium.active);
    }
}

// Helper: Text Translator
function tt(string) {
    var gameLocale = game_data.locale;

    if (translations[gameLocale] !== undefined) {
        return translations[gameLocale][string];
    } else {
        return translations['en_DK'][string];
    }
}

// Helper: Translations Notice
function initTranslationsNotice() {
    const gameLocale = game_data.locale;

    if (translations[gameLocale] === undefined) {
        UI.ErrorMessage(
            `No translation found for <b>${gameLocale}</b>. <a href="${scriptData.helpLink}" class="btn" target="_blank" rel="noreferrer noopener">Add Yours</a> by replying to the thread.`,
            4000
        );
    }
}

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidScreen = twSDK.checkValidLocation('screen');

        const LC_STORAGE_KEY = `${scriptConfig.scriptData.prefix}_data`;
    // Initialize Script
    (function () {
        const gameScreen = getParameterByName('screen');
        const gameMode = getParameterByName('mode');

        if (allowedGameScreens.includes(gameScreen)) {
            if (allowedGameModes.includes(gameMode)) {
                console.log('We are on a valid game screen and mode, init script!');
                console.log('If a lot of stuff are going to be done from the script encapsulate in a function');
            } else {
                UI.ErrorMessage(`${tt('Invalid game mode!')}`);
            }
        } else {
            console.log('Show a notice or redirect to the correct place!');
        }
    })();
});