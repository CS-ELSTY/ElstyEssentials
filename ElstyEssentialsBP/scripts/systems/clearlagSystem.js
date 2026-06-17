import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { GlobalConfig } from "../config/mainConfig.js";

// Default configuration for the clear lag system
const DEFAULT_CONFIG = {
    enabled: GlobalConfig.clearlag.enabled, // Enable by default
    interval: GlobalConfig.clearlag.defaultInterval, // From config
    warningTimes: GlobalConfig.clearlag.warningTimes, // From config
    prefix: "§b[ClearLag System]",
    messages: {
        start: "§f⚠ §bMaintenance: §fClearing dropped items in §e{time} §fseconds",
        countdown: "§f⚡ §c{time} §fseconds remaining until cleanup...",
        success: "§f✔ §aCleanup complete: §fremoved §e{count} §fdropped items",
        noEntities: "§f✦ §aServer clean: §fno items to remove"
    }
};

// Internal variables
let currentConfig = null;
const configListeners = new Set();
let autoClearTask = null;

/**
 * Notifies config change listeners
 * @param {Object} newConfig - The new configuration
 */
function notifyConfigChange(newConfig) {
    currentConfig = newConfig;
    const listeners = Array.from(configListeners);
    for (const element of listeners) {
        element(newConfig);
    }
}

/**
 * Gets the current configuration
 * @returns {Object} - The configuration object
 */
function getConfig() {
    if (currentConfig) return currentConfig;

    try {
        const saved = world.getDynamicProperty('clearlagConfig');
        if (saved) {
            currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } else {
            // If no config exists, use defaults and save them
            currentConfig = DEFAULT_CONFIG;
            saveConfig(currentConfig);
        }
        return currentConfig;
    } catch (error) {
        currentConfig = DEFAULT_CONFIG;
        return currentConfig;
    }
}

/**
 * Saves the configuration
 * @param {Object} config - The configuration to save
 * @returns {boolean} - Whether the save was successful
 */
function saveConfig(config) {
    try {
        world.setDynamicProperty('clearlagConfig', JSON.stringify(config));
        notifyConfigChange(config);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Counts clearable entities (items)
 * @returns {number} - The number of clearable entities
 */
function countClearableEntities() {
    let count = 0;
    try {
        for (const dimension of [world.getDimension("overworld"), world.getDimension("nether"), world.getDimension("the_end")]) {
            count += dimension.getEntities({ type: "minecraft:item" }).length;
        }
    } catch (error) { }
    return count;
}

/**
 * Clears entities (items) from all dimensions
 * @returns {number} - The number of entities cleared
 */
function clearEntities() {
    let cleared = 0;
    try {
        for (const dimension of [world.getDimension("overworld"), world.getDimension("nether"), world.getDimension("the_end")]) {
            const items = dimension.getEntities({ type: "minecraft:item" });
            for (const item of items) {
                item.remove();
                cleared++;
            }
        }
    } catch (error) { }
    return cleared;
}

/**
 * Opens the clear lag menu for a player
 * @param {Player} player - The player to open the menu for
 */
export async function openClearLagMenu(player) {
    try {
        const config = getConfig();
        const entityCount = countClearableEntities();

        const form = new ActionFormData()
            .title("§bClear Lag System")
            .body(
                "§bServer Statistics:\n" +
                `§b• Items on Ground: §f${entityCount}\n` +
                `§b• Auto Clear Status: ${config.enabled ? "§aENABLED" : "§cDISABLED"}\n` +
                `§b• Interval: §f${config.interval} seconds\n` +
                `§b• Next Clear: §f${config.interval} seconds\n\n` +
                "§bSelect an option:"
            )
            .button("Clear Items Now\n§8Remove all items instantly", "textures/ui/trash")
            .button("Auto Clear Settings\n§8Configure timing & messages", "textures/ui/immersive_reader")
            .button("Toggle Auto Clear\n§8Turn ON/OFF automatic clearing", "textures/ui/redstone_light_powered")
            .button("§cBack", "textures/ui/arrow_left");

        const response = await form.show(player);

        if (!response.canceled) {
            switch (response.selection) {
                case 0:
                    await clearEntitiesWithConfirmation(player);
                    break;
                case 1:
                    await showAutoClearSettings(player);
                    break;
                case 2:
                    await toggleAutoClear(player);
                    break;
                case 3:
                    // Back to main menu - do nothing
                    break;
            }
        }
    } catch (error) {
        console.warn("Error in clear lag menu:", error);
        player.sendMessage("§c⚠ Failed to open clear lag menu");
    }
}

/**
 * Shows confirmation for clearing entities
 * @param {Player} player - The player to show the confirmation to
 */
async function clearEntitiesWithConfirmation(player) {
    try {
        const entityCount = countClearableEntities();
        const config = getConfig();

        const form = new ActionFormData()
            .title("§cConfirm Clear Items")
            .body(
                `§bThere are §f${entityCount} §bitems on the ground.\n\n` +
                "§bItems to be cleared:\n" +
                "• All items dropped on ground\n" +
                "• Across all dimensions (Overworld, Nether, End)\n\n" +
                "§c⚠ This action cannot be undone!"
            )
            .button("§cClear Now\n§8Click to proceed", "textures/ui/trash")
            .button("§aCancel\n§8Go back to menu", "textures/ui/arrow_left");

        const response = await form.show(player);

        if (!response.canceled && response.selection === 0) {
            const cleared = clearEntities();
            player.runCommand('playsound random.levelup @a[r=5] ~~~ 1 1');

            if (cleared > 0) {
                const msg = config.messages.success.replace("{count}", cleared);
                world.sendMessage(msg);
                player.sendMessage(`§a✔ Cleared ${cleared} items from ground`);
            } else {
                world.sendMessage(config.messages.noEntities);
                player.sendMessage("§eℹ No items found to clear");
            }
        }
    } catch (error) {
        console.warn("Error in clear confirmation:", error);
        player.sendMessage("§c⚠ An error occurred while clearing items!");
    }
}

/**
 * Shows auto clear settings form
 * @param {Player} player - The player to show the settings to
 */
async function showAutoClearSettings(player) {
    try {
        const config = getConfig();

        const form = new ModalFormData()
            .title("§bAUTO CLEAR SETTINGS")
            .toggle("§aEnable Auto Clear", config.enabled)
            .textField("§bInterval (seconds)", "Time between clears", config.interval.toString())
            .textField("§eWarning Times", "Comma separated seconds", config.warningTimes.join(','));

        const response = await form.show(player);

        if (!response.canceled) {
            const [enabled, intervalStr, warningTimesStr] = response.formValues;
            const interval = Math.max(5, parseInt(intervalStr) || 300);
            const warningTimes = warningTimesStr.split(',')
                .map(t => parseInt(t.trim()))
                .filter(t => !isNaN(t) && t > 0 && t < interval)
                .sort((a, b) => b - a);

            const newConfig = {
                ...config,
                enabled,
                interval,
                warningTimes
            };

            if (saveConfig(newConfig)) {
                player.sendMessage("§a✔ Auto clear configuration updated");
                if (enabled) {
                    startAutoClearSystem();
                    player.sendMessage("§a🔧 ClearLag system is now ACTIVE");
                } else {
                    stopAutoClearSystem();
                    player.sendMessage("§c🔧 ClearLag system is now DISABLED");
                }
            } else {
                player.sendMessage("§c⚠ Failed to save settings");
            }
        }
    } catch (error) {
        console.warn("Error in auto clear settings:", error);
        player.sendMessage("§c⚠ Failed to update settings");
    }
}

/**
 * Toggles auto clear system
 * @param {Player} player - The player performing the toggle
 */
async function toggleAutoClear(player) {
    try {
        const config = getConfig();
        const newEnabled = !config.enabled;

        const newConfig = {
            ...config,
            enabled: newEnabled
        };

        if (saveConfig(newConfig)) {
            if (newEnabled) {
                startAutoClearSystem();
                player.sendMessage("§a🔧 ClearLag system is now ACTIVE");
                world.sendMessage("§b[ClearLag System] §aAuto clear system has been enabled");
            } else {
                stopAutoClearSystem();
                player.sendMessage("§c🔧 ClearLag system is now DISABLED");
                world.sendMessage("§b[ClearLag System] §cAuto clear system has been disabled");
            }
        } else {
            player.sendMessage("§c⚠ Failed to toggle auto clear");
        }
    } catch (error) {
        console.warn("Error toggling auto clear:", error);
        player.sendMessage("§c⚠ Failed to toggle auto clear");
    }
}

/**
 * Shows message settings form
 * @param {Player} player - The player to show the settings to
 */
async function showMessageSettings(player) {
    try {
        const config = getConfig();

        const form = new ModalFormData()
            .title("§bMESSAGE SETTINGS")
            .textField("Prefix Text", "Text before messages", config.prefix)
            .textField("Initial Message", "Use {time} for countdown", config.messages.start)
            .textField("Countdown Message", "Use {time} for countdown", config.messages.countdown)
            .textField("Success Message", "Use {count} for item count", config.messages.success)
            .textField("No Items Message", "When no items found", config.messages.noEntities);

        const response = await form.show(player);

        if (!response.canceled) {
            const [prefix, start, countdown, success, noEntities] = response.formValues;

            const newConfig = {
                ...config,
                prefix: prefix || DEFAULT_CONFIG.prefix,
                messages: {
                    start: start || DEFAULT_CONFIG.messages.start,
                    countdown: countdown || DEFAULT_CONFIG.messages.countdown,
                    success: success || DEFAULT_CONFIG.messages.success,
                    noEntities: noEntities || DEFAULT_CONFIG.messages.noEntities
                }
            };

            if (saveConfig(newConfig)) {
                player.sendMessage("§a✔ Messages updated successfully!");
                startAutoClearSystem();
            } else {
                player.sendMessage("§c⚠ Failed to save messages!");
            }
        }
    } catch (error) {
        console.warn("Error in message settings:", error);
        player.sendMessage("§c⚠ An error occurred in message settings!");
    }
}

/**
 * Starts the auto clear system
 */
function startAutoClearSystem() {
    stopAutoClearSystem();

    const config = getConfig();
    if (!config.enabled) return;

    let timeUntilClear = config.interval;

    autoClearTask = system.runInterval(() => {
        try {
            const currentConfig = getConfig();

            if (!currentConfig.enabled) {
                stopAutoClearSystem();
                return;
            }

            timeUntilClear--;

            // Show warning messages
            if (currentConfig.warningTimes.includes(timeUntilClear)) {
                const msg = timeUntilClear >= 30 ?
                    currentConfig.messages.start :
                    currentConfig.messages.countdown;

                const formattedMsg = `${currentConfig.prefix} ${msg.replace("{time}", timeUntilClear)}`;
                world.sendMessage(formattedMsg);

                // Play sound for short warnings
                if (timeUntilClear <= 10) {
                    const players = world.getPlayers();
                    for (const player of players) {
                        player.runCommand('playsound note.pling @a[r=5] ~~~ 1 0.5');
                    }
                }
            }

            // Execute clear when time reaches 0
            if (timeUntilClear <= 0) {
                // Play completion sound
                const players = world.getPlayers();
                for (const player of players) {
                    player.runCommand('playsound random.levelup @a[r=5] ~~~ 1 1');
                }

                // Clear entities
                const cleared = clearEntities();
                
                // Send appropriate message
                const message = cleared > 0 ?
                    `${currentConfig.prefix} ${currentConfig.messages.success.replace("{count}", cleared)}` :
                    `${currentConfig.prefix} ${currentConfig.messages.noEntities}`;

                world.sendMessage(message);
                
                // Reset timer
                timeUntilClear = currentConfig.interval;
            }
        } catch (error) {
            console.warn("Error in auto clear system:", error);
        }
    }, 20); // Run every second (20 ticks)
}

/**
 * Stops the auto clear system
 */
function stopAutoClearSystem() {
    if (autoClearTask !== null) {
        system.clearRun(autoClearTask);
        autoClearTask = null;
    }
}

/**
 * Handles the clearlag command
 * @param {Player} player - The player executing the command
 */
export function handleClearLagCommand(player) {
    // Check if player is admin/OP
    if (!isPlayerAdmin(player)) {
        player.sendMessage("§c⚠ You don't have permission to use this command!");
        return;
    }
    
    system.runTimeout(() => {
        openClearLagMenu(player);
    }, 20);
}

/**
 * Checks if a player is an admin
 * @param {Player} player - The player to check
 * @returns {boolean} - Whether the player is an admin
 */
function isPlayerAdmin(player) {
    try {
        // Check admin tags
        if (player.hasTag("admin") || player.hasTag("op") || player.hasTag("moderator")) {
            return true;
        }
        
        // Check permission level
        if (player.isOp) {
            return true;
        }
        
        // Fallback: try to run a command that only ops can run
        try {
            player.runCommand("testfor @s");
            return true;
        } catch {
            return false;
        }
    } catch (error) {
        return false;
    }
}

/**
 * Gets clear lag system information
 * @returns {Object} - Information about the clear lag system
 */
export function getClearLagInfo() {
    const config = getConfig();
    const entityCount = countClearableEntities();
    
    return {
        enabled: config.enabled,
        interval: config.interval,
        entityCount: entityCount,
        nextClear: config.enabled ? "Active" : "Disabled"
    };
}

// Initialize the system when the module loads
system.runTimeout(() => {
    try {
        const config = getConfig();
        console.warn(`ClearLag system initializing... Enabled: ${config.enabled}`);
        
        if (config.enabled) {
            startAutoClearSystem();
            console.warn("ClearLag system started automatically");
            world.sendMessage("§b[ClearLag System] §aAuto clear system is now active");
        } else {
            console.warn("ClearLag system is disabled");
        }
    } catch (error) {
        console.warn("Error starting auto clear system:", error);
    }
}, 100); // Run after 5 seconds

// Export functions for external access
export { startAutoClearSystem, stopAutoClearSystem };
