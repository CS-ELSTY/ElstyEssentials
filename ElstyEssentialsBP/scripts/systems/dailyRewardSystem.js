// Elsty Essentials - Daily Reward System
import { world, system, ActionFormData } from "../core.js"
import { Database } from "../function/Database.js"
import { getScore } from "../function/moneySystem.js"

// Database untuk menyimpan data daily rewards
const dailyDB = new Database("daily_rewards")

// Konfigurasi rewards per hari
const DAILY_REWARDS = {
  1: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  2: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  3: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  4: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  5: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  6: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  7: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  8: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  9: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  10: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  11: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  12: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  13: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  14: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  15: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  16: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  17: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  18: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  19: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  20: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  21: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  22: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  23: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  24: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  25: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  26: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_beef", streakBonus: 0 },
  27: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 },
  28: { money: 1000, key: "wg:daily_key", food: "minecraft:cooked_porkchop", streakBonus: 0 },
  29: { money: 1000, key: "wg:daily_key", food: "minecraft:bread", streakBonus: 0 },
  30: { money: 1000, key: "wg:daily_key", food: "minecraft:golden_apple", streakBonus: 0 }
}

// Cek apakah player bisa claim daily reward
function canClaimDaily(playerId) {
  const data = dailyDB.get(playerId, { lastClaim: 0, streak: 0 })
  const now = Date.now()
  const lastClaim = data.lastClaim || 0
  const oneDay = 24 * 60 * 60 * 1000 // 24 jam dalam milidetik

  // Jika belum pernah claim (lastClaim = 0), bisa langsung claim
  if (lastClaim === 0) {
    return true
  }

  return (now - lastClaim) >= oneDay
}

// Cek apakah streak sudah reset (lebih dari 48 jam)
function isStreakReset(playerId) {
  const data = dailyDB.get(playerId, { lastClaim: 0, streak: 0 })
  const now = Date.now()
  const lastClaim = data.lastClaim || 0
  const twoDays = 48 * 60 * 60 * 1000 // 48 jam dalam milidetik
  
  return (now - lastClaim) >= twoDays
}

// Get player daily data
function getPlayerDailyData(playerId) {
  return dailyDB.get(playerId, { lastClaim: 0, streak: 0 })
}

// Update player daily data
function updatePlayerDailyData(playerId, data) {
  dailyDB.set(playerId, data)
}

// Claim daily reward
export function claimDailyReward(player) {
  const playerId = player.name
  const data = getPlayerDailyData(playerId)
  
  if (!canClaimDaily(playerId)) {
    const now = Date.now()
    const lastClaim = data.lastClaim || 0
    const timeLeft = 24 * 60 * 60 * 1000 - (now - lastClaim)
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000))
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
    
    player.sendMessage("§c§lDaily Reward§r")
    player.sendMessage(`§7You can claim again in §e${hoursLeft}h ${minutesLeft}m§7!`)
    player.playSound("note.bass")
    return false
  }
  
  // Cek apakah streak reset
  let streak = data.streak || 0
  if (isStreakReset(playerId)) {
    streak = 0
    player.sendMessage("§e§lStreak Reset!§r")
    player.sendMessage("§7You missed a day, streak has been reset to 0.")
  }
  
  streak++
  const maxDay = Math.min(streak, 30)
  const reward = DAILY_REWARDS[maxDay]
  
  // Berikan reward
  const totalMoney = reward.money + reward.streakBonus
  const currentMoney = getScore(player, "money") || 0
  player.runCommand(`scoreboard players add @s money ${totalMoney}`)
  
  // Berikan key
  if (reward.key) {
    const keyName = reward.key.replace("wg:", "").replace("_", " ").toUpperCase()
    player.runCommand(`give @s ${reward.key} 1`)
    player.sendMessage(`§a+1 §e${keyName}§r`)
  }
  
  // Berikan food
  if (reward.food) {
    const foodName = reward.food.replace("minecraft:", "").replace("_", " ").toUpperCase()
    player.runCommand(`give @s ${reward.food} 16`)
    player.sendMessage(`§a+16 §e${foodName}§r`)
  }
  
  // Update data
  updatePlayerDailyData(playerId, {
    lastClaim: Date.now(),
    streak: streak
  })
  
  // Tampilkan pesan reward
  player.sendMessage("§6§l=== DAILY REWARD ===§r")
  player.sendMessage(`§7Day: §e${streak}§7/30`)
  player.sendMessage(`§7Money: §a+${totalMoney.toLocaleString()}§r`)
  if (reward.streakBonus > 0) {
    player.sendMessage(`§7Streak Bonus: §a+${reward.streakBonus.toLocaleString()}§r`)
  }
  if (reward.key) {
    player.sendMessage(`§7Key: §e+1 ${reward.key.replace("wg:", "").toUpperCase()}§r`)
  }
  if (reward.food) {
    player.sendMessage(`§7Food: §e+16 ${reward.food.replace("minecraft:", "").toUpperCase()}§r`)
  }
  player.sendMessage("§6§l===================§r")
  player.playSound("random.levelup")
  
  return true
}

// Tampilkan daily reward menu
export function showDailyRewardMenu(player) {
  const playerId = player.name
  const data = getPlayerDailyData(playerId)
  const canClaim = canClaimDaily(playerId)
  const streak = data.streak || 0
  
  const form = new ActionFormData()
    .title("§6§lDaily Rewards")
    .body(`§eCurrent Streak: §6${streak}§e/30\n\n§7Claim your daily rewards and build up your streak for better rewards!`)
  
  // Tampilkan preview rewards untuk beberapa hari ke depan
  let previewText = "§7Upcoming Rewards:\n"
  for (let i = 1; i <= 5; i++) {
    const day = streak + i
    if (day > 30) break
    const reward = DAILY_REWARDS[day]
    const keyText = reward.key ? `§e+1 ${reward.key.replace("wg:", "").toUpperCase()}` : ""
    const foodText = reward.food ? `§e+16 ${reward.food.replace("minecraft:", "").toUpperCase()}` : ""
    previewText += `§7Day ${day}: §a${reward.money.toLocaleString()} ${keyText} ${foodText}\n`
  }
  
  form.body(form.body + "\n" + previewText)
  
  if (canClaim) {
    form.button("§a§lClaim Reward", "textures/menu/member/rewards")
  } else {
    const now = Date.now()
    const lastClaim = data.lastClaim || 0
    const timeLeft = 24 * 60 * 60 * 1000 - (now - lastClaim)
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000))
    const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
    form.button(`§cClaim in ${hoursLeft}h ${minutesLeft}m`, "textures/menu/member/rewards")
  }

  form.button("§cClose", "textures/icons/back")
  
  form.show(player).then(response => {
    if (response.canceled || response.selection === 1) return
    
    if (response.selection === 0 && canClaim) {
      claimDailyReward(player)
    }
  })
}

// Tampilkan all rewards preview
export function showAllRewardsPreview(player) {
  const form = new ActionFormData()
    .title("§6§lAll Daily Rewards")
    .body("§7Complete list of daily rewards:\n\n")
  
  let rewardsText = ""
  for (let day = 1; day <= 30; day++) {
    const reward = DAILY_REWARDS[day]
    const keyText = reward.key ? `§e+1 ${reward.key.replace("wg:", "").toUpperCase()}` : ""
    const foodText = reward.food ? `§e+16 ${reward.food.replace("minecraft:", "").toUpperCase()}` : ""
    const bonusText = reward.streakBonus > 0 ? ` §7(§a+${reward.streakBonus.toLocaleString()} bonus§7)` : ""
    rewardsText += `§7Day ${day}: §a${reward.money.toLocaleString()}${bonusText} ${keyText} ${foodText}\n`
  }
  
  form.body(form.body + rewardsText)
  form.button("§cClose", "textures/ui/cancel")
  
  form.show(player)
}

// Initialize daily reward system
export function initializeDailyRewardSystem() {
  console.warn("[Daily Reward] System initialized!")
}

// Command handler untuk daily reward
export function handleDailyCommand(player) {
  showDailyRewardMenu(player)
}