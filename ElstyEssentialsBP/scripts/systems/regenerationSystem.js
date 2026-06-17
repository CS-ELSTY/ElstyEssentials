import { world, system } from "@minecraft/server";

// Konfigurasi regenerasi sesuai standar Java Edition
const REGEN_DURATION_TICKS = 80; // 4 detik (80 ticks) - sesuai standar Java
const HUNGER_DURATION_TICKS = 40; // 2 detik (40 ticks)
const REGEN_LEVEL = 0; // Level 1 regenerasi (0-based = level 1) - sesuai standar Java
const HUNGER_LEVEL = 9; // Level 10 hunger (0-based = level 10)

// Daftar makanan yang memicu regenerasi
const FOOD_ITEMS = [
    "minecraft:apple",
    "minecraft:baked_potato",
    "minecraft:beetroot",
    "minecraft:beetroot_soup",
    "minecraft:bread",
    "minecraft:carrot",
    "minecraft:chorus_fruit",
    "minecraft:cooked_beef",
    "minecraft:cooked_chicken",
    "minecraft:cooked_cod",
    "minecraft:cooked_mutton",
    "minecraft:cooked_porkchop",
    "minecraft:cooked_rabbit",
    "minecraft:cooked_salmon",
    "minecraft:cookie",
    "minecraft:dried_kelp",
    "minecraft:enchanted_golden_apple",
    "minecraft:glow_berries",
    "minecraft:golden_apple",
    "minecraft:golden_carrot",
    "minecraft:honey_bottle",
    "minecraft:melon_slice",
    "minecraft:mushroom_stew",
    "minecraft:poisonous_potato",
    "minecraft:potato",
    "minecraft:pumpkin_pie",
    "minecraft:rabbit_stew",
    "minecraft:raw_beef",
    "minecraft:raw_chicken",
    "minecraft:raw_cod",
    "minecraft:raw_mutton",
    "minecraft:raw_porkchop",
    "minecraft:raw_rabbit",
    "minecraft:raw_salmon",
    "minecraft:rotten_flesh",
    "minecraft:spider_eye",
    "minecraft:suspicious_stew",
    "minecraft:sweet_berries",
    "minecraft:tropical_fish"
];

// Auto-detect makanan dari add-on
const CUSTOM_FOOD_ITEMS = new Set();

// Tracking player yang sedang dalam efek regenerasi
const activeRegenPlayers = new Set();
const playerHealthTracker = new Map();

// Function untuk mendapatkan health player
function getPlayerHealth(player) {
    try {
        const healthComponent = player.getComponent("health");
        if (healthComponent) {
            return healthComponent.currentValue;
        }
        return 20;
    } catch (error) {
        return 20;
    }
}

// Function untuk cek apakah player memerlukan healing
function needsHealing(player) {
    try {
        const currentHealth = getPlayerHealth(player);
        const maxHealth = 20;
        return currentHealth < maxHealth && currentHealth > 0;
    } catch (error) {
        return false;
    }
}

// Function untuk auto-detect makanan custom
function detectCustomFoodItems() {
    try {
        for (const player of world.getAllPlayers()) {
            try {
                const inventory = player.getComponent("inventory");
                if (!inventory || !inventory.container) continue;
                
                const container = inventory.container;
                for (let slot = 0; slot < container.size; slot++) {
                    try {
                        const item = container.getItem(slot);
                        if (!item) continue;
                        
                        const itemId = item.typeId;
                        
                        if (itemId && !itemId.startsWith("minecraft:") && !FOOD_ITEMS.includes(itemId)) {
                            try {
                                const foodComponent = item.getComponent("food");
                                if (foodComponent && !CUSTOM_FOOD_ITEMS.has(itemId)) {
                                    CUSTOM_FOOD_ITEMS.add(itemId);
                                    console.warn(`[RegenScript] Detected custom food: ${itemId}`);
                                }
                            } catch (e) {
                                // Bukan makanan
                            }
                        }
                    } catch (slotError) {
                        // Skip slot error
                    }
                }
            } catch (invError) {
                // Skip inventory error
            }
        }
    } catch (error) {
        console.warn(`[RegenScript] Error detecting custom food: ${error}`);
    }
}

// Function untuk cek apakah item adalah makanan
function isFoodItem(itemStack) {
    if (!itemStack) return false;
    
    const itemId = itemStack.typeId;
    
    if (FOOD_ITEMS.includes(itemId)) {
        return true;
    }
    
    if (CUSTOM_FOOD_ITEMS.has(itemId)) {
        return true;
    }
    
    try {
        const foodComponent = itemStack.getComponent("food");
        if (foodComponent) {
            if (!itemId.startsWith("minecraft:")) {
                CUSTOM_FOOD_ITEMS.add(itemId);
                console.warn(`[RegenScript] New custom food detected: ${itemId}`);
            }
            return true;
        }
    } catch (e) {
        // Bukan makanan
    }
    
    return false;
}

// Function untuk set gamerule dengan aman
function setNaturalRegeneration(value) {
    try {
        // Gunakan runCommand untuk set gamerule true
        world.getDimension("overworld").runCommand(`gamerule naturalregeneration ${value}`);
        console.warn(`[RegenScript] Natural regeneration set to: ${value}`);
    } catch (error) {
        console.error(`[RegenScript] Failed to set gamerule: ${error}`);
    }
}

// Sistem regenerasi alami Java Edition
const naturalRegenPlayers = new Map(); // Map untuk melacak pemain dengan regenerasi alami

export function initializeSaturationSystem() {
    // Aktifkan natural regeneration
    system.runTimeout(() => {
        setNaturalRegeneration(true);
    }, 20);

    // Auto-detect makanan custom
    system.runTimeout(() => {
        detectCustomFoodItems();
    }, 100);

    // Monitor health perubahan dan terapkan regenerasi alami
    system.runInterval(() => {
        try {
            for (const player of world.getAllPlayers()) {
                if (!player) continue;

                try {
                    if (typeof player.isValid === 'function' && !player.isValid()) {
                        continue;
                    }
                } catch (e) {
                    continue;
                }

                let playerId;
                try {
                    playerId = player.id || player.name;
                } catch (e) {
                    continue;
                }

                const currentHealth = getPlayerHealth(player);
                playerHealthTracker.set(playerId, currentHealth);

                // Cek kondisi untuk regenerasi alami Java Edition
                checkNaturalRegeneration(player, currentHealth);
            }
        } catch (error) {
            console.error(`[RegenScript] Error in health monitoring: ${error}`);
        }
    }, 20); // Perbarui interval ke 20 ticks (1 detik) untuk efisiensi

    // Event listener untuk detect makan
    world.afterEvents.itemCompleteUse.subscribe((event) => {
        const player = event.source;
        const itemStack = event.itemStack;

        if (!player || player.typeId !== "minecraft:player") {
            return;
        }

        if (!isFoodItem(itemStack)) {
            return;
        }

        if (!needsHealing(player)) {
            return;
        }

        let playerId;
        try {
            playerId = player.id || player.name;
        } catch (e) {
            return;
        }

        if (activeRegenPlayers.has(playerId)) {
            return;
        }

        try {
            applyRegenAfterEating(player, itemStack.typeId);
        } catch (error) {
            console.error(`[RegenScript] Error processing food: ${error}`);
        }
    });

    // Cleanup ketika player leave
    world.afterEvents.playerLeave.subscribe((event) => {
        try {
            const playerId = event.playerId;
            activeRegenPlayers.delete(playerId);
            naturalRegenPlayers.delete(playerId);
            playerHealthTracker.delete(playerId);
        } catch (e) {
            // Ignore
        }
    });

    console.warn("[RegenScript] Custom Saturation System initialized");
}

// Fungsi untuk mengecek dan menerapkan regenerasi alami Java Edition
function checkNaturalRegeneration(player, currentHealth) {
    try {
        if (!player) return;

        const maxHealth = 20;

        // Dalam Java Edition, regenerasi alami terjadi ketika:
        // 1. HP >= 18 (9 hearts penuh)
        // 2. Hunger penuh (kita asumsikan setelah makan)
        if (currentHealth >= 18 && currentHealth < maxHealth) {
            let playerId;
            try {
                playerId = player.id || player.name;
            } catch (e) {
                return;
            }

            // Jika pemain belum memiliki efek regenerasi alami
            if (!naturalRegenPlayers.has(playerId)) {
                // Terapkan efek regenerasi level 0 (memberikan 1 HP setiap 2.5 detik)
                player.dimension.runCommand(`effect "${player.name}" regeneration 10 0 true`);

                // Tandai bahwa pemain sedang dalam regenerasi alami
                naturalRegenPlayers.set(playerId, Date.now());
            }
        } else {
            // Jika kondisi tidak terpenuhi, hapus efek regenerasi alami
            let playerId;
            try {
                playerId = player.id || player.name;
            } catch (e) {
                return;
            }

            if (naturalRegenPlayers.has(playerId)) {
                player.dimension.runCommand(`effect "${player.name}" regeneration 0`);
                naturalRegenPlayers.delete(playerId);
            }
        }
    } catch (error) {
        console.error(`[RegenScript] Error in natural regeneration check: ${error}`);
    }
}

function applyRegenAfterEating(player, foodType) {
    try {
        if (!player) return;

        if (typeof player.isValid === 'function' && !player.isValid()) {
            return;
        }

        if (!needsHealing(player)) {
            return;
        }

        let playerId;
        try {
            playerId = player.id || player.name;
        } catch (e) {
            return;
        }

        activeRegenPlayers.add(playerId);

        // Gunakan dimension.runCommand untuk lebih reliable
        system.run(() => {
            try {
                const dim = player.dimension;
                const name = player.name;

                // Regeneration untuk heal berkelanjutan - sesuai standar Java
                dim.runCommand(`effect "${name}" regeneration ${Math.ceil(REGEN_DURATION_TICKS/20)} ${REGEN_LEVEL} true`);

                // Hunger untuk balance
                dim.runCommand(`effect "${name}" hunger ${Math.ceil(HUNGER_DURATION_TICKS/20)} ${HUNGER_LEVEL} true`);

                // Feedback
                player.onScreenDisplay.setActionBar("§a🍖 Makanan memicu regenerasi!");

            } catch (cmdError) {
                console.warn(`[RegenScript] Command failed: ${cmdError}`);
            }
        });

        // Setup healing interval tambahan
        setupHealingInterval(player);

        // Cleanup setelah durasi selesai
        system.runTimeout(() => {
            activeRegenPlayers.delete(playerId);
        }, REGEN_DURATION_TICKS);

    } catch (error) {
        console.error(`[RegenScript] Error applying regen: ${error}`);
        try {
            const playerId = player.id || player.name;
            activeRegenPlayers.delete(playerId);
        } catch (e) {
            // Ignore
        }
    }
}

function setupHealingInterval(player) {
    let healingCount = 0;
    const maxHealingTicks = 8; // Lebih lama sesuai durasi regenerasi yang diperpanjang

    let playerId;
    try {
        playerId = player.id || player.name;
    } catch (e) {
        return;
    }

    const healingInterval = system.runInterval(() => {
        try {
            if (!player || (typeof player.isValid === 'function' && !player.isValid())) {
                system.clearRun(healingInterval);
                activeRegenPlayers.delete(playerId);
                return;
            }

            if (!needsHealing(player)) {
                system.clearRun(healingInterval);
                activeRegenPlayers.delete(playerId);
                return;
            }

            try {
                // Gunakan effect regeneration yang lebih sesuai standar Java
                player.dimension.runCommand(`effect "${player.name}" instant_health 1 0 true`);
            } catch (healError) {
                // Skip jika gagal
            }

            healingCount++;

            if (healingCount >= maxHealingTicks) {
                system.clearRun(healingInterval);
            }

        } catch (error) {
            console.error(`[RegenScript] Error in healing interval: ${error}`);
            system.clearRun(healingInterval);
            activeRegenPlayers.delete(playerId);
        }
    }, 20); // Interval 1 detik (20 ticks) untuk mengikuti standar Java
}

// Function untuk manually menambahkan makanan custom
export function addCustomFood(itemId) {
    if (!FOOD_ITEMS.includes(itemId) && !CUSTOM_FOOD_ITEMS.has(itemId)) {
        CUSTOM_FOOD_ITEMS.add(itemId);
        console.warn(`[RegenScript] Manually added custom food: ${itemId}`);
    }
}

// Function untuk mendapatkan daftar makanan yang didukung
export function getSupportedFoods() {
    return [...FOOD_ITEMS, ...CUSTOM_FOOD_ITEMS];
}