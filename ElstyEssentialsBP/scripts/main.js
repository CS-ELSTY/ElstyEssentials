import { system, world } from "@minecraft/server";
import { checkPlayerRank, getPlayerRank } from "./social/ranks/rank.js";
import { guildSystem, initializeGuildSystem } from "./social/guildSystem.js";
import { initializeScoreboardObjectives, updateScoreboard, getPlayerClanInfo } from "./systems/scoreboardSystem.js";
import { startAutoClearSystem } from "./systems/clearlagSystem.js";
import { GlobalConfig } from "./config/mainConfig.js";
import { registerCustomCommands } from "./commands/commandHandler.js";
import { initializeCustomChat } from "./social/chatSystem.js";
import { initializeShopSystem } from "./social/shopSystem.js";
import { initializeSitSystem } from "./plugins/sit-system/sitSystem.js";
import { LandDatabase } from "./plugins/land/LandDatabase.js";
import { LandProtection } from "./plugins/land/LandProtection.js";
import { LandMember } from "./plugins/land/LandMember.js";
import { initializeRTPSystem } from "./systems/rtpSystem.js";
import { initializeSkillsSystem } from "./systems/skills/skillsSystem.js";
import { initializeQuestSystem, handleItemCollection, handleEntityKill, handleItemCraft, handleBlockBreak, handleBlockPlace, handleExplore } from "./systems/quest/questSystem.js";
import { initializeSaturationSystem } from "./systems/regenerationSystem.js";
import { initializeCombatSystem } from "./systems/combatSystem.js";
import { addSkillXP, handleCombatXP, handleExplorerXP } from "./systems/skills/skillsXPHandlers.js";
import { registerEventHandlers } from "./systems/eventHandlers.js";
// Import player tracker to initialize it
import "./social/playerTracker.js";
// Import floating text system to initialize it
import "./plugins/floating-text/floating_text.js";
// Import nametag system to initialize it
import "./board/nametag.js";
// Import music system
import "./systems/musicSystem.js";

// Initialize all systems when the script loads
async function initializeSystems() {
    console.warn("[Elsty Essentials] Initializing systems...");

    // Check if world is ready
    let worldReady = false;
    let attempts = 0;

    while (!worldReady && attempts < 10) {
        try {
            // Try to access a simple world property
            const test = world.getAllPlayers();
            worldReady = true;
        } catch (e) {
            attempts++;
            if (attempts < 10) {
                // Wait 1 second (20 ticks) before trying again
                await new Promise(resolve => system.runTimeout(resolve, 20));
            }
        }
    }

    if (!worldReady) {
        console.warn("[Elsty Essentials] World not ready after 10 attempts, systems may not work properly");
    }

    // Set gamerules to reduce command spam
    try {
        world.getDimension("overworld").runCommand("gamerule sendcommandfeedback false");
        world.getDimension("overworld").runCommand("gamerule commandblockoutput false");
        world.getDimension("nether").runCommand("gamerule sendcommandfeedback false");
        world.getDimension("nether").runCommand("gamerule commandblockoutput false");
        world.getDimension("the_end").runCommand("gamerule sendcommandfeedback false");
        world.getDimension("the_end").runCommand("gamerule commandblockoutput false");
        console.warn("[Elsty Essentials] Gamerules set successfully");
    } catch (e) {
        console.warn("[Elsty Essentials] Failed to set gamerules:", e);
    }

    // Initialize scoreboard objectives
    initializeScoreboardObjectives();

    // Initialize custom chat system
    initializeCustomChat();

    // Initialize shop system
    initializeShopSystem();

    // Initialize sit system
    initializeSitSystem();

    // Initialize land system
    LandDatabase.init();
    LandProtection.init();

    // Initialize RTP system
    initializeRTPSystem();

    // Initialize skills system
    initializeSkillsSystem();

    // Initialize quest system
    initializeQuestSystem();

    // Initialize saturation/regeneration system
    initializeSaturationSystem();

    // Initialize combat system with HP bonus and money drop
    initializeCombatSystem();

    // Initialize guild system asynchronously
    await initializeGuildSystem();

    // Register 1.26.10+ stable event handlers for quests and skills
    registerEventHandlers();

    console.warn("[Elsty Essentials] All systems initialized!");
}

// Register custom commands
registerCustomCommands(system);

let systemsInitialized = false;

// Set up the update loop for the scoreboard
system.runInterval(() => {
    try {
        if (GlobalConfig.scoreboard.enabled && systemsInitialized) {
            updateScoreboard();
        }
    } catch (error) {
        console.warn("Error updating scoreboard:", error);
    }
}, GlobalConfig.general.updateInterval); // Use config value

// Initialize systems after a short delay to ensure world is ready
system.runTimeout(async () => {
    await initializeSystems();
    systemsInitialized = true; // Enable scoreboard updates after initialization
}, 80); // Run after 4 seconds to allow more time for world to be ready



// Handle player joins to ensure they get updated info
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    
    // Small delay to ensure player is fully loaded
    system.runTimeout(() => {
        try {
            if (GlobalConfig.scoreboard.enabled) {
                updateScoreboard();
            }
        } catch (error) {
            console.warn(`Error updating scoreboard for ${player.name}:`, error);
        }
    }, 5);
});

// Export any necessary functions for external use
export { initializeSystems };