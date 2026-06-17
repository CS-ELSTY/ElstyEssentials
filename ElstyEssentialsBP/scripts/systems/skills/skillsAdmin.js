// Skills Admin Module
// Admin menu for quickly adding skill XP

import { world, system } from "../../core.js";
import { ActionFormData, ModalFormData } from "../../core.js";
import { SKILLS_CONFIG } from "./skillsConfig.js";
import { addSkillXP } from "./skillsXPHandlers.js";
import { getPlayerSkills } from "./skillsDataManager.js";

// Open Skills Admin Menu
export async function openSkillsAdminMenu(admin) {
    try {
        const form = new ActionFormData()
            .title("§6§l✦ SKILLS ADMIN")
            .body("§eSelect a player to modify skills:");
        
        // Get all online players
        const players = world.getAllPlayers();
        
        if (players.length === 0) {
            admin.sendMessage("§cNo players online!");
            return;
        }
        
        // Add player buttons
        for (const player of players) {
            form.button(`§a${player.name}`, "textures/ui/icon_steve");
        }
        
        form.button("§8Back", "textures/icons/back.png");
        
        const response = await form.show(admin);
        if (response.canceled || response.selection === players.length) return;
        
        const selectedPlayer = players[response.selection];
        await openPlayerSkillsAdminMenu(admin, selectedPlayer);
        
    } catch (error) {
        console.warn("[Skills Admin] Error opening admin menu:", error);
    }
}

// Open Player Skills Admin Menu
async function openPlayerSkillsAdminMenu(admin, player) {
    try {
        const skills = getPlayerSkills(player);
        
        const form = new ActionFormData()
            .title(`§6§l✦ SKILLS: ${player.name}`)
            .body("§eSelect a skill to add XP:");
        
        const skillIcons = {
            mining: "textures/menu/skills/mining.png",
            woodcutting: "textures/menu/skills/woodcutting.png",
            combat: "textures/menu/skills/combat.png",
            defense: "textures/menu/skills/defense.png",
            farming: "textures/menu/skills/farmer.png",
            fishing: "textures/menu/skills/fishing.png",
            archer: "textures/menu/skills/archer.png",
            explorer: "textures/menu/skills/explorer.png"
        };
        
        for (const [skillKey, config] of Object.entries(SKILLS_CONFIG)) {
            const skill = skills[skillKey];
            const nextXP = config.levelUpXP(skill.level);
            
            form.button(
                `${config.icon} ${config.name}\n§7Level ${skill.level} §8| §e${skill.xp}§7/§e${nextXP} XP`,
                skillIcons[skillKey] || "textures/items/buku_enchanted.png"
            );
        }
        
        form.button("§8Back", "textures/icons/back.png");
        
        const response = await form.show(admin);
        if (response.canceled || response.selection === Object.keys(SKILLS_CONFIG).length) {
            await openSkillsAdminMenu(admin);
            return;
        }
        
        const skillKeys = Object.keys(SKILLS_CONFIG);
        const selectedSkill = skillKeys[response.selection];
        await openXPAmountMenu(admin, player, selectedSkill);
        
    } catch (error) {
        console.warn("[Skills Admin] Error opening player menu:", error);
    }
}

// Open XP Amount Menu
async function openXPAmountMenu(admin, player, skillType) {
    try {
        const config = SKILLS_CONFIG[skillType];
        const skills = getPlayerSkills(player);
        const skill = skills[skillType];
        const nextXP = config.levelUpXP(skill.level);
        
        const form = new ModalFormData()
            .title(`§6§l✦ ADD XP: ${config.name}`)
            .textField(`§eCurrent XP: §a${skill.xp}§7/§e${nextXP}\n§7Enter XP amount to add:`, "1000")
            .toggle("§eAdd enough to level up");
        
        const response = await form.show(admin);
        if (response.canceled) {
            await openPlayerSkillsAdminMenu(admin, player);
            return;
        }
        
        const xpAmount = parseInt(response.formValues[0]) || 0;
        const levelUp = response.formValues[1];
        
        if (xpAmount <= 0) {
            admin.sendMessage("§cInvalid XP amount!");
            await openXPAmountMenu(admin, player, skillType);
            return;
        }
        
        let finalXP = xpAmount;
        
        if (levelUp) {
            // Calculate XP needed to level up
            finalXP = nextXP - skill.xp;
        }
        
        // Add XP
        addSkillXP(player, skillType, finalXP);
        
        admin.sendMessage(`§a§l✦ Added §e${finalXP} XP §ato §f${player.name}'s §6${config.name}§a!`);
        player.sendMessage(`§6§l✦ Admin added §e${finalXP} XP §6to your §a${config.name}§6!`);
        
        // Show updated menu
        await openPlayerSkillsAdminMenu(admin, player);
        
    } catch (error) {
        console.warn("[Skills Admin] Error opening XP amount menu:", error);
    }
}

// Command handler for skills admin
export function handleSkillsAdminCommand(admin) {
    system.runTimeout(() => {
        openSkillsAdminMenu(admin);
    }, 5);
}