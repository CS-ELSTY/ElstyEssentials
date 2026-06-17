// Note: world is not imported here anymore to avoid import issues
// Functions that need world should receive it as a parameter

/**
 * Converts large numbers to metric format (K, M, B, T)
 * @param {number} num - The number to convert
 * @returns {string} - The metric formatted number
 */
export function metricNumbers(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    
    const sign = Math.sign(num);
    const absNum = Math.abs(num);
    
    if (absNum >= 1e12) {
        return `${(sign * (absNum / 1e12)).toFixed(1)}T`;
    } else if (absNum >= 1e9) {
        return `${(sign * (absNum / 1e9)).toFixed(1)}B`;
    } else if (absNum >= 1e6) {
        return `${(sign * (absNum / 1e6)).toFixed(1)}M`;
    } else if (absNum >= 1e3) {
        return `${(sign * (absNum / 1e3)).toFixed(1)}K`;
    }
    
    return (sign * absNum).toString();
}

import { world } from "@minecraft/server";



const SAFE_LIMIT = 2000000000;

const MIN_LIMIT = 0;



/**

 * Gets the score of a player for a specific objective

 * @param {Player|string} playerOrName - The player object or player name

 * @param {string} objective - The objective name

 * @returns {number} - The player's score

 */

export function getScore(playerOrName, objective) {

    try {

        // Get player object if name is provided
        let playerObj;
        if (typeof playerOrName === 'string') {
            const players = world.getPlayers({ name: playerOrName });
            const player = players.next();
            if (player.done || !player.value) {
                return MIN_LIMIT;
            }
            playerObj = player.value;
        } else {
            playerObj = playerOrName;
        }

        // Try to get the score
        const score = world.scoreboard.getObjective(objective).getScore(playerObj.scoreboardIdentity);

        // Handle undefined or negative scores
        if (score === undefined || score < MIN_LIMIT) {
            world.getDimension("overworld").runCommand(`scoreboard players set "${playerObj.name}" ${objective} ${MIN_LIMIT}`);
            return MIN_LIMIT;
        }

        // Handle scores that are too high
        if (score > SAFE_LIMIT) {
            world.getDimension("overworld").runCommand(`scoreboard players set "${playerObj.name}" ${objective} ${SAFE_LIMIT}`);
            return SAFE_LIMIT;
        }

        return score;
    } catch {
        // If anything fails, create the objective and set default score
        try {
            world.getDimension("overworld").runCommand(`scoreboard objectives add ${objective} dummy`);
            if (typeof playerOrName === 'string') {
                const players = world.getPlayers({ name: playerOrName });
                const player = players.next();
                if (!player.done && player.value) {
                    world.getDimension("overworld").runCommand(`scoreboard players set "${player.value.name}" ${objective} ${MIN_LIMIT}`);
                }
            } else if (playerOrName && playerOrName.name) {
                world.getDimension("overworld").runCommand(`scoreboard players set "${playerOrName.name}" ${objective} ${MIN_LIMIT}`);
            }
        } catch (e) {
            // Silent fail if command fails
        }
        return MIN_LIMIT;
    }
}

/**
 * Sets the score of a player for a specific objective
 * @param {Player|string} playerOrName - The player object or player name
 * @param {string} objective - The objective name
 * @param {number} value - The value to set
 * @returns {boolean} - Whether the operation was successful
 */
export function setScore(playerOrName, objective, value) {
    try {
        // Get player object if name is provided
        let playerObj;
        if (typeof playerOrName === 'string') {
            const players = world.getPlayers({ name: playerOrName });
            const player = players.next();
            if (player.done || !player.value) {
                return false;
            }
            playerObj = player.value;
        } else {
            playerObj = playerOrName;
        }

        // Ensure value is within limits
        const safeValue = Math.max(MIN_LIMIT, Math.min(value, SAFE_LIMIT));

        // Use command to set score (more reliable)
        world.getDimension("overworld").runCommand(`scoreboard players set "${playerObj.name}" ${objective} ${safeValue}`);
        return true;
    } catch {
        // If command fails, try to create objective first
        try {
            world.getDimension("overworld").runCommand(`scoreboard objectives add ${objective} dummy`);
            if (typeof playerOrName === 'string') {
                const players = world.getPlayers({ name: playerOrName });
                const player = players.next();
                if (!player.done && player.value) {
                    const safeValue = Math.max(MIN_LIMIT, Math.min(value, SAFE_LIMIT));
                    world.getDimension("overworld").runCommand(`scoreboard players set "${player.value.name}" ${objective} ${safeValue}`);
                    return true;
                }
            } else if (playerOrName && playerOrName.name) {
                const safeValue = Math.max(MIN_LIMIT, Math.min(value, SAFE_LIMIT));
                world.getDimension("overworld").runCommand(`scoreboard players set "${playerOrName.name}" ${objective} ${safeValue}`);
                return true;
            }
        } catch (e) {
            // Silent fail
        }
        return false;
    }
}

/**
 * Adds to a player's score for a specific objective
 * @param {Player|string} playerOrName - The player object or player name
 * @param {string} objective - The objective name
 * @param {number} value - The value to add
 * @returns {boolean} - Whether the operation was successful
 */
export function addScore(playerOrName, objective, value) {
    try {
        const currentScore = getScore(playerOrName, objective);
        return setScore(playerOrName, objective, currentScore + value);
    } catch (error) {
        console.warn(`Error adding score for ${typeof playerOrName === 'string' ? playerOrName : playerOrName.name} in ${objective}:`, error);
        return false;
    }
}

/**
 * Force opens a form for a player to ensure they see it
 * @param {Player} player - The player to show the form to
 * @param {any} form - The form to show
 * @returns {Promise<any>} - The form response
 */
export async function ForceOpen(player, form) {
    return new Promise((resolve) => {
        // Show the form to the player
        form.show(player).then((response) => {
            // If the player cancels or closes the form, show it again
            if (response.canceled || response.selection === undefined) {
                // Small delay before showing again to prevent issues
                setTimeout(() => {
                    ForceOpen(player, form).then(resolve);
                }, 100);
            } else {
                // If they made a selection, resolve with the response
                resolve(response);
            }
        }).catch(error => {
            // If there's an error showing the form, try again
            setTimeout(() => {
                ForceOpen(player, form).then(resolve);
            }, 100);
        });
    });
}