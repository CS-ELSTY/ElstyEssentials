import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { QUEST_DEFINITIONS, QUEST_TYPES, LAST_RESET_OBJECTIVE, QUEST_RESET_TIME } from "./questConfig.js";

// Helper untuk force show form
async function forceShowForm(player, form, timeout = 100) {
    const startTick = system.currentTick;
    while ((system.currentTick - startTick) < timeout) {
        const response = await form.show(player);
        if (response.cancelationReason !== "UserBusy") {
            return response;
        }
    }
    return { canceled: true, cancelationReason: "UserBusy" };
}

export function getPlayerQuests(player) {
    try {
        const questData = player.getDynamicProperty("quests");
        return questData ? JSON.parse(questData) : {};
    } catch (error) {
        console.warn(`Error getting quests: ${error}`);
        return {};
    }
}

export function setPlayerQuests(player, quests) {
    try {
        player.setDynamicProperty("quests", JSON.stringify(quests));
    } catch (error) {
        console.warn(`Error setting quests: ${error}`);
    }
}

export function getQuestProgress(player, questId) {
    const quests = getPlayerQuests(player);
    return quests[questId] || { progress: 0, completed: false, claimed: false };
}

export function updateQuestProgress(player, questId, progress) {
    const quests = getPlayerQuests(player);
    if (!quests[questId]) {
        quests[questId] = { progress: 0, completed: false, claimed: false };
    }
    
    // Cap progress at required amount
    const questDef = QUEST_DEFINITIONS[questId];
    quests[questId].progress = Math.min(progress, questDef.required);
    
    if (questDef && quests[questId].progress >= questDef.required && !quests[questId].completed) {
        quests[questId].completed = true;
        player.sendMessage(`§a§l✔ Quest Completed: §e${questDef.name}§a!`);
        player.sendMessage(`§7Use §b!quest §7to claim your reward!`);
        try {
            player.playSound("random.levelup");
        } catch (e) {}
    }
    
    setPlayerQuests(player, quests);
}

export function isNewDay() {
    const currentTime = world.getAbsoluteTime();
    const currentDay = Math.floor(currentTime / 24000);
    
    try {
        const objective = world.scoreboard.getObjective(LAST_RESET_OBJECTIVE);
        if (objective) {
            const lastReset = objective.getScore("global") || 0;
            return currentDay > lastReset;
        }
    } catch (error) {
        console.warn(`Error checking new day: ${error}`);
    }
    return true;
}

export function resetDailyQuests() {
    try {
        const currentTime = world.getAbsoluteTime();
        const currentDay = Math.floor(currentTime / 24000);
        
        const objective = world.scoreboard.getObjective(LAST_RESET_OBJECTIVE);
        if (objective) {
            objective.setScore("global", currentDay);
        }
        
        const players = world.getAllPlayers();
        for (const player of players) {
            const quests = getPlayerQuests(player);

            // Reset only daily quests (medium difficulty only)
            // Advance quests (hard difficulty) are not reset daily
            for (const questId in QUEST_DEFINITIONS) {
                const questDef = QUEST_DEFINITIONS[questId];
                if (questDef.difficulty === "medium") {
                    delete quests[questId];
                }
            }

            setPlayerQuests(player, quests);
            player.sendMessage("§6§l⏰ Daily Quests Reset! §eQuest baru telah tersedia!");
        }
        
        console.warn("[Quest] Daily quests reset completed");
    } catch (error) {
        console.warn(`Error resetting daily quests: ${error}`);
    }
}

export async function openQuestMenu(player) {
    try {
        const form = new ActionFormData()
            .title("§6§lQUEST SYSTEM")
            .body("§ePilih kategori quest yang ingin dilihat:");

        form.button("§a§lBeginner Quests\n§7Quest mudah untuk pemula", "textures/items/book_normal");
        form.button("§b§lDaily Quests\n§7Quest harian dengan reward menarik", "textures/items/clock_item");
        form.button("§c§lAdvanced Quests\n§7Quest sulit dengan reward hebat", "textures/items/diamond");
        form.button("§e§lMy Progress\n§7Lihat progress semua quest", "textures/items/paper");
        form.button("§8§lClose", "textures/ui/cancel");

        const res = await forceShowForm(player, form);
        if (res.canceled) return;

        switch (res.selection) {
            case 0:
                system.runTimeout(() => openQuestCategory(player, "easy"), 5);
                break;
            case 1:
                system.runTimeout(() => openQuestCategory(player, "medium"), 5);
                break;
            case 2:
                system.runTimeout(() => openQuestCategory(player, "hard"), 5);
                break;
            case 3:
                // Panggil openProgressMenu secara langsung karena sekarang diexport dengan benar
                system.runTimeout(() => openProgressMenu(player), 5);
                break;
        }
    } catch (error) {
        console.warn(`Error opening quest menu: ${error}`);
        player.sendMessage("§cError opening quest menu");
    }
}

async function openQuestCategory(player, difficulty) {
    try {
        const quests = Object.values(QUEST_DEFINITIONS).filter(q => q.difficulty === difficulty);
        const difficultyName = difficulty === "easy" ? "§aBeginner" : difficulty === "medium" ? "§bDaily" : "§cAdvanced";
        
        const form = new ActionFormData()
            .title(`${difficultyName} §6Quests`)
            .body("§ePilih quest untuk melihat detail:");

        quests.forEach(quest => {
            const progress = getQuestProgress(player, quest.id);
            const status = progress.claimed ? "§6✓" : progress.completed ? "§a✓" : "§7○";
            const progressText = `${progress.progress}/${quest.required}`;
            
            form.button(
                `${status} §e${quest.name}\n§7${progressText} - ${quest.description}`, 
                "textures/items/paper"
            );
        });

        form.button("§8§lBack", "textures/ui/cancel");

        const res = await forceShowForm(player, form);
        if (res.canceled) return;
        
        if (res.selection === quests.length) {
            system.runTimeout(() => openQuestMenu(player), 5);
            return;
        }
        
        const selectedQuest = quests[res.selection];
        system.runTimeout(() => showQuestDetail(player, selectedQuest), 5);
    } catch (error) {
        console.warn(`Error opening quest category: ${error}`);
    }
}

async function showQuestDetail(player, quest) {
    try {
        const progress = getQuestProgress(player, quest.id);
        const progressText = `${progress.progress}/${quest.required}`;
        const percentage = Math.floor((progress.progress / quest.required) * 100);
        
        let statusText;
        if (progress.claimed) {
            statusText = "§6Reward Claimed";
        } else if (progress.completed) {
            statusText = "§aCompleted - Claim Reward!";
        } else {
            statusText = `§7In Progress (${percentage}%)`;
        }
        
        // Build reward text
        let rewardText = `§eReward: §b${quest.reward_xp} XP`;
        
        if (quest.reward_money) {
            rewardText += ` §7+ §2$${quest.reward_money}`;
        }
        
        if (quest.reward_items && quest.reward_items.length > 0) {
            rewardText += "\n§eItems: ";
            quest.reward_items.forEach((item, index) => {
                const itemName = item.item.replace("minecraft:", "");
                rewardText += `§b${item.count}x ${itemName}`;
                if (index < quest.reward_items.length - 1) rewardText += ", ";
            });
        }
        
        const form = new ActionFormData()
            .title(`§6${quest.name}`)
            .body(
                `§7${quest.description}\n\n` +
                `§eProgress: §b${progressText}\n` +
                `§eStatus: ${statusText}\n\n` +
                `${rewardText}`
            );

        if (progress.completed && !progress.claimed) {
            form.button("§a§lClaim Reward", "textures/items/emerald");
        }
        
        form.button("§8§lBack", "textures/ui/cancel");

        const res = await forceShowForm(player, form);
        if (res.canceled) return;
        
        if (res.selection === 0 && progress.completed && !progress.claimed) {
            claimQuestReward(player, quest);
        } else {
            system.runTimeout(() => openQuestCategory(player, quest.difficulty), 5);
        }
    } catch (error) {
        console.warn(`Error showing quest detail: ${error}`);
    }
}

function claimQuestReward(player, quest) {
    try {
        const quests = getPlayerQuests(player);
        if (!quests[quest.id] || !quests[quest.id].completed || quests[quest.id].claimed) {
            player.sendMessage("§c§lQuest belum selesai atau reward sudah diklaim!");
            return;
        }
        
        // Give XP
        player.addExperience(quest.reward_xp);
        
        // Give Money
        if (quest.reward_money && quest.reward_money > 0) {
            try {
                player.runCommand(`scoreboard players add @s money ${quest.reward_money}`);
            } catch (error) {
                console.warn(`Error giving money: ${error}`);
            }
        }
        
        // Give items
        if (quest.reward_items && quest.reward_items.length > 0) {
            const inventory = player.getComponent("inventory");
            
            quest.reward_items.forEach(reward => {
                try {
                    const item = new ItemStack(reward.item, reward.count);
                    if (inventory && inventory.container) {
                        inventory.container.addItem(item);
                    }
                } catch (error) {
                    console.warn(`Error giving item ${reward.item}: ${error}`);
                    // Fallback: try give command
                    try {
                        player.runCommand(`give @s ${reward.item} ${reward.count}`);
                    } catch (cmdError) {
                        console.warn(`Command fallback failed: ${cmdError}`);
                    }
                }
            });
        }
        
        // Mark as claimed
        quests[quest.id].claimed = true;
        setPlayerQuests(player, quests);
        
        // Build reward message
        let rewardMessage = `§a§l✔ Reward Claimed! §e+${quest.reward_xp} XP`;
        if (quest.reward_money) {
            rewardMessage += ` §2+$${quest.reward_money}`;
        }
        
        player.sendMessage(rewardMessage);
        try {
            player.playSound("random.orb");
            player.runCommand(`particle minecraft:totem_particle ~~~`);
        } catch (e) {}
        
    } catch (error) {
        console.warn(`Error claiming reward: ${error}`);
        player.sendMessage("§cError claiming reward!");
    }
}

export async function openProgressMenu(player) {
    try {
        const allQuests = Object.values(QUEST_DEFINITIONS);
        let progressText = "§6§lQuest Progress Summary:\n\n";

        let completedCount = 0;
        let claimedCount = 0;
        let totalCount = allQuests.length;
        let totalEarnedMoney = 0;
        let totalEarnedXP = 0;

        ["easy", "medium", "hard"].forEach(difficulty => {
            const difficultyName = difficulty === "easy" ? "§aBeginner" : difficulty === "medium" ? "§bDaily" : "§cAdvanced";
            progressText += `${difficultyName} §6Quests:\n`;

            const categoryQuests = allQuests.filter(q => q.difficulty === difficulty);
            categoryQuests.forEach(quest => {
                const progress = getQuestProgress(player, quest.id);
                let status;
                if (progress.claimed) {
                    status = "§6✓";
                    claimedCount++;
                } else if (progress.completed) {
                    status = "§a✓";
                } else {
                    status = "§7○";
                }

                const progressBar = `${progress.progress}/${quest.required}`;

                // Calculate earned rewards
                if (progress.claimed) {
                    totalEarnedXP += quest.reward_xp;
                    if (quest.reward_money) {
                        totalEarnedMoney += quest.reward_money;
                    }
                }

                progressText += `${status} §e${quest.name} §7${progressBar}\n`;

                if (progress.completed) completedCount++;
            });
            progressText += "\n";
        });

        progressText += `§6━━━━━━━━━━━━━━━━━━━━\n`;
        progressText += `§eCompleted: §a${completedCount}§7/${totalCount}\n`;
        progressText += `§eClaimed: §6${claimedCount}§7/${totalCount}\n`;
        progressText += `§2Total Money Earned: §a$${totalEarnedMoney}\n`;
        progressText += `§bTotal XP Earned: §a${totalEarnedXP}`;

        const form = new ActionFormData()
            .title("§6§lMy Quest Progress")
            .body(progressText);
        form.button("§8§lClose", "textures/ui/cancel");
        form.button("§6§lBack to Menu", "textures/ui/arrow_left");

        const res = await forceShowForm(player, form);
        if (res.canceled) return;

        if (res.selection === 1) {
            system.runTimeout(() => openQuestMenu(player), 5);
        }
    } catch (error) {
        console.warn(`Error opening progress menu: ${error}`);
        player.sendMessage("§cError opening progress menu");
    }
}

export function handleItemCollection(player, item) {
    try {
        if (!player || !item) return;

        const itemId = item.typeId;
        const amount = item.amount || 1;

        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.type === QUEST_TYPES.COLLECT) {
                let matches = false;

                if (quest.target && quest.target === itemId) {
                    matches = true;
                } else if (quest.targetAny && Array.isArray(quest.targetAny) && quest.targetAny.includes(itemId)) {
                    matches = true;
                }

                if (matches) {
                    const progress = getQuestProgress(player, questId);
                    if (!progress.completed) {
                        updateQuestProgress(player, questId, progress.progress + amount);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling item collection: ${error}`);
    }
}

export function handleEntityKill(player, entity) {
    try {
        const entityId = entity.typeId;
        
        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.type === QUEST_TYPES.KILL) {
                let matches = false;
                
                if (quest.target && quest.target === entityId) {
                    matches = true;
                } else if (quest.targetAny && Array.isArray(quest.targetAny) && quest.targetAny.includes(entityId)) {
                    matches = true;
                }
                
                if (matches) {
                    const progress = getQuestProgress(player, questId);
                    if (!progress.completed) {
                        updateQuestProgress(player, questId, progress.progress + 1);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling entity kill: ${error}`);
    }
}

export function handleItemCraft(player, item) {
    try {
        const itemId = item.typeId;

        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.type === QUEST_TYPES.CRAFT) {
                let matches = false;

                // Check single target
                if (quest.target && quest.target === itemId) {
                    matches = true;
                }
                // Check targets array (for multi-item craft quests)
                else if (quest.targets && Array.isArray(quest.targets) && quest.targets.includes(itemId)) {
                    matches = true;
                }
                // Check targetAny array
                else if (quest.targetAny && Array.isArray(quest.targetAny) && quest.targetAny.includes(itemId)) {
                    matches = true;
                }

                if (matches) {
                    const progress = getQuestProgress(player, questId);
                    if (!progress.completed) {
                        updateQuestProgress(player, questId, progress.progress + item.amount);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling item craft: ${error}`);
    }
}

export function handleBlockBreak(player, blockOrPermutation) {
    try {
        let blockId;

        // Try multiple ways to get block ID
        if (blockOrPermutation.type && blockOrPermutation.type.id) {
            blockId = blockOrPermutation.type.id;
        } else if (blockOrPermutation.typeId) {
            blockId = blockOrPermutation.typeId;
        } else if (blockOrPermutation.block && blockOrPermutation.block.type && blockOrPermutation.block.type.id) {
            blockId = blockOrPermutation.block.type.id;
        } else if (typeof blockOrPermutation === 'string') {
            blockId = blockOrPermutation;
        } else {
            return;
        }

        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.type === QUEST_TYPES.MINE) {
                let matches = false;

                // Check single target
                if (quest.target && quest.target === blockId) {
                    matches = true;
                }
                // Check targetAny array
                else if (quest.targetAny && Array.isArray(quest.targetAny) && quest.targetAny.includes(blockId)) {
                    matches = true;
                }
                // Check targets array (for multi-block mining quests)
                else if (quest.targets && Array.isArray(quest.targets) && quest.targets.includes(blockId)) {
                    matches = true;
                }

                if (matches) {
                    const progress = getQuestProgress(player, questId);
                    if (!progress.completed) {
                        updateQuestProgress(player, questId, progress.progress + 1);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling block break: ${error}`);
    }
}

export function handleBlockPlace(player, block) {
    try {
        let blockId;

        // Try multiple ways to get block ID
        if (block.typeId) {
            blockId = block.typeId;
        } else if (block.type && block.type.id) {
            blockId = block.type.id;
        } else if (block.permutation && block.permutation.type && block.permutation.type.id) {
            blockId = block.permutation.type.id;
        } else if (typeof block === 'string') {
            blockId = block;
        } else {
            return;
        }

        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.type === QUEST_TYPES.BUILD) {
                let matches = false;

                if (quest.target && quest.target === blockId) {
                    matches = true;
                } else if (quest.targetAny && Array.isArray(quest.targetAny) && quest.targetAny.includes(blockId)) {
                    matches = true;
                }

                if (matches) {
                    const progress = getQuestProgress(player, questId);
                    if (!progress.completed) {
                        updateQuestProgress(player, questId, progress.progress + 1);
                    }
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling block place: ${error}`);
    }
}

export function handleExplore(player, distance) {
    try {
        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.type === QUEST_TYPES.EXPLORE) {
                const progress = getQuestProgress(player, questId);
                if (!progress.completed) {
                    // Update progress dengan jarak yang ditempuh
                    updateQuestProgress(player, questId, progress.progress + distance);
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling exploration: ${error}`);
    }
}

export function handleVillagerTrade(player) {
    try {
        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.target === "villager_trade") {
                const progress = getQuestProgress(player, questId);
                if (!progress.completed) {
                    updateQuestProgress(player, questId, progress.progress + 1);
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling villager trade: ${error}`);
    }
}

export function handleTreasureChest(player) {
    try {
        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.target === "treasure_chest") {
                const progress = getQuestProgress(player, questId);
                if (!progress.completed) {
                    updateQuestProgress(player, questId, progress.progress + 1);
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling treasure chest: ${error}`);
    }
}

export function handleEnchant(player) {
    try {
        for (const questId in QUEST_DEFINITIONS) {
            const quest = QUEST_DEFINITIONS[questId];
            if (quest.target === "enchanted_item") {
                const progress = getQuestProgress(player, questId);
                if (!progress.completed) {
                    updateQuestProgress(player, questId, progress.progress + 1);
                }
            }
        }
    } catch (error) {
        console.warn(`Error handling enchant: ${error}`);
    }
}

// Initialize Quest System
export function initializeQuestSystem() {
    // Create scoreboard objective for daily reset tracking
    try {
        world.scoreboard.addObjective(LAST_RESET_OBJECTIVE, "Quest Last Reset");
    } catch (error) {
        // Objective already exists
    }

    // Check for daily reset every minute
    system.runInterval(() => {
        if (isNewDay()) {
            resetDailyQuests();
        }
    }, 1200); // Check every minute (1200 ticks)

    console.warn("[Quest] Quest System initialized");
}