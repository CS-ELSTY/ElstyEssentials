// Skills UI Module
// Handles all skill-related UI menus and displays

import { world } from "../../core.js";
import { CustomForm, Observable } from "../../DDUI/DDUI.js";
import { SKILLS_CONFIG, MANA_CONFIG, MAX_LEVEL } from "./skillsConfig.js";
import { getPlayerSkills } from "./skillsDataManager.js";
import { getPlayerMana, getPlayerMaxMana } from "./skillsAbilities.js";

// Progress bar helper
function getProgressBar(current, max, length = 10) {
    const percentage = current / max;
    const filled = Math.floor(percentage * length);
    const empty = length - filled;
    
    return "§a" + "█".repeat(filled) + "§7" + "█".repeat(empty) + " §e" + Math.floor(percentage * 100) + "%";
}

// Main Skills Menu
export async function openSkillsMenu(player) {
    try {
        const skills = getPlayerSkills(player);

        const form = CustomForm.create(player, "§6§l✦ SKILLS MENU");

        form.spacer();
        form.label("§7Select a skill to view details:");
        form.spacer();
        form.divider();
        form.spacer();

        // Texture mapping for skills
        const skillTextures = {
            mining: "textures/menu/skills/mining.png",
            combat: "textures/menu/skills/combat.png",
            defense: "textures/menu/skills/defense.png",
            archer: "textures/menu/skills/archer.png",
            explorer: "textures/menu/skills/explorer.png",
            farming: "textures/menu/skills/farming.png",
            fishing: "textures/menu/skills/fishing.png",
            woodcutting: "textures/menu/skills/woodcutting.png",
            crafting: "textures/menu/skills/crafting.png",
            building: "textures/menu/skills/building.png",
            support: "textures/menu/skills/support.png"
        };

        for (const [skillKey, config] of Object.entries(SKILLS_CONFIG)) {
            const skill = skills[skillKey];
            const nextXP = config.levelUpXP(skill.level);
            const texture = skillTextures[skillKey] || "textures/menu/skills/skills.png";

            form.button(
                `${config.icon} ${config.name}`,
                () => openSkillDetailMenu(player, skillKey),
                texture
            );
        }

        form.spacer();
        form.divider();
        form.spacer();

        form.button("§8Back", () => {
            player.sendMessage("§7Skills menu closed.");
        });

        form.closeButton();

        form.show()
            .then(() => {
                console.warn(`[DDUI] Skills Menu closed`);
            })
            .catch(e => {
                console.error(`[DDUI] Error: ${e}`);
                player.sendMessage(`§cError: ${e}`);
            });

    } catch (error) {
        console.warn("[Skills] Error opening skills menu:", error);
    }
}

// Skill Detail Menu
async function openSkillDetailMenu(player, skillType) {
    try {
        const skills = getPlayerSkills(player);
        const skill = skills[skillType];
        const config = SKILLS_CONFIG[skillType];
        const nextXP = config.levelUpXP(skill.level);

        // Observables for dynamic updates
        const levelObs = Observable.create(skill.level);
        const xpObs = Observable.create(skill.xp);
        const nextXPObs = Observable.create(nextXP);

        const form = CustomForm.create(player, `${config.icon} ${config.name}`);

        form.spacer();
        form.label(`§f${config.name}`);
        form.spacer();
        form.divider();
        form.spacer();

        // Skill Information
        form.label("§7§oSkill Information");
        form.label(`§7Level: §e${levelObs}`);
        form.label(`§7XP: §e${xpObs}§7/§e${nextXPObs}`);
        form.label(`§7Progress: ${getProgressBar(skill.xp, nextXP)}`);

        form.spacer();

        // Show current total bonuses for Explorer skill
        if (skillType === "explorer") {
            let totalManaRegenBonus = 0;
            let totalMaxManaBonus = 0;
            for (const abilityLevel of skill.unlockedAbilities) {
                const ability = config.abilities[abilityLevel];
                if (ability?.bonus?.manaRegen) {
                    totalManaRegenBonus += ability.bonus.manaRegen;
                }
                if (ability?.bonus?.maxMana) {
                    totalMaxManaBonus += ability.bonus.maxMana;
                }
            }
            if (totalManaRegenBonus > 0 || totalMaxManaBonus > 0) {
                form.spacer();
                form.label("§e§lCurrent Bonuses:");
                if (totalManaRegenBonus > 0) {
                    form.label(`§b✨ Mana Regen: §a+${Math.floor(totalManaRegenBonus * 100)}%`);
                }
                if (totalMaxManaBonus > 0) {
                    form.label(`§b✦ Max Mana: §a+${totalMaxManaBonus}`);
                }
            }
        }

        form.spacer();
        form.divider();
        form.spacer();

        // Abilities Section
        form.label("§e§lAbilities:");
        form.spacer();

        for (const [level, ability] of Object.entries(config.abilities)) {
            const levelNum = parseInt(level);
            const unlocked = skill.level >= levelNum;
            const icon = unlocked ? "§a✔" : "§7✖";
            form.label(`${icon} §7Lv.${level} §f${ability.name}`);
            form.label(`   ${ability.desc}`);
        }

        form.spacer();
        form.divider();
        form.spacer();

        form.button("§8Back", () => {
            openSkillsMenu(player);
        });

        form.closeButton();

        form.show()
            .then(() => {
                console.warn(`[DDUI] Skill Detail (${skillType}) closed`);
            })
            .catch(e => {
                console.error(`[DDUI] Error: ${e}`);
                player.sendMessage(`§cError: ${e}`);
            });

    } catch (error) {
        console.warn("[Skills] Error opening skill detail:", error);
    }
}

// Update action bar with HP, Mana, and bonuses
export function updateActionBar(player) {
    try {
        const health = player.getComponent("health");
        if (!health) return;
        
        const hp = Math.floor(health.currentValue);
        const maxHP = Math.floor(health.effectiveMax);
        const mana = Math.floor(getPlayerMana(player.name));
        const maxMana = Math.floor(getPlayerMaxMana(player));
        
        // HP Bar
        const hpPercentage = hp / maxHP;
        const hpColor = hpPercentage > 0.7 ? "§a" : hpPercentage > 0.3 ? "§e" : "§c";
        
        // Mana Bar
        const manaPercentage = mana / maxMana;
        const manaColor = manaPercentage > 0.5 ? "§b" : manaPercentage > 0.2 ? "§9" : "§5";
        
        // Get bonuses
        const skills = getPlayerSkills(player);
        const combatSkill = skills.combat || { level: 0, xp: 0, unlockedAbilities: [] };
        const defenseSkill = skills.defense || { level: 0, xp: 0, unlockedAbilities: [] };
        const archerSkill = skills.archer || { level: 0, xp: 0, unlockedAbilities: [] };
        const explorerSkill = skills.explorer || { level: 0, xp: 0, unlockedAbilities: [] };
        
        let damageBonus = 0;
        for (const abilityLevel of combatSkill.unlockedAbilities) {
            const ability = SKILLS_CONFIG.combat.abilities[abilityLevel];
            if (ability?.bonus?.damage) {
                damageBonus += ability.bonus.damage;
            }
        }
        
        let defenseReduction = 0;
        for (const abilityLevel of defenseSkill.unlockedAbilities) {
            const ability = SKILLS_CONFIG.defense.abilities[abilityLevel];
            if (ability?.bonus?.reduction) {
                defenseReduction += ability.bonus.reduction;
            }
        }
        
        let archerBonus = 0;
        for (const abilityLevel of archerSkill.unlockedAbilities) {
            const ability = SKILLS_CONFIG.archer.abilities[abilityLevel];
            if (ability?.bonus?.arrowDamage) {
                archerBonus += ability.bonus.arrowDamage;
            }
        }
        
        let manaRegenBonus = 0;
        let maxManaBonus = 0;
        for (const abilityLevel of explorerSkill.unlockedAbilities) {
            const ability = SKILLS_CONFIG.explorer.abilities[abilityLevel];
            if (ability?.bonus?.manaRegen) {
                manaRegenBonus += ability.bonus.manaRegen;
            }
            if (ability?.bonus?.maxMana) {
                maxManaBonus += ability.bonus.maxMana;
            }
        }
        
        const defPercent = Math.floor(defenseReduction * 100);
        const archerPercent = Math.floor(archerBonus * 100);
        const regenPercent = Math.floor(manaRegenBonus * 100);
        
        const actionBarText = 
            `${hpColor}❤ ${hp}/${maxHP} §r| ` +
            `${manaColor}✦ ${mana}/${maxMana} §r| ` +
            `§c⚔ +${damageBonus} §r| ` +
            `§e✨ +${regenPercent}%`;
        
        player.onScreenDisplay.setActionBar(actionBarText);
        
    } catch (error) {
        // Silently continue if error occurs
    }
}

// Update all players' action bars
export function updateAllActionBars() {
    for (const player of world.getAllPlayers()) {
        updateActionBar(player);
    }
}