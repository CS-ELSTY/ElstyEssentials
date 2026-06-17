// Elsty Essentials - Nametag System
// Custom nametag with placeholders and multi-line support

import { system, world, ActionFormData, ModalFormData, MessageFormData } from "../core.js"
import { ForceOpen } from "../function/ForceOpen.js"
import { getClan } from "../function/getClan.js"
import { getPlaceholder } from "../function/getPlaceholder.js"
import { getRank } from "../function/getRank.js"
import { getFormattedMoney } from "../function/moneySystem.js"
import { getCurrency, getDefaultCurrency } from "../function/getCurrency.js"
import { guildSystem } from "../social/guildSystem.js"

const DEVICE_ICONS = {
  Mobile: "§e[MOBILE]§r",
  Console: "§b[CONSOLE]§r",
  Desktop: "§a[DESKTOP]§r",
}

const DEFAULT_FORMAT = "§8[§r@RANK§8] §f@HEALTH @NAME@NL§r§8[§r@CLAN§8]"

const DEFAULT_CONFIG = {
  format: DEFAULT_FORMAT,
  enabled: false,
  showHealth: false,
  showCoordinates: false,
  showDimension: false,
  multiLine: true,
  lastUpdate: Date.now(),
}

function getNametagSettings() {
  try {
    const settings = world.getDynamicProperty("nametag_settings")
    if (!settings) {
      world.setDynamicProperty("nametag_settings", JSON.stringify(DEFAULT_CONFIG))
      return DEFAULT_CONFIG
    }
    return JSON.parse(settings)
  } catch (error) {
    console.warn("Error getting nametag settings:", error)
    return DEFAULT_CONFIG
  }
}

function saveNametagSettings(settings) {
  try {
    const updatedSettings = {
      ...settings,
      lastUpdate: Date.now(),
    }
    world.setDynamicProperty("nametag_settings", JSON.stringify(updatedSettings))
    return true
  } catch (error) {
    console.warn("Error saving nametag settings:", error)
    return false
  }
}

async function handleNametagConfig(player) {
  const settings = getNametagSettings()

  const UI = new ActionFormData()
    .title("Nametag Configuration")
    .body(
      "§fCurrent Status:\n" +
        `§f• Custom Nametag: ${settings.enabled ? "§aEnabled" : "§cDisabled"}\n` +
        `§f• Multi-line Format: ${settings.multiLine ? "§aEnabled" : "§cDisabled"}\n\n` +
        "§fCurrent Format:\n" +
        "§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n" +
        `${settings.format || DEFAULT_FORMAT}\n` +
        "§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
        "§fFormat Examples:\n" +
        "§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n" +
        "§8[§r@RANK§8] §f@DEVICE @NAME@NL§r§8[§r@CLAN§8]\n" +
        "§8[§r@RANK§8] §f@NAME§7(§c@HEALTH❤§7)@NL§r§8[§r@CLAN§8]\n" +
        "§8[§r@RANK§8] §f@NAME@NL§8[§f@X§7, §f@Y§7, §f@Z§7]\n" +
        "§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n" +
        "§fAvailable Placeholders:\n" +
        "§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n" +
        "§f@NAME - Player name\n" +
        "§f@DEVICE - Player device type\n" +
        "§f@RANK - Player rank\n" +
        "§f@CLAN - Player clan\n" +
        "§f@NL - New line\n" +
        "§f@HEALTH - Player health\n" +
        "§f@LEVEL - Player level\n" +
        "§f@XP - Total experience\n" +
        "§f@KILL - Kill count\n" +
        "§f@DEATH - Death count\n" +
        "§f@DIMENSION - Player dimension\n" +
        "§f@X - Player X position\n" +
        "§f@Y - Player Y position\n" +
        "§f@Z - Player Z position\n" +
        "§f@MONEY - Player money\n" +
        "§f@CURRENCY - Currency symbol\n" +
        "§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
    )
    .button("Configure Settings\n§8Edit nametag options", "textures/ui/button_custom/settings")
    .button("Edit Format\n§8Customize nametag format", "textures/ui/button_custom/Object-7ce37")
    .button("Reset to Default\n§8Restore default settings", "textures/ui/refresh")
    .button("Cancel", "textures/ui/cancel")

  const result = await ForceOpen(player, UI)
  if (result.canceled) return

  switch (result.selection) {
    case 0:
      await handleToggleSettings(player)
      break
    case 1:
      await handleEditFormat(player)
      break
    case 2:
      await handleResetNametag(player)
      break
  }
}

async function handleToggleSettings(player) {
  const settings = getNametagSettings()

  const UI = new ModalFormData()
    .title("Nametag Settings")
    .toggle("§fEnable Custom Nametag\n§8Use custom nametag format", {
      defaultValue: settings.enabled,
    })
    .toggle("§fMulti-line Format\n§8Use multiple lines", {
      defaultValue: settings.multiLine,
    })
    .toggle("§fApply Immediately\n§8Update nametags now", {
      defaultValue: true,
    })

  const result = await ForceOpen(player, UI)
  if (result.canceled) return

  const [enabled, multiLine, applyImmediately] = result.formValues

  const updatedSettings = {
    ...settings,
    enabled,
    multiLine,
    showHealth: settings.showHealth || false,
    showCoordinates: settings.showCoordinates || false,
    showDimension: settings.showDimension || false,
  }

  if (saveNametagSettings(updatedSettings)) {
    if (applyImmediately) {
      player.sendMessage("§a Nametag settings updated successfully!")
    } else {
      player.sendMessage("§a Settings will be applied after reload")
    }
    player.playSound("random.levelup")
  } else {
    player.sendMessage("§c Failed to update settings!")
    player.playSound("note.bass")
  }
}

async function handleEditFormat(player) {
  const settings = getNametagSettings()
  const currentFormat = settings.format || DEFAULT_FORMAT

  const editUI = new ModalFormData()
    .title("Edit Nametag Format")
    .textField("§eFormat", currentFormat)
    .toggle("§fApply Immediately\n§8Update nametags now", {
      defaultValue: true,
    })

  const result = await ForceOpen(player, editUI)
  if (result.canceled) return

  const [format, applyImmediately] = result.formValues

  if (!format?.trim()) {
    player.sendMessage("§c Format cannot be empty!")
    player.playSound("note.bass")
    return
  }

  const updatedSettings = {
    ...settings,
    format: format.trim(),
  }

  if (saveNametagSettings(updatedSettings)) {
    if (applyImmediately) {
      player.sendMessage("§a Nametag format updated successfully!")
      const finalPreview = getPlaceholder(format.trim(), [
        {
          NAME: player.name,
          DEVICE: DEVICE_ICONS[player.clientSystemInfo?.platformType] || "",
          RANK: getRank(player),
          CLAN: (() => {
              try {
                const clan = getClan(player);
                return clan || "None";
              } catch {
                return "None";
              }
            })(),
          NL: "\n",
          HEALTH: Math.round(player.getComponent("minecraft:health")?.currentValue || 20),
          LEVEL: player.level || 0,
          XP: player.xpEarnedAtCurrentLevel || 0,
          MONEY: getFormattedMoney(player).replace(/[^\d]/g, ""),
          CURRENCY: getDefaultCurrency(),
          KILL: (() => {
            try {
              const objective = world.scoreboard.getObjective("Kills")
              if (objective) {
                const participants = objective.getParticipants()
                const participant = participants.find(p => p.displayName === player.name)
                return participant ? objective.getScore(participant) || 0 : 0
              }
              return 0
            } catch {
              return 0
            }
          })(),
          DEATH: (() => {
            try {
              const objective = world.scoreboard.getObjective("Deaths")
              if (objective) {
                const participants = objective.getParticipants()
                const participant = participants.find(p => p.displayName === player.name)
                return participant ? objective.getScore(participant) || 0 : 0
              }
              return 0
            } catch {
              return 0
            }
          })(),
          DIMENSION: player.dimension.id.replace("minecraft:", ""),
          X: Math.floor(player.location.x),
          Y: Math.floor(player.location.y),
          Z: Math.floor(player.location.z),
        },
      ])

      player.sendMessage("§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n" + finalPreview + "\n§7▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬")
    } else {
      player.sendMessage("§a Format will be applied after reload")
    }
    player.playSound("random.levelup")
  } else {
    player.sendMessage("§c Failed to update format!")
    player.playSound("note.bass")
  }
}

async function handleResetNametag(player) {
  try {
    const UI = new MessageFormData().title("Reset Nametag").body("§fAre you sure you want to reset all nametag settings to default?\n\n§7This will:\n§7• Disable custom nametag\n§7• Reset format to default\n§7• Clear all custom settings").button1("§aReset").button2("§cCancel")

    const result = await ForceOpen(player, UI)
    if (result.canceled || result.selection === 1) return
    const resetSuccess = saveNametagSettings({
      ...DEFAULT_CONFIG,
      lastUpdate: Date.now(),
    })

    if (resetSuccess) {
      for (const p of world.getPlayers()) {
        try {
          p.nameTag = p.name
        } catch {}
      }

      player.sendMessage("§a Nametag settings have been reset to default!")
      player.playSound("random.levelup")
    } else {
      player.sendMessage("§c Failed to reset settings!")
      player.playSound("note.bass")
    }
  } catch (error) {
    console.warn("Error in handleResetNametag:", error)
    player.sendMessage("§c An error occurred while resetting nametag!")
    player.playSound("note.bass")
  }
}

system.runInterval(() => {
  try {
    const settings = getNametagSettings()
    if (!settings || !settings.enabled) {
      return
    }

    for (const player of world.getPlayers()) {
      try {
        let health = 20
        try {
          const healthComponent = player.getComponent("minecraft:health")
          if (healthComponent) {
            health = Math.round(healthComponent.currentValue)
          }
        } catch {}

        let playerLevel = 0
        let totalXp = 0
        try {
          playerLevel = player.level || 0
          totalXp = player.xpEarnedAtCurrentLevel || 0
        } catch {}

        let kills = 0
        let deaths = 0
        try {
          const killObjective = world.scoreboard.getObjective("Kills")
          if (killObjective) {
            const participants = killObjective.getParticipants()
            const participant = participants.find(p => p.displayName === player.name)
            if (participant) {
              kills = killObjective.getScore(participant) || 0
            }
          }
        } catch {}
        try {
          const deathObjective = world.scoreboard.getObjective("Deaths")
          if (deathObjective) {
            const participants = deathObjective.getParticipants()
            const participant = participants.find(p => p.displayName === player.name)
            if (participant) {
              deaths = deathObjective.getScore(participant) || 0
            }
          }
        } catch {}

        let dimension = "unknown"
        try {
          dimension = player.dimension.id.replace("minecraft:", "")
        } catch {}

        let format = settings.format || DEFAULT_FORMAT

        if (!settings.showHealth) {
          format = format.replace(/§7\(§c@HEALTH❤§7\)/g, "")
        }
        if (!settings.showCoordinates) {
          format = format.replace(/§7\[§f@X§7, §f@Y§7, §f@Z§7\]/g, "")
        }
        if (!settings.showDimension) {
          format = format.replace(/§7\[§e@DIMENSION[^\]]*\]/g, "")
        }
        if (!settings.multiLine) {
          format = format.replace(/@NL/g, " ")
        }

        const placeholderData = {
          NAME: player.name,
          DEVICE: DEVICE_ICONS[player.clientSystemInfo?.platformType] || "",
          RANK: (() => {
            try {
              return getRank(player);
            } catch {
              return "§7Member";
            }
          })(),
          CLAN: (() => {
            try {
              const clan = getClan(player);
              return clan || "None";
            } catch {
              return "None";
            }
          })(),
          NL: "\n",
          HEALTH: health,
          LEVEL: playerLevel,
          XP: totalXp,
          MONEY: (() => {
            try {
              return getFormattedMoney(player).replace(/[^\d]/g, "");
            } catch {
              return "0";
            }
          })(),
          CURRENCY: (() => {
            try {
              return getDefaultCurrency();
            } catch {
              return "$";
            }
          })(),
          KILL: kills,
          DEATH: deaths,
          DIMENSION: dimension,
          X: Math.floor(player.location.x),
          Y: Math.floor(player.location.y),
          Z: Math.floor(player.location.z),
        };

        const finalNametag = getPlaceholder(format, [placeholderData]);
        if (finalNametag) {
          player.nameTag = finalNametag;
        }
      } catch (error) {
        console.warn(`Error updating nametag for ${player.name}:`, error)
      }
    }
  } catch (error) {
    console.warn("Error in nametag update interval:", error)
  }
}, 20)

export { handleNametagConfig }