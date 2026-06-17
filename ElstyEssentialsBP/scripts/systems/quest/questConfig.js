// Quest Configuration
export const QUEST_TYPES = {
    COLLECT: "collect",
    KILL: "kill",
    CRAFT: "craft",
    MINE: "mine",
    BUILD: "build",
    EXPLORE: "explore"
};

export const LAST_RESET_OBJECTIVE = "quest_last_reset";
export const QUEST_RESET_TIME = 24000; // 1 Minecraft day

// Quest definitions dengan reward money
export const QUEST_DEFINITIONS = {
    // Beginner Quests (Easy)
    collect_wood: {
        id: "collect_wood",
        name: "§eWood Collector",
        description: "Kumpulkan 16 kayu dari jenis apapun",
        type: QUEST_TYPES.COLLECT,
        target: "minecraft:log",
        targetAny: ["minecraft:oak_log", "minecraft:birch_log", "minecraft:spruce_log", "minecraft:jungle_log", "minecraft:acacia_log", "minecraft:dark_oak_log"],
        required: 16,
        reward_xp: 100,
        reward_money: 50,
        reward_items: [{ item: "minecraft:bread", count: 5 }],
        difficulty: "easy"
    },
    
    craft_stone_tools: {
        id: "craft_stone_tools",
        name: "§eStone Age",
        description: "Kumpulkan 1 stone pickaxe, 1 stone axe, dan 1 stone sword",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:stone_pickaxe", "minecraft:stone_axe", "minecraft:stone_sword"],
        required: 3,
        reward_xp: 150,
        reward_money: 100,
        reward_items: [{ item: "minecraft:coal", count: 8 }],
        difficulty: "easy"
    },

    mine_first_stone: {
        id: "mine_first_stone",
        name: "§eFirst Steps",
        description: "Kumpulkan 32 batu untuk memulai petualangan",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:stone", "minecraft:cobblestone"],
        required: 32,
        reward_xp: 80,
        reward_money: 75,
        reward_items: [{ item: "minecraft:wooden_pickaxe", count: 1 }],
        difficulty: "easy"
    },

    // Daily Quests (Medium)
    mine_cobblestone: {
        id: "mine_cobblestone",
        name: "§bCobblestone Miner",
        description: "Kumpulkan 64 cobblestone",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:cobblestone", "minecraft:mossy_cobblestone"],
        required: 64,
        reward_xp: 200,
        reward_money: 250,
        reward_items: [{ item: "minecraft:iron_ingot", count: 3 }],
        difficulty: "medium"
    },

    kill_monsters: {
        id: "kill_monsters",
        name: "§bMonster Hunter",
        description: "Bunuh 10 monster hostile apapun",
        type: QUEST_TYPES.KILL,
        targetAny: ["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider", "minecraft:enderman"],
        required: 10,
        reward_xp: 250,
        reward_money: 300,
        reward_items: [{ item: "minecraft:golden_apple", count: 1 }],
        difficulty: "medium"
    },

    collect_food: {
        id: "collect_food",
        name: "§bFood Gatherer",
        description: "Kumpulkan 32 makanan apapun",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:wheat", "minecraft:carrot", "minecraft:potato", "minecraft:beetroot", "minecraft:apple", "minecraft:bread", "minecraft:cooked_beef", "minecraft:cooked_porkchop", "minecraft:cooked_chicken"],
        required: 32,
        reward_xp: 180,
        reward_money: 200,
        reward_items: [{ item: "minecraft:golden_carrot", count: 5 }],
        difficulty: "medium"
    },

    craft_iron_tools: {
        id: "craft_iron_tools",
        name: "§bIron Worker",
        description: "Kumpulkan 1 iron pickaxe dan 1 iron sword",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:iron_pickaxe", "minecraft:iron_sword"],
        required: 2,
        reward_xp: 300,
        reward_money: 400,
        reward_items: [{ item: "minecraft:diamond", count: 1 }],
        difficulty: "medium"
    },

    mine_iron: {
        id: "mine_iron",
        name: "§bIron Miner",
        description: "Kumpulkan 20 iron ore",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:iron_ore", "minecraft:deepslate_iron_ore", "minecraft:raw_iron"],
        required: 20,
        reward_xp: 280,
        reward_money: 350,
        reward_items: [{ item: "minecraft:coal", count: 16 }],
        difficulty: "medium"
    },

    build_house: {
        id: "build_house",
        name: "§bBuilder",
        description: "Tempatkan 100 blok bangunan apapun",
        type: QUEST_TYPES.BUILD,
        targetAny: ["minecraft:oak_planks", "minecraft:stone", "minecraft:cobblestone", "minecraft:bricks", "minecraft:oak_log"],
        required: 100,
        reward_xp: 350,
        reward_money: 500,
        reward_items: [{ item: "minecraft:emerald", count: 2 }],
        difficulty: "medium"
    },

    explore_distance: {
        id: "explore_distance",
        name: "§bExplorer",
        description: "Jelajahi area dengan berjalan 1000 blok",
        type: QUEST_TYPES.EXPLORE,
        required: 1000,
        reward_xp: 200,
        reward_money: 250,
        reward_items: [{ item: "minecraft:map", count: 1 }],
        difficulty: "medium"
    },

    daily_farmer: {
        id: "daily_farmer",
        name: "§bDaily Farmer",
        description: "Tanam dan panen 50 tanaman apapun",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:wheat", "minecraft:carrot", "minecraft:potato", "minecraft:beetroot"],
        required: 50,
        reward_xp: 220,
        reward_money: 300,
        reward_items: [{ item: "minecraft:bone_meal", count: 10 }],
        difficulty: "medium"
    },

    // Advanced Daily Quests (Hard)
    collect_diamonds: {
        id: "collect_diamonds",
        name: "§cDiamond Hunter",
        description: "Kumpulkan 5 diamond",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:diamond"],
        required: 5,
        reward_xp: 500,
        reward_money: 1000,
        reward_items: [{ item: "minecraft:enchanted_golden_apple", count: 1 }],
        difficulty: "hard"
    },

    kill_boss: {
        id: "kill_boss",
        name: "§cBoss Slayer",
        description: "Bunuh 1 Wither atau Ender Dragon",
        type: QUEST_TYPES.KILL,
        targetAny: ["minecraft:wither", "minecraft:ender_dragon"],
        required: 1,
        reward_xp: 1000,
        reward_money: 2500,
        reward_items: [{ item: "minecraft:nether_star", count: 1 }],
        difficulty: "hard"
    },

    craft_enchanted_items: {
        id: "craft_enchanted_items",
        name: "§cEnchanter",
        description: "Kumpulkan 1 enchanting table",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:enchanting_table"],
        required: 1,
        reward_xp: 400,
        reward_money: 800,
        reward_items: [{ item: "minecraft:experience_bottle", count: 10 }],
        difficulty: "hard"
    },

    mine_ancient_debris: {
        id: "mine_ancient_debris",
        name: "§cNetherite Seeker",
        description: "Kumpulkan 4 Ancient Debris",
        type: QUEST_TYPES.COLLECT,
        targetAny: ["minecraft:ancient_debris"],
        required: 4,
        reward_xp: 600,
        reward_money: 1500,
        reward_items: [{ item: "minecraft:netherite_scrap", count: 2 }],
        difficulty: "hard"
    },

    nether_explorer: {
        id: "nether_explorer",
        name: "§cNether Explorer",
        description: "Jelajahi Nether sejauh 2000 blok",
        type: QUEST_TYPES.EXPLORE,
        required: 2000,
        reward_xp: 450,
        reward_money: 750,
        reward_items: [{ item: "minecraft:fire_resistance_potion", count: 3 }],
        difficulty: "hard"
    },

    master_trader: {
        id: "master_trader",
        name: "§cMaster Trader",
        description: "Kumpulkan 64 emerald dari trading",
        type: QUEST_TYPES.COLLECT,
        target: "minecraft:emerald",
        required: 64,
        reward_xp: 350,
        reward_money: 600,
        reward_items: [{ item: "minecraft:emerald", count: 5 }],
        difficulty: "hard"
    },

    treasure_hunter: {
        id: "treasure_hunter",
        name: "§cTreasure Hunter",
        description: "Kumpulkan 32 gold ingot",
        type: QUEST_TYPES.COLLECT,
        target: "minecraft:gold_ingot",
        required: 32,
        reward_xp: 400,
        reward_money: 1200,
        reward_items: [{ item: "minecraft:diamond", count: 3 }],
        difficulty: "hard"
    }
};