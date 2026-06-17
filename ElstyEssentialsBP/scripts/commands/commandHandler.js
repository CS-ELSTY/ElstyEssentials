import { Player, CommandPermissionLevel, CustomCommandStatus, CustomCommandParamType, world, system } from "@minecraft/server";
import { handleClearLagCommand } from "../systems/clearlagSystem.js";
import { getPlayerRankInfoForCommands, showScoreboardMenu } from "../systems/scoreboardSystem.js";
import { floatingTextMenu } from "../plugins/floating-text/floating_text.js";
import { guildSystem, showGuildMenu } from "../social/guildSystem.js";
import { HomeSystem } from "../social/homeSystem.js";
import { openShopMenu } from "../social/shopSystem.js";
import { Bank } from "../social/bankSystem.js";
import { checkPlayerRank, setRank, getAllRanks, openAdminPanel } from "../social/ranks/rank.js";
import { isAdmin } from "../function/getAdmin.js";
import { sendTPARequest, acceptTPARequest, denyTPARequest, showTPAMenu } from "../systems/tpaSystem.js";
import { handleDailyCommand } from "../systems/dailyRewardSystem.js";
import { showDailyRewardMenu } from "../systems/dailyRewardSystem.js";
import { handleSitCommand, handleStandCommand } from "../plugins/sit-system/sitSystem.js";
import { LandMember } from "../plugins/land/LandMember.js";
import { handleRTPCommand } from "../systems/rtpSystem.js";
import { showMainMenu, showMemberMenu } from "../elsty.js";
import { handleSkillsCommand, handleSkillsSyncCommand } from "../systems/skills/skillsSystem.js";
import { handleSkillsAdminCommand } from "../systems/skills/skillsAdmin.js";
import { handleMusicCommand } from "../systems/musicSystem.js";
import { openQuestMenu } from "../systems/quest/questSystem.js";
import { showAdminMenu } from "../admin/adminUI.js";

// Utility functions
const getPlayer = origin => origin?.initiator || origin.sourceEntity;
const isPlayer = player => player instanceof Player;
const success = () => ({ status: CustomCommandStatus.Success });
const failure = (message = "Players only.") => ({ status: CustomCommandStatus.Failure, message });

// Command handlers
const handlers = {
  clearlag: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure("This command is for players only.");

    if (!isAdmin(player)) {
      player.sendMessage("§c⚠ You don't have permission to use this command!");
      return failure("Permission denied");
    }

    handleClearLagCommand(player);
    return success();
  },

  admin: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    if (!isAdmin(player)) {
      player.sendMessage("§c⚠ You don't have permission to use this command!");
      return failure("Permission denied");
    }

    system.run(() => showAdminMenu(player));
    return success();
  },

  elsty: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    const message = [
      "§l§9━━━[ ELSTY ESSENTIALS ]━━━§r",
      "§bCommands:§r",
      "§3• §f/elsty:elstyhelp §7- Show this help",
      "§3• §f/elsty:info §7- Server info",
      "§3• §f/elsty:membermenu §7- Member menu",
      "§3• §f/elsty:skills §7- Skills menu",
      "§3• §f/elsty:skillssync §7- Sync skills and abilities",
      "§3• §f/elsty:quest §7- Quest system",
      "§3• §f/elsty:daily §7- Daily rewards",
      "§3• §f/elsty:sit §7- Sit on block",
      "§3• §f/elsty:stand §7- Stand up",
      "§3• §f/elsty:land §7- Land management",
      "§3• §f/elsty:rtp §7- Random teleport",
      "§3• §f/elsty:clearlag §7- Clear lag system (admin)",
      "§3• §f/elsty:floatingtext §7- Floating text menu (admin)",
      "§3• §f/elsty:admin §7- Admin panel (admin)",
      "§3• §f/elsty:home §7- Home system",
      "§3• §f/elsty:shop §7- Shop system",
      "§3• §f/elsty:bank §7- Bank system",
      "§3• §f/elsty:rank §7- View your rank",
      "§3• §f/elsty:clan §7- Guild information",
      "§3• §f/elsty:tpa §7- TPA system",
      "§3• §f/elsty:tpaaccept §7- Accept TPA",
      "§3• §f/elsty:tpadeny §7- Deny TPA",
      "§3• §f/elsty:music §7- Music player",
      "",
      "§eTips:§r",
      "§7- Use §f/elsty:skillssync§7 if your mana bonuses aren't working",
      "§7- Commands are not case-sensitive",
      "§8━━━━━━━━━━━━━━━━━━━━━━§r",
    ].join("\n");

    player.sendMessage(message);
    return success();
  },

  info: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    const message = [
      "§l§2━━━[ SERVER INFO ]━━━§r", 
      "§a• §fAddon: §bElsty Essentials",
      "§a• §fVersion: §e1.0.0", 
      "§a• §fDeveloper: §9Elsty Team",
      "§a• §fFeatures: §eScoreboard, ClearLag, Ranks, Guilds",
      "§8━━━━━━━━━━━━━━━━━━━━━━§r"
    ].join("\n");

    player.sendMessage(message);
    return success();
  },

  rank: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    const rankInfo = getPlayerRankInfoForCommands(player);
    player.sendMessage(`§aYour rank: ${rankInfo.display}`);
    return success();
  },

  clan: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    // Get player's rank tag
    const rankTag = checkPlayerRank(player);
    
    // Define rank hierarchy - Iron rank () and above can create guilds
    const ranksThatCanCreateGuild = [
      "", // Owner
      "", // Admin
      "", // Command
      "", // Helper
      "", // Designer
      "", // Builder
      "", // Legends
      "", // Kingdom
      "", // Discord
      "", // Youtube
      "", // Twitch
      "", // Sniper
      "", // End
      "", // Nether
      "", // Space
      "", // Fire
      "", // Water
      "", // Air
      "", // Hacker
      "", // Diamond
      "", // Iron (this is the minimum rank)
      "", // Gold
    ];
    
    const canCreateGuild = ranksThatCanCreateGuild.includes(rankTag);
    
    // Check if player already has a guild
    const guildInfo = guildSystem.getPlayerGuild(player.name);
    if (guildInfo) {
      // Player already has a guild, allow them to manage it regardless of rank
      system.run(() => showGuildMenu(player));
      return success();
    } else if (canCreateGuild) {
      // Player doesn't have a guild but has required rank to create one
      system.run(() => showGuildMenu(player));
      return success();
    } else {
      // Player doesn't have a guild and doesn't have required rank to create one
      player.sendMessage("§c⚠ You need at least Iron rank to create a guild!");
      return failure("Rank too low to create guild");
    }
  },

  scoreboard: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    // Open the scoreboard builder menu
    system.run(() => showScoreboardMenu(player));
    return success();
  },

  floatingtext: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    // Check if player is admin using tags
    if (!isAdmin(player)) {
      player.sendMessage("§c⚠ You don't have permission to use this command!");
      return failure("Permission denied");
    }

    system.run(() => floatingTextMenu(player));
    return success();
  },

  home: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => HomeSystem(player));
    return success();
  },

  bank: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => Bank(player));
    return success();
  },

  shop: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => openShopMenu(player));
    return success();
  },

  tpa: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => showTPAMenu(player));
    return success();
  },

  tpaaccept: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => acceptTPARequest(player));
    return success();
  },

  tpadeny: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => denyTPARequest(player));
    return success();
  },

  daily: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => showDailyRewardMenu(player));
    return success();
  },

  dailyrewards: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => showDailyRewardMenu(player));
    return success();
  },

  sit: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => handleSitCommand(player));
    return success();
  },

  stand: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => handleStandCommand(player));
    return success();
  },

  land: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => LandMember(player));
    return success();
  },

  rtp: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => handleRTPCommand(player));
    return success();
  },

  membermenu: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => showMemberMenu(player));
    return success();
  },

  skills: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => handleSkillsCommand(player));
    return success();
  },

  skillssync: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => handleSkillsSyncCommand(player));
    return success();
  },

  skillsadmin: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    if (!isAdmin(player)) {
      player.sendMessage("§cAccess Denied. You need admin permission.");
      return failure();
    }

    system.run(() => handleSkillsAdminCommand(player));
    return success();
  },

  music: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => handleMusicCommand(player));
    return success();
  },

  quest: origin => {
    const player = getPlayer(origin);
    if (!isPlayer(player)) return failure();

    system.run(() => openQuestMenu(player));
    return success();
  }
};

// Command definitions
const commands = [
  { name: "elsty:admin", description: "Open admin panel (admin)", handler: handlers.admin },
  { name: "elsty:clearlag", description: "Open clear lag management menu (admin)", handler: handlers.clearlag },
  { name: "elsty:elstyhelp", description: "Show help message", handler: handlers.elsty },
  { name: "elsty:info", description: "Server information", handler: handlers.info },
  { name: "elsty:rank", description: "View your rank", handler: handlers.rank },
  { name: "elsty:clan", description: "View your guild information", handler: handlers.clan },
  { name: "elsty:bank", description: "Open bank menu", handler: handlers.bank },
  { name: "elsty:floatingtext", description: "Floating text menu (admin)", handler: handlers.floatingtext },
  { name: "elsty:home", description: "Home system", handler: handlers.home },
  { name: "elsty:shop", description: "Shop system", handler: handlers.shop },
  { name: "elsty:tpa", description: "Open TPA menu", handler: handlers.tpa },
  { name: "elsty:tpaccept", description: "Accept TPA request", handler: handlers.tpaaccept },
  { name: "elsty:tpadeny", description: "Deny TPA request", handler: handlers.tpadeny },
  { name: "elsty:daily", description: "Open daily rewards menu", handler: handlers.daily },
  { name: "elsty:sit", description: "Sit on targeted block", handler: handlers.sit },
  { name: "elsty:stand", description: "Stand up from sitting", handler: handlers.stand },
  { name: "elsty:land", description: "Land management system", handler: handlers.land },
  { name: "elsty:rtp", description: "Random teleport system", handler: handlers.rtp },
  { name: "elsty:menu", description: "Open member menu", handler: handlers.membermenu },
  { name: "elsty:skills", description: "Open skills menu", handler: handlers.skills },
  { name: "elsty:skillssync", description: "Sync skills and abilities", handler: handlers.skillssync },
  { name: "elsty:music", description: "Open music player menu", handler: handlers.music },
  { name: "elsty:quest", description: "Open quest system menu", handler: handlers.quest }
];

export function registerCustomCommands(system) {
  system.beforeEvents.startup.subscribe(init => {
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      const commandConfig = {
        name: cmd.name,
        description: cmd.description,
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: false,
      };
      try {
        init.customCommandRegistry.registerCommand(commandConfig, cmd.handler);
      } catch (error) {
        // Ignore reload errors - commands work fine after full restart
        if (!error.message?.includes('reload failed')) {
          console.warn(`Failed to register command ${cmd.name}:`, error);
        }
      }
    }
  });
}