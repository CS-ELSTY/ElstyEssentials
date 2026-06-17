import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { SHOP_ITEMS } from './config/shopItems.js';
import { ITEM_TEXTURES } from './config/shopTextures.js';
import { getScore, ForceOpen } from "../core/utils.js";

// Daftar item yang bisa dijual/dibeli - Updated dengan item baru
const SHOP_ITEMS_CONFIG = SHOP_ITEMS;

// Update shop menu function untuk menambah kategori baru
export async function openShopMenu(player) {
    const form = new ActionFormData()
        .title("§6§lSHOP SYSTEM")
        .body("§ePilih kategori:")
        .button("§b§lTools", "textures/menu/shop/tools.png")
        .button("§9§lArmor", "textures/menu/shop/armor.png")
        .button("§a§lFood", "textures/menu/shop/food.png")
        .button("§f§lBlocks", "textures/menu/shop/block.png")
        .button("§6§lWood", "textures/menu/shop/wood.png")
        .button("§d§lFurniture", "textures/menu/shop/furniture.png")
        .button("§e§lFarm", "textures/menu/shop/farm.png")
        .button("§c§lOres", "textures/menu/shop/ore.png")
        .button("§5§lMob Drops", "textures/menu/shop/mob.png")
        .button("§a§lSell", "textures/menu/shop/sell.png")
        .button("§8§lClose", "textures/icons/deny.png");

    const result = await ForceOpen(player, form);
    if (result.canceled) return;

    switch (result.selection) {
        case 0:
            await openShopCategory(player, "tools");
            break;
        case 1:
            await openShopCategory(player, "armor");
            break;
        case 2:
            await openShopCategory(player, "food");
            break;
        case 3:
            await openShopCategory(player, "block");
            break;
        case 4:
            await openShopCategory(player, "wood");
            break;
        case 5:
            await openShopCategory(player, "furniture");
            break;
        case 6:
            await openShopCategory(player, "farm");
            break;
        case 7:
            await openShopCategory(player, "ore");
            break;
        case 8:
            await openShopCategory(player, "mobdrops");
            break;
        case 9:
            await openSellMenu(player);
            break;
    }
}

async function openShopCategory(player, category) {
    const items = SHOP_ITEMS_CONFIG[category];
    const categoryNames = {
        tools: "§bTools",
        armor: "§9Armor",
        food: "§aFood",
        block: "§fBlocks",
        wood: "§6Wood",
        furniture: "§dFurniture",
        farm: "§eFarm Items",
        ore: "§cOres",
        mobdrops: "§5Mob Drops"
    };

    const form = new ActionFormData()
        .title(`${categoryNames[category]} §6Shop`)
        .body("§ePilih item untuk melihat detail:");

    items.forEach(item => {
        form.button(
            `§f${item.name}\n§aBuy: §2${item.buy} §7| §6Sell: §e${item.sell}`,
            getItemTexture(item.id)
        );
    });

    form.button("§8§lBack", "textures/icons/back.png");

    const result = await ForceOpen(player, form);
    if (result.canceled) return;

    if (result.selection === items.length) {
        await openShopMenu(player);
        return;
    }

    const selectedItem = items[result.selection];
    await openBuyMenu(player, selectedItem);
}

async function openBuyMenu(player, item) {
    try {
        // Perbaikan: Gunakan textField dan toggle dengan parameter yang benar
        const form = new ModalFormData()
            .title(`§aBuy ${item.name}`)
            .textField("Jumlah yang ingin dibeli (1-64):", "1")
            .toggle("Konfirmasi pembelian?"); // Removed default value parameter

        const result = await form.show(player);
        if (result.canceled) return;

        let quantity = parseInt(result.formValues[0]);
        const confirmed = result.formValues[1];

        // Validasi input
        if (isNaN(quantity) || quantity < 1) quantity = 1;
        if (quantity > 64) quantity = 64;

        if (!confirmed) {
            player.sendMessage("§8[§6Shop§8] §cPembelian dibatalkan");
            return;
        }

        const totalCost = item.buy * quantity;
        const playerMoney = getScore(player, "money");

        if (playerMoney < totalCost) {
            player.sendMessage(
                `§8[§6Shop§8] §cUang tidak cukup! Dibutuhkan: §e${totalCost} §c| Punya: §e${playerMoney}`
            );
            return;
        }

        // Berikan item terlebih dahulu (sebelum mengurangi uang)
        const itemStack = new ItemStack(item.id, quantity);
        const inventory = player.getComponent("inventory").container;

        // Coba tambahkan ke inventory
        const remainingItems = inventory.addItem(itemStack);

        if (!remainingItems) {
            // Berhasil menambah semua item (tidak ada sisa)
            player.runCommand(
                `scoreboard players remove @s money ${totalCost}`
            );
            player.sendMessage(
                `§8[§6Shop§8] §aBerhasil membeli §e${quantity}x ${item.name} §aseharga §e${totalCost}`
            );
            player.runCommand(`playsound random.orb @s`);
        } else {
            // Inventory penuh atau sebagian penuh
            player.sendMessage(
                "§8[§6Shop§8] §cInventory penuh! Tidak bisa membeli item."
            );
        }
    } catch (error) {
        player.sendMessage(
            `§8[§6Shop§8] §cTerjadi kesalahan: ${error.message}`
        );
        console.error("Error in openBuyMenu:", error);
    }
}

async function openSellMenu(player) {
    try {
        const inventory = player.getComponent("inventory").container;
        let sellableItems = [];

        // Cari item yang bisa dijual di inventory
        for (let i = 0; i < inventory.size; i++) {
            const item = inventory.getItem(i);
            if (item) {
                // Cari harga jual item
                const sellPrice = findSellPrice(item.typeId);
                if (sellPrice > 0) {
                    sellableItems.push({
                        slot: i,
                        item: item,
                        sellPrice: sellPrice,
                        itemName: getItemName(item.typeId)
                    });
                }
            }
        }

        if (sellableItems.length === 0) {
            player.sendMessage(
                "§8[§6Shop§8] §cTidak ada item yang bisa dijual di inventory!"
            );
            return;
        }

        const form = new ActionFormData()
            .title("§6§lSELL ITEMS")
            .body("§ePilih item yang ingin dijual:");

        sellableItems.forEach(sellItem => {
            const totalValue = sellItem.sellPrice * sellItem.item.amount;
            form.button(
                `§f${sellItem.item.amount}x ${sellItem.itemName}\n§6Value: §e${totalValue}`,
                getItemTexture(sellItem.item.typeId)
            );
        });

        form.button("§8§lBack", "textures/icons/back.png");

        const result = await ForceOpen(player, form);
        if (result.canceled) return;

        if (result.selection === sellableItems.length) {
            await openShopMenu(player);
            return;
        }

        const selectedItem = sellableItems[result.selection];
        await confirmSellItem(player, selectedItem);
    } catch (error) {
        player.sendMessage(
            `§8[§6Shop§8] §cTerjadi kesalahan: ${error.message}`
        );
        console.error("Error in openSellMenu:", error);
    }
}

async function confirmSellItem(player, sellItem) {
    try {
        // Perbaikan: Toggle tanpa parameter default
        const form = new ModalFormData()
            .title(`§6Sell ${sellItem.itemName}`)
            .textField(
                `Jumlah yang ingin dijual (1-${sellItem.item.amount}):`,
                sellItem.item.amount.toString()
            )
            .toggle("Konfirmasi penjualan?"); // Removed default value parameter

        const result = await form.show(player);
        if (result.canceled) return;

        let quantity = parseInt(result.formValues[0]);
        const confirmed = result.formValues[1];

        // Validasi input
        if (isNaN(quantity) || quantity < 1) quantity = 1;
        if (quantity > sellItem.item.amount) quantity = sellItem.item.amount;

        if (!confirmed) {
            player.sendMessage("§8[§6Shop§8] §cPenjualan dibatalkan");
            return;
        }

        const totalValue = sellItem.sellPrice * quantity;
        const inventory = player.getComponent("inventory").container;

        // Kurangi item dari inventory
        const newAmount = sellItem.item.amount - quantity;
        if (newAmount > 0) {
            const newItem = new ItemStack(sellItem.item.typeId, newAmount);
            inventory.setItem(sellItem.slot, newItem);
        } else {
            inventory.setItem(sellItem.slot, undefined);
        }

        // Tambahkan uang ke player
        player.runCommand(`scoreboard players add @s money ${totalValue}`);

        player.sendMessage(
            `§8[§6Shop§8] §aBerhasil menjual §e${quantity}x ${sellItem.itemName} §aseharga §e${totalValue}`
        );
        player.runCommand(`playsound random.orb @s`);
    } catch (error) {
        player.sendMessage(
            `§8[§6Shop§8] §cTerjadi kesalahan: ${error.message}`
        );
        console.error("Error in confirmSellItem:", error);
    }
}

// Helper functions
function findSellPrice(itemId) {
    for (const category of Object.values(SHOP_ITEMS_CONFIG)) {
        for (const item of category) {
            if (item.id === itemId) {
                return item.sell;
            }
        }
    }
    return 0; // Tidak bisa dijual
}

function getItemName(itemId) {
    for (const category of Object.values(SHOP_ITEMS_CONFIG)) {
        for (const item of category) {
            if (item.id === itemId) {
                return item.name;
            }
        }
    }
    return itemId.replace("minecraft:", ""); // Fallback ke ID item
}

function getItemTexture(itemId) {
    return ITEM_TEXTURES[itemId] || "textures/items/emerald"; // Default texture
}

// Handler untuk command shop
export function handleShopCommand(player) {
    system.runTimeout(() => {
        openShopMenu(player);
    }, 20);
}

// Handler untuk item use (jika ingin menggunakan item untuk membuka shop)
world.beforeEvents.itemUse.subscribe(eventData => {
    const item = eventData.itemStack;
    const player = eventData.source;

    if (item.typeId === "minecraft:emerald") {
        // Ganti dengan item yang diinginkan
        system.run(() => {
            openShopMenu(player);
        });
    }
});

// Initialize function untuk main system
export function initializeShopSystem() {
    console.warn("✓ Shop System initialized with categories:");
    console.warn(`  - ${Object.keys(SHOP_ITEMS_CONFIG).join(", ")}`);
    return true;
}