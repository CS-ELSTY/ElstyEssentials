// Elsty Essentials - Leaderboard Logic
// Berdasarkan arsitektur referensi CONTOH_ADDON_LAIN
import { world, system } from "../../core.js"
import { getScore } from "../../function/moneySystem.js"
import { getBank } from "../../social/bankSystem.js"
import { getRank } from "../../function/getRank.js"

export const MONEY_DISPLAY_OPTIONS = {
  FULL: "full",
  TRUNCATED: "truncated",
  STARS: "stars",
}

let moneyDisplayMode = MONEY_DISPLAY_OPTIONS.TRUNCATED

export function getMoneyDisplayMode() {
  const savedMode = world.getDynamicProperty("elsty:moneyDisplayMode")
  return savedMode || moneyDisplayMode
}

export function setMoneyDisplayMode(mode) {
  if (Object.values(MONEY_DISPLAY_OPTIONS).includes(mode)) {
    world.setDynamicProperty("elsty:moneyDisplayMode", mode)
    moneyDisplayMode = mode
  }
}

// Format number dengan metric system (1.2M, 345K, dll)
function metricNumbers(numStr) {
  const num = parseFloat(numStr)
  if (isNaN(num)) return "0"

  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

export function formatMoneyDisplay(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return "0"
  }

  const mode = getMoneyDisplayMode()
  switch (mode) {
    case MONEY_DISPLAY_OPTIONS.FULL:
      return value.toString()
    case MONEY_DISPLAY_OPTIONS.STARS:
      return "****"
    case MONEY_DISPLAY_OPTIONS.TRUNCATED:
    default:
      return metricNumbers(value.toString())
  }
}

// Format playtime ke unit yang berbeda
function formatPlaytime(score, unitIndex) {
  switch (unitIndex) {
    case 0:
      return `${score} Seconds`
    case 1:
      return `${Math.floor(score / 60)} Minutes`
    case 2:
      return `${(score / 3600).toFixed(2)} Hours`
    case 3:
      return `${(score / 86400).toFixed(2)} Days`
    default:
      return `${score} Seconds`
  }
}

function getPlaytimeNumericValue(score, unitIndex) {
  switch (unitIndex) {
    case 0:
      return score
    case 1:
      return score / 60
    case 2:
      return score / 3600
    case 3:
      return score / 86400
    default:
      return score
  }
}

// ============== MAIN UPDATE FUNCTION ==============
export function updateLeaderboard(entity, data) {
  try {
    // Data structure: [title, objectiveId, sortDesc, showNumbers, enumColor, nameColor, scoreColor, limit, cachedScores, cachedNumericScores, playtimeUnit]

    // Handle online_time leaderboard
    if (data[1] === "online_time") {
      const onlinePlayers = world.getPlayers()
      const scores = {}
      const numericScores = {}

      for (const player of onlinePlayers) {
        const playtimeScore = getScore(player, "playtime") || 0
        scores[player.name] = formatPlaytime(playtimeScore, data[10] ?? 2)
        numericScores[player.name] = getPlaytimeNumericValue(playtimeScore, data[10] ?? 2)
      }

      const cachedScores = data[8] || {}
      const cachedNumericScores = data[9] || {}

      // Hapus player yang offline dari cache
      Object.keys(cachedScores).forEach(playerName => {
        if (!scores[playerName]) {
          delete cachedScores[playerName]
          delete cachedNumericScores[playerName]
        }
      })

      Object.assign(cachedScores, scores)
      Object.assign(cachedNumericScores, numericScores)

      const sortedScores = Object.entries(cachedNumericScores)
        .map(([name, numericScore]) => ({
          name,
          numericScore,
          displayScore: cachedScores[name] || scores[name],
        }))
        .sort((a, b) => (data[2] ? b.numericScore - a.numericScore : a.numericScore - b.numericScore))
        .slice(0, data[7])

      const separator = "§8" + "=".repeat(28)
      const rankColors = ["§6", "§b", "§a"]
      const entries = sortedScores.map(({ name, displayScore }, i) => {
        const color = rankColors[i] || "§f"
        const player = onlinePlayers.find(p => p.name === name)
        const rankDisplay = player ? getRank(player) : "§7"
        const displayName = name.length > 16 ? name.substring(0, 14) + ".." : name.padEnd(16, " ")
        const numStr = (i + 1).toString().padStart(2, " ")
        return `${color}#${numStr} §r${rankDisplay} ${data[5]}${displayName}§r §8| ${data[6]}${displayScore}§r`
      })

      entity.nameTag = [`§l${data[0] || "ONLINE PLAYERS"}§r`, `§8(Current online: ${onlinePlayers.length})`, separator, ...entries.map(e => e.replace(/^\s+/gm, "")), separator].join("\n")

      data[8] = cachedScores
      data[9] = cachedNumericScores
      entity.setDynamicProperty("elsty:scoreboardData", JSON.stringify(data))
      return
    }

    // Handle regular scoreboard objectives
    const objective = world.scoreboard.getObjective(data[1])
    if (!objective) {
      try {
        world.getDimension("overworld").runCommand(`scoreboard objectives add ${data[1]} dummy`)
      } catch (e) {
        // Objective tidak bisa dibuat
      }

      const retryObjective = world.scoreboard.getObjective(data[1])
      if (!retryObjective) {
        entity.nameTag = `§l${data[0] || "LEADERBOARD"}§r\n§8${"".repeat(28)}\n§cScoreboard '${data[1]}' not found!\n§7Please create it first.\n§8${"".repeat(28)}`
        return
      }
    }

    const scores = {}
    const numericScores = {}

    for (const player of world.getPlayers()) {
      try {
        if (data[1] === "money") {
          // Money system - gunakan getScore dengan objective "money"
          const moneyAmount = getScore(player, "money") || 0
          scores[player.name] = parseInt(moneyAmount.toString())
          numericScores[player.name] = parseInt(moneyAmount.toString())
        } else if (data[1] === "bank") {
          // Bank system - gunakan getBank
          const bankAmount = getBank(player)
          scores[player.name] = parseInt(bankAmount.toString())
          numericScores[player.name] = parseInt(bankAmount.toString())
        } else if (data[1] === "playtime") {
          const score = getScore(player, data[1]) || 0
          numericScores[player.name] = getPlaytimeNumericValue(score, data[10] ?? 2)
          scores[player.name] = formatPlaytime(score, data[10] ?? 2)
        } else {
          const score = getScore(player, data[1]) || 0
          scores[player.name] = score
          numericScores[player.name] = score
        }
      } catch (e) {
        // Skip player jika error
      }
    }

    const cachedScores = data[8] || {}
    const cachedNumericScores = data[9] || {}

    Object.assign(cachedScores, scores)
    Object.assign(cachedNumericScores, numericScores)

    const sortedScores = Object.entries(cachedNumericScores)
      .map(([name, numericScore]) => ({
        name,
        numericScore: numericScore || 0,
        displayScore: cachedScores[name] || scores[name] || 0,
      }))
      .sort((a, b) => (data[2] ? b.numericScore - a.numericScore : a.numericScore - b.numericScore))
      .slice(0, data[7])

    const separator = "§8" + "=".repeat(28)
    const rankColors = ["§6", "§b", "§a"]
    const entries = sortedScores.map(({ name, displayScore }, i) => {
      const color = rankColors[i] || "§f"
      const player = world.getPlayers().find(p => p.name === name)
      const rankDisplay = player ? getRank(player) : "§7"
      const displayName = name.length > 16 ? name.substring(0, 14) + ".." : name.padEnd(16, " ")
      const numStr = (i + 1).toString().padStart(2, " ")
      let finalDisplayScore = displayScore || 0

      if (data[1] === "money") {
        finalDisplayScore = formatMoneyDisplay(displayScore || 0)
      } else if (data[1] === "bank") {
        finalDisplayScore = formatMoneyDisplay(displayScore || 0)
      }

      return `${color}#${numStr} §r${rankDisplay} ${data[5]}${displayName}§r §8| ${data[6]}${finalDisplayScore}§r`
    })

    entity.nameTag = [`§l${data[0] || "LEADERBOARD"}§r`, separator, ...entries.map(e => e.replace(/^\s+/gm, "")), separator].join("\n")

    data[8] = cachedScores
    data[9] = cachedNumericScores
    entity.setDynamicProperty("elsty:scoreboardData", JSON.stringify(data))
  } catch (error) {
    console.warn("[FloatingText] Error in updateLeaderboard:", error)
  }
}

// Get sorted objectives untuk dropdown menu
export function getSortedObjectives() {
  const allowedObjectives = {
    money: "Money Leaderboard",
    bank: "Bank Leaderboard",
    kills: "Kill Leaderboard",
    deaths: "Death Leaderboard",
    mining: "Top Mining",
    playtime: "Playtime Leaderboard",
    online_time: "Online Time Leaderboard",
  }

  const priority = ["money", "bank", "kills", "deaths", "mining", "playtime", "online_time"]
  const existingObjectives = world.scoreboard.getObjectives()

  const allObjectives = existingObjectives.map(obj => ({
    id: obj.id,
    displayName: allowedObjectives[obj.id] ?? obj.displayName,
  }))

  // Tambahkan objectives yang belum ada tapi di priority list
  for (const id of priority) {
    if (!allObjectives.find(obj => obj.id === id)) {
      allObjectives.push({
        id,
        displayName: allowedObjectives[id] ?? id,
      })
    }
  }

  // Sort berdasarkan priority, lalu alphabetically
  allObjectives.sort((a, b) => {
    const aIndex = priority.indexOf(a.id)
    const bIndex = priority.indexOf(b.id)

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    } else if (aIndex !== -1) {
      return -1
    } else if (bIndex !== -1) {
      return 1
    } else {
      return a.displayName.localeCompare(b.displayName)
    }
  })

  return allObjectives
}