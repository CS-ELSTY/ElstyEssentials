/**
 * @file ProtectedItems.js
 * @description List of protected blocks and items in land claims
 */

export const PROTECTED_BLOCKS = {
    // Storage blocks
    STORAGE: ["chest", "trapped_chest", "barrel", "shulker_box", "ender_chest", "hopper", "dispenser", "dropper", "chiseled_bookshelf", "decorated_pot"],

    // Furnace blocks
    FURNACES: ["furnace", "blast_furnace", "smoker", "campfire", "soul_campfire"],

    // Crafting blocks
    CRAFTING: ["crafting_table", "smithing_table", "cartography_table", "grindstone", "stonecutter", "loom", "fletching_table"],

    // Utility blocks
    UTILITY: ["brewing_stand", "enchanting_table", "anvil", "beacon", "lectern", "composter", "cauldron", "water_cauldron", "lava_cauldron", "powder_snow_cauldron"],

    // Redstone blocks
    REDSTONE: ["repeater", "comparator", "daylight_detector", "observer", "target", "lever", "button", "pressure_plate", "tripwire", "tripwire_hook", "sculk_sensor", "calibrated_sculk_sensor", "redstone_wire", "redstone_torch", "piston", "sticky_piston"],

    // Interactive blocks
    INTERACTIVE: ["jukebox", "note_block", "bell", "lodestone", "respawn_anchor", "conduit", "end_portal_frame", "dragon_egg", "sign", "hanging_sign", "wall_sign"],

    // Door blocks
    DOORS: ["door", "iron_door", "trapdoor", "fence_gate", "wooden_door", "wooden_trapdoor", "iron_trapdoor"],

    // Farming & Nature
    FARMING: ["farmland", "dirt", "grass_block", "sweet_berry_bush", "bee_nest", "beehive", "turtle_egg", "bamboo", "cocoa", "sugar_cane", "kelp", "chorus_flower", "chorus_plant", "crop", "wheat", "potato", "carrot", "beetroot", "melon_stem", "pumpkin_stem", "nether_wart"],

    // Mob Related
    MOB_RELATED: ["spawner", "dragon_egg", "turtle_egg", "infested_stone", "infested_deepslate"],

    // Decoration
    DECORATION: ["item_frame", "glow_item_frame", "armor_stand", "painting", "banner", "flower_pot"]
};

// Daftar item yang tidak boleh digunakan
export const PROTECTED_ITEMS = {
    // Tools & Weapons
    TOOLS: ["axe", "hoe", "shovel", "pickaxe", "shears", "flint_and_steel", "shield", "trident", "sword"],

    // Buckets & Containers
    CONTAINERS: ["bucket", "water_bucket", "lava_bucket", "powder_snow_bucket", "milk_bucket", "axolotl_bucket", "cod_bucket", "salmon_bucket", "tropical_fish_bucket", "pufferfish_bucket"],

    // Spawn Eggs & Mob Related
    MOB_ITEMS: ["spawn_egg", "lead", "name_tag", "saddle", "horse_armor", "breathing_helmet"],

    // Redstone Items
    REDSTONE_ITEMS: ["redstone", "redstone_torch", "repeater", "comparator", "hopper", "dispenser", "dropper", "observer", "piston", "sticky_piston", "daylight_detector", "tripwire_hook", "sculk_sensor"],

    // Dangerous Items
    DANGEROUS: ["tnt", "end_crystal", "firework_rocket", "trident", "crossbow", "bow", "charged_creeper_spawn_egg", "fire_charge", "wither_skull"],

    // Farming Items
    FARMING_ITEMS: ["bone_meal", "seeds", "wheat_seeds", "pumpkin_seeds", "melon_seeds", "beetroot_seeds", "carrot", "potato", "bamboo", "nether_wart", "mushroom", "sapling"],

    // Utility Items
    UTILITY_ITEMS: ["compass", "clock", "spyglass", "brush", "recovery_compass", "bundle", "debug_stick", "structure_block", "command_block", "barrier", "light"],

    // Beds & Sleeping Items
    BEDS: ["bed"],

    // Signs & Information Items
    SIGNS: ["sign", "hanging_sign"],

    // Decoration Items
    DECORATION: ["item_frame", "glow_item_frame", "painting", "armor_stand", "flower_pot", "banner", "candle", "lantern", "bookshelf"],

    // Light Sources
    LIGHT_SOURCES: ["torch", "lantern", "sea_lantern", "glowstone", "shroomlight", "end_rod", "redstone_lamp", "jack_o_lantern", "candle", "light"],

    // Containers & Storage
    PLACEABLE_STORAGE: ["chest", "trapped_chest", "barrel", "shulker_box", "hopper", "dispenser", "dropper", "ender_chest"],

    // Functional Items
    FUNCTIONAL: ["ladder", "scaffolding", "chain", "bell", "lectern", "grindstone", "stonecutter", "loom", "composter", "cartography_table", "fletching_table", "smithing_table", "anvil", "chiseled_bookshelf", "jukebox", "note_block", "cauldron"],

    // Rails & Transportation
    RAILS: ["rail", "powered_rail", "detector_rail", "activator_rail", "minecart"],

    // Special Items
    SPECIAL: ["structure_void", "command_block", "repeating_command_block", "chain_command_block", "structure_block", "jigsaw", "barrier", "light", "reinforced_deepslate"]
};

// Helper functions
export function isProtectedBlock(blockId) {
    const id = blockId.toLowerCase().replace("minecraft:", "");
    return Object.values(PROTECTED_BLOCKS).some(category =>
        category.some(block => id.includes(block)));
}

export function isProtectedItem(itemId) {
    const id = itemId.toLowerCase().replace("minecraft:", "");
    return Object.values(PROTECTED_ITEMS).some(category =>
        category.some(item => id.includes(item)));
}

export function getBlockCategory(blockId) {
    const id = blockId.toLowerCase().replace("minecraft:", "");
    for (const [category, blocks] of Object.entries(PROTECTED_BLOCKS))
        if (blocks.some(block => id.includes(block)))
            return category;
    return null;
}

export function getItemCategory(itemId) {
    const id = itemId.toLowerCase().replace("minecraft:", "");
    for (const [category, items] of Object.entries(PROTECTED_ITEMS))
        if (items.some(item => id.includes(item)))
            return category;
    return null;
}

export function getReadableBlockName(blockId) {
    return blockId.split(":")[1]
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
