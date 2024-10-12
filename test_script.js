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
        prefix: 'togtja_test_script',
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
            'Redirect': 'Do you want to redirect to the correct place?',
        },
        en_US: {
            'Script Template': 'Script Template',
            Help: 'Help',
            'Invalid game mode!': 'Invalid game mode!',
            'Redirect': 'Do you want to redirect to the correct place?',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['overview_villages'],
    allowedModes: ['incomings'],
    isDebug: DEBUG,
    enableCountApi: true,
};

// Init Translations Notice
initTranslationsNotice();

// Helper: Translations Notice
function initTranslationsNotice() {
    const gameLocale = game_data.locale;

    if (scriptConfig.translations[gameLocale] === undefined) {
        UI.ErrorMessage(
            `No translation found for <b>${gameLocale}</b>. <a href="${scriptConfig.scriptData.helpLink}" class="btn" target="_blank" rel="noreferrer noopener">Add Yours</a> by replying to the thread.`,
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
        const isValidMode = twSDK.checkValidLocation('mode');

        const LC_STORAGE_KEY = `${scriptConfig.scriptData.prefix}_data`;
    // Initialize Script
    (function () {
        if (isValidScreen) {
            if (isValidMode) {
                console.log('We are on a valid game screen and mode, init script!');
                var village_building = twSDK.getVillageBuildings();
                console.log(village_building);
            } else {
                UI.ErrorMessage(`${twSDK.tt('Invalid game mode!')}`);
            }
        } else {
            console.log('Show a notice or redirect to the correct place!');
            UI.addConfirmBox(twSDK.tt('Redirect'), function () { // Callback function
                twSDK.redirectTo(scriptConfig.allowedScreens[0]);
            });
        }
    })();
});