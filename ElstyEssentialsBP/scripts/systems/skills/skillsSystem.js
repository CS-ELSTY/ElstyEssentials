// Main Skills System Module
// Initializes and coordinates all skill system components

import { world, system } from "../../core.js";
import { MANA_CONFIG } from "./skillsConfig.js";
import { initializePlayerSkills, getPlayerSkills, syncAllPlayerSkills } from "./skillsDataManager.js";
import { handleMiningXP, handleCombatXP, handleDefenseXP, handleArcherXP, handleExplorerXP, getExplorerManaRegenBonus, getExplorerMaxManaBonus } from "./skillsXPHandlers.js";
import { regenerateMana, checkDefenseAbilities, cleanupPlayer, initializeButtonInputHandler, initializePlayerMana } from "./skillsAbilities.js";
import { updateAllActionBars } from "./skillsUI.js";
import { openSkillsMenu } from "./skillsUI.js";

// Initialize Skills System
export function initializeSkillsSystem() {
    // Event for mining
    world.afterEvents.playerBreakBlock.subscribe((event) => {
        handleMiningXP(event.player, event.brokenBlockPermutation);
    });
    
    // Event for combat
    world.afterEvents.entityDie.subscribe((event) => {
        if (event.damageSource.damagingEntity?.typeId === "minecraft:player") {
            handleCombatXP(event.damageSource.damagingEntity, event.deadEntity);
            
            // Archer XP if kill with arrow
            if (event.damageSource.cause === "projectile" || event.damageSource.damagingProjectile?.typeId === "minecraft:arrow") {
                handleArcherXP(event.damageSource.damagingEntity);
            }
        }
    });
    
    // Event for defense - when player takes damage
    if (world.afterEvents.entityHurt) {
        world.afterEvents.entityHurt.subscribe((event) => {
            if (event.hurtEntity.typeId === "minecraft:player") {
                handleDefenseXP(event.hurtEntity, event.damage);
            }
        });
    }
    
    // Auto-load skills when player joins
    world.afterEvents.playerSpawn.subscribe((event) => {
        if (event.initialSpawn) {
            initializePlayerSkills(event.player);
            // Sync unlocked abilities to ensure players have all abilities for their level
            syncAllPlayerSkills(event.player);
            // Initialize player mana with their actual max mana (including Explorer bonuses)
            initializePlayerMana(event.player);
        }
    });
    
    // Cleanup when player leaves
    world.afterEvents.playerLeave.subscribe((event) => {
        cleanupPlayer(event.playerName);
    });
    
    // Initialize button input handler for active abilities (Sprint, etc.)
    initializeButtonInputHandler();
    
    // Mana regeneration
    system.runInterval(() => {
        regenerateMana();
    }, MANA_CONFIG.regenInterval);
    
    // Update action bar for all players
    system.runInterval(() => {
        updateAllActionBars();
    }, 10); // Update every 0.5 seconds
    
    // Check defense abilities (Last Stand, Regen, Explorer speed)
    system.runInterval(() => {
        checkDefenseAbilities();
    }, 20); // Check every second
    
    // Explorer tracking using position interval (more stable than playerTravel event)
    const lastPositions = new Map();
    system.runInterval(() => {
        try {
            for (const player of world.getAllPlayers()) {
                const playerId = player.id || player.name;
                const last = lastPositions.get(playerId);
                const now = player.location;

                if (last) {
                    const dx = now.x - last.x;
                    const dz = now.z - last.z;
                    const distance = Math.sqrt(dx*dx + dz*dz);

                    if (distance > 0.5) {
                        handleExplorerXP(player, distance);
                    }
                }

                lastPositions.set(playerId, { x: now.x, z: now.z });
            }
        } catch (error) {
            console.warn("[Skills] Error in explorer tracking:", error);
        }
    }, 20); // Check every second
    
    console.warn("[Skills] Skills System initialized with persistent storage");
}

// Command handler for skills menu
export function handleSkillsCommand(player) {
    system.runTimeout(() => {
        openSkillsMenu(player);
    }, 5);
}

// Sync player skills manually (for debugging/fixing)
export function handleSkillsSyncCommand(player) {
    try {
        syncAllPlayerSkills(player);
        initializePlayerMana(player);
        player.sendMessage("§a§l✓ Skills synced! All abilities have been updated based on your skill levels.");
        player.sendMessage("§b✓ Mana has been reinitialized with your Explorer bonuses.");
        player.runCommand("playsound random.orb @s");
    } catch (error) {
        console.warn("[Skills] Error syncing skills:", error);
        player.sendMessage("§cError syncing skills!");
    }
}

// Export showSkillsMenu as alias for openSkillsMenu
export { openSkillsMenu as showSkillsMenu };

// Export functions for external use
export {
    // Data management
    getPlayerSkills,
    initializePlayerSkills,
    syncAllPlayerSkills,
    
    // XP handlers
    handleMiningXP,
    handleCombatXP,
    handleDefenseXP,
    handleArcherXP,
    handleExplorerXP,
    
    // Abilities
    regenerateMana,
    checkDefenseAbilities,
    initializePlayerMana,
    
    // UI
    openSkillsMenu,
    updateAllActionBars,
    
    // Bonus getters
    getExplorerManaRegenBonus,
    getExplorerMaxManaBonus
};