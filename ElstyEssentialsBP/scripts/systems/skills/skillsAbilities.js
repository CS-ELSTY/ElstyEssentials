// Skills Abilities Module
// Handles active and passive abilities, mana management, and ability effects

import { world, system, InputButton } from "../../core.js";
import { MANA_CONFIG, SKILLS_CONFIG, SKILL_ITEMS } from "./skillsConfig.js";
import { getSkillData, isAbilityUnlocked } from "./skillsDataManager.js";
import { handleCombatXP, getExplorerManaRegenBonus, getExplorerMaxManaBonus } from "./skillsXPHandlers.js";

// Mana storage (runtime only - regenerates automatically)
const playerMana = new Map();
const activeAbilities = new Map();

// Cooldown and tracking for active abilities
const doubleSneakTimestamps = new Map();
const sprintCooldown = new Map();
const abilityCooldowns = new Map();

// Mana functions
export function getPlayerMana(playerName) {
    if (!playerName) return MANA_CONFIG.maxMana;
    if (!playerMana.has(playerName)) {
        playerMana.set(playerName, MANA_CONFIG.maxMana);
    }
    return playerMana.get(playerName);
}

export function getPlayerMaxMana(player) {
    try {
        const baseMaxMana = MANA_CONFIG.maxMana;
        const explorerBonus = getExplorerMaxManaBonus(player);
        return baseMaxMana + explorerBonus;
    } catch (error) {
        console.warn("[Skills] Error getting player max mana:", error);
        return MANA_CONFIG.maxMana;
    }
}

// Initialize player mana with their actual max mana (including Explorer bonuses)
export function initializePlayerMana(player) {
    if (!player || !player.name) return;
    const maxMana = getPlayerMaxMana(player);
    playerMana.set(player.name, maxMana);
}

export function setPlayerMana(player, amount) {
    if (!player) return;
    const playerName = player.name;
    if (!playerName) return;
    
    const maxMana = getPlayerMaxMana(player);
    playerMana.set(playerName, Math.max(0, Math.min(maxMana, amount)));
}

export function useMana(player, amount) {
    if (!player || !player.name) return false;
    const currentMana = getPlayerMana(player.name);
    const maxMana = getPlayerMaxMana(player);
    if (currentMana >= amount) {
        setPlayerMana(player, currentMana - amount);
        return true;
    }
    return false;
}

export function regenerateMana() {
    for (const player of world.getAllPlayers()) {
        try {
            if (!player || !player.name) continue;
            const currentMana = getPlayerMana(player.name);
            const maxMana = getPlayerMaxMana(player);

            if (currentMana < maxMana) {
                // Get mana regen bonus from Explorer skill
                const manaRegenBonus = getExplorerManaRegenBonus(player);
                const regenRate = MANA_CONFIG.regenRate * (1 + manaRegenBonus);

                const newMana = Math.min(maxMana, currentMana + regenRate);
                setPlayerMana(player, newMana);
            }
        } catch (error) {
            console.warn("[Skills] Error regenerating mana:", error);
            continue;
        }
    }
}

// Show ability notification
function showAbilityNotification(player, message) {
    player.onScreenDisplay.setActionBar(message);
}

// Get skill type from held item
function getSkillTypeFromItem(item) {
    if (!item || !item.typeId) return null;
    
    for (const [skillType, items] of Object.entries(SKILL_ITEMS)) {
        if (items.includes(item.typeId)) {
            return skillType;
        }
    }
    return null;
}

// Check if ability is on cooldown
function isAbilityOnCooldown(playerName, abilityName) {
    const playerCooldowns = abilityCooldowns.get(playerName);
    if (!playerCooldowns) return false;
    
    const cooldownEnd = playerCooldowns.get(abilityName);
    if (!cooldownEnd) return false;
    
    return Date.now() < cooldownEnd;
}

// Set ability cooldown
function setAbilityCooldown(playerName, abilityName, durationSeconds) {
    if (!abilityCooldowns.has(playerName)) {
        abilityCooldowns.set(playerName, new Map());
    }
    
    const playerCooldowns = abilityCooldowns.get(playerName);
    playerCooldowns.set(abilityName, Date.now() + (durationSeconds * 1000));
}

// Get remaining cooldown in seconds
function getRemainingCooldown(playerName, abilityName) {
    const playerCooldowns = abilityCooldowns.get(playerName);
    if (!playerCooldowns) return 0;
    
    const cooldownEnd = playerCooldowns.get(abilityName);
    if (!cooldownEnd) return 0;
    
    const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
    return Math.max(0, remaining);
}

// Check defense abilities (Last Stand, Regen)
export function checkDefenseAbilities() {
    for (const player of world.getAllPlayers()) {
        try {
            if (!player || !player.name) continue;
            
            const health = player.getComponent("health");
            if (!health) continue;
            
            const currentHP = health.currentValue;
            const maxHP = health.effectiveMax;
            
            const defenseSkill = getSkillData(player, "defense");
            const explorerSkill = getSkillData(player, "explorer");
            
            // Last Stand: Speed II when HP < 2 hearts (4 HP)
            let hasLastStand = false;
            for (const abilityLevel of defenseSkill.unlockedAbilities) {
                const ability = SKILLS_CONFIG.defense.abilities[abilityLevel];
                if (ability?.bonus?.lastStand) {
                    hasLastStand = true;
                    break;
                }
            }
            
            if (hasLastStand && currentHP <= 4) {
                player.addEffect("speed", 40, { amplifier: 1, showParticles: false });
                
                // Show notification every 5 seconds
                if (!player.hasTag("lastStandNotified") || Date.now() % 5000 < 100) {
                    showAbilityNotification(player, "§9🛡 Last Stand Active!");
                    player.addTag("lastStandNotified");
                }
            } else {
                player.removeTag("lastStandNotified");
            }
            
            // Regeneration: Heal when HP < 50%
            let hasRegen = false;
            for (const abilityLevel of defenseSkill.unlockedAbilities) {
                const ability = SKILLS_CONFIG.defense.abilities[abilityLevel];
                if (ability?.bonus?.regen) {
                    hasRegen = true;
                    break;
                }
            }
            
            if (hasRegen && currentHP < maxHP * 0.5 && currentHP > 0) {
                player.addEffect("regeneration", 40, { amplifier: 0, showParticles: false });
            }
            
            // Check if player has Sprint ability (Explorer level 10)
            let hasSprintAbility = false;
            let sprintAbility = null;
            for (const abilityLevel of explorerSkill.unlockedAbilities) {
                const ability = SKILLS_CONFIG.explorer.abilities[abilityLevel];
                if (ability?.name === "Sprint") {
                    hasSprintAbility = true;
                    sprintAbility = ability;
                    break;
                }
            }
            
            // If player has Sprint ability and it's active
            const playerKey = player.id ?? player.name;
            if (hasSprintAbility && activeAbilities.has(playerKey)) {
                const activeAbility = activeAbilities.get(playerKey);
                if (activeAbility.skill === "explorer" && activeAbility.ability === "Sprint") {
                    player.addEffect("speed", 40, { amplifier: 2, showParticles: false }); // Speed III
                }
            }
            
        } catch (error) {
            continue;
        }
    }
}

// Activate active ability
export function activateAbility(player, skillType, fromItem = false, target = null) {
    try {
        const config = SKILLS_CONFIG[skillType];
        if (!config) return false;

        // Find the highest level active ability
        let highestAbility = null;
        let highestLevel = 0;

        const skillData = getSkillData(player, skillType);

        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = config.abilities[abilityLevel];
            if (ability?.type === "active" && abilityLevel > highestLevel) {
                highestAbility = ability;
                highestLevel = abilityLevel;
            }
        }

        if (!highestAbility) {
            if (fromItem) {
                player.onScreenDisplay.setActionBar("§cNo active ability unlocked for this skill!");
            } else {
                player.onScreenDisplay.setActionBar("§cNo active ability available!");
            }
            return false;
        }

        // Check cooldown
        if (isAbilityOnCooldown(player.name, highestAbility.name)) {
            const remaining = getRemainingCooldown(player.name, highestAbility.name);
            player.onScreenDisplay.setActionBar(`§cCooldown: ${remaining}s`);
            return false;
        }

        // Check if player has enough mana
        if (!useMana(player, highestAbility.manaCost)) {
            player.onScreenDisplay.setActionBar(`§cNot enough mana! Need ${highestAbility.manaCost} mana.`);
            return false;
        }

        // Execute ability based on type
        switch (skillType) {
            case "mining":
                if (highestAbility.name === "Vein Miner") {
                    activateVeinMiner(player);
                }
                break;
            case "woodcutting":
                if (highestAbility.name === "Timber!") {
                    activateTimber(player);
                }
                break;
            case "combat":
                if (highestAbility.name === "Power Strike") {
                    if (!target) return false;
                    activatePowerStrike(player, target);
                }
                break;
            case "defense":
                if (highestAbility.name === "Shield Wall") {
                    activateShieldWall(player);
                }
                break;
            case "farming":
                if (highestAbility.name === "Harvest") {
                    activateHarvest(player);
                }
                break;
            case "fishing":
                if (highestAbility.name === "Sea Blessing") {
                    activateSeaBlessing(player);
                }
                break;
            case "archer":
                if (highestAbility.name === "Multi-Shot") {
                    activateMultiShot(player);
                }
                break;
        }

        // Set cooldown (10 seconds default, or based on ability)
        const cooldownDuration = highestAbility.cooldown || 10;
        setAbilityCooldown(player.name, highestAbility.name, cooldownDuration);

        showAbilityNotification(player, `§6✦ ${highestAbility.name} Activated!`);
        player.playSound("random.levelup");
        return true;

    } catch (error) {
        console.warn(`[Skills] Error activating ability for ${skillType}:`, error);
        return false;
    }
}

// Vein Miner Ability
function activateVeinMiner(player) {
    try {
        const viewDir = player.getViewDirection();
        const loc = player.location;
        
        // Mine blocks in 3x3 area in front of player
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const targetX = Math.floor(loc.x) + x;
                    const targetY = Math.floor(loc.y + 1) + y;
                    const targetZ = Math.floor(loc.z) + z;
                    
                    try {
                        player.runCommand(`setblock ${targetX} ${targetY} ${targetZ} air destroy`);
                    } catch (e) {
                        // Block cannot be broken
                    }
                }
            }
        }
    } catch (error) {
        console.warn("[Skills] Error in Vein Miner:", error);
    }
}

// Timber Ability
function activateTimber(player) {
    try {
        const viewDir = player.getViewDirection();
        const loc = player.location;
        
        // Break entire tree (simplified - breaks wood blocks in vertical line)
        for (let y = 0; y <= 10; y++) {
            const targetY = Math.floor(loc.y + 1) + y;
            const targetX = Math.floor(loc.x);
            const targetZ = Math.floor(loc.z);
            
            try {
                player.runCommand(`setblock ${targetX} ${targetY} ${targetZ} air destroy`);
            } catch (e) {
                // Block cannot be broken
            }
        }
    } catch (error) {
        console.warn("[Skills] Error in Timber:", error);
    }
}

// Power Strike Ability
function activatePowerStrike(player, target) {
    try {
        if (!target || !target.location) return;

        const dim = player.dimension;
        const pos = target.location;

        dim.spawnEntity("minecraft:lightning_bolt", {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z)
        });

        player.onScreenDisplay.setActionBar("§c⚡ Power Strike!");
        player.playSound("ambient.weather.lightning.impact");
    } catch (e) {
        console.warn("[Skills] Power Strike error:", e);
    }
}

// Shield Wall Ability
function activateShieldWall(player) {
    try {
        // Apply resistance effect
        player.addEffect("resistance", 100, { amplifier: 4, showParticles: false });
        showAbilityNotification(player, "§9🛡 Shield Wall Active!");
    } catch (error) {
        console.warn("[Skills] Error in Shield Wall:", error);
    }
}

// Harvest Ability
function activateHarvest(player) {
    try {
        const loc = player.location;
        
        // Harvest 3x3 area
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const targetX = Math.floor(loc.x) + x;
                const targetY = Math.floor(loc.y);
                const targetZ = Math.floor(loc.z) + z;
                
                try {
                    // Try to harvest crops
                    player.runCommand(`setblock ${targetX} ${targetY} ${targetZ} air destroy`);
                } catch (e) {
                    // Block cannot be broken
                }
            }
        }
    } catch (error) {
        console.warn("[Skills] Error in Harvest:", error);
    }
}

// Sea Blessing Ability
function activateSeaBlessing(player) {
    try {
        // Apply luck effect
        player.addEffect("luck", 600, { amplifier: 3, showParticles: false });
        showAbilityNotification(player, "§b🎣 Sea Blessing Active!");
    } catch (error) {
        console.warn("[Skills] Error in Sea Blessing:", error);
    }
}

// Multi-Shot Ability
function activateMultiShot(player) {
    try {
        // Spawn 2 additional arrows
        const dim = player.dimension;
        const pos = player.location;
        const viewDir = player.getViewDirection();
        
        for (let i = 0; i < 2; i++) {
            const arrow = dim.spawnEntity("minecraft:arrow", {
                x: pos.x + viewDir.x * 0.5 + (Math.random() - 0.5) * 0.3,
                y: pos.y + 1.5 + (Math.random() - 0.5) * 0.3,
                z: pos.z + viewDir.z * 0.5 + (Math.random() - 0.5) * 0.3
            });
            
            // Set arrow velocity
            arrow.applyImpulse({
                x: viewDir.x * 1.5,
                y: viewDir.y * 1.5,
                z: viewDir.z * 1.5
            });
        }
        
        showAbilityNotification(player, "§d🏹 Multi-Shot Active!");
    } catch (error) {
        console.warn("[Skills] Error in Multi-Shot:", error);
    }
}

// Sprint Ability
function activateSprint(player) {
    try {
        const skillData = getSkillData(player, "explorer");

        // Check if player has Sprint ability (level 10)
        if (!skillData.unlockedAbilities || !skillData.unlockedAbilities.includes(10)) {
            player.onScreenDisplay.setActionBar("§eAnda belum memiliki ability Sprint!");
            return;
        }

        const sprintAbility = SKILLS_CONFIG.explorer.abilities[10];
        const playerId = player.id || player.name;
        const lastSprint = sprintCooldown.get(playerId) || 0;
        const now = Date.now();

        // Check cooldown (5 seconds)
        if (now - lastSprint < 5000) {
            // Don't spam cooldown message, only play sound if too fast
            if (now - lastSprint < 100) {
                player.playSound("note.harp");
            }
            return;
        }

        // Check mana (40 mana)
        if (!useMana(player, sprintAbility.manaCost)) {
            player.onScreenDisplay.setActionBar("§cMana tidak cukup untuk menggunakan Sprint!");
            return;
        }
        
        // Activate sprint
        activeAbilities.set(player.name, {
            skill: "explorer",
            ability: "Sprint",
            expiresAt: Date.now() + (sprintAbility.duration * 50) // duration in ticks, 1 tick = 50ms
        });
        
        // Apply speed effect
        player.addEffect("speed", sprintAbility.duration, { amplifier: 2, showParticles: true });
        
        // Use action bar instead of sendMessage to avoid spam
        player.onScreenDisplay.setActionBar("§aSprint aktif! §7(10 detik)");
        player.playSound("random.orb");
        
        // Set cooldown
        sprintCooldown.set(playerId, now);
        
        // Remove effect after duration
        system.runTimeout(() => {
            if (activeAbilities.has(player.name)) {
                const activeAbility = activeAbilities.get(player.name);
                if (activeAbility.skill === "explorer" && activeAbility.ability === "Sprint") {
                    activeAbilities.delete(player.name);
                    // Use action bar for completion notification too
                    player.onScreenDisplay.setActionBar("§eSprint selesai!");
                }
            }
        }, sprintAbility.duration); // Duration is already in ticks
        
    } catch (error) {
        console.warn("[Skills] Error in Sprint:", error);
    }
}

// Cleanup on player leave
export function cleanupPlayer(playerName) {
    if (!playerName) return;
    playerMana.delete(playerName);
    activeAbilities.delete(playerName);
    doubleSneakTimestamps.delete(playerName);
    sprintCooldown.delete(playerName);
}

// Initialize button input handler for active abilities
export function initializeButtonInputHandler() {
    world.afterEvents.playerButtonInput.subscribe((ev) => {
        const player = ev.player;
        if (!player) return;
        
        const btn = ev.button;
        const now = Date.now();
        
        // Double sneak detection for Sprint ability
        if (btn === InputButton.Sneak) {
            const lastTime = doubleSneakTimestamps.get(player.id) || 0;
            const diff = now - lastTime;
            
            // Check if double tap within 400ms
            if (diff < 400 && diff > 0) {
                // Double sneak detected - activate Sprint
                activateSprint(player);
            } else {
                // Save time as first tap
                doubleSneakTimestamps.set(player.id, now);
            }
        }
    });
    
    // Left-click attack handler for item-based skill activation
    world.afterEvents.entityHurt.subscribe((event) => {
        const target = event.hurtEntity;
        const damageSource = event.damageSource;

        if (!damageSource || !damageSource.damagingEntity) {
            return;
        }

        const player = damageSource.damagingEntity;
        if (player.typeId !== "minecraft:player") {
            return;
        }

        try {
            // Combat XP (FIXED)
            handleCombatXP(player, target);

            // Get the item the player is holding using equipment component
            const equipment = player.getComponent("equippable");
            if (!equipment) return;

            const selectedItem = equipment.getEquipment("Mainhand");
            if (!selectedItem) return;

            // Check if the held item maps to a skill type
            const skillType = getSkillTypeFromItem(selectedItem);
            if (!skillType) return;

            // ACTIVATE ABILITY
            activateAbility(player, skillType, true, target);

        } catch (error) {
            console.warn("[Skills] Error in entity hurt handler:", error);
        }
    });
    
    // Left-click block handler for item-based skill activation (for non-combat skills)
    world.afterEvents.playerBreakBlock.subscribe((event) => {
        const player = event.player;
        if (!player) return;
        
        try {
            // Get the item the player is holding
            const inventory = player.getComponent("inventory");
            if (!inventory) return;
            
            const container = inventory.container;
            if (!container) return;
            
            const selectedSlot = player.selectedSlot;
            if (typeof selectedSlot !== "number" || selectedSlot < 0 || selectedSlot >= container.size) return;
            
            const selectedItem = container.getItem(selectedSlot);
            if (!selectedItem) return;
            
            // Check if the held item maps to a skill type
            const skillType = getSkillTypeFromItem(selectedItem);
            if (!skillType) return;
            
            // Activate the ability for this skill type
            // Only activate for non-combat skills (mining, woodcutting, farming)
            if (["mining", "woodcutting", "farming"].includes(skillType)) {
                activateAbility(player, skillType, true);
            }
            
        } catch (error) {
            console.warn("[Skills] Error in block break handler:", error);
        }
    });
    
    console.warn("[Skills] Button input handler initialized with item-based skill activation");
}