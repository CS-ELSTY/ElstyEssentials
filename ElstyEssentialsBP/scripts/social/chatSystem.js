import { world, system } from "@minecraft/server";
import { getPlayerRank as getNewPlayerRank, getRankInfo } from "./ranks/rank.js";
import { guildSystem } from "./guildSystem.js";

// Konfigurasi Custom Chat
const CHAT_CONFIG = {
    // Format chat
    format: {
        enabled: true,
        colonColor: "§f",
        messageColor: "§f",
        uppercase: false,
    },
    
    // Anti-spam settings
    antiSpam: {
        enabled: true,
        cooldown: 1000,  // Milliseconds (1 detik)
        warningMessage: "§c§lPlease wait before sending another message!"
    },
    
    // Bad words filter (opsional)
    filter: {
        enabled: true,
        words: ["anjing", "asu", "kontol", "memek", "bajingan", "ngentot", "anj", "asw", "ajg", "tot", "tol", "su", "jing"],
        replacement: "***",
        warningMessage: "§c§lPlease watch your language!"
    }
};

// Tracker untuk anti-spam
const chatCooldowns = new Map();

// Inisialisasi Custom Chat System
export function initializeCustomChat() {
    // Subscribe ke chat event
    world.beforeEvents.chatSend.subscribe((event) => {
        // Skip jika message adalah command (! atau + atau /)
        if (event.message.startsWith("!") || event.message.startsWith("+") || event.message.startsWith("/")) {
            return; // Biarkan command handler yang menangani
        }
        
        handleCustomChat(event);
    });
    
    // Cleanup cooldowns setiap 30 detik
    system.runInterval(() => {
        cleanupCooldowns();
    }, 600);
    
    console.warn("Custom Chat System initialized");
}

// Handler untuk custom chat
function handleCustomChat(event) {
    try {
        const player = event.sender;
        const message = event.message;
        
        // Cancel original chat message
        event.cancel = true;
        
        // Anti-spam check
        if (CHAT_CONFIG.antiSpam.enabled) {
            if (isOnChatCooldown(player)) {
                player.sendMessage(CHAT_CONFIG.antiSpam.warningMessage);
                return;
            }
            setChatCooldown(player);
        }
        
        // Bad words filter
        let filteredMessage = message;
        if (CHAT_CONFIG.filter.enabled) {
            const filterResult = filterBadWords(message);
            if (filterResult.filtered) {
                player.sendMessage(CHAT_CONFIG.filter.warningMessage);
                filteredMessage = filterResult.message;
            }
        }
        
        // Get player rank dari rank system
        const rankData = getPlayerRankFromNewSystem(player);
        
        // Get player guild data
        const playerGuild = guildSystem.getPlayerGuild(player.name);
        
        // Build custom chat format: [rank] [clan] Nama : [message]
        let chatMessage = "";
        
        // [rank] - Add rank display
        if (rankData.display) {
            chatMessage += `${rankData.display} `;
        }
        
        // [clan] - Add clan prefix jika player punya clan
        if (playerGuild) {
            const memberData = playerGuild.members[player.name];
            const roleColor = getGuildRoleColor(memberData?.role || "member");
            chatMessage += `${roleColor} ${playerGuild.tag} `;
        }
        
        // Nama - Add player name dengan warna rank
        const playerName = CHAT_CONFIG.format.uppercase ?
            player.name.toUpperCase() :
            player.name;
        
        // : [message] - Add colon dan message
        chatMessage += `${rankData.color}${playerName}${CHAT_CONFIG.format.colonColor}: ${CHAT_CONFIG.format.messageColor}${filteredMessage}`;
        
        // Broadcast to all players
        world.sendMessage(chatMessage);
        
        console.warn(`[CHAT] [${rankData.name}] ${playerGuild ? `[${playerGuild.tag}] ` : ''}${player.name}: ${filteredMessage}`);
        
    } catch (error) {
        console.warn("Error in custom chat:", error);
        // Fallback: kirim pesan asli jika error
        world.sendMessage(`${event.sender.name}: ${event.message}`);
    }
}

// Helper function to get player rank from new system
function getPlayerRankFromNewSystem(player) {
    try {
        const rankTag = getNewPlayerRank(player);
        const rankInfo = getRankInfo(rankTag);
        
        if (rankInfo) {
            return {
                display: `${rankInfo.color}${rankInfo.prefix}`,  // Show only icon, no rank name
                color: rankInfo.color || "§7",
                name: rankTag
            };
        } else {
            return {
                display: "§7",  // No icon for default
                color: "§7",
                name: "default"
            };
        }
    } catch (error) {
        return {
            display: "§7",  // No icon for default
            color: "§7",
            name: "default"
        };
    }
}

// Helper function untuk mendapatkan warna role guild
function getGuildRoleColor(role) {
    const roleColors = {
        leader: "§c",
        officer: "§6", 
        member: "§a"
    };
    return roleColors[role] || "§7";
}

// Anti-spam cooldown functions
function setChatCooldown(player) {
    chatCooldowns.set(player.id, Date.now() + CHAT_CONFIG.antiSpam.cooldown);
}

function isOnChatCooldown(player) {
    const cooldown = chatCooldowns.get(player.id);
    if (!cooldown) return false;
    
    if (Date.now() >= cooldown) {
        chatCooldowns.delete(player.id);
        return false;
    }
    
    return true;
}

function cleanupCooldowns() {
    const now = Date.now();
    for (const [playerId, expiry] of chatCooldowns.entries()) {
        if (now >= expiry) {
            chatCooldowns.delete(playerId);
        }
    }
}

// Bad words filter
function filterBadWords(message) {
    if (!CHAT_CONFIG.filter.enabled) {
        return { filtered: false, message: message };
    }
    
    let filtered = false;
    let filteredMessage = message;
    
    for (const word of CHAT_CONFIG.filter.words) {
        // Create a regex that matches the exact word and common Indonesian slang extensions
        // but avoids matching inside other words
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
        
        // This pattern matches:
        // 1. The exact word
        // 2. The word with 1-3 'y's at the end (common in Indonesian slang)
        // 3. The word with common suffixes like 'ing', 'er', 'ed', 's'
        // 4. Ensures it's a word boundary before and after
        const regex = new RegExp(`\\b${escapedWord}(?:y{1,3})?\\b|\\b${escapedWord}(?:ing|er|ed|s)\\b`, 'gi');
        
        // Find all matches to determine if filtering is needed
        const matches = filteredMessage.match(regex);
        if (matches) {
            filtered = true;
            // Replace each match with asterisks of the same length
            filteredMessage = filteredMessage.replace(regex, (match) => '*'.repeat(match.length));
        }
    }
    
    return { filtered, message: filteredMessage };
}

// Export config untuk customization dari luar
export function getChatConfig() {
    return CHAT_CONFIG;
}

export function updateChatConfig(newConfig) {
    Object.assign(CHAT_CONFIG, newConfig);
}

// Get guild info for other systems
export function getGuild(player) {
    if (!player || !player.name) return { hasGuild: false, name: "", tag: "", role: "" };
    
    try {
        const guild = guildSystem.getPlayerGuild(player.name);
        if (guild) {
            const memberData = guild.members[player.name];
            return {
                hasGuild: true,
                name: guild.name,
                tag: guild.tag,
                role: memberData?.role || "member"
            };
        }
        return { hasGuild: false, name: "", tag: "", role: "" };
    } catch (e) {
        return { hasGuild: false, name: "", tag: "", role: "" };
    }
}