// Skills XP Handlers Module
// Handles XP gain, level ups, and fortune chances for different skills

import { world, system } from "../../core.js";
import { SKILLS_CONFIG, MAX_LEVEL } from "./skillsConfig.js";
import { getPlayerSkills, savePlayerSkills, getSkillData } from "./skillsDataManager.js";

// Add XP to skill and handle level ups
export function addSkillXP(player, skillType, amount) {
    try {
        const skills = getPlayerSkills(player);
        const skill = skills[skillType];
        const config = SKILLS_CONFIG[skillType];
        
        if (!skill || !config) return;
        
        skill.xp += amount;
        
        // Check level up (but cap at MAX_LEVEL)
        const requiredXP = config.levelUpXP(skill.level);
        if (skill.xp >= requiredXP && skill.level < MAX_LEVEL) {
            skill.xp -= requiredXP;
            skill.level++;
            
            // Check for new abilities
            const newAbility = config.abilities[skill.level];
            if (newAbility) {
                skill.unlockedAbilities.push(skill.level);
                player.sendMessage(`§6§l✦ SKILL UP! §r${config.name} §7Level ${skill.level}`);
                player.sendMessage(`§e§lNew Ability: §r${newAbility.name} §7- ${newAbility.desc}`);
                player.runCommand(`playsound random.levelup @s`);
                player.runCommand(`particle minecraft:totem_particle ~~~`);
            } else {
                player.sendMessage(`§6§l✦ LEVEL UP! §r${config.name} §7Level ${skill.level}`);
                player.runCommand(`playsound random.orb @s`);
            }
            
            // Show MAX LEVEL message when reaching max level
            if (skill.level >= MAX_LEVEL) {
                player.sendMessage(`§6§l✦ MAX LEVEL! §r${config.name} §7has reached Level ${MAX_LEVEL}!`);
                player.runCommand(`playsound random.levelup @s`);
                player.runCommand(`particle minecraft:totem_particle ~~~`);
            }
        }
        
        // Save skills data
        savePlayerSkills(player, skills);
        
    } catch (error) {
        console.warn(`[Skills] Error adding XP for ${skillType}:`, error);
    }
}

// Mining XP Handler with fortune chance
export function handleMiningXP(player, block) {
    try {
        const blockType = block.type.id.toLowerCase();
        
        // Check for mining blocks
        const isMiningBlock = 
            blockType.includes("stone") || blockType.includes("ore") ||
            blockType.includes("granite") || blockType.includes("diorite") ||
            blockType.includes("andesite") || blockType.includes("cobblestone") ||
            blockType.includes("deepslate") || blockType.includes("netherrack") ||
            blockType.includes("ancient_debris") || blockType.includes("blackstone");
        
        if (isMiningBlock) {
            let xp = SKILLS_CONFIG.mining.xpPerAction;
            
            // Bonus XP for ores
            if (blockType.includes("ore") || blockType.includes("ancient_debris")) {
                xp *= 2;
            }
            
            // Check fortune chance
            const fortuneChance = getMiningFortuneChance(player);
            if (fortuneChance > 0 && Math.random() < fortuneChance) {
                // Give double drop
                try {
                    const itemType = block.type.id;
                    player.runCommand(`give @s ${itemType} 1`);
                    
                    // Notification in action bar
                    player.onScreenDisplay.setActionBar("§6⛏ Fortune Proc! §e+1 Drop");
                    player.playSound("random.orb");
                } catch (error) {
                    console.warn("[Skills] Error giving fortune drop:", error);
                }
            }
            
            addSkillXP(player, "mining", xp);
        }
        
        // Check for woodcutting
        if (blockType.includes("log") || blockType.includes("wood")) {
            let xp = SKILLS_CONFIG.woodcutting.xpPerAction;
            
            // Check fortune chance for woodcutting
            const fortuneChance = getWoodcuttingFortuneChance(player);
            if (fortuneChance > 0 && Math.random() < fortuneChance) {
                try {
                    const itemType = block.type.id;
                    player.runCommand(`give @s ${itemType} 1`);
                    
                    player.onScreenDisplay.setActionBar("§2🪓 Fortune Proc! §e+1 Log");
                    player.playSound("random.orb");
                } catch (error) {
                    console.warn("[Skills] Error giving woodcutting fortune:", error);
                }
            }
            
            addSkillXP(player, "woodcutting", xp);
        }
        
    } catch (error) {
        console.warn("[Skills] Error in handleMiningXP:", error);
    }
}

// Combat XP Handler
export function handleCombatXP(player, entity) {
    try {
        if (!entity.getComponent("health")) return;
        
        const maxHealth = entity.getComponent("health").effectiveMax;
        let xp = SKILLS_CONFIG.combat.xpPerAction;
        
        // Bonus XP for mobs with high HP
        if (maxHealth > 100) {
            xp *= 3;
        } else if (maxHealth > 50) {
            xp *= 2;
        }
        
        addSkillXP(player, "combat", xp);
        
    } catch (error) {
        console.warn("[Skills] Error in handleCombatXP:", error);
    }
}

// Defense XP Handler
export function handleDefenseXP(player, damage) {
    try {
        // Get XP based on damage received
        const xp = Math.floor(damage * 2); // 2 XP per damage
        addSkillXP(player, "defense", xp);
    } catch (error) {
        console.warn("[Skills] Error in handleDefenseXP:", error);
    }
}

// Get mining fortune chance
export function getMiningFortuneChance(player) {
    try {
        const skillData = getSkillData(player, "mining");
        let fortuneChance = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.mining.abilities[abilityLevel];
            if (ability?.bonus?.fortune) {
                fortuneChance += ability.bonus.fortune;
            }
        }
        
        return fortuneChance;
    } catch (error) {
        console.warn("[Skills] Error getting mining fortune chance:", error);
        return 0;
    }
}

// Get woodcutting fortune chance
export function getWoodcuttingFortuneChance(player) {
    try {
        const skillData = getSkillData(player, "woodcutting");
        let fortuneChance = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.woodcutting.abilities[abilityLevel];
            if (ability?.bonus?.fortune) {
                fortuneChance += ability.bonus.fortune;
            }
        }
        
        return fortuneChance;
    } catch (error) {
        console.warn("[Skills] Error getting woodcutting fortune chance:", error);
        return 0;
    }
}

// Get combat damage bonus
export function getCombatDamageBonus(player) {
    try {
        const skillData = getSkillData(player, "combat");
        let damageBonus = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.combat.abilities[abilityLevel];
            if (ability?.bonus?.damage) {
                damageBonus += ability.bonus.damage;
            }
        }
        
        return damageBonus;
    } catch (error) {
        console.warn("[Skills] Error getting combat damage bonus:", error);
        return 0;
    }
}

// Get defense reduction
export function getDefenseReduction(player) {
    try {
        const skillData = getSkillData(player, "defense");
        let defenseReduction = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.defense.abilities[abilityLevel];
            if (ability?.bonus?.reduction) {
                defenseReduction += ability.bonus.reduction;
            }
        }
        
        return defenseReduction;
    } catch (error) {
        console.warn("[Skills] Error getting defense reduction:", error);
        return 0;
    }
}

// Archer XP Handler
export function handleArcherXP(player) {
    try {
        addSkillXP(player, "archer", SKILLS_CONFIG.archer.xpPerAction);
    } catch (error) {
        console.warn("[Skills] Error in handleArcherXP:", error);
    }
}

// Explorer XP Handler
export function handleExplorerXP(player, distance) {
    try {
        // Give XP based on distance traveled
        // Every 10 blocks = 1 XP
        const xpGained = Math.floor(distance / 10);
        if (xpGained > 0) {
            addSkillXP(player, "explorer", SKILLS_CONFIG.explorer.xpPerAction * xpGained);
        }
    } catch (error) {
        console.warn("[Skills] Error in handleExplorerXP:", error);
    }
}

// Get archer damage bonus
export function getArcherDamageBonus(player) {
    try {
        const skillData = getSkillData(player, "archer");
        let damageBonus = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.archer.abilities[abilityLevel];
            if (ability?.bonus?.arrowDamage) {
                damageBonus += ability.bonus.arrowDamage;
            }
        }
        
        return damageBonus;
    } catch (error) {
        console.warn("[Skills] Error getting archer damage bonus:", error);
        return 0;
    }
}

// Get explorer mana regen bonus
export function getExplorerManaRegenBonus(player) {
    try {
        const skillData = getSkillData(player, "explorer");
        let manaRegenBonus = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.explorer.abilities[abilityLevel];
            if (ability?.bonus?.manaRegen) {
                manaRegenBonus += ability.bonus.manaRegen;
            }
        }
        
        return manaRegenBonus;
    } catch (error) {
        console.warn("[Skills] Error getting explorer mana regen bonus:", error);
        return 0;
    }
}

// Get explorer max mana bonus
export function getExplorerMaxManaBonus(player) {
    try {
        const skillData = getSkillData(player, "explorer");
        let maxManaBonus = 0;
        
        for (const abilityLevel of skillData.unlockedAbilities) {
            const ability = SKILLS_CONFIG.explorer.abilities[abilityLevel];
            if (ability?.bonus?.maxMana) {
                maxManaBonus += ability.bonus.maxMana;
            }
        }
        
        return maxManaBonus;
    } catch (error) {
        console.warn("[Skills] Error getting explorer max mana bonus:", error);
        return 0;
    }
}