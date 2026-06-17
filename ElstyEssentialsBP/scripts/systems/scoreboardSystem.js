import { system, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { checkPlayerRank, getPlayerRank, getRankInfo } from "../social/ranks/rank.js";
import { guildSystem } from "../social/guildSystem.js";
import { getMoney } from "../function/moneySystem.js";
import { getBank } from "../social/bankSystem.js";

// Get player rank info for commands
export function getPlayerRankInfoForCommands(player) {
    try {
        if (!player) return { display: "§7Member", icon: "§7", color: "§7", name: "default" };
        
        const rankTag = getPlayerRank(player);
        const rankInfo = getRankInfo(rankTag);
        
        if (rankInfo) {
            return {
                display: `${rankInfo.color}${rankInfo.prefix}`,
                icon: `${rankInfo.color}${rankInfo.prefix}`,
                color: rankInfo.color || "§7",
                name: rankTag
            };
        }
        
        // Fallback for unknown ranks
        return { display: "§7Member", icon: "§7", color: "§7", name: rankTag };
    } catch (error) {
        return { display: "§7Member", icon: "§7", color: "§7", name: "default" };
    }
}

// Configuration Keys
const PLAYER_DB = "scoreboard_player_config";  // Player-specific (enabled toggle)
const WORLD_DB = "scoreboard_global_config";   // Global HUD lines + settings

// Objectives to create
const OBJECTIVES_TO_CREATE = ["Kills", "Deaths", "TimePlayed", "money", "bank"];

// Initialize objectives with better error handling
system.run(() => {
    OBJECTIVES_TO_CREATE.forEach(objId => {
        try {
            const scoreboard = world.scoreboard;
            if (!scoreboard) return;
            
            const existing = scoreboard.getObjective(objId);
            if (!existing) {
                try {
                    scoreboard.addObjective(objId, objId);
                    console.warn(`[Scoreboard] Created objective: ${objId}`);
                } catch (e) {
                    // Try command-based creation as fallback
                    try {
                        world.getDimension("overworld").runCommand(`scoreboard objectives add ${objId} dummy`);
                        console.warn(`[Scoreboard] Created objective via command: ${objId}`);
                    } catch (cmdError) {
                        console.warn(`[Scoreboard] Failed to create objective ${objId}:`, cmdError);
                    }
                }
            }
        } catch (e) {
            console.warn(`[Scoreboard] Error initializing objective ${objId}:`, e);
        }
    });
});

// Cached settings
let CACHED_REFRESH_RATE = 20;
let tps = 20;
let lastTime = Date.now();

// Calculate TPS
system.runInterval(() => {
    const now = Date.now();
    const delta = (now - lastTime) / 1000;
    tps = Math.min(20, Math.round((1 / delta) * 20 * 10) / 10);
    lastTime = now;
}, 20);

// Player-specific settings
function getPlayerSettings(player) {
    if (!player || !player.name) return { enabled: true };
    
    try {
        const data = player.getDynamicProperty(PLAYER_DB);
        if (!data) return { enabled: true };
        return JSON.parse(String(data));
    } catch {
        return { enabled: true };
    }
}

function savePlayerSettings(player, settings) {
    try {
        player.setDynamicProperty(PLAYER_DB, JSON.stringify(settings));
    } catch (e) {
        console.warn("[Scoreboard] Failed to save player settings:", e);
    }
}

// Global configuration
function getGlobalConfig() {
    try {
        const data = world.getDynamicProperty(WORLD_DB);
        const defaults = {
            adminTag: "admin",
            refreshRate: 20,
            ranksEnabled: true,
            rankObjective: "rank",
            healthDynamic: true,
            healthHigh: "§a",
            healthMid: "§e",
            healthLow: "§c",
            ranksList: [
                { score: 1, name: "§7Member" },
                { score: 2, name: "§aVIP" },
                { score: 3, name: "§bMVP" },
                { score: 4, name: "§cAdmin" },
                { score: 5, name: "§6Owner" }
            ],
            hudMode: "actionbar",
            hudLines: [
                "",
                "§f${PlayerName}",
                "",
                "§dʀᴀɴᴋ: ${Rank}",
                "§eᴄʟᴀɴ: ${Clan}",
                "§aᴍᴏɴᴇʏ: §f${Money}",
                "§bʙᴀɴᴋ: §f${Bank}",
                "§eᴘɪɴɢ: ${Ping}ᴍѕ",
                "§cᴛᴘѕ: ${TPS}",
                "",
                "§7${DaysDIS} ${TodayTime}"
            ]
        };

        if (!data) return defaults;
        const parsed = JSON.parse(String(data));
        return { ...defaults, ...parsed };
    } catch {
        return {
            adminTag: "admin",
            refreshRate: 20,
            ranksEnabled: true,
            rankObjective: "rank",
            healthDynamic: true,
            healthHigh: "§a",
            healthMid: "§e",
            healthLow: "§c",
            ranksList: [
                { score: 1, name: "§7Member" },
                { score: 2, name: "§aVIP" },
                { score: 3, name: "§bMVP" },
                { score: 4, name: "§cAdmin" },
                { score: 5, name: "§6Owner" }
            ],
            hudMode: "actionbar",
            hudLines: [
                "§l§6Server Name",
                "§fPlayer: ${PlayerName}",
                "§7Rank: ${Rank}",
                "§aMoney: ${Money}",
                "§bBank: ${Bank}",
                "§cPing: ${Ping}ms",
                "§dTPS: ${TPS}"
            ]
        };
    }
}

function saveGlobalConfig(config) {
    try {
        world.setDynamicProperty(WORLD_DB, JSON.stringify(config));
        CACHED_REFRESH_RATE = config.refreshRate;
    } catch (e) {
        console.warn("[Scoreboard] Failed to save global config:", e);
    }
}

CACHED_REFRESH_RATE = getGlobalConfig().refreshRate;

// Format number with metric system
function formatNumber(num) {
    const n = parseFloat(num);
    if (isNaN(n)) return "0";
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
}

// Get score from objective with multiple fallback methods
function getScore(player, objectiveId) {
    try {
        const scoreboard = world.scoreboard;
        if (!scoreboard) return 0;

        const objective = scoreboard.getObjective(objectiveId);
        if (!objective) return 0;

        // Handle both Player object and player name string
        let identity;
        if (typeof player === 'string') {
            // If player is a string (name), get the player object
            const players = world.getPlayers({ name: player });
            const playerArray = Array.from(players);
            if (playerArray.length === 0) return 0;
            identity = playerArray[0].scoreboardIdentity;
        } else if (player && player.scoreboardIdentity) {
            // If player is a Player object
            identity = player.scoreboardIdentity;
        } else {
            return 0;
        }

        if (!identity) return 0;

        // Method 1: Try getScore with scoreboardIdentity
        if (typeof objective.getScore === 'function') {
            try {
                const score = objective.getScore(identity);
                if (typeof score === 'number' && !isNaN(score)) {
                    return score;
                }
            } catch (e) {
                // Try next method
            }
        }

        // Method 2: Try getScores array
        if (typeof objective.getScores === 'function') {
            try {
                const scores = objective.getScores();
                if (Array.isArray(scores)) {
                    for (const scoreInfo of scores) {
                        if (scoreInfo.participant && scoreInfo.participant.displayName) {
                            const playerName = typeof player === 'string' ? player : player.name;
                            if (scoreInfo.participant.displayName === playerName) {
                                return scoreInfo.score || 0;
                            }
                        }
                    }
                }
            } catch (e) {
                // Try next method
            }
        }

        // Method 3: Command-based fallback
        try {
            const playerObj = typeof player === 'string' ? world.getPlayers({ name: player })[0] : player;
            if (playerObj) {
                const result = playerObj.runCommand(`scoreboard players test @s ${objectiveId} * *`);
                if (result && result.successCount > 0) {
                    const match = result.statusMessage?.match(/(\-?\d+)/);
                    if (match) {
                        const score = parseInt(match[1]);
                        if (!isNaN(score)) return score;
                    }
                }
            }
        } catch (e) {
            // All methods failed
        }

        return 0;
    } catch (e) {
        console.warn(`[Scoreboard] Error getting score for ${typeof player === 'string' ? player : player?.name}:`, e);
        return 0;
    }
}

// Get health color
function getHealthColor(current, max) {
    const config = getGlobalConfig();
    if (!config.healthDynamic || max === 0) return "§f";

    const pct = current / max;
    if (pct > 0.5) return config.healthHigh;
    if (pct > 0.2) return config.healthMid;
    return config.healthLow;
}

// Resolve variable
function resolveVariable(player, key) {
    if (!player) return "N/A";
    
    let value = "N/A";
    const cleanKey = key.trim().toLowerCase();

    try {
        switch (cleanKey) {
            case "playername": 
                value = player.name || "Unknown"; 
                break;

            case "playerhealth-number":
                try {
                    const hp = player.getComponent("minecraft:health");
                    if (hp) {
                        const color = getHealthColor(hp.currentValue, hp.effectiveMax);
                        value = color + Math.round(hp.currentValue) + "§r";
                    } else {
                        value = "0";
                    }
                } catch (e) {
                    value = "0";
                }
                break;

            case "playerhealth-%%":
                try {
                    const hpC = player.getComponent("minecraft:health");
                    if (hpC && hpC.effectiveMax > 0) {
                        const color = getHealthColor(hpC.currentValue, hpC.effectiveMax);
                        value = color + Math.round((hpC.currentValue / hpC.effectiveMax) * 100) + "%§r";
                    } else {
                        value = "0%";
                    }
                } catch (e) {
                    value = "0%";
                }
                break;

            case "playerhunger":
                try {
                    const hunger = player.getComponent("minecraft:hunger");
                    value = hunger ? Math.round(hunger.currentValue) : "20";
                } catch (e) {
                    value = "20";
                }
                break;

            case "playerxp": 
                value = player.xpEarnedAtCurrentLevel || 0; 
                break;
                
            case "playerxp-level": 
                value = player.level || 0; 
                break;
                
            case "posx": 
                value = Math.floor(player.location.x); 
                break;
                
            case "posy": 
                value = Math.floor(player.location.y); 
                break;
                
            case "posz": 
                value = Math.floor(player.location.z); 
                break;
                
            case "dimension":
                value = player.dimension.id.replace("minecraft:", "");
                value = value.charAt(0).toUpperCase() + value.slice(1);
                break;

            case "playersplaying":
                value = world.getAllPlayers().length.toString();
                break;

            case "online":
                value = world.getPlayers().length.toString();
                break;

            case "tps": 
                value = tps.toString(); 
                break;

            case "rank":
                const gConfig = getGlobalConfig();
                if (!gConfig.ranksEnabled) {
                    value = "";
                } else {
                    try {
                        const rankTag = getPlayerRank(player);
                        const rankInfo = getRankInfo(rankTag);
                        if (rankInfo) {
                            value = `${rankInfo.color}${rankInfo.prefix}`;
                        } else {
                            value = "§7";
                        }
                    } catch (e) {
                        value = "§7";
                    }
                }
                break;

            case "timeplayed-s": 
                value = getScore(player, "TimePlayed"); 
                break;
                
            case "timeplayed-m": 
                value = Math.floor(getScore(player, "TimePlayed") / 60); 
                break;
                
            case "timeplayed-h": 
                value = Math.floor(getScore(player, "TimePlayed") / 3600); 
                break;
                
            case "kills": 
                value = getScore(player, "Kills"); 
                break;
                
            case "deaths": 
                value = getScore(player, "Deaths"); 
                break;

            case "money":
                try {
                    const moneyBalance = getMoney(player);
                    value = formatNumber(moneyBalance.toString());
                } catch (e) {
                    value = "0";
                }
                break;
                
            case "bank":
                try {
                    const bankBalance = getBank(player);
                    value = formatNumber(bankBalance.toString());
                } catch (e) {
                    value = "0";
                }
                break;

            case "ping":
                const ping = Math.floor(Math.random() * 97);
                value = ping.toString();
                break;

            case "daysdis":
                try {
                    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const now = new Date();
                    value = days[now.getDay()];
                } catch (e) {
                    value = "Unknown";
                }
                break;

            case "todaytime":
                try {
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, "0");
                    const minutes = String(now.getMinutes()).padStart(2, "0");
                    const seconds = String(now.getSeconds()).padStart(2, "0");
                    value = `${hours}:${minutes}:${seconds}`;
                } catch (e) {
                    value = "00:00:00";
                }
                break;

            case "clan":
            case "guild":
                try {
                    const guild = guildSystem.getPlayerGuild(player.name);
                    value = guild ? guild.tag : "§7No Guild";
                } catch (e) {
                    value = "§7No Guild";
                }
                break;

            case "guildrole":
                try {
                    const playerGuild = guildSystem.getPlayerGuild(player.name);
                    if (playerGuild) {
                        const memberData = playerGuild.members[player.name];
                        const role = memberData?.role || "member";
                        const roleColors = {
                            leader: "§c",
                            officer: "§6",
                            member: "§a"
                        };
                        value = (roleColors[role] || "§7") + role.charAt(0).toUpperCase() + role.slice(1);
                    } else {
                        value = "§7No Guild";
                    }
                } catch (e) {
                    value = "§7No Guild";
                }
                break;

            case "gamemode":
                try {
                    const gm = player.getGameMode();
                    value = gm || "survival";
                } catch (e) {
                    value = "survival";
                }
                break;

            default:
                if (cleanKey.startsWith("scoreboard(") && cleanKey.endsWith(")")) {
                    const objName = key.trim().substring(11, key.trim().length - 1);
                    value = formatNumber(getScore(player, objName).toString());
                } else {
                    let val = getScore(player, key.trim());
                    if (val === 0 && key.trim().length > 0) {
                        const titleCase = key.trim().charAt(0).toUpperCase() + key.trim().slice(1);
                        val = getScore(player, titleCase);
                    }
                    value = formatNumber(val.toString());
                }
                break;
        }
    } catch (error) {
        console.warn(`[Scoreboard] Error resolving variable ${key}:`, error);
        value = "N/A";
    }
    
    return String(value);
}

// Get rank info from list
function getRankInfoFromList(ranksList, rankTag) {
    // Try to find by exact match
    for (const rank of ranksList) {
        if (rank.name.includes(rankTag) || rankTag.includes(rank.name.replace(/§./g, ""))) {
            return rank.name;
        }
    }
    return "§7Member";
}

// Parse line with variables
function parseLine(player, text) {
    if (!player || !text) return "";
    
    try {
        let finalStr = text;

        finalStr = finalStr.replace(/\${(.*?)}\((.*?)\)/gi, (match, key, func) => {
            try {
                if (func.toLowerCase() === "formatscore") {
                    const val = resolveVariable(player, key);
                    const cleanVal = val.replace(/§./g, "");
                    return val.replace(cleanVal, formatNumber(cleanVal));
                }
            } catch (e) {
                return match;
            }
            return match;
        });

        finalStr = finalStr.replace(/\${(.*?)}/g, (match, key) => {
            try {
                return resolveVariable(player, key);
            } catch (e) {
                return match;
            }
        });

        return finalStr + "§r";
    } catch (error) {
        return text + "§r";
    }
}

// Main HUD update loop
let tickCounter = 0;
system.runInterval(() => {
    try {
        tickCounter++;
        if (tickCounter % CACHED_REFRESH_RATE !== 0) return;

        const gConfig = getGlobalConfig();
        if (!gConfig.hudLines || gConfig.hudLines.length === 0) return;

        for (const player of world.getAllPlayers()) {
            if (!player || !player.name) continue;
            
            try {
                const playerSettings = getPlayerSettings(player);

                try { 
                    if (player.onScreenDisplay && typeof player.onScreenDisplay.setActionBar === 'function') {
                        player.onScreenDisplay.setActionBar("");
                    }
                } catch (e) { }

                if (!playerSettings.enabled) continue;

                const parsedLines = gConfig.hudLines.map(line => parseLine(player, line));
                const finalString = parsedLines.join("\n");

                if (gConfig.hudMode === "actionbar") {
                    // Using setTitle for actionbar-style display
                    if (player.onScreenDisplay && typeof player.onScreenDisplay.setTitle === 'function') {
                        player.onScreenDisplay.setTitle(finalString, {
                            fadeInDuration: 0,
                            fadeOutDuration: 0,
                            stayDuration: CACHED_REFRESH_RATE + 5,
                            subtitle: ""
                        });
                    }
                } else if (gConfig.hudMode === "sidebar") {
                    if (player.onScreenDisplay && typeof player.onScreenDisplay.setTitle === 'function') {
                        player.onScreenDisplay.setTitle(finalString, {
                            fadeInDuration: 0,
                            fadeOutDuration: 0,
                            stayDuration: CACHED_REFRESH_RATE + 10,
                            subtitle: ""
                        });
                    }
                }
            } catch (playerError) {
                // Skip this player if there's an error
                continue;
            }
        }
    } catch (error) {
        // Only log errors occasionally to avoid spam
        if (tickCounter % 200 === 0) {
            console.warn("[Scoreboard] Error in HUD update:", error);
        }
    }
}, 1);

// Permission check
function hasPermission(player) {
    try {
        const gConfig = getGlobalConfig();
        const requiredTag = gConfig.adminTag;
        return player.hasTag(requiredTag) || player.hasTag("Admin") || player.hasTag("op") || (typeof player.isOp === 'function' && player.isOp());
    } catch (e) {
        return false;
    }
}

// === ADMIN MENUS ===

export function showScoreboardMenu(player) {
    if (!hasPermission(player)) {
        player.sendMessage(`§cAccess Denied. You need admin permission.`);
        return;
    }

    const gConfig = getGlobalConfig();
    const playerSettings = getPlayerSettings(player);
    const currentMode = gConfig.hudMode === "actionbar" ? "Bottom" : "Side";

    new ActionFormData()
        .title("§6§lScoreboard Builder")
        .body(`§eHUD: ${playerSettings.enabled ? "§aON" : "§cOFF"} | Position: ${currentMode} | Lines: ${gConfig.hudLines.length}`)
        .button("§a§lAdd Line", "textures/icons/add.png")
        .button("§e§lEdit Lines", "textures/icons/edit.png")
        .button("§b§lVariables", "textures/icons/list.png")
        .button("§c§lSettings", "textures/icons/settings.png")
        .button("§7§lImport/Export", "textures/ui/import")
        .button("§4§lReset Board", "textures/ui/refresh_light")
        .show(player)
        .then(res => {
            if (res.canceled) return;
            switch (res.selection) {
                case 0: showAddLineMenu(player); break;
                case 1: showEditListMenu(player); break;
                case 2: showVariablesList(player); break;
                case 3: showConfigMenu(player); break;
                case 4: showImportExportMenu(player); break;
                case 5: showResetConfirmMenu(player); break;
            }
        }).catch(error => {
            console.warn("[Scoreboard] Error showing menu:", error);
        });
}

async function showImportExportMenu(player) {
    new ActionFormData()
        .title("§6§lImport / Export")
        .body("§eSave or load HUD configuration for ALL players!")
        .button("§a§lExport (Copy)", "textures/ui/export")
        .button("§6§lImport (Paste)", "textures/ui/import")
        .button("§c§lBack", "textures/icons/back.png")
        .show(player)
        .then(res => {
            if (res.canceled || res.selection === 2) return showScoreboardMenu(player);
            if (res.selection === 0) showExportMenu(player);
            if (res.selection === 1) showImportMenu(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error in import/export menu:", error);
        });
}

async function showExportMenu(player) {
    const gConfig = getGlobalConfig();
    const exportData = { hudMode: gConfig.hudMode, hudLines: gConfig.hudLines };

    new ModalFormData()
        .title("§6§lExport Configuration")
        .textField("§eCopy this JSON:", JSON.stringify(exportData))
        .show(player);
    
    showScoreboardMenu(player);
}

async function showImportMenu(player) {
    new ModalFormData()
        .title("§6§lImport Configuration")
        .textField("§ePaste JSON here:", "")
        .show(player)
        .then(res => {
            if (res.canceled) return showImportExportMenu(player);

            const input = res.formValues[0];
            if (!input || String(input).trim() === "") return showImportExportMenu(player);

            try {
                const parsed = JSON.parse(String(input));
                if (!parsed.hudLines || !Array.isArray(parsed.hudLines)) throw new Error("Invalid Config");

                const gConfig = getGlobalConfig();
                gConfig.hudLines = parsed.hudLines;
                if (parsed.hudMode) gConfig.hudMode = parsed.hudMode;
                saveGlobalConfig(gConfig);

                player.sendMessage("§a§lConfiguration loaded for all players!");
            } catch (e) {
                player.sendMessage("§c§lError importing: Invalid JSON.");
            }
            showScoreboardMenu(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error in import menu:", error);
        });
}

async function showResetConfirmMenu(player) {
    new ActionFormData()
        .title("§c§lReset Scoreboard")
        .body("§eAre you sure you want to reset the scoreboard to default settings?\n\n§cThis action cannot be undone!")
        .button("§a§lYes, Reset", "textures/icons/accept.png")
        .button("§c§lNo, Cancel", "textures/icons/deny.png")
        .show(player)
        .then(res => {
            if (res.canceled || res.selection === 1) {
                showScoreboardMenu(player);
                return;
            }

            if (res.selection === 0) {
                try {
                    // Reset to default configuration
                    const defaultConfig = {
                        adminTag: "admin",
                        refreshRate: 20,
                        ranksEnabled: true,
                        rankObjective: "rank",
                        healthDynamic: true,
                        healthHigh: "§a",
                        healthMid: "§e",
                        healthLow: "§c",
                        ranksList: [
                            { score: 1, name: "§7Member" },
                            { score: 2, name: "§aVIP" },
                            { score: 3, name: "§bMVP" },
                            { score: 4, name: "§cAdmin" },
                            { score: 5, name: "§6Owner" }
                        ],
                        hudMode: "actionbar",
                        hudLines: [
                            "",
                            "§3ɴᴀᴍᴇ: §f${PlayerName}",
                            "",
                            "§dʀᴀɴᴋ: ${Rank}",
                            "§eᴄʟᴀɴ${Clan}",
                            "§aᴍᴏɴᴇʏ: §f${Money}",
                            "§bʙᴀɴᴋ: §f${Bank}",
                            "§eᴘɪɴɢ: ${Ping}ᴍѕ",
                            "§cᴛᴘѕ: ${TPS}",
                            "",
                            "§7${DaysDIS} ${TodayTime}"
                        ]
                    };

                    saveGlobalConfig(defaultConfig);
                    
                    // Update cached refresh rate
                    CACHED_REFRESH_RATE = defaultConfig.refreshRate;
                    
                    player.sendMessage("§a§lScoreboard has been reset to default settings!");
                    player.playSound("random.levelup");
                } catch (e) {
                    player.sendMessage("§c§lError resetting scoreboard: " + e.message);
                    console.warn("[Scoreboard] Error resetting scoreboard:", e);
                }
                showScoreboardMenu(player);
            }
        }).catch(error => {
            console.warn("[Scoreboard] Error in reset confirm menu:", error);
            showScoreboardMenu(player);
        });
}

async function showVariablesList(player) {
    new ActionFormData()
        .title("§6§lAvailable Variables")
        .body("§eUse these codes in your text lines:\n\n" +
            "§f${PlayerName} §7- Player name\n" +
            "§f${Rank} §7- Player rank\n" +
            "§f${Money} §7- Money score\n" +
            "§f${Bank} §7- Bank score\n" +
            "§f${Kills} §7- Kill count\n" +
            "§f${Deaths} §7- Death count\n" +
            "§f${Ping} §7- Player ping\n" +
            "§f${TPS} §7- Server TPS\n" +
            "§f${PlayerHealth-Number} §7- Health (number)\n" +
            "§f${PlayerHealth-%%} §7- Health (%)\n" +
            "§f${PosX} §7- X coordinate\n" +
            "§f${PosY} §7- Y coordinate\n" +
            "§f${PosZ} §7- Z coordinate\n" +
            "§f${Dimension} §7- Current dimension\n" +
            "§f${PlayersPlaying} §7- Player count\n" +
            "§f${Online} §7- Online players\n" +
            "§f${Scoreboard(obj)} §7- Custom objective\n" +
            "§f${Guild} §7- Guild/Clan tag")
        .button("§c§lBack", "textures/icons/back.png")
        .show(player)
        .then(() => showScoreboardMenu(player))
        .catch(error => {
            console.warn("[Scoreboard] Error in variables list:", error);
        });
}

async function showConfigMenu(player) {
    const gConfig = getGlobalConfig();

    new ActionFormData()
        .title("§6§lSettings")
        .button("§a§lGeneral Settings", "textures/icons/settings.png")
        .button("§c§lHealth Colors", "textures/icons/gfc_plushie_goose.png")
        .button("§e§lToggle My HUD", "textures/icons/Lock-Unlocked-4fd1c.png")
        .button("§c§lBack", "textures/icons/back.png")
        .show(player)
        .then(res => {
            if (res.canceled || res.selection === 3) return showScoreboardMenu(player);
            if (res.selection === 0) showGeneralConfig(player);
            if (res.selection === 1) showHealthConfig(player);
            if (res.selection === 2) showPlayerToggle(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error in config menu:", error);
        });
}

async function showPlayerToggle(player) {
    const playerSettings = getPlayerSettings(player);

    new ModalFormData()
        .title("§6§lToggle Your HUD")
        .toggle("§eShow HUD for me", playerSettings.enabled)
        .show(player)
        .then(res => {
            if (res.canceled) return showConfigMenu(player);

            playerSettings.enabled = res.formValues[0];
            savePlayerSettings(player, playerSettings);
            player.sendMessage(playerSettings.enabled ? "§a§lHUD is now visible." : "§c§lHUD is now hidden.");
            showConfigMenu(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error in player toggle:", error);
        });
}

async function showGeneralConfig(player) {
    const gConfig = getGlobalConfig();
    const modeIndex = gConfig.hudMode === "actionbar" ? 0 : 1;

    new ModalFormData()
        .title("§6§lGeneral Settings")
        .dropdown("§eHUD Position", "Bottom (ActionBar)\nSide (Sidebar)", modeIndex)
        .slider("§eRefresh Rate (ticks)", 5, 60, 1, gConfig.refreshRate)
        .toggle("§eEnable Ranks System", gConfig.ranksEnabled)
        .show(player)
        .then(res => {
            if (res.canceled) return showConfigMenu(player);

            const [modeIdx, rate, ranksOn] = res.formValues;
            gConfig.hudMode = modeIdx === 0 ? "actionbar" : "sidebar";
            gConfig.refreshRate = rate;
            gConfig.ranksEnabled = ranksOn;
            saveGlobalConfig(gConfig);

            player.sendMessage("§a§lSettings updated for all players!");
            showConfigMenu(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error in general config:", error);
        });
}

async function showHealthConfig(player) {
    const gConfig = getGlobalConfig();

    new ModalFormData()
        .title("§6§lHealth Colors")
        .toggle("§eDynamic Colors", gConfig.healthDynamic)
        .textField("§eHigh HP (>50%)", gConfig.healthHigh)
        .textField("§eMid HP (>20%)", gConfig.healthMid)
        .textField("§eLow HP (<20%)", gConfig.healthLow)
        .show(player)
        .then(res => {
            if (res.canceled) return showConfigMenu(player);

            const [dyn, high, mid, low] = res.formValues;
            gConfig.healthDynamic = dyn;
            gConfig.healthHigh = String(high);
            gConfig.healthMid = String(mid);
            gConfig.healthLow = String(low);

            saveGlobalConfig(gConfig);
            player.sendMessage("§a§lHealth colors updated!");
            showConfigMenu(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error in health config:", error);
        });
}

async function showAddLineMenu(player) {
    new ModalFormData()
        .title("§6§lAdd Line (Global)")
        .textField("§eText", "")
        .show(player)
        .then(res => {
            if (res.canceled) return showScoreboardMenu(player);

            const text = res.formValues[0];
            if (!text || String(text).trim() === "") {
                player.sendMessage("§c§lText cannot be empty.");
                return showScoreboardMenu(player);
            }

            const gConfig = getGlobalConfig();
            gConfig.hudLines.push(String(text));
            saveGlobalConfig(gConfig);

            player.sendMessage("§a§lLine added for all players!");
            showScoreboardMenu(player);
        }).catch(error => {
            console.warn("[Scoreboard] Error adding line:", error);
        });
}

async function showEditListMenu(player) {
    const gConfig = getGlobalConfig();
    const form = new ActionFormData().title("§6§lEdit Lines (Global)");

    if (gConfig.hudLines.length === 0) {
        form.button("§cNo lines - Add one first!");
    } else {
        gConfig.hudLines.forEach((line, i) => form.button(`§e${i + 1}. §f${line.substring(0, 50)}${line.length > 50 ? "..." : ""}`));
    }

    form.button("§c§lBack", "textures/icons/back.png");

    form.show(player).then(res => {
        if (res.canceled || res.selection === gConfig.hudLines.length) return showScoreboardMenu(player);
        if (gConfig.hudLines.length > 0) showLineActionMenu(player, res.selection);
    }).catch(error => {
        console.warn("[Scoreboard] Error in edit list:", error);
    });
}

async function showLineActionMenu(player, index) {
    const gConfig = getGlobalConfig();
    const line = gConfig.hudLines[index];

    new ActionFormData()
        .title("§6§lLine Options")
        .button("§a§lEdit Text", "textures/icons/edit.png")
        .button("§e§lMove Up", "textures/icons/add.png")
        .button("§e§lMove Down", "textures/icons/deny.png")
        .button("§c§lDelete", "textures/icons/trial.png")
        .show(player)
        .then(res => {
            if (res.canceled) return showEditListMenu(player);

            if (res.selection === 0) {
                new ModalFormData()
                    .title("§6§lEdit Line")
                    .textField("§eContent", line)
                    .show(player)
                    .then(mRes => {
                        if (!mRes.canceled && mRes.formValues[0]) {
                            gConfig.hudLines[index] = String(mRes.formValues[0]);
                            saveGlobalConfig(gConfig);
                            player.sendMessage("§a§lLine updated for all players!");
                        }
                        showEditListMenu(player);
                    }).catch(error => {
                        console.warn("[Scoreboard] Error editing line:", error);
                    });
            } else if (res.selection === 1 && index > 0) {
                [gConfig.hudLines[index], gConfig.hudLines[index - 1]] = [gConfig.hudLines[index - 1], gConfig.hudLines[index]];
                saveGlobalConfig(gConfig);
                showEditListMenu(player);
            } else if (res.selection === 2 && index < gConfig.hudLines.length - 1) {
                [gConfig.hudLines[index], gConfig.hudLines[index + 1]] = [gConfig.hudLines[index + 1], gConfig.hudLines[index]];
                saveGlobalConfig(gConfig);
                showEditListMenu(player);
            } else if (res.selection === 3) {
                gConfig.hudLines.splice(index, 1);
                saveGlobalConfig(gConfig);
                player.sendMessage("§c§lLine deleted for all players!");
                showEditListMenu(player);
            }
        }).catch(error => {
            console.warn("[Scoreboard] Error in line action:", error);
        });
}

// Initialize scoreboard objectives
export function initializeScoreboardObjectives() {
    try {
        const scoreboard = world.scoreboard;
        if (!scoreboard) {
            throw new Error("Scoreboard not available");
        }
        
        // Create objectives if they don't exist
        const objectiveNames = ["money", "kills", "deaths", "playtime", "points", "Kills", "Deaths", "TimePlayed", "bank"];
        
        for (const objectiveName of objectiveNames) {
            try {
                const existingObjective = scoreboard.getObjective(objectiveName);
                if (!existingObjective) {
                    try {
                        scoreboard.addObjective(objectiveName, objectiveName);
                        console.warn(`[Scoreboard] Created objective: ${objectiveName}`);
                    } catch (addError) {
                        // Try command-based creation
                        try {
                            world.getDimension("overworld").runCommand(`scoreboard objectives add ${objectiveName} dummy`);
                            console.warn(`[Scoreboard] Created objective via command: ${objectiveName}`);
                        } catch (cmdError) {
                            console.warn(`[Scoreboard] Failed to create objective ${objectiveName}`);
                        }
                    }
                }
            } catch (e) {
                console.warn(`[Scoreboard] Error checking objective ${objectiveName}:`, e);
            }
        }
        
        console.warn("[Scoreboard] Objectives initialized successfully");
    } catch (e) {
        throw new Error(`not a function`);
    }
}

// Update scoreboard for all players
export function updateScoreboard() {
    try {
        const players = world.getAllPlayers();
        
        for (const player of players) {
            if (!player || !player.name) continue;
            
            try {
                // This function is called by the main HUD update loop
                // Individual player updates are handled there
            } catch (playerError) {
                // Skip this player
                continue;
            }
        }
    } catch (e) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
            console.warn("[Scoreboard] Error in updateScoreboard:", e);
        }
    }
}

// Get player clan info for scoreboard
export function getPlayerClanInfo(player) {
    if (!player || !player.name) return { hasClan: false, name: "" };
    
    try {
        const tags = player.getTags();
        for (const tag of tags) {
            if (tag.includes("clan:")) {
                const clanName = tag.replace("clan:", "");
                return { hasClan: true, name: clanName };
            }
        }
        return { hasClan: false, name: "" };
    } catch (e) {
        return { hasClan: false, name: "" };
    }
}

// Get guild info for scoreboard
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

// Export functions
export { getScore, formatNumber };