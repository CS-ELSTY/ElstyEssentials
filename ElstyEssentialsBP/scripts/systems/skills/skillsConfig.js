// Skills Configuration Module
// Contains all skill definitions, abilities, and mana settings

// Maximum level for all skills
export const MAX_LEVEL = 100;

export const SKILLS_CONFIG = {
    // Mining Skill
    mining: {
        name: "§6Mining",
        icon: "⛏",
        xpPerAction: 10,
        levelUpXP: (level) => Math.floor(100 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Stone Breaker", desc: "§7+10% mining speed", type: "passive" },
            5: { name: "Fortune Touch", desc: "§75% chance double drops", type: "passive", bonus: { fortune: 0.05 } },
            10: { name: "Vein Miner", desc: "§7Mine 3x3 area (30 mana)", type: "active", manaCost: 30, cooldown: 8 },
            15: { name: "Fortune II", desc: "§715% chance double drops", type: "passive", bonus: { fortune: 0.15 } },
            20: { name: "Master Miner", desc: "§730% chance double drops", type: "passive", bonus: { fortune: 0.30 } }
        }
    },
    
    // Woodcutting Skill
    woodcutting: {
        name: "§2Woodcutting",
        icon: "🪓",
        xpPerAction: 8,
        levelUpXP: (level) => Math.floor(100 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Lumberjack", desc: "§7+10% chopping speed", type: "passive" },
            5: { name: "Timber!", desc: "§7Break entire tree (40 mana)", type: "active", manaCost: 40, cooldown: 10 },
            10: { name: "Wood Fortune", desc: "§710% chance double logs", type: "passive", bonus: { fortune: 0.10 } },
            15: { name: "Nature's Gift", desc: "§720% chance double logs", type: "passive", bonus: { fortune: 0.20 } },
            20: { name: "Forest Master", desc: "§740% chance double logs", type: "passive", bonus: { fortune: 0.40 } }
        }
    },
    
    // Combat/Hunting Skill
    combat: {
        name: "§cCombat",
        icon: "⚔",
        xpPerAction: 15,
        levelUpXP: (level) => Math.floor(150 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Warrior", desc: "§7+1 Attack Damage", type: "passive", bonus: { damage: 1 } },
            3: { name: "Swift Strike", desc: "§7+2 Attack Damage", type: "passive", bonus: { damage: 2 } },
            5: { name: "Berserker", desc: "§7+3 Attack Damage", type: "passive", bonus: { damage: 3 } },
            8: { name: "Critical Hit", desc: "§715% crit chance (2x damage)", type: "passive", bonus: { crit: 0.15 } },
            10: { name: "Power Strike", desc: "§7Lightning bolt strike (50 mana)", type: "active", manaCost: 50, cooldown: 30 },
            15: { name: "Life Steal", desc: "§710% damage to HP", type: "passive", bonus: { lifesteal: 0.10 } },
            20: { name: "Slayer", desc: "§7+8 Damage, 30% crit", type: "passive", bonus: { damage: 8, crit: 0.30 } }
        }
    },
    
    // Defense Skill
    defense: {
        name: "§9Defense",
        icon: "🛡",
        xpPerAction: 10,
        levelUpXP: (level) => Math.floor(120 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Iron Skin", desc: "§7+5% damage reduction", type: "passive", bonus: { reduction: 0.05 } },
            3: { name: "Tough", desc: "§7+10% damage reduction", type: "passive", bonus: { reduction: 0.10 } },
            5: { name: "Last Stand", desc: "§7Speed II when HP < 2 hearts", type: "passive", bonus: { lastStand: true } },
            8: { name: "Guardian", desc: "§7+15% damage reduction", type: "passive", bonus: { reduction: 0.15 } },
            10: { name: "Shield Wall", desc: "§750% reduction (30 mana)", type: "active", manaCost: 30, cooldown: 15, bonus: { reduction: 0.50 } },
            15: { name: "Regeneration", desc: "§7Heal 1HP/2s when HP < 50%", type: "passive", bonus: { regen: true } },
            20: { name: "Immortal", desc: "§7+30% reduction, Regen II", type: "passive", bonus: { reduction: 0.30, regen: true } }
        }
    },
    
    // Farming Skill
    farming: {
        name: "§aFarming",
        icon: "🌾",
        xpPerAction: 5,
        levelUpXP: (level) => Math.floor(80 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Green Thumb", desc: "§710% faster growth", type: "passive" },
            5: { name: "Harvest", desc: "§73x3 instant harvest (25 mana)", type: "active", manaCost: 25, cooldown: 6 },
            10: { name: "Crop Fortune", desc: "§720% double crops", type: "passive", bonus: { fortune: 0.20 } },
            15: { name: "Auto Replant", desc: "§7Auto plant seeds", type: "passive" },
            20: { name: "Farm Master", desc: "§740% double crops", type: "passive", bonus: { fortune: 0.40 } }
        }
    },
    
    // Fishing Skill   
    fishing: {
        name: "§bFishing",
        icon: "🎣",
        xpPerAction: 12,
        levelUpXP: (level) => Math.floor(90 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Angler", desc: "§710% better catch", type: "passive" },
            5: { name: "Lucky Catch", desc: "§715% treasure chance", type: "passive", bonus: { fortune: 0.15 } },
            10: { name: "Master Fisher", desc: "§7Double catch chance", type: "passive", bonus: { fortune: 0.30 } },
            15: { name: "Sea Blessing", desc: "§7Auto fishing (30 mana)", type: "active", manaCost: 30, cooldown: 20 },
            20: { name: "Ocean Master", desc: "§750% treasure, 2x catch", type: "passive", bonus: { fortune: 0.50 } }
        }
    },

    // Archer Skill
    archer: {
        name: "§dArcher",
        icon: "🏹",
        xpPerAction: 15,
        levelUpXP: (level) => Math.floor(120 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Sharp Eye", desc: "§7+5% arrow damage", type: "passive", bonus: { arrowDamage: 0.05 } },
            3: { name: "Quick Shot", desc: "§7+10% arrow speed", type: "passive", bonus: { arrowSpeed: 0.10 } },
            5: { name: "Precision", desc: "§710% crit chance", type: "passive", bonus: { crit: 0.10 } },
            8: { name: "Piercing Arrow", desc: "§7+20% arrow damage", type: "passive", bonus: { arrowDamage: 0.20 } },
            10: { name: "Multi-Shot", desc: "§7Shoot 3 arrows (50 mana)", type: "active", manaCost: 50, cooldown: 10 },
            15: { name: "Power Shot", desc: "§7+50% arrow damage, 15% crit", type: "passive", bonus: { arrowDamage: 0.50, crit: 0.15 } },
            20: { name: "Master Archer", desc: "§7+100% arrow damage, 25% crit", type: "passive", bonus: { arrowDamage: 1.00, crit: 0.25 } }
        }
    },

    // Explorer Skill
    explorer: {
        name: "§eExplorer",
        icon: "🗺",
        xpPerAction: 8,
        levelUpXP: (level) => Math.floor(100 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Mana Flow", desc: "§7+10% mana regen speed", type: "passive", bonus: { manaRegen: 0.10 } },
            3: { name: "Wisdom", desc: "§7+10 max mana", type: "passive", bonus: { maxMana: 10 } },
            5: { name: "Focus", desc: "§7+20% mana regen speed", type: "passive", bonus: { manaRegen: 0.20 } },
            8: { name: "Mind Power", desc: "§7+20 max mana", type: "passive", bonus: { maxMana: 20 } },
            10: { name: "Sprint", desc: "§7Speed III (40 mana, 10s)", type: "active", manaCost: 40, duration: 200 },
            15: { name: "Enlightenment", desc: "§7+40% mana regen speed, +30 max mana", type: "passive", bonus: { manaRegen: 0.40, maxMana: 30 } },
            20: { name: "Arcane Master", desc: "§7+60% mana regen speed, +50 max mana", type: "passive", bonus: { manaRegen: 0.60, maxMana: 50 } }
        }
    },

    // Crafting Skill - NEW!
    crafting: {
        name: "§bCrafting",
        icon: "🔨",
        xpPerAction: 5,
        levelUpXP: (level) => Math.floor(70 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Apprentice", desc: "§75% chance save ingredients", type: "passive", bonus: { saveChance: 0.05 } },
            5: { name: "Efficient", desc: "§710% chance save ingredients", type: "passive", bonus: { saveChance: 0.10 } },
            10: { name: "Master Crafter", desc: "§715% chance save ingredients", type: "passive", bonus: { saveChance: 0.15 } },
            15: { name: "Legendary Craftsman", desc: "§720% chance save ingredients", type: "passive", bonus: { saveChance: 0.20 } },
            20: { name: "Divine Crafter", desc: "§730% chance save ingredients, +50% XP", type: "passive", bonus: { saveChance: 0.30, xpBoost: 0.50 } }
        }
    },

    // Building Skill - NEW!
    building: {
        name: "§7Building",
        icon: "🏗",
        xpPerAction: 3,
        levelUpXP: (level) => Math.floor(60 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Builder", desc: "§75% faster block placement", type: "passive" },
            5: { name: "Architect", desc: "§710% faster block placement", type: "passive" },
            10: { name: "Master Builder", desc: "§715% faster block placement", type: "passive" },
            15: { name: "Construction Master", desc: "§720% faster block placement", type: "passive" },
            20: { name: "Divine Architect", desc: "§730% faster placement, +50% XP", type: "passive", bonus: { speedBoost: 0.30, xpBoost: 0.50 } }
        }
    },

    // Support Skill - NEW! For healing and team play
    support: {
        name: "§dSupport",
        icon: "💖",
        xpPerAction: 8,
        levelUpXP: (level) => Math.floor(90 * Math.pow(1.5, level)),
        abilities: {
            1: { name: "Healer", desc: "§7+10% healing power", type: "passive", bonus: { healPower: 0.10 } },
            5: { name: "Guardian Angel", desc: "§715% chance to prevent ally death", type: "passive", bonus: { saveChance: 0.15 } },
            10: { name: "Mass Heal", desc: "§7Heal all nearby players (60 mana)", type: "active", manaCost: 60, cooldown: 30 },
            15: { name: "Blessing", desc: "§7+20% healing power, +10% speed", type: "passive", bonus: { healPower: 0.20, speedBoost: 0.10 } },
            20: { name: "Divine Support", desc: "§7+40% healing, resurrection (200 mana)", type: "passive", bonus: { healPower: 0.40, resurrection: true } }
        }
    }
};

// Mana Configuration
export const MANA_CONFIG = {
    maxMana: 100,
    regenRate: 1, // Mana per second
    regenInterval: 20 // Ticks (1 second = 20 ticks)
};

// Get skill keys for iteration
export function getSkillKeys() {
    return Object.keys(SKILLS_CONFIG);
}

// Get skill configuration by key
export function getSkillConfig(skillKey) {
    return SKILLS_CONFIG[skillKey];
}

// Item mapping for skill activation
export const SKILL_ITEMS = {
    mining: ["minecraft:diamond_pickaxe", "minecraft:netherite_pickaxe", "minecraft:iron_pickaxe", "minecraft:golden_pickaxe", "minecraft:stone_pickaxe", "minecraft:wooden_pickaxe"],
    woodcutting: ["minecraft:diamond_axe", "minecraft:netherite_axe", "minecraft:iron_axe", "minecraft:golden_axe", "minecraft:stone_axe", "minecraft:wooden_axe"],
    combat: ["minecraft:diamond_sword", "minecraft:netherite_sword", "minecraft:iron_sword", "minecraft:golden_sword", "minecraft:stone_sword", "minecraft:wooden_sword"],
    defense: ["minecraft:shield"],
    farming: ["minecraft:diamond_hoe", "minecraft:netherite_hoe", "minecraft:iron_hoe", "minecraft:golden_hoe", "minecraft:stone_hoe", "minecraft:wooden_hoe"],
    fishing: ["minecraft:fishing_rod"],
    archer: ["minecraft:bow"],
    explorer: ["minecraft:compass", "minecraft:map"],
    crafting: ["minecraft:crafting_table", "minecraft:furnace", "minecraft:blast_furnace", "minecraft:smoker", "minecraft:anvil"],
    building: ["minecraft:stone", "minecraft:brick", "minecraft:concrete", "minecraft:wool", "minecraft:planks"],
    support: ["minecraft:potion", "minecraft:splash_potion", "minecraft:lingering_potion", "minecraft:golden_apple", "minecraft:totem_of_undying"]
};

// Get all skill configurations
export function getAllSkillConfigs() {
    return SKILLS_CONFIG;
}