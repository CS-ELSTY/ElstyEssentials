import { system, world, ActionFormData, MessageFormData } from "../core.js";
import { showScoreboardMenu } from "../systems/scoreboardSystem.js";
import { floatingTextMenu } from "../plugins/floating-text/floating_text.js";
import { openAdminPanel } from "../social/ranks/rank.js";
import { handleSkillsAdminCommand } from "../systems/skills/skillsAdmin.js";
import { handleNametagConfig } from "../board/nametag.js";
import { handleClearLagCommand } from "../systems/clearlagSystem.js";

export function showAdminMenu(player) {
  const form = new ActionFormData()
    .title("§c§lAdmin Panel")
    .body("§eWelcome to Admin Panel!\n§7Select an option below:")
    .button("§aScoreboard Builder\n§7Manage scoreboard settings", "textures/menu/admin/scoreboard")
    .button("§bFloating Text\n§7Manage floating texts", "textures/menu/admin/floatingtext")
    .button("§6Rank System\n§7Manage player ranks", "textures/menu/admin/ranks")
    .button("§dSkills Admin\n§7Manage skills settings", "textures/menu/admin/skills")
    .button("§eNametag Config\n§7Configure nametags", "textures/menu/admin/nametag")
    .button("§cClear Lag\n§7Manage clear lag system", "textures/menu/admin/clearlag")
    .button("§7Back", "textures/ui/cancel");

  form.show(player).then(response => {
    if (response.canceled) return;

    switch(response.selection) {
      case 0: // Scoreboard Builder
        system.run(() => showScoreboardMenu(player));
        break;
      case 1: // Floating Text
        system.run(() => floatingTextMenu(player));
        break;
      case 2: // Rank System
        system.run(() => openAdminPanel(player));
        break;
      case 3: // Skills Admin
        system.run(() => handleSkillsAdminCommand(player));
        break;
      case 4: // Nametag Config
        system.run(() => handleNametagConfig(player));
        break;
      case 5: // Clear Lag
        handleClearLagCommand(player);
        break;
      case 6: // Back
        player.sendMessage("§cAdmin panel closed.");
        break;
    }
  }).catch(error => {
    player.sendMessage(`§cError showing admin menu: ${error.message}`);
  });
}