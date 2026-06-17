import { system, world, ActionFormData, ModalFormData, MessageFormData } from "../../core.js"
import { showMainMenu } from "../../elsty.js"
import { showRankCustomizeMenu } from "./rank_customize.js"
import { rankDefault } from "./rank_default.js"
import { showRankSubscriptionAdminMenu } from "./rank_subscription.js"
import { RankDatabase } from "./rank_database.js"

export const uuidRanks = [
  "", // Owner
  "", // Admin
  "", // Member
  "", // Vip
  "", // Diamond
  "", // Iron
  "", // Gold
  "", // Stone
  "", // Noob
  "", // End
  "", // Nether
  "", // Space
  "", // Fire
  "", // Water
  "", // Air
  "", // Twitch
  "", // Youtube
  "", // Sniper
  "", // Command
  "", // Builder
  "", // Legends
  "", // Discord
  "", // Helper
  "", // Kingdom
  "", // Dead
  "", // Hacker
  "", // Designer
  "", // Kill
  "", // Pixel
  "", // Dev
]

export const RANK_PREFIX = "rank:"
let defaultRank = ""
let customRankList = []

RankDatabase.loadCustomRankList(list => {
  customRankList = list
})

const getPlayers = () => [...world.getPlayers()]

export const setRank = (player, rank) => {
  const rankTags = player.getTags().filter(t => t.startsWith(RANK_PREFIX))
  for (const tag of rankTags) {
    player.removeTag(tag)
  }
  player.addTag(`${RANK_PREFIX}${rank}`)
  player.sendMessage(`§aRank set: ${rank}`)
  player.playSound("random.levelup")
}

const removeRank = player => {
  const tags = player.getTags().filter(t => t.startsWith(RANK_PREFIX))
  if (tags.length) {
    for (const tag of tags) {
      player.removeTag(tag)
    }
    player.sendMessage("§aRank removed")
    player.playSound("random.pop")
  } else {
    player.sendMessage("§cNo rank to remove")
  }
}

export const checkPlayerRank = player => {
  const tags = player.getTags().filter(t => t.startsWith(RANK_PREFIX))
  if (!tags.length || tags.includes(RANK_PREFIX)) {
    for (const tag of tags) {
      player.removeTag(tag)
    }
    setRank(player, defaultRank)
    console.warn(`Set default rank '${defaultRank}' for ${player.name}`)
    return defaultRank
  }
  return tags[0].slice(RANK_PREFIX.length)
}

export const getPlayerRank = player => {
  const rankTag = player.getTags().find(t => t.startsWith(RANK_PREFIX))
  return rankTag ? rankTag.slice(RANK_PREFIX.length) : checkPlayerRank(player)
}

export const getRankInfo = rank => {
  const rankKey = `${RANK_PREFIX}${rank}`
  return rankDefault.ranks[rankKey] || null
}

export const executeRankCommand = (player, cmd) => {
  const rank = getPlayerRank(player)
  const rankInfo = getRankInfo(rank)
  if (!rankInfo) return false

  const command = rankInfo.commands[cmd]
  if (!command) return false

  player.runCommand(command.cmd)
  player.sendMessage(command.msg)
  return true
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  system.run(() => {
    const tags = player.getTags().filter(t => t.startsWith(RANK_PREFIX))
    if (!tags.length || tags.includes(RANK_PREFIX)) {
      for (const tag of tags) {
        player.removeTag(tag)
      }
      setRank(player, defaultRank)
      console.warn(`Auto-assigned default rank '${defaultRank}' to ${player.name} on join`)
    }
  })
})

system.runTimeout(() => {
  const players = getPlayers()
  for (const player of players) {
    checkPlayerRank(player)
  }
}, 20)

export const openAdminPanel = player =>
  new ActionFormData()
    .title("§6Admin Rank Panel")
    .body("§eChoose action:")
    .button("Set Rank", "textures/ui/icon_steve")
    .button("Remove Rank", "textures/ui/trash_default")
    .button("Add Custom", "textures/ui/creative_icon")
    .button("List Ranks Have Skill", "textures/items/villagebell")
    .button("Set Default", "textures/ui/icon_sign")
    .button("Rank Customize", "textures/ui/icon_recipe_item")
    .button("Rank Subscription", "textures/ui/timer")
    .button("Back", "textures/ui/arrow_left")
    .show(player)
    .then(({ canceled, selection }) => {
      if (canceled) return
      ;[openPlayerSelectionForRank, openPlayerSelectionForRemoval, addCustomRank, listAllRank, setDefaultRankMenu, showRankCustomizeMenu, showRankSubscriptionAdminMenu, showMainMenu][selection](player)
    })
    .catch(e => {
      player.sendMessage(`§cForm error: ${e.message}`)
      console.warn(`Form error in openAdminPanel: ${e}`)
    })

const listAllRank = player => {
  let msg = "§6=== RANKS & PERMISSIONS ===§f\n\n"
  for (const [key, rank] of Object.entries(rankDefault.ranks)) {
    msg += `§l${rank.prefix} ${rank.name} §r(${rank.color}):\n`
    for (const [cmd, info] of Object.entries(rank.commands)) {
      msg += `§7- ${cmd}: §f${info.msg}\n`
    }
    msg += "\n"
  }
  new MessageFormData()
    .title("Rank Skills")
    .body(msg)
    .button1("Back")
    .button2("Customize")
    .show(player)
    .then(({ selection }) => {
      if (selection === 0) openAdminPanel(player)
      if (selection === 1) showRankCustomizeMenu(player)
    })
    .catch(e => {
      player.sendMessage(`§cForm error: ${e.message}`)
      console.warn(`Form error in listAllRank: ${e}`)
    })
}

const openPlayerSelectionForRank = player => {
  const players = getPlayers(),
    names = players.map(p => p.name)
  if (!names.length) return player.sendMessage("§cNo players available")
  new ModalFormData()
    .title("Set Rank")
    .dropdown("Player", names)
    .dropdown("Rank", customRankList.length ? customRankList.concat(uuidRanks) : uuidRanks)
    .show(player)
    .then(({ canceled, formValues }) => {
      if (canceled || !formValues?.length) return
      const [idx, rankIdx] = formValues,
        selPlayer = players[idx],
        ranks = customRankList.length ? customRankList.concat(uuidRanks) : uuidRanks
      if (!selPlayer || rankIdx < 0 || rankIdx >= ranks.length) return player.sendMessage("§cInvalid selection")
      setRank(selPlayer, ranks[rankIdx])
    })
    .catch(e => player.sendMessage(`§cForm error: ${e.message}`))
}

const openPlayerSelectionForRemoval = player => {
  const players = getPlayers(),
    names = players.map(p => p.name)
  if (!names.length) return player.sendMessage("§cNo players available")
  new ModalFormData()
    .title("Remove Rank")
    .dropdown("Player", names)
    .show(player)
    .then(({ canceled, formValues }) => {
      if (canceled || !formValues?.length) return
      const selPlayer = players.find(p => p.name === names[formValues[0]])
      if (!selPlayer) return player.sendMessage("§cPlayer not found")
      removeRank(selPlayer)
    })
    .catch(e => player.sendMessage(`§cForm error: ${e.message}`))
}

const addCustomRank = player => {
  new ModalFormData()
    .title("Add Custom Rank")
    .textField("Rank Name", "Enter rank name", { defaultValue: "Custom Rank" })
    .toggle("Add/Remove\n(ON = Add / OFF = Remove)", { defaultValue: true })
    .show(player)
    .then(({ canceled, formValues }) => {
      if (canceled || !formValues?.length) return
      const rank = formValues[0]?.trim()
      const isAdd = formValues[1]
      if (!rank) return player.sendMessage("§cRank name cannot be empty")
      if (isAdd) {
        if (customRankList.includes(rank)) return player.sendMessage("§cRank already exists in custom list!")
        customRankList.push(rank)
        RankDatabase.saveCustomRankList(customRankList)
        player.sendMessage(`§aCustom rank '${rank}' has been added to the list!`)
        player.playSound("random.levelup")
      } else {
        const index = customRankList.indexOf(rank)
        if (index === -1) return player.sendMessage("§cRank not found in custom list!")
        customRankList.splice(index, 1)
        RankDatabase.saveCustomRankList(customRankList)
        player.sendMessage(`§aCustom rank '${rank}' has been removed from the list!`)
        player.playSound("random.pop")
      }
    })
    .catch(e => player.sendMessage(`§cForm error: ${e.message}`))
}

export const setDefaultRank = player => {
  const tags = player.getTags().filter(t => t.startsWith(RANK_PREFIX))
  for (const tag of tags) {
    player.removeTag(tag)
  }
  player.addTag(`${RANK_PREFIX}${defaultRank}`)
  console.warn(`Set default rank '${defaultRank}' for ${player.name}`)
}

const setDefaultRankMenu = player => {
  const ranks = customRankList.length ? customRankList.concat(uuidRanks) : uuidRanks
  new ModalFormData()
    .title("Set Default Rank")
    .dropdown("Current: " + defaultRank + "\nChoose new default", ranks, {
      defaultValueIndex: ranks.indexOf(defaultRank),
    })
    .show(player)
    .then(({ canceled, formValues }) => {
      if (canceled || !formValues?.length) return
      defaultRank = ranks[formValues[0]]
      player.sendMessage("§aDefault rank updated to: " + defaultRank)
      player.playSound("random.levelup")
    })
    .catch(e => player.sendMessage("§cForm error: " + e.message))
}

export function getAllRanks() {
  return customRankList.length ? customRankList.concat(uuidRanks) : uuidRanks
}

export function isCustomRank(rank) {
  return customRankList.includes(rank)
}
