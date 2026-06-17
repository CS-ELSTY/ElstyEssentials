// Skills Data Management Module
// Handles saving, loading, and managing player skill data using Dynamic Properties

import { world } from "../../core.js";
import { SKILLS_CONFIG } from "./skillsConfig.js";

const SKILLS_DATA_KEY = "skillsData";

// Create default skills data structure
function createDefaultSkillsData() {
    const skills = {};
    for (const skillKey of Object.keys(SKILLS_CONFIG)) {
        skills[skillKey] = {
            level: 0,
            xp: 0,
            unlockedAbilities: []
        };
    }
    return skills;
}

// Initialize player skills
export function initializePlayerSkills(player) {
    try {
        // Try to load from dynamic property
        const savedData = player.getDynamicProperty(SKILLS_DATA_KEY);
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Validate and merge with default structure
                const defaultData = createDefaultSkillsData();
                const mergedData = { ...defaultData, ...parsed };
                
                // Ensure all skill keys exist
                for (const skillKey of Object.keys(SKILLS_CONFIG)) {
                    if (!mergedData[skillKey]) {
                        mergedData[skillKey] = {
                            level: 0,
                            xp: 0,
                            unlockedAbilities: []
                        };
                    }
                }
                
                return mergedData;
            } catch (error) {
                console.warn(`[Skills] Error parsing skills data for ${player.name}:`, error);
            }
        }
        
        // Create new default data
        const newSkills = createDefaultSkillsData();
        savePlayerSkills(player, newSkills);
        return newSkills;
        
    } catch (error) {
        console.warn(`[Skills] Error initializing skills for ${player.name}:`, error);
        return createDefaultSkillsData();
    }
}

// Get player skills
export function getPlayerSkills(player) {
    try {
        if (!player) return createDefaultSkillsData();
        
        const savedData = player.getDynamicProperty(SKILLS_DATA_KEY);
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                const defaultData = createDefaultSkillsData();
                const mergedData = { ...defaultData, ...parsed };
                
                // Ensure all skill keys exist
                for (const skillKey of Object.keys(SKILLS_CONFIG)) {
                    if (!mergedData[skillKey]) {
                        mergedData[skillKey] = {
                            level: 0,
                            xp: 0,
                            unlockedAbilities: []
                        };
                    }
                }
                
                return mergedData;
            } catch (error) {
                console.warn(`[Skills] Error loading skills for ${player.name}:`, error);
            }
        }
        
        return initializePlayerSkills(player);
        
    } catch (error) {
        console.warn(`[Skills] Error getting skills for ${player.name}:`, error);
        return createDefaultSkillsData();
    }
}

// Save player skills
export function savePlayerSkills(player, skills) {
    try {
        if (!player) return;
        
        player.setDynamicProperty(SKILLS_DATA_KEY, JSON.stringify(skills));
        
    } catch (error) {
        console.warn(`[Skills] Error saving skills for ${player.name}:`, error);
    }
}

// Get specific skill data
export function getSkillData(player, skillKey) {
    const skills = getPlayerSkills(player);
    return skills[skillKey] || { level: 0, xp: 0, unlockedAbilities: [] };
}

// Update specific skill data
export function updateSkillData(player, skillKey, newData) {
    const skills = getPlayerSkills(player);
    skills[skillKey] = { ...skills[skillKey], ...newData };
    savePlayerSkills(player, skills);
    return skills[skillKey];
}

// Reset player skills
export function resetPlayerSkills(player) {
    const newSkills = createDefaultSkillsData();
    savePlayerSkills(player, newSkills);
    return newSkills;
}

// Get player skill level
export function getSkillLevel(player, skillKey) {
    const skillData = getSkillData(player, skillKey);
    return skillData.level || 0;
}

// Get player skill XP
export function getSkillXP(player, skillKey) {
    const skillData = getSkillData(player, skillKey);
    return skillData.xp || 0;
}

// Check if ability is unlocked
export function isAbilityUnlocked(player, skillKey, abilityLevel) {
    const skillData = getSkillData(player, skillKey);
    return skillData.unlockedAbilities && skillData.unlockedAbilities.includes(abilityLevel);
}

// Get all unlocked abilities for a skill
export function getUnlockedAbilities(player, skillKey) {
    const skillData = getSkillData(player, skillKey);
    return skillData.unlockedAbilities || [];
}

// Sync unlocked abilities based on current skill level
// This ensures players who leveled up before ability fixes get their proper abilities
export function syncUnlockedAbilities(player, skillKey) {
    try {
        if (!player) return;
        
        const skills = getPlayerSkills(player);
        const skill = skills[skillKey];
        const config = SKILLS_CONFIG[skillKey];
        
        if (!skill || !config) return;
        
        let updated = false;
        
        // Check all abilities in config
        for (const abilityLevel of Object.keys(config.abilities).map(Number)) {
            if (skill.level >= abilityLevel) {
                // Player has reached this ability level
                if (!skill.unlockedAbilities.includes(abilityLevel)) {
                    // Ability not in unlocked list, add it
                    skill.unlockedAbilities.push(abilityLevel);
                    updated = true;
                }
            }
        }
        
        // Sort unlocked abilities by level
        skill.unlockedAbilities.sort((a, b) => a - b);
        
        if (updated) {
            savePlayerSkills(player, skills);
            console.log(`[Skills] Synced abilities for ${player.name}'s ${skillKey} skill`);
        }
        
    } catch (error) {
        console.warn(`[Skills] Error syncing abilities for ${skillKey}:`, error);
    }
}

// Sync all skills for a player
export function syncAllPlayerSkills(player) {
    if (!player) return;
    
    for (const skillKey of Object.keys(SKILLS_CONFIG)) {
        syncUnlockedAbilities(player, skillKey);
    }
}