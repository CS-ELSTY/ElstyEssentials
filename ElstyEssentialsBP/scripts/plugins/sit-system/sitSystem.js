import { world, system, EntityComponentTypes } from "../../core.js"

const cooldowns = new Set();

// Default height offsets untuk berbagai jenis block
const BLOCK_HEIGHTS = {
    // Slabs - setengah block
    "slab": 0.35,
    "double_slab": 0.35,
    
    // Stairs - sedikit lebih tinggi
    "stairs": 0.4,
    
    // Logs dan wood blocks - lebih tinggi agar kaki tidak tertimbun
    "log": 0.9,
    "stem": 0.9,
    "wood": 0.9,
    "hyphae": 0.9,
    "bamboo_block": 0.9,
    "bone_block": 0.9,
    "creaking_heart": 0.9,
    
    // Carpets - sangat rendah
    "carpet": 0.1,
    
    // Beds - tinggi khusus
    "bed": 0.3,
    
    // Default untuk semua block lainnya
    "default": 0.9
};

export function initializeSitSystem() {
    console.warn("[Sit System] Initialized - Use /sit to sit on targeted block");

    // Cleanup empty seats
    system.runInterval(() => {
        cleanupSeats();
    }, 100); // Check every 5 seconds

    // Cleanup cooldowns
    system.runInterval(() => {
        cooldowns.forEach((playerId) => {
            if (!world.getAllPlayers().some(p => p.id === playerId)) {
                cooldowns.delete(playerId);
            }
        });
    }, 200);
}

// Command handler untuk /sit
export function handleSitCommand(player) {
    try {
        // Cek jika player sudah duduk
        if (player.vehicle && player.vehicle.typeId === "sit:seat") {
            player.sendMessage("§cYou are already sitting!");
            return;
        }

        // Cooldown check
        const playerId = player.id;
        if (cooldowns.has(playerId)) {
            player.sendMessage("§cWait a moment before sitting again");
            return;
        }
        cooldowns.add(playerId);

        // Cari block yang ditarget player
        const block = player.getBlockFromViewDirection({ maxDistance: 5 });
        if (!block || !block.block) {
            player.sendMessage("§cNo block targeted! Aim your crosshair at a block.");
            cooldowns.delete(playerId);
            return;
        }

        const targetBlock = block.block;
        const blockLocation = targetBlock.location;

        // Check if block is solid dan bisa diduduki
        if (!isSittableBlock(targetBlock)) {
            player.sendMessage("§cThis block cannot be sat on");
            cooldowns.delete(playerId);
            return;
        }

        // Check space above block
        const blockAbove = player.dimension.getBlock({
            x: blockLocation.x,
            y: blockLocation.y + 1,
            z: blockLocation.z
        });

        if (!isBreathable(blockAbove?.typeId)) {
            player.sendMessage("§cNo space to sit here");
            cooldowns.delete(playerId);
            return;
        }

        // Check distance from player
        const playerLoc = player.location;
        const distance = Math.sqrt(
            Math.pow(playerLoc.x - blockLocation.x, 2) +
            Math.pow(playerLoc.z - blockLocation.z, 2)
        );

        if (distance > 3) {
            player.sendMessage("§cBlock is too far to sit on");
            cooldowns.delete(playerId);
            return;
        }

        // Check if player is on ground
        if (!player.isOnGround && distance > 1) {
            player.sendMessage("§cYou must be on the ground to sit on a distant block");
            cooldowns.delete(playerId);
            return;
        }

        // Create sit entity
        createSit(targetBlock, player);

        // Remove cooldown after processing
        system.runTimeout(() => {
            cooldowns.delete(playerId);
        }, 20);

    } catch (error) {
        console.error(`[Sit System] Error: ${error}`);
        player.sendMessage("§cError: " + error.message);
        cooldowns.delete(playerId);
    }
}

// Command handler untuk /stand
export function handleStandCommand(player) {
    try {
        // Cek jika player sedang riding seat entity
        const vehicle = player.vehicle;
        if (vehicle && vehicle.typeId === "sit:seat") {
            try {
                vehicle.remove();
                player.sendMessage("§aYou are now standing");
            } catch (error) {
                player.sendMessage("§cFailed to stand up");
            }
        } else {
            player.sendMessage("§cYou are not sitting");
        }
    } catch (error) {
        player.sendMessage("§cYou are not sitting");
    }
}

/**
 * Check if block is sittable
 */
function isSittableBlock(block) {
    const blockId = block.typeId;
    
    // Block yang tidak bisa diduduki
    const unsittableBlocks = [
        "minecraft:air",
        "minecraft:water",
        "minecraft:flowing_water", 
        "minecraft:lava",
        "minecraft:flowing_lava",
        "minecraft:fire",
        "minecraft:soul_fire",
        "minecraft:portal",
        "minecraft:end_portal",
        "minecraft:end_gateway",
        "minecraft:bedrock",
        "minecraft:barrier"
    ];
    
    if (unsittableBlocks.includes(blockId)) {
        return false;
    }
    
    // Check if block adalah cairan atau non-solid
    if (blockId.includes("water") || blockId.includes("lava") || 
        blockId.includes("air") || blockId.includes("portal") ||
        blockId.includes("sign") || blockId.includes("banner") ||
        blockId.includes("pressure_plate") || blockId.includes("button") ||
        blockId.includes("lever") || blockId.includes("torch") ||
        blockId.includes("rail") || blockId.includes("carpet") && !blockId.includes("concrete")) {
        return false;
    }
    
    return true;
}

/**
 * Check if block is breathable (air-like)
 */
function isBreathable(blockId) {
    if (!blockId) return true;
    
    const breathableBlocks = [
        "minecraft:air",
        "minecraft:cave_air",
        "minecraft:void_air",
        "minecraft:fire",
        "minecraft:soul_fire"
    ];
    
    if (breathableBlocks.includes(blockId)) {
        return true;
    }
    
    // Block transparan yang masih memungkinkan duduk
    const transparentBlocks = [
        "sign", "frame", "painting", "banner", "torch", "lever", 
        "button", "web", "carpet", "chain", "flower", "sapling",
        "mushroom", "grass", "fern", "vine", "ladder", "rail"
    ];
    
    return transparentBlocks.some(keyword => blockId.includes(keyword));
}

/**
 * Get appropriate height offset for block type
 */
function getBlockHeight(blockId) {
    for (const [key, height] of Object.entries(BLOCK_HEIGHTS)) {
        if (blockId.includes(key)) {
            return height;
        }
    }
    return BLOCK_HEIGHTS.default;
}

/**
 * Create sit entity dengan tinggi yang sesuai
 */
function createSit(block, player) {
    system.run(() => {
        try {
            // Check if there's already a seat at this location
            const existingEntities = block.dimension.getEntitiesAtBlockLocation(block.location);
            const existingSeat = existingEntities.find(entity => entity.typeId === "sit:seat");

            if (existingSeat) {
                player.sendMessage("§7This seat is already occupied");
                return;
            }

            // Determine height based on block type
            const blockId = block.typeId;
            const heightOffset = getBlockHeight(blockId);

            const location = {
                x: block.location.x + 0.5,
                y: block.location.y + heightOffset, // Gunakan height yang sesuai
                z: block.location.z + 0.5
            };

            // Spawn seat entity
            const seat = block.dimension.spawnEntity("sit:seat", location);

            // Set rotation based on player's facing direction
            const playerRotation = player.getRotation();
            seat.setRotation(playerRotation);

            // Add player as rider
            const rideable = seat.getComponent(EntityComponentTypes.Rideable);
            if (rideable) {
                rideable.addRider(player);

                // Beri feedback berdasarkan jenis block
                let blockName = getBlockDisplayName(blockId);
                player.sendMessage(`§aYou are now sitting on ${blockName}`);
                player.playSound("random.pop");
            }

        } catch (error) {
            console.error(`[Sit System] Create error: ${error}`);
            player.sendMessage("§cFailed to sit on this block");
        }
    });
}

/**
 * Get display name for block
 */
function getBlockDisplayName(blockId) {
    // Remove namespace
    let name = blockId.replace("minecraft:", "");
    
    // Convert to readable format
    name = name.split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    
    return name;
}

// Cleanup function for empty seats
function cleanupSeats() {
    try {
        const dimensions = [
            world.getDimension("overworld"),
            world.getDimension("nether"),
            world.getDimension("the_end")
        ];

        for (const dimension of dimensions) {
            const seats = dimension.getEntities({ type: "sit:seat" });
            for (const seat of seats) {
                try {
                    const rideable = seat.getComponent(EntityComponentTypes.Rideable);
                    if (!rideable || rideable.getRiders().length === 0) {
                        seat.remove();
                    }
                } catch (e) {
                    // Entity might be invalid, remove it
                    seat.remove();
                }
            }
        }
    } catch (error) {
        console.error(`[Sit System] Cleanup error: ${error}`);
    }
}

// Auto cleanup when player leaves
world.afterEvents.playerLeave.subscribe((event) => {
    const player = event.player;
    
    // Cleanup any seats the player was riding
    const dimensions = [
        world.getDimension("overworld"),
        world.getDimension("nether"),
        world.getDimension("the_end")
    ];
    
    for (const dimension of dimensions) {
        const seats = dimension.getEntities({ type: "sit:seat" });
        for (const seat of seats) {
            try {
                const rideable = seat.getComponent(EntityComponentTypes.Rideable);
                if (rideable && rideable.getRiders().some(rider => rider.id === player.id)) {
                    seat.remove();
                }
            } catch (e) {
                seat.remove();
            }
        }
    }
});