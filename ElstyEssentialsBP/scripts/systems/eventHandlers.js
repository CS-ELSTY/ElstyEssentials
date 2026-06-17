// Event Handlers Module - Minecraft Bedrock 1.26.10+
// Utilizes stable API events for quest and skills tracking
// @minecraft/server v2.6.0+ (stable)

import { world, system } from "../core.js";
import { addSkillXP } from "./skills/skillsXPHandlers.js";
import { handleItemCollection, handleEntityKill, handleItemCraft, handleBlockBreak, handleBlockPlace, handleExplore } from "./quest/questSystem.js";

// ============================================
// EVENT HANDLERS REGISTRY
// ============================================

export function registerEventHandlers() {
    console.warn("[EventHandlers] Registering stable event handlers...");
    
    registerEntityEvents();
    registerBlockEvents();
    registerPlayerEvents();
    
    console.warn("[EventHandlers] Event handlers registered successfully!");
}

// ============================================
// ENTITY EVENTS
// ============================================

function registerEntityEvents() {
    // Entity Item Pickup - For quest item collection & farming XP
    if (world.afterEvents.entityItemPickup) {
        world.afterEvents.entityItemPickup.subscribe((event) => {
            try {
                const { entity, itemStack } = event;
                
                // Check if entity and itemStack are valid
                if (!entity || !itemStack || !itemStack.typeId) {
                    return;
                }
                
                if (entity.typeId === "minecraft:player") {
                    // Quest tracking
                    handleItemCollection(entity, itemStack);
                    
                    // Skills - Farming XP (picking up crops/items)
                    const itemId = itemStack.typeId.toLowerCase();
                    
                    // Farm crops
                    if (itemId.includes("wheat") ||
                        itemId.includes("carrot") ||
                        itemId.includes("potato") ||
                        itemId.includes("beetroot")) {
                        addSkillXP(entity, "farming", 2);
                    }
                    // Fruits
                    else if (itemId.includes("apple") ||
                             itemId.includes("berry") ||
                             itemId.includes("melon") ||
                             itemId.includes("pumpkin")) {
                        addSkillXP(entity, "farming", 1);
                    }
                    // Seeds
                    else if (itemId.includes("seed")) {
                        addSkillXP(entity, "farming", 1);
                    }
                    // Fishing drops
                    else if (itemId.includes("cod") ||
                             itemId.includes("salmon") ||
                             itemId.includes("tropical_fish") ||
                             itemId.includes("pufferfish")) {
                        addSkillXP(entity, "fishing", 3);
                    }
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in entityItemPickup: ${error}`);
            }
        });
    }
    
    // Entity Item Use - For support XP when using potions/food
    if (world.afterEvents.itemUse) {
        world.afterEvents.itemUse.subscribe((event) => {
            try {
                const { source, itemStack } = event;
                
                if (!source || source.typeId !== "minecraft:player" || !itemStack) {
                    return;
                }
                
                const itemId = itemStack.typeId.toLowerCase();
                
                // Support XP for using healing items
                if (itemId.includes("potion")) {
                    // Check if it's a healing potion
                    if (itemId.includes("healing") || 
                        itemId.includes("regeneration") ||
                        itemId.includes("water")) {
                        addSkillXP(source, "support", 5);
                    }
                }
                // Support XP for using golden apple
                else if (itemId.includes("golden_apple")) {
                    addSkillXP(source, "support", 10);
                }
                // Support XP for using food
                else if (itemId.includes("cooked_") || 
                         itemId.includes("bread") ||
                         itemId.includes("apple") ||
                         itemId.includes("carrot") ||
                         itemId.includes("potato")) {
                    addSkillXP(source, "support", 2);
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in itemUse: ${error}`);
            }
        });
    }
    
    // Player Interact with Block - For crafting XP when using crafting table
    if (world.afterEvents.playerInteractWithBlock) {
        world.afterEvents.playerInteractWithBlock.subscribe((event) => {
            try {
                const { player, block } = event;
                
                if (!player || !block) {
                    return;
                }
                
                const blockId = block.typeId.toLowerCase();
                
                // Give crafting XP when interacting with crafting-related blocks
                if (blockId.includes("crafting_table") || 
                    blockId.includes("workbench")) {
                    // Store last craft time for player
                    player.setDynamicProperty("lastCraftTime", Date.now());
                }
                else if (blockId.includes("furnace")) {
                    player.setDynamicProperty("lastCraftTime", Date.now());
                    addSkillXP(player, "crafting", 2);
                }
                else if (blockId.includes("anvil")) {
                    player.setDynamicProperty("lastCraftTime", Date.now());
                    addSkillXP(player, "crafting", 3);
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in playerInteractWithBlock: ${error}`);
            }
        });
    }
    
    // Player Inventory Change - For crafting XP detection
    if (world.afterEvents.playerInventoryChange) {
        world.afterEvents.playerInventoryChange.subscribe((event) => {
            try {
                const { player, container, itemStack } = event;
                
                if (!player || !itemStack) {
                    return;
                }
                
                // Check if player recently used crafting table (within 5 seconds)
                const lastCraftTime = player.getDynamicProperty("lastCraftTime");
                const now = Date.now();
                
                if (lastCraftTime && (now - lastCraftTime) < 5000) {
                    // Player recently used crafting table - likely crafted this item
                    const itemId = itemStack.typeId.toLowerCase();
                    
                    // Only give XP for newly added items (not removed)
                    if (itemStack.amount > 0) {
                        // Workbenches and crafting tables
                        if (itemId.includes("crafting_table") || 
                            itemId.includes("workbench")) {
                            addSkillXP(player, "crafting", 15);
                        }
                        // Furnaces and smelting blocks
                        else if (itemId.includes("furnace") || 
                                 itemId.includes("blast_furnace") ||
                                 itemId.includes("smoker")) {
                            addSkillXP(player, "crafting", 10);
                        }
                        // Tools and weapons
                        else if (itemId.includes("pickaxe") || 
                                 itemId.includes("axe") ||
                                 itemId.includes("sword") ||
                                 itemId.includes("shovel") ||
                                 itemId.includes("hoe")) {
                            addSkillXP(player, "crafting", 5);
                        }
                        // Armor
                        else if (itemId.includes("helmet") || 
                                 itemId.includes("chestplate") ||
                                 itemId.includes("leggings") ||
                                 itemId.includes("boots")) {
                            addSkillXP(player, "crafting", 5);
                        }
                        // Other crafted items
                        else if (!itemId.includes("raw_") && 
                                 !itemId.includes("stone") &&
                                 !itemId.includes("dirt") &&
                                 !itemId.includes("cobble")) {
                            addSkillXP(player, "crafting", 2);
                        }
                        
                        // Reset craft time to prevent duplicate XP
                        player.setDynamicProperty("lastCraftTime", 0);
                    }
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in playerInventoryChange: ${error}`);
            }
        });
    }
    
    // Entity Item Drop - For quest tracking
    if (world.afterEvents.entityItemDrop) {
        world.afterEvents.entityItemDrop.subscribe((event) => {
            try {
                const { entity, itemStack } = event;
                
                // Check if entity and itemStack are valid
                if (!entity || !itemStack) {
                    return;
                }
                
                if (entity.typeId === "minecraft:player") {
                    // Track item drops for quests
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in entityItemDrop: ${error}`);
            }
        });
    }
    
    // Entity Hurt - For combat tracking & defense XP
    if (world.afterEvents.entityHurt) {
        world.afterEvents.entityHurt.subscribe((event) => {
            try {
                const { hurtEntity, damageSource, damage } = event;
                
                // Track damage taken for defense XP
                if (hurtEntity.typeId === "minecraft:player" && damage > 0) {
                    addSkillXP(hurtEntity, "defense", Math.floor(damage));
                }
                
                // Track archery XP for bow damage
                if (damageSource.cause === "projectile" &&
                    damageSource.damagingEntity?.typeId === "minecraft:player") {
                    addSkillXP(damageSource.damagingEntity, "archer", 5);
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in entityHurt: ${error}`);
            }
        });
    }
    
    // Entity Heal - For healing quests and support skills
    if (world.afterEvents.entityHeal) {
        world.afterEvents.entityHeal.subscribe((event) => {
            try {
                const { target, healAmount, cause } = event;
                
                if (!target || target.typeId !== "minecraft:player") {
                    return;
                }
                
                // Track healing received (for support skill when using potions/items on self)
                // cause can be: "effect", "saturation", "spell", "magic", "anvil", "wither", "starve", "freeze"
                if (cause === "effect" || cause === "saturation") {
                    // Self-healing from potions, regeneration effect, or food
                    // Give support XP for using healing items
                    addSkillXP(target, "support", Math.floor(healAmount / 2));
                }
                
                // Track healing done BY players (for support/healer skills)
                // Note: event.healer may not always be available
                if (event.healer && event.healer.typeId === "minecraft:player") {
                    // Give support XP to the healer (from splash potions, spells, etc.)
                    addSkillXP(event.healer, "support", Math.floor(healAmount));
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in entityHeal: ${error}`);
            }
        });
    }
    
    // Entity Death - For combat XP and quest tracking
    if (world.afterEvents.entityDie) {
        world.afterEvents.entityDie.subscribe((event) => {
            try {
                const { deadEntity, damageSource } = event;
                
                if (damageSource.damagingEntity?.typeId === "minecraft:player") {
                    const killer = damageSource.damagingEntity;
                    handleEntityKill(killer, deadEntity);
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in entityDie: ${error}`);
            }
        });
    }
}

// ============================================
// BLOCK EVENTS
// ============================================

function registerBlockEvents() {
    // Block Break - For mining/woodcutting XP and quests
    if (world.afterEvents.playerBreakBlock) {
        world.afterEvents.playerBreakBlock.subscribe((event) => {
            try {
                const { player, brokenBlockPermutation } = event;
                handleBlockBreak(player, brokenBlockPermutation);
            } catch (error) {
                console.warn(`[EventHandlers] Error in playerBreakBlock: ${error}`);
            }
        });
    }
    
    // Block Place - For building XP and quests
    if (world.afterEvents.playerPlaceBlock) {
        world.afterEvents.playerPlaceBlock.subscribe((event) => {
            try {
                const { player, block } = event;
                
                // Quest tracking
                handleBlockPlace(player, block);
                
                // Skills - Building XP
                const blockId = block.typeId.toLowerCase();
                
                // Stone/brick/concrete buildings
                if (blockId.includes("stone") ||
                    blockId.includes("brick") ||
                    blockId.includes("concrete") ||
                    blockId.includes("terracotta")) {
                    addSkillXP(player, "building", 2);
                }
                // Wood structures
                else if (blockId.includes("plank") ||
                         blockId.includes("log") ||
                         blockId.includes("wood")) {
                    addSkillXP(player, "building", 1);
                }
                // Decorative blocks
                else if (blockId.includes("wool") ||
                         blockId.includes("glass") ||
                         blockId.includes("quartz")) {
                    addSkillXP(player, "building", 1);
                }
            } catch (error) {
                console.warn(`[EventHandlers] Error in playerPlaceBlock: ${error}`);
            }
        });
    }
}

// ============================================
// PLAYER EVENTS
// ============================================

function registerPlayerEvents() {
    // Player exploration tracking
    const lastExplorePositions = new Map();
    const EXPLORE_DISTANCE_THRESHOLD = 5;
    
    system.runInterval(() => {
        try {
            for (const player of world.getAllPlayers()) {
                const playerId = player.id || player.name;
                const last = lastExplorePositions.get(playerId);
                const now = player.location;
                
                if (last) {
                    const dx = now.x - last.x;
                    const dz = now.z - last.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance >= EXPLORE_DISTANCE_THRESHOLD) {
                        handleExplore(player, distance);
                        addSkillXP(player, "explorer", Math.floor(distance / 5));
                    }
                }
                
                lastExplorePositions.set(playerId, { x: now.x, z: now.z });
            }
        } catch (error) {
            console.warn(`[EventHandlers] Error in explore tracking: ${error}`);
        }
    }, 20);
}
