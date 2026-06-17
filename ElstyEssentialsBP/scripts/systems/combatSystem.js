import { world, system } from "@minecraft/server";
import { getCombatDamageBonus } from "./skills/skillsXPHandlers.js";

// Debug flag - set false untuk production
const DEBUG = false; // Set true untuk melihat log

// Store untuk menyimpan data combat
const combatData = new Map();

// Config money drop system - FLEKSIBEL untuk add-on mobs
const MONEY_CONFIG = {
    baseChance: 0.6,
    minMoney: 10,
    maxMoney: 100,

    autoDetection: {
        tierKeywords: {
            tier4: ["boss", "dragon", "titan", "king", "queen", "ancient", "elder", "great", "colossal"],
            tier3: ["knight", "guardian", "warrior", "brute", "giant", "alpha", "mutant"],
            tier2: ["mage", "wizard", "shaman", "sorcerer", "archer", "hunter", "assassin"],
            tier1: []
        },

        bonusKeywords: {
            "boss": 0.7, "dragon": 0.8, "titan": 0.6,
            "king": 0.7, "queen": 0.7, "ancient": 0.5,
            "elder": 0.5, "legendary": 0.9, "mythical": 1.0
        },

        multiplierKeywords: {
            "boss": 8, "dragon": 10, "titan": 7,
            "king": 8, "queen": 8, "ancient": 5,
            "elder": 5, "legendary": 15, "mythical": 20
        }
    },

    manualOverrides: {
        "minecraft:ender_dragon": { chance: 0.9, multiplier: 15, tier: 4 },
        "minecraft:wither": { chance: 0.85, multiplier: 12, tier: 4 },
        "minecraft:warden": { chance: 0.8, multiplier: 10, tier: 4 },
        "minecraft:elder_guardian": { chance: 0.7, multiplier: 6, tier: 4 },
        "minecraft:evoker": { chance: 0.6, multiplier: 4, tier: 3 }
    },

    tierMoney: {
        tier1: { min: 15, max: 40 },
        tier2: { min: 30, max: 60 },
        tier3: { min: 50, max: 100 },
        tier4: { min: 80, max: 150 }
    }
};

// Config HP Bonus System - NERFED
const HP_BONUS_CONFIG = {
    attackBonus: {
        minHP: 1,
        maxHP: 2,
        chance: 0.3
    },
    
    killBonus: {
        percentage: 0.05,
        minHP: 1,
        maxHP: 3,
        sound: "random.orb"
    },
    
    cooldown: {
        attack: 40,
        kill: 10
    }
};

// Cache untuk mob analysis
const mobAnalysisCache = new Map();

// Cooldown tracker untuk HP bonuses
const hpCooldownTracker = new Map();

// Hologram entity tracker (untuk cleanup)
const hologramTracker = new Map();

// Initialize scoreboard objective untuk money
let moneyObjective = null;

function initializeCombatSystem() {
    world.afterEvents.entityHurt.subscribe((event) => {
        handleEntityHurt(event);
    });

    world.afterEvents.entityDie.subscribe((event) => {
        handleEntityDeath(event);
    });

    // Initialize money scoreboard
    system.runTimeout(() => {
        initializeMoneyScoreboard();
    }, 20);

    // Cleanup cooldown tracker setiap 10 detik
    system.runInterval(() => {
        cleanupCooldownTracker();
        cleanupHolograms();
    }, 200);

    console.warn("Combat System initialized with HP Bonus & Money Drop features");
}

function initializeMoneyScoreboard() {
    try {
        const scoreboard = world.scoreboard;
        moneyObjective = scoreboard.getObjective("money");
        
        if (!moneyObjective) {
            moneyObjective = scoreboard.addObjective("money", "Money");
            console.warn("Money scoreboard objective created");
        } else {
            console.warn("Money scoreboard objective already exists");
        }
    } catch (error) {
        console.warn("Error initializing money scoreboard:", error.message);
    }
}

function handleEntityHurt(event) {
    try {
        const { damageSource, hurtEntity } = event;
        const attacker = damageSource.damagingEntity;
        
        if (attacker && attacker.typeId === "minecraft:player" && hurtEntity && isLivingEntity(hurtEntity)) {
            giveAttackHPBonus(attacker);
        }
    } catch (error) {
        console.warn("Error in handleEntityHurt:", error);
    }
}

function handleEntityDeath(event) {
    try {
        const { deadEntity, damageSource } = event;
        const killer = damageSource.damagingEntity;
        
        if (killer && killer.typeId === "minecraft:player" && deadEntity && isLivingEntity(deadEntity)) {
            giveKillHPBonus(killer, deadEntity);
            giveMoneyDrop(killer, deadEntity);
        }
    } catch (error) {
        console.warn("Error in handleEntityDeath:", error);
    }
}

function giveAttackHPBonus(player) {
    try {
        if (isOnCooldown(player.id, 'attack')) return;
        if (Math.random() > HP_BONUS_CONFIG.attackBonus.chance) return;
        
        const hpBonus = Math.floor(Math.random() * 
            (HP_BONUS_CONFIG.attackBonus.maxHP - HP_BONUS_CONFIG.attackBonus.minHP + 1)) + 
            HP_BONUS_CONFIG.attackBonus.minHP;
        
        const healthComponent = player.getComponent("health");
        if (!healthComponent) return;
        
        const currentHealth = healthComponent.currentValue;
        const maxHealth = healthComponent.effectiveMax;
        const newHealth = Math.min(currentHealth + hpBonus, maxHealth);
        
        if (newHealth > currentHealth) {
            healthComponent.setCurrentValue(newHealth);
            setCooldown(player.id, 'attack', HP_BONUS_CONFIG.cooldown.attack);
            
            // Gunakan title/actionbar untuk notifikasi
            player.onScreenDisplay.setActionBar(`§a+${hpBonus/2}❤ HP Bonus`);
            player.playSound("random.orb");
        }
    } catch (error) {
        console.warn("Error giving attack HP bonus:", error);
    }
}

function giveKillHPBonus(killer, killedEntity) {
    try {
        if (isOnCooldown(killer.id, 'kill')) return;
        
        const killedHealthComponent = killedEntity.getComponent("health");
        if (!killedHealthComponent) return;
        
        const killedMaxHealth = killedHealthComponent.effectiveMax;
        const hpBonus = Math.max(
            HP_BONUS_CONFIG.killBonus.minHP, 
            Math.min(
                Math.floor(killedMaxHealth * HP_BONUS_CONFIG.killBonus.percentage),
                HP_BONUS_CONFIG.killBonus.maxHP
            )
        );
        
        const killerHealthComponent = killer.getComponent("health");
        if (!killerHealthComponent) return;
        
        const currentHealth = killerHealthComponent.currentValue;
        const maxHealth = killerHealthComponent.effectiveMax;
        const newHealth = Math.min(currentHealth + hpBonus, maxHealth);
        
        if (newHealth > currentHealth) {
            killerHealthComponent.setCurrentValue(newHealth);
            setCooldown(killer.id, 'kill', HP_BONUS_CONFIG.cooldown.kill);
            
            killer.playSound(HP_BONUS_CONFIG.killBonus.sound);
            killer.onScreenDisplay.setActionBar(`§6⚔️ §eKill Bonus: §a+${hpBonus/2}❤`);
        }
    } catch (error) {
        console.warn("Error giving kill HP bonus:", error);
    }
}

function setCooldown(playerId, type, duration) {
    const key = `${playerId}_${type}`;
    hpCooldownTracker.set(key, {
        expires: Date.now() + (duration * 50)
    });
}

function isOnCooldown(playerId, type) {
    const key = `${playerId}_${type}`;
    const cooldown = hpCooldownTracker.get(key);
    
    if (!cooldown) return false;
    
    if (Date.now() >= cooldown.expires) {
        hpCooldownTracker.delete(key);
        return false;
    }
    
    return true;
}

function cleanupCooldownTracker() {
    const now = Date.now();
    for (const [key, cooldown] of hpCooldownTracker.entries()) {
        if (now >= cooldown.expires) {
            hpCooldownTracker.delete(key);
        }
    }
}

function cleanupHolograms() {
    const now = Date.now();
    for (const [id, data] of hologramTracker.entries()) {
        if (now >= data.expires) {
            hologramTracker.delete(id);
        }
    }
}

function analyzeMobType(entity) {
    try {
        const entityType = entity.typeId;
        
        if (mobAnalysisCache.has(entityType)) {
            return mobAnalysisCache.get(entityType);
        }
        
        if (MONEY_CONFIG.manualOverrides[entityType]) {
            mobAnalysisCache.set(entityType, MONEY_CONFIG.manualOverrides[entityType]);
            return MONEY_CONFIG.manualOverrides[entityType];
        }
        
        const entityName = entity.nameTag?.toLowerCase() || "";
        const typeIdLower = entityType.toLowerCase();
        
        let chance = MONEY_CONFIG.baseChance;
        let multiplier = 1;
        let tier = 1;
        
        const allText = typeIdLower + " " + entityName;
        
        for (const [tierLevel, keywords] of Object.entries(MONEY_CONFIG.autoDetection.tierKeywords)) {
            for (const keyword of keywords) {
                if (allText.includes(keyword)) {
                    tier = parseInt(tierLevel.replace('tier', ''));
                    break;
                }
            }
            if (tier > 1) break;
        }
        
        for (const [keyword, bonus] of Object.entries(MONEY_CONFIG.autoDetection.bonusKeywords)) {
            if (allText.includes(keyword)) {
                chance += bonus;
            }
        }
        
        for (const [keyword, mult] of Object.entries(MONEY_CONFIG.autoDetection.multiplierKeywords)) {
            if (allText.includes(keyword)) {
                multiplier *= mult;
            }
        }
        
        const healthComponent = entity.getComponent("health");
        if (healthComponent) {
            const maxHealth = healthComponent.effectiveMax;
            
            if (maxHealth > 200) {
                chance = Math.max(chance, 0.6);
                multiplier = Math.max(multiplier, 5);
                tier = Math.max(tier, 4);
            } else if (maxHealth > 100) {
                chance = Math.max(chance, 0.4);
                multiplier = Math.max(multiplier, 3);
                tier = Math.max(tier, 3);
            } else if (maxHealth > 50) {
                chance = Math.max(chance, 0.3);
                multiplier = Math.max(multiplier, 2);
                tier = Math.max(tier, 2);
            }
        }
        
        chance = Math.min(chance, 1.0);
        multiplier = Math.max(multiplier, 1);
        tier = Math.min(Math.max(tier, 1), 4);
        
        const result = { chance, multiplier, tier };
        mobAnalysisCache.set(entityType, result);
        
        return result;
        
    } catch (error) {
        console.warn("Error analyzing mob type:", error);
        return { chance: MONEY_CONFIG.baseChance, multiplier: 1, tier: 1 };
    }
}

function giveMoneyDrop(player, killedEntity) {
    try {
        const entityType = killedEntity.typeId;
        const mobAnalysis = analyzeMobType(killedEntity);
        const { chance, multiplier, tier } = mobAnalysis;

        const roll = Math.random();

        if (roll <= chance) {
            const moneyRange = MONEY_CONFIG.tierMoney[`tier${tier}`] || MONEY_CONFIG.tierMoney.tier1;
            let moneyAmount = Math.floor(Math.random() * (moneyRange.max - moneyRange.min + 1)) + moneyRange.min;
            moneyAmount = Math.floor(moneyAmount * multiplier);

            // Simpan reference player name
            const playerName = player.name;
            const entityName = getEntityName(killedEntity);

            // Delay eksekusi untuk memastikan player masih valid
            system.runTimeout(() => {
                try {
                    // Cari player lagi
                    const currentPlayer = world.getPlayers().find(p => p.name === playerName);

                    if (currentPlayer && currentPlayer.typeId === "minecraft:player") {
                        // Tambahkan money menggunakan Scoreboard API
                        const success = addMoneyToPlayer(currentPlayer, moneyAmount);

                        if (success) {
                            const tierColors = { 1: "§7", 2: "§a", 3: "§9", 4: "§6" };
                            const tierNames = { 1: "Common", 2: "Uncommon", 3: "Rare", 4: "BOSS" };
                            const color = tierColors[tier] || "§7";
                            const tierName = tierNames[tier] || "Common";

                            currentPlayer.onScreenDisplay.setActionBar(`${color}💰 +${moneyAmount} Money (${tierName})`);

                            const sound = tier >= 4 ? "random.levelup" : "random.orb";
                            currentPlayer.playSound(sound);

                            if (tier >= 4) {
                                currentPlayer.sendMessage(`§6🎯 §lBOSS SLAYER! §r§eYou defeated ${entityName} and earned §6${moneyAmount} money§e!`);
                            }

                            if (DEBUG) {
                                console.warn(`Money Drop: ${playerName} got ${moneyAmount} money from ${entityType} (Tier ${tier})`);
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Error in delayed money drop:", err.message);
                }
            }, 1);
        }

    } catch (error) {
        console.warn("Error in giveMoneyDrop:", error.message);
    }
}

/**
 * Menambahkan money ke player menggunakan Scoreboard API
 * @param {Player} player - Player object
 * @param {number} amount - Jumlah money yang akan ditambahkan
 * @returns {boolean} - True jika berhasil, false jika gagal
 */
function addMoneyToPlayer(player, amount) {
    try {
        // Validasi player
        if (!player || player.typeId !== "minecraft:player") {
            if (DEBUG) console.warn("addMoneyToPlayer: Player is invalid");
            return false;
        }

        // Validasi amount
        if (typeof amount !== 'number' || amount <= 0) {
            if (DEBUG) console.warn("addMoneyToPlayer: Invalid amount:", amount);
            return false;
        }

        // Ambil scoreboard objective
        const scoreboard = world.scoreboard;
        let objective = moneyObjective || scoreboard.getObjective("money");

        // Jika objective tidak ada, coba buat
        if (!objective) {
            try {
                objective = scoreboard.addObjective("money", "Money");
                moneyObjective = objective;
                console.warn("Money objective created on-the-fly");
            } catch (createError) {
                console.warn("Failed to create money objective:", createError.message);
                return false;
            }
        }

        // Dapatkan score saat ini
        let currentScore = 0;
        try {
            currentScore = objective.getScore(player) || 0;
        } catch (getError) {
            // Jika getScore gagal, set default 0
            currentScore = 0;
        }

        // Set score baru
        const newScore = currentScore + amount;
        objective.setScore(player, newScore);

        if (DEBUG) {
            console.warn(`Money added: ${player.name} +${amount} (${currentScore} -> ${newScore})`);
        }

        return true;

    } catch (error) {
        console.warn("Error in addMoneyToPlayer:", error.message);
        if (DEBUG) {
            console.warn("Player name:", player?.name);
            console.warn("Amount:", amount);
            console.warn("Stack:", error.stack);
        }
        return false;
    }
}

function isLivingEntity(entity) {
    try {
        const healthComponent = entity.getComponent("health");
        if (!healthComponent) return false;
        
        const excludedEntities = [
            "minecraft:armor_stand", "minecraft:item", "minecraft:xp_orb",
            "minecraft:arrow", "minecraft:snowball", "minecraft:egg",
            "minecraft:ender_pearl", "minecraft:item_frame", "minecraft:glow_item_frame",
            "minecraft:painting", "minecraft:leash_knot", "minecraft:fireworks_rocket",
            "minecraft:boat", "minecraft:minecart", "minecraft:chest_minecart",
            "minecraft:hopper_minecart", "minecraft:tnt_minecart", "minecraft:command_block_minecart",
            "minecraft:falling_block", "minecraft:experience_orb", "minecraft:area_effect_cloud"
        ];
        
        if (excludedEntities.includes(entity.typeId)) return false;
        
        const nonLivingKeywords = ["arrow", "projectile", "thrown", "fireball", "item", "orb", "crystal", "minecart", "boat"];
        const entityType = entity.typeId.toLowerCase();
        
        for (const keyword of nonLivingKeywords) {
            if (entityType.includes(keyword)) return false;
        }
        
        return true;
        
    } catch (error) {
        console.warn("Error checking living entity:", error);
        return false;
    }
}

function getEntityName(entity) {
    try {
        if (entity.nameTag && entity.nameTag !== "") {
            return entity.nameTag;
        }
        
        let name = entity.typeId;
        if (name.includes(":")) {
            name = name.split(":")[1];
        }
        
        name = name.split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        
        return name;
        
    } catch (error) {
        console.warn("Error getting entity name:", error);
        return entity.typeId || "Unknown";
    }
}

function addManualMobOverride(mobTypeId, settings) {
    MONEY_CONFIG.manualOverrides[mobTypeId] = settings;
    mobAnalysisCache.delete(mobTypeId);
    console.warn(`Manual override added for ${mobTypeId}:`, settings);
}

function getMobAnalysisInfo(entityType) {
    if (mobAnalysisCache.has(entityType)) {
        return mobAnalysisCache.get(entityType);
    }
    return analyzeMobType({ typeId: entityType, nameTag: "" });
}

/**
 * Get player's current money balance
 * @param {Player} player - Player object
 * @returns {number} - Current money balance
 */
function getPlayerMoney(player) {
    try {
        if (!player || player.typeId !== "minecraft:player") return 0;
        
        const scoreboard = world.scoreboard;
        const objective = moneyObjective || scoreboard.getObjective("money");
        
        if (!objective) return 0;
        
        return objective.getScore(player) || 0;
    } catch (error) {
        console.warn("Error getting player money:", error.message);
        return 0;
    }
}

/**
 * Set player's money to a specific amount
 * @param {Player} player - Player object
 * @param {number} amount - Amount to set
 * @returns {boolean} - Success status
 */
function setPlayerMoney(player, amount) {
    try {
        if (!player || player.typeId !== "minecraft:player") return false;
        if (typeof amount !== 'number' || amount < 0) return false;
        
        const scoreboard = world.scoreboard;
        let objective = moneyObjective || scoreboard.getObjective("money");
        
        if (!objective) {
            objective = scoreboard.addObjective("money", "Money");
            moneyObjective = objective;
        }
        
        objective.setScore(player, amount);
        return true;
    } catch (error) {
        console.warn("Error setting player money:", error.message);
        return false;
    }
}

export { 
    initializeCombatSystem,
    giveAttackHPBonus,
    giveKillHPBonus,
    giveMoneyDrop,
    addManualMobOverride,
    getMobAnalysisInfo,
    addMoneyToPlayer,
    getPlayerMoney,
    setPlayerMoney
};
