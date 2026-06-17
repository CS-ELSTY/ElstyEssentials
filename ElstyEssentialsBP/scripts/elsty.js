// Elsty module - Main menu functionality for Elsty Essentials addon
import { ActionFormData } from "@minecraft/server-ui";
import { showDailyRewardMenu } from "./systems/dailyRewardSystem.js";
import { HomeSystem } from "./social/homeSystem.js";
import { openShopMenu } from "./social/shopSystem.js";
import { Bank } from "./social/bankSystem.js";
import { guildSystem, showGuildMenu } from "./social/guildSystem.js";
import { showTPAMenu } from "./systems/tpaSystem.js";
import { handleSitCommand, handleStandCommand } from "./plugins/sit-system/sitSystem.js";
import { LandMember } from "./plugins/land/LandMember.js";
import { handleRTPCommand } from "./systems/rtpSystem.js";
import { getPlayerRankInfoForCommands } from "./systems/scoreboardSystem.js";
import { rank } from "./social/ranks/rank_list.js";
import { showSkillsMenu } from "./systems/skills/skillsSystem.js";
import { showMusicMenu } from "./systems/musicSystem.js";
import { openQuestMenu } from "./systems/quest/questSystem.js";

export function showMemberMenu(player) {
    const form = new ActionFormData()
        .title("§6Member Menu")
        .body("§eWelcome, Member!\n§7Select an option below:")
        .button("§dBank", "textures/menu/member/bank.png")
        .button("§eGuild/Clan", "textures/menu/member/clan.png")
        .button("§bHome System", "textures/menu/member/home.png")
        .button("§8Land", "textures/menu/member/land.png")
        .button("§aMy Rank", "textures/menu/member/myrank.png")
        .button("§6Rank Shop", "textures/menu/member/rank.png")
        .button("§aDaily Rewards", "textures/menu/member/rewards.png")
        .button("§9Random TP", "textures/menu/member/rtp.png")
        .button("§cShop", "textures/menu/member/shop.png")
        .button("§6Skills", "textures/menu/member/skills.png")
        .button("§fTPA System", "textures/menu/member/tpa.png")
        .button("§5Music", "textures/menu/member/musik.png")
        .button("§aQuests", "textures/menu/quest.png")
        .button("§7Back", "textures/icons/deny");

    form.show(player).then(response => {
        if (response.canceled) return;

        switch(response.selection) {
            case 0: // Bank
                Bank(player);
                break;
            case 1: // Guild/Clan
                showGuildMenu(player);
                break;
            case 2: // Home System
                HomeSystem(player);
                break;
            case 3: // Land
                LandMember(player);
                break;
            case 4: // My Rank
                const rankInfo = getPlayerRankInfoForCommands(player);
                player.sendMessage(`§aYour rank: ${rankInfo.display}`);
                showMemberMenu(player);
                break;
            case 5: // Rank Shop
                rank(player);
                break;
            case 6: // Daily Rewards
                showDailyRewardMenu(player);
                break;
            case 7: // Random TP
                handleRTPCommand(player);
                break;
            case 8: // Shop
                openShopMenu(player);
                break;
            case 9: // Skills
                showSkillsMenu(player);
                break;
            case 10: // TPA System
                showTPAMenu(player);
                break;
            case 11: // Music
                showMusicMenu(player);
                break;
            case 12: // Quests
                openQuestMenu(player);
                break;
            case 13: // Back
                showMainMenu(player);
                break;
        }
    }).catch(error => {
        player.sendMessage(`§cError showing menu: ${error.message}`);
    });
}

export function showMainMenu(player) {
    // Create a main menu form for Elsty Essentials
    const form = new ActionFormData()
        .title("§6Elsty Essentials Menu")
        .body("§eWelcome to Elsty Essentials!\n§7Select an option below:")
        .button("§aDaily Rewards", "textures/ui/gift_borderless")
        .button("§bMember Menu", "textures/ui/permissions_member")
        .button("§cServer Info", "textures/ui/info_outline")
        .button("§7Close", "textures/ui/cancel");

    form.show(player).then(response => {
        if (response.canceled) return;

        switch(response.selection) {
            case 0: // Daily Rewards
                showDailyRewardMenu(player);
                break;
            case 1: // Member Menu
                showMemberMenu(player);
                break;
            case 2: // Server info
                player.sendMessage("§aWelcome to Elsty Essentials - Your Minecraft Bedrock server enhancement!");
                showMainMenu(player);
                break;
            case 3: // Close
                player.sendMessage("§cMenu closed.");
                break;
        }
    }).catch(error => {
        player.sendMessage(`§cError showing menu: ${error.message}`);
    });
}