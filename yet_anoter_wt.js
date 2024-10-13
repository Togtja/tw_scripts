/*
* Script Name: Yet Another Watchtower
* Version: v0.1.1
* Last Updated: 2024-10-13
* Author: Togtja
* Author URL: https://github.com/Togtja/
* Author Contact: togtja (Discord)
* Approved: N/A
* Approved Date: N/A
* Mod: N/A
*/
// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'yawt',
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
            'No incoming': 'No incoming attacks found!',
            'Spotcolumn': 'Watchtower',
            'Invalid distance calculation!' : 'Invalid distance calculation!',
            'htmlSpot': 'Spot: ',
            'htmlReact': 'React: ',
            'spotSpan': 'Detected',
            'spotableSpan': 'Detectable',
            'noSpot': 'Undetectable',

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

// Helper: Get Watchtowers
async function get_wt() {
    const villages_url = 'https://' + location.host + game_data.link_base_pure + 'overview_villages&mode=buildings&group=0&page=-1';
    const response = await fetch(villages_url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const villages = [];
    // All villages own by the player on the overview page in html format
    const html_villages = doc.querySelectorAll('#villages')[0].rows;

    //For each village find its coordinates and watchtower level
    for (let i = 1; i < html_villages.length; i++) {
        
        const village = html_villages[i];
        var village_cord = "";
        var village_watchtower_lvl = NaN;
        const child_map = village.children;
        for (let j = 0; j < child_map.length; j++) {
            const child = child_map[j];
            // Find the village coordinates
            if (child.className === 'nowrap') {
                village_cord = child.innerText;
                // Strip
                village_cord = village_cord.trim();
                var tmp = village_cord.split(" ");
                village_cord = tmp[tmp.length - 2];
                // Remove ( and )
                village_cord = village_cord.replace("(", "").replace(")", "");

            }
            // Find the watchtower level
            if (child.className === 'upgrade_building b_watchtower') {
                village_watchtower_lvl = Number(child.innerText);
            }
        }
        // If the village has a watchtower and the coordinates are valid
        if (village_cord !== "" && !isNaN(village_watchtower_lvl) && village_watchtower_lvl > 0){
            villages.push({ coords: village_cord, wt_lvl: village_watchtower_lvl });
        }
    }
    return villages;
}

// Helper: Collect incomings
function collectIncomingsList() {
    const incomingsMap = new Map();

    jQuery('#incomings_table tbody tr.nowrap').each((_, incoming) => {
        const incomingId = parseInt(
            jQuery(incoming).find('span.quickedit').attr('data-id')
        );
        const attackType = jQuery(incoming)
            .find('td:eq(0)')
            .find('img')
            .attr('src')
            .split('/')
            .pop()
            .split('#')[0]
            .split('?')[0];
        const containsNoble =
            jQuery(incoming)
                .find('td:eq(0)')
                .find('img:eq(1)')
                .attr('src') &&
            jQuery(incoming)
                .find('td:eq(0)')
                .find('img:eq(1)')
                .attr('src')
                .split('/')
                .pop()
                .split('#')[0]
                .split('?')[0] === 'snob.png'
                ? true
                : false;

        const incomingData = {
            id: incomingId,
            label: jQuery(incoming)
                .find('span.quickedit-label')
                .text()
                .trim(),
            attacker: {
                id: parseInt(
                    jQuery(incoming)
                        .find('td:eq(3) a')
                        .attr('href')
                        .split('id=')[1]
                ),
                name: jQuery(incoming).find('td:eq(3)').text().trim(),
            },
            destination: {
                id: parseInt(
                    jQuery(incoming)
                        .find('td:eq(1) a')
                        .attr('href')
                        .split('village=')[1]
                ),
                coord: jQuery(incoming)
                    .find('td:eq(1)')
                    .text()
                    .match(twSDK.coordsRegex)[0],
            },
            origin: {
                id: parseInt(
                    jQuery(incoming)
                        .find('td:eq(2) a')
                        .attr('href')
                        .split('id=')[1]
                ),
                coord: jQuery(incoming)
                    .find('td:eq(2)')
                    .text()
                    .match(twSDK.coordsRegex)[0],
            },
            landingTime: twSDK.getTimeFromString(
                jQuery(incoming).find('td:eq(5)').text().trim()
            ),
            arrivesIn: jQuery(incoming).find('td:eq(6)').text().trim(),
            distance: jQuery(incoming).find('td:eq(4)').text().trim(),
            metadata: {
                attackType: attackType,
                containsNoble: containsNoble,
            },
        };

        incomingsMap.set(incomingId, incomingData);
    });

    return incomingsMap;
}


// Function to find the intersection points between a line and a circle
function findCircleLineIntersections(cx, cy, radius, point1, point2) {
    const [x1, y1] = point1.map(Number);
    const [x2, y2] = point2.map(Number);

    const dx = x2 - x1;
    const dy = y2 - y1;

    const A = dx * dx + dy * dy;
    const B = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    const C = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - radius * radius;

    const det = B * B - 4 * A * C;
    if (det < 0) {
        return []; // No intersection
    } else if (det === 0) {
        const t = -B / (2 * A);
        const ix = x1 + t * dx;
        const iy = y1 + t * dy;
        return [[Number(ix), Number(iy)]]; // One intersection
    } else {
        const t1 = (-B + Math.sqrt(det)) / (2 * A);
        const t2 = (-B - Math.sqrt(det)) / (2 * A);
        const ix1 = x1 + t1 * dx;
        const iy1 = y1 + t1 * dy;
        const ix2 = x1 + t2 * dx;
        const iy2 = y1 + t2 * dy;
        return [[Number(ix1), Number(iy1)], [Number(ix2), Number(iy2)]]; // Two intersections
    }
}

function parseDateTime(dateTimeStr) {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

// Helper: Get the attack that will be spotted by the watchtower and the time it will be spotted
async function get_spotted_attacks(incomingAttacks, WatchTowers){
    const spottedAttacks = new Map();
    for (const attack of incomingAttacks) {
        const all_intersections = [];
        var from = attack[1].origin.coord.split("|");
        var to = attack[1].destination.coord.split("|");
        for (const wt of WatchTowers){
            wt_coords = wt.coords.split("|");
            wt_rad = twSDK.watchtowerLevels[wt.wt_lvl -1];
            // Find the intersection points
            const intersections = findCircleLineIntersections(
                wt_coords[0], // cx
                wt_coords[1], // cy
                wt_rad,
                from,
                to
            );
            if (intersections.length === 0) {
                continue;
            }
            all_intersections.push(...intersections);
        }

        if (all_intersections.length === 0) {
            continue;
        }
        console.log("All", all_intersections);

        // Find the intersection point closest to the from_village point
        const closestIntersection = all_intersections.reduce((closest, current) => {
            const [cx, cy] = closest;
            const [ix, iy] = current;
            const closestDistance = Math.sqrt(cx * cx + cy * cy);
            const currentDistance = Math.sqrt(ix * ix + iy * iy);
            return currentDistance < closestDistance ? current : closest;
        }, all_intersections[0]);
        console.log("closest", closestIntersection);
        var closest_tw_format = closestIntersection[0] + "|" + closestIntersection[1];
        var dist = twSDK.calculateDistance(closest_tw_format, attack[1].destination.coord);
        const units =  Object.keys((await twSDK.getWorldUnitInfo()).config);
        console.log("did magic array stuff");
        const distTimes = await twSDK.calculateTimesByDistance(dist);
        console.log("We get here");
        if (distTimes.length !== units.length) {
            UI.ErrorMessage(twSDK.tt('Invalid distance calculation!'));
            continue;
        }
        const landingTime = parseDateTime(attack[1].landingTime);

        const unitTimes = {};
        for (let i = 0; i < units.length; i++) {
            console.log(units[i], distTimes[i]);
            var [hours, minutes, seconds] = distTimes[i].split(':').map(Number);
            var spot_time = new Date(landingTime.getTime() - (hours * 60 * 60 * 1000) - (minutes * 60 * 1000) - (seconds * 1000));
            var spot_time_str = spot_time.toLocaleString();
            unitTimes[units[i]] = {
                spot_time: spot_time_str,
                react_time: distTimes[i],
            }
        }
        console.log(unitTimes);
        spottedAttacks[attack[0]] = {
            unit_info: unitTimes,
        };                  

    }
    return spottedAttacks;
}

function build_ui(incomingAttacks, spottedAttacks){
    let columnExists = false;
    let column_index = 0;
    $("#incomings_table").find("tr").eq(0).find("th").each(function() {
        if ($(this).text().trim() === twSDK.tt('Spotcolumn')) {
            columnExists = true;
            return false; // Break the loop
        }
        column_index++;
    });
    if (!columnExists) {
        $("#incomings_table").find("tr").eq(0).find("th").last().after("<th>" + twSDK.tt('Spotcolumn') + "</th>");
        // change colspan to current colspan + 1
        const colspan = $("#incomings_table").find("tr").last().find("th").last().attr("colspan");
        console.log(colspan);
        $("#incomings_table").find("tr").last().find("th").last().attr("colspan", Number(colspan) + 1);
    }
    console.log("Column index", column_index);
    
    var i = 1;
    for (const attack of incomingAttacks) {
        console.log(attack[0]);
        // Add the spotted column
        if (!columnExists) {
            $("#incomings_table").find("tr").eq(i).find("td").eq(column_index-1).after("<td></td>");
        }
        const attack_label = $("#incomings_table").find("tr").eq(i).find("td").eq(0).text().trim();
        if (attack[0] in spottedAttacks){
            const unit_named = []
            console.log(typeof spottedAttacks[attack[0]].unit_info);

            // Find the unit that is in the attack label
            for (const unit in spottedAttacks[attack[0]].unit_info){
                if (attack_label.toLowerCase().includes(unit.toLowerCase())){
                    console.log(spottedAttacks[attack[0]].unit_info[unit]);
                    unit_named.push(
                        [unit, spottedAttacks[attack[0]].unit_info[unit]]
                    );
                }
            }

            // If no unit was found in the attack label, add all units
            if (unit_named.length === 0){
                for (const unit in spottedAttacks[attack[0]].unit_info){
                    unit_named.push(
                        [unit, spottedAttacks[attack[0]].unit_info[unit]]
                    );
                }
            }
            // Unit info format
            var unit_info_str = "";
            for (const unit of unit_named){
                unit_info_str += twSDK.tt('htmlSpot') + unit[0] + ": " + unit[1].spot_time + " | "  + twSDK.tt('htmlReact') + unit[1].react_time + "<br>";
            }
            console.log(unit_info_str);
            // Detectable
            //TODO: One for detectable and one for detected (Need to read if the attack is detected or not)
            var spot_html = "<span class='tooltip' title='{}' style='color: yellow; font-weight: bold;'>{}</span>".format(unit_info_str, twSDK.tt('spotableSpan'));
            $("#incomings_table").find("tr").eq(i).find("td").eq(column_index).replaceWith("<td>" + spot_html + "</td>");
        }
        else{
            var no_spot_html = "<span class='tooltip' title='{}' style='color: red; font-weight: bold;'>{}</span>".format(twSDK.tt('noSpot'), twSDK.tt('noSpot'));
            $("#incomings_table").find("tr").eq(i).find("td").eq(column_index).replaceWith("<td>" + no_spot_html + "</td>");
        }
        i++;
        
    }
    
}

// Helper: String format (Python-like)
String.prototype.format = function(...args) {
    return this.replace(/{}/g, () => args.shift());
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const isValidScreen = twSDK.checkValidLocation('screen');
        const isValidMode = twSDK.checkValidLocation('mode');
        const gameType = twSDK.getParameterByName('subtype');
        const totalIncomingAttacks = parseInt(game_data.player.incomings);
        
        const WatchTowers = await get_wt();
    // Initialize Script
    (async function () {
        if (!totalIncomingAttacks) {
            UI.InfoMessage(
                twSDK.tt('No incoming')
            );
            return;
        }

        if (isValidScreen) {
            if (isValidMode && gameType === 'attacks') {
                console.log('We are on a valid game screen and mode, init script!');

                const incomingAttacks = collectIncomingsList();
                const spottedAttacks = await get_spotted_attacks(incomingAttacks, WatchTowers);
                build_ui(incomingAttacks, spottedAttacks);
                console.log(spottedAttacks);
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