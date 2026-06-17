// shopItems.js - Konfigurasi semua item shop
export const SHOP_ITEMS = {
  // Kategori Tools
  tools: [
    // Pickaxes - Harga meningkat sesuai tier
    { id: "minecraft:wooden_pickaxe", name: "Wooden Pickaxe", buy: 80, sell: 20 },
    { id: "minecraft:stone_pickaxe", name: "Stone Pickaxe", buy: 150, sell: 35 },
    { id: "bf_rb:amethyst_pickaxe", name: "Amethyst Pickaxe", buy: 800, sell: 180 },
    { id: "bf_rb:copper_pickaxe", name: "Copper Pickaxe", buy: 450, sell: 100 },
    { id: "minecraft:iron_pickaxe", name: "Iron Pickaxe", buy: 1200, sell: 280 },
    { id: "minecraft:golden_pickaxe", name: "Golden Pickaxe", buy: 2500, sell: 550 },
    { id: "bf_rb:emerald_pickaxe", name: "Emerald Pickaxe", buy: 6000, sell: 1400 },
    { id: "bf_rb:platinum_pickaxe", name: "Platinum Pickaxe", buy: 7500, sell: 1700 },
    { id: "minecraft:diamond_pickaxe", name: "Diamond Pickaxe", buy: 8500, sell: 2000 },
    { id: "bf_rb:ruby_pickaxe", name: "Ruby Pickaxe", buy: 9500, sell: 2200 },
    { id: "minecraft:netherite_pickaxe", name: "Netherite Pickaxe", buy: 25000, sell: 6000 },
    { id: "better_on_bedrock:stardust_pickaxe", name: "Stardust Pickaxe", buy: 35000, sell: 8500 },

    // Axes
    { id: "minecraft:wooden_axe", name: "Wooden Axe", buy: 70, sell: 18 },
    { id: "minecraft:stone_axe", name: "Stone Axe", buy: 130, sell: 30 },
    { id: "minecraft:iron_axe", name: "Iron Axe", buy: 1000, sell: 240 },
    { id: "minecraft:golden_axe", name: "Golden Axe", buy: 2200, sell: 500 },
    { id: "minecraft:diamond_axe", name: "Diamond Axe", buy: 7500, sell: 1800 },

    // Swords
    { id: "minecraft:wooden_sword", name: "Wooden Sword", buy: 60, sell: 15 },
    { id: "minecraft:stone_sword", name: "Stone Sword", buy: 120, sell: 28 },
    { id: "minecraft:iron_sword", name: "Iron Sword", buy: 900, sell: 220 },
    { id: "minecraft:golden_sword", name: "Golden Sword", buy: 2000, sell: 480 },
    { id: "minecraft:diamond_sword", name: "Diamond Sword", buy: 7000, sell: 1650 },

    // Shovels
    { id: "minecraft:iron_shovel", name: "Iron Shovel", buy: 600, sell: 140 },
    { id: "minecraft:golden_shovel", name: "Golden Shovel", buy: 1500, sell: 350 },
    { id: "minecraft:diamond_shovel", name: "Diamond Shovel", buy: 5000, sell: 1200 },

    // Hoes
    { id: "minecraft:stone_hoe", name: "Stone Hoe", buy: 100, sell: 25 }
  ],

  // Kategori Armor
  armor: [
    // Helmets
    { id: "minecraft:leather_helmet", name: "Leather Helmet", buy: 300, sell: 70 },
    { id: "minecraft:chainmail_helmet", name: "Chainmail Helmet", buy: 800, sell: 190 },
    { id: "minecraft:iron_helmet", name: "Iron Helmet", buy: 1500, sell: 360 },
    { id: "minecraft:golden_helmet", name: "Golden Helmet", buy: 3500, sell: 850 },
    { id: "minecraft:diamond_helmet", name: "Diamond Helmet", buy: 8000, sell: 1900 },

    // Chestplates
    { id: "minecraft:leather_chestplate", name: "Leather Chestplate", buy: 500, sell: 120 },
    { id: "minecraft:chainmail_chestplate", name: "Chainmail Chestplate", buy: 1400, sell: 330 },
    { id: "minecraft:iron_chestplate", name: "Iron Chestplate", buy: 2800, sell: 670 },
    { id: "minecraft:golden_chestplate", name: "Golden Chestplate", buy: 6500, sell: 1550 },
    { id: "minecraft:diamond_chestplate", name: "Diamond Chestplate", buy: 14000, sell: 3400 },

    // Leggings
    { id: "minecraft:leather_leggings", name: "Leather Leggings", buy: 450, sell: 110 },
    { id: "minecraft:chainmail_leggings", name: "Chainmail Leggings", buy: 1200, sell: 290 },
    { id: "minecraft:iron_leggings", name: "Iron Leggings", buy: 2400, sell: 580 },
    { id: "minecraft:golden_leggings", name: "Golden Leggings", buy: 5500, sell: 1300 },
    { id: "minecraft:diamond_leggings", name: "Diamond Leggings", buy: 12000, sell: 2900 },

    // Boots
    { id: "minecraft:leather_boots", name: "Leather Boots", buy: 250, sell: 60 },
    { id: "minecraft:chainmail_boots", name: "Chainmail Boots", buy: 700, sell: 170 },
    { id: "minecraft:iron_boots", name: "Iron Boots", buy: 1300, sell: 310 },
    { id: "minecraft:golden_boots", name: "Golden Boots", buy: 3000, sell: 720 },
    { id: "minecraft:diamond_boots", name: "Diamond Boots", buy: 7000, sell: 1700 }
  ],

  // Kategori Food
  food: [
    { id: "minecraft:apple", name: "Apple", buy: 35, sell: 8 },
    { id: "minecraft:bread", name: "Bread", buy: 45, sell: 10 },
    { id: "minecraft:cooked_beef", name: "Steak", buy: 65, sell: 15 },
    { id: "minecraft:cooked_porkchop", name: "Cooked Porkchop", buy: 65, sell: 15 },
    { id: "minecraft:cooked_chicken", name: "Cooked Chicken", buy: 55, sell: 13 },
    { id: "minecraft:cooked_mutton", name: "Cooked Mutton", buy: 60, sell: 14 },
    { id: "minecraft:golden_apple", name: "Golden Apple", buy: 2500, sell: 600 },
    { id: "minecraft:enchanted_golden_apple", name: "Enchanted Golden Apple", buy: 50000, sell: 12000 },
    { id: "minecraft:carrot", name: "Carrot", buy: 20, sell: 5 },
    { id: "minecraft:potato", name: "Potato", buy: 20, sell: 5 },
    { id: "minecraft:melon_slice", name: "Melon Slice", buy: 25, sell: 6 }
  ],

  // Kategori Block
  block: [
    // Natural Blocks
    { id: "minecraft:grass_block", name: "Grass Block", buy: 15, sell: 3 },
    { id: "minecraft:moss_block", name: "Moss Block", buy: 25, sell: 6 },
    { id: "minecraft:dirt_with_roots", name: "Rooted Dirt", buy: 18, sell: 4 },
    { id: "minecraft:dirt", name: "Dirt", buy: 10, sell: 2 },
    { id: "minecraft:sand", name: "Sand", buy: 12, sell: 3 },
    { id: "minecraft:red_sand", name: "Red Sand", buy: 15, sell: 4 },
    { id: "minecraft:gravel", name: "Gravel", buy: 12, sell: 3 },
    { id: "minecraft:clay", name: "Clay", buy: 30, sell: 7 },

    // Stone variants
    { id: "minecraft:cobblestone", name: "Cobblestone", buy: 8, sell: 2 },
    { id: "minecraft:stone", name: "Stone", buy: 12, sell: 3 },
    { id: "minecraft:granite", name: "Granite", buy: 14, sell: 3 },
    { id: "minecraft:polished_granite", name: "Polished Granite", buy: 18, sell: 4 },
    { id: "minecraft:diorite", name: "Diorite", buy: 14, sell: 3 },
    { id: "minecraft:polished_diorite", name: "Polished Diorite", buy: 18, sell: 4 },
    { id: "minecraft:andesite", name: "Andesite", buy: 14, sell: 3 },
    { id: "minecraft:polished_andesite", name: "Polished Andesite", buy: 18, sell: 4 },
    { id: "minecraft:blackstone", name: "Blackstone", buy: 25, sell: 6 },
    { id: "minecraft:polished_blackstone", name: "Polished Blackstone", buy: 35, sell: 8 },
    { id: "minecraft:deepslate", name: "Deepslate", buy: 20, sell: 5 },
    { id: "minecraft:polished_deepslate", name: "Polished Deepslate", buy: 28, sell: 7 },

    // Special blocks
    { id: "minecraft:prismarine", name: "Prismarine", buy: 80, sell: 19 },
    { id: "minecraft:prismarine_bricks", name: "Prismarine Bricks", buy: 90, sell: 21 },
    { id: "minecraft:dark_prismarine", name: "Dark Prismarine", buy: 100, sell: 24 },
    { id: "minecraft:end_stone", name: "End Stone", buy: 120, sell: 29 },
    { id: "minecraft:end_stone_bricks", name: "End Stone Bricks", buy: 140, sell: 33 },
    { id: "minecraft:sandstone", name: "Sandstone", buy: 16, sell: 4 },

    // Glass (16 colors)
    { id: "minecraft:glass", name: "Glass", buy: 22, sell: 5 },
    { id: "minecraft:white_stained_glass", name: "White Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:orange_stained_glass", name: "Orange Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:magenta_stained_glass", name: "Magenta Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:light_blue_stained_glass", name: "Light Blue Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:yellow_stained_glass", name: "Yellow Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:lime_stained_glass", name: "Lime Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:pink_stained_glass", name: "Pink Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:gray_stained_glass", name: "Gray Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:light_gray_stained_glass", name: "Light Gray Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:cyan_stained_glass", name: "Cyan Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:purple_stained_glass", name: "Purple Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:blue_stained_glass", name: "Blue Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:brown_stained_glass", name: "Brown Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:green_stained_glass", name: "Green Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:red_stained_glass", name: "Red Stained Glass", buy: 28, sell: 7 },
    { id: "minecraft:black_stained_glass", name: "Black Stained Glass", buy: 28, sell: 7 },

    // Wool (16 colors)
    { id: "minecraft:white_wool", name: "White Wool", buy: 35, sell: 8 },
    { id: "minecraft:orange_wool", name: "Orange Wool", buy: 35, sell: 8 },
    { id: "minecraft:magenta_wool", name: "Magenta Wool", buy: 35, sell: 8 },
    { id: "minecraft:light_blue_wool", name: "Light Blue Wool", buy: 35, sell: 8 },
    { id: "minecraft:yellow_wool", name: "Yellow Wool", buy: 35, sell: 8 },
    { id: "minecraft:lime_wool", name: "Lime Wool", buy: 35, sell: 8 },
    { id: "minecraft:pink_wool", name: "Pink Wool", buy: 35, sell: 8 },
    { id: "minecraft:gray_wool", name: "Gray Wool", buy: 35, sell: 8 },
    { id: "minecraft:light_gray_wool", name: "Light Gray Wool", buy: 35, sell: 8 },
    { id: "minecraft:cyan_wool", name: "Cyan Wool", buy: 35, sell: 8 },
    { id: "minecraft:purple_wool", name: "Purple Wool", buy: 35, sell: 8 },
    { id: "minecraft:blue_wool", name: "Blue Wool", buy: 35, sell: 8 },
    { id: "minecraft:brown_wool", name: "Brown Wool", buy: 35, sell: 8 },
    { id: "minecraft:green_wool", name: "Green Wool", buy: 35, sell: 8 },
    { id: "minecraft:red_wool", name: "Red Wool", buy: 35, sell: 8 },
    { id: "minecraft:black_wool", name: "Black Wool", buy: 35, sell: 8 }
  ],

  // Kategori Wood/Logs
  wood: [
    { id: "minecraft:oak_log", name: "Oak Log", buy: 18, sell: 4 },
    { id: "minecraft:birch_log", name: "Birch Log", buy: 18, sell: 4 },
    { id: "minecraft:spruce_log", name: "Spruce Log", buy: 18, sell: 4 },
    { id: "minecraft:jungle_log", name: "Jungle Log", buy: 22, sell: 5 },
    { id: "minecraft:acacia_log", name: "Acacia Log", buy: 20, sell: 5 },
    { id: "minecraft:dark_oak_log", name: "Dark Oak Log", buy: 25, sell: 6 },
    { id: "minecraft:mangrove_log", name: "Mangrove Log", buy: 28, sell: 7 },
    { id: "minecraft:cherry_log", name: "Cherry Log", buy: 30, sell: 7 },
    { id: "minecraft:oak_planks", name: "Oak Planks", buy: 8, sell: 2 }
  ],

  // Kategori Furniture/Functional
  furniture: [
    { id: "minecraft:crafting_table", name: "Crafting Table", buy: 120, sell: 30 },
    { id: "minecraft:furnace", name: "Furnace", buy: 250, sell: 60 },
    { id: "minecraft:blast_furnace", name: "Blast Furnace", buy: 450, sell: 110 },
    { id: "minecraft:smoker", name: "Smoker", buy: 450, sell: 110 },
    { id: "minecraft:cartography_table", name: "Cartography Table", buy: 350, sell: 85 },
    { id: "minecraft:brewing_stand", name: "Brewing Stand", buy: 280, sell: 70 },
    { id: "minecraft:composter", name: "Composter", buy: 180, sell: 43 },
    { id: "minecraft:barrel", name: "Barrel", buy: 220, sell: 53 },
    { id: "minecraft:fletching_table", name: "Fletching Table", buy: 380, sell: 91 },
    { id: "minecraft:cauldron", name: "Cauldron", buy: 800, sell: 190 },
    { id: "minecraft:lectern", name: "Lectern", buy: 420, sell: 100 },
    { id: "minecraft:stonecutter", name: "Stonecutter", buy: 320, sell: 77 },
    { id: "minecraft:loom", name: "Loom", buy: 300, sell: 72 },
    { id: "minecraft:smithing_table", name: "Smithing Table", buy: 500, sell: 120 },
    { id: "minecraft:grindstone", name: "Grindstone", buy: 400, sell: 96 },
    { id: "minecraft:anvil", name: "Anvil", buy: 5500, sell: 1300 },
    { id: "minecraft:bookshelf", name: "Bookshelf", buy: 450, sell: 110 },
    { id: "minecraft:note_block", name: "Note Block", buy: 300, sell: 70 },
    { id: "minecraft:enchanting_table", name: "Enchanting Table", buy: 18000, sell: 4300 },
    { id: "minecraft:chest", name: "Chest", buy: 280, sell: 70 },
    { id: "minecraft:shulker_box", name: "Shulker Box", buy: 45000, sell: 11000 },
    { id: "minecraft:torch", name: "Torch", buy: 15, sell: 3 },
    { id: "minecraft:end_rod", name: "End Rod", buy: 180, sell: 43 }
  ],

  // Kategori Hasil Panen (Farm)
  farm: [
    { id: "minecraft:stone_hoe", name: "Stone Hoe", buy: 100, sell: 25 },
    { id: "minecraft:wheat_seeds", name: "Wheat Seeds", buy: 12, sell: 3 },
    { id: "minecraft:melon_seeds", name: "Melon Seeds", buy: 15, sell: 4 },
    { id: "minecraft:beetroot_seeds", name: "Beetroot Seeds", buy: 12, sell: 3 },
    { id: "minecraft:wheat", name: "Wheat", buy: 30, sell: 7 },
    { id: "minecraft:beetroot", name: "Beetroot", buy: 28, sell: 7 },
    { id: "minecraft:carrot", name: "Carrot", buy: 25, sell: 6 },
    { id: "minecraft:potato", name: "Potato", buy: 25, sell: 6 },
    { id: "minecraft:sugar_cane", name: "Sugar Cane", buy: 55, sell: 13 },
    { id: "minecraft:bone_meal", name: "Bone Meal", buy: 40, sell: 10 },
    { id: "minecraft:pumpkin", name: "Pumpkin", buy: 45, sell: 11 },
    { id: "minecraft:melon_slice", name: "Melon Slice", buy: 25, sell: 6 }
  ],

  // Kategori Ore (Tambang)
  ore: [
    { id: "minecraft:coal", name: "Coal", buy: 25, sell: 6 },
    { id: "minecraft:copper_ingot", name: "Copper Ingot", buy: 80, sell: 19 },
    { id: "minecraft:iron_ingot", name: "Iron Ingot", buy: 350, sell: 85 },
    { id: "minecraft:gold_ingot", name: "Gold Ingot", buy: 750, sell: 180 },
    { id: "minecraft:emerald", name: "Emerald", buy: 1800, sell: 430 },
    { id: "minecraft:diamond", name: "Diamond", buy: 2500, sell: 600 },
    { id: "minecraft:netherite_ingot", name: "Netherite Ingot", buy: 12000, sell: 2900 },
    { id: "minecraft:redstone", name: "Redstone", buy: 35, sell: 8 },
    { id: "minecraft:lapis_lazuli", name: "Lapis Lazuli", buy: 45, sell: 11 },
    { id: "minecraft:quartz", name: "Nether Quartz", buy: 65, sell: 15 },
    { id: "minecraft:netherite_scrap", name: "Netherite Scrap", buy: 3500, sell: 850 }
  ],

  // Kategori Baru: Mob Drops
  mobdrops: [
    { id: "minecraft:leather", name: "Leather", buy: 55, sell: 13 },
    { id: "minecraft:rotten_flesh", name: "Rotten Flesh", buy: 8, sell: 2 },
    { id: "minecraft:bone", name: "Bone", buy: 28, sell: 7 },
    { id: "minecraft:arrow", name: "Arrow", buy: 18, sell: 4 },
    { id: "minecraft:string", name: "String", buy: 32, sell: 8 },
    { id: "minecraft:spider_eye", name: "Spider Eye", buy: 42, sell: 10 },
    { id: "minecraft:gunpowder", name: "Gunpowder", buy: 85, sell: 20 },
    { id: "minecraft:ender_pearl", name: "Ender Pearl", buy: 350, sell: 85 },
    { id: "minecraft:blaze_rod", name: "Blaze Rod", buy: 450, sell: 110 },
    { id: "minecraft:ghast_tear", name: "Ghast Tear", buy: 550, sell: 130 },
    { id: "minecraft:slime_ball", name: "Slime Ball", buy: 120, sell: 29 },
    { id: "minecraft:magma_cream", name: "Magma Cream", buy: 180, sell: 43 },
    { id: "minecraft:phantom_membrane", name: "Phantom Membrane", buy: 280, sell: 67 },
    { id: "minecraft:nautilus_shell", name: "Nautilus Shell", buy: 800, sell: 190 },
    { id: "minecraft:shulker_shell", name: "Shulker Shell", buy: 1500, sell: 360 },
    { id: "minecraft:echo_shard", name: "Echo Shard", buy: 2000, sell: 480 },
    { id: "minecraft:scute", name: "Scute", buy: 350, sell: 85 },
    { id: "minecraft:rabbit_hide", name: "Rabbit Hide", buy: 45, sell: 11 },
    { id: "minecraft:feather", name: "Feather", buy: 20, sell: 5 },
    { id: "minecraft:egg", name: "Egg", buy: 22, sell: 5 }
  ]
};