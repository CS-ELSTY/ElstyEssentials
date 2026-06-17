// Elsty Essentials - Floating Text System
// Berdasarkan arsitektur referensi CONTOH_ADDON_LAIN
import { system, world, ActionFormData } from "../../core.js"
import { updateLeaderboard, MONEY_DISPLAY_OPTIONS, getMoneyDisplayMode, setMoneyDisplayMode } from "./leaderboard.js"
import { floatingTextMenu, newText, newLeaderboard, createCountdownText, showTexts } from "./forms/floatingTextMenus.js"

const DIMENSIONS = ["overworld", "nether", "the_end"]

const getDimension = name => world.getDimension(name)

// ============== UPDATE LOOP ==============
// Pattern: Single loop dengan counter untuk update terjadwal
let updateCounter = 0

system.runInterval(() => {
  updateCounter++

  // Update countdown setiap 1 detik (20 ticks)
  if (updateCounter % 20 === 0) {
    updateCountdownTexts()
  }

  // Update leaderboard setiap 5 detik (100 ticks)
  if (updateCounter % 100 === 0) {
    const updates = new Map()
    DIMENSIONS.forEach(dim => {
      try {
        getDimension(dim)
          .getEntities({ type: "lildanlid:floatingtext", families: ["scoreboard"] })
          .forEach(entity => {
            try {
              const data = JSON.parse(entity.getDynamicProperty("elsty:scoreboardData") ?? "null")
              if (data) updates.set(entity, data)
            } catch (e) {
              // Skip entity dengan data corrupt
            }
          })
      } catch (e) {
        // Skip dimension jika error
      }
    })

    updates.forEach((data, entity) => {
      try {
        updateLeaderboard(entity, data)
      } catch (e) {
        console.warn("[FloatingText] Error updating leaderboard entity:", e)
      }
    })
  }

  // Reset counter untuk mencegah overflow
  if (updateCounter >= 1000) updateCounter = 0
}, 1)

// ============== COUNTDOWN UPDATE ==============
function updateCountdownTexts() {
  const timezone = world.getDynamicProperty("time:timezone") || "UTC+7"
  const serverTimezoneOffset = parseInt(timezone.replace("UTC", "")) || 7

  DIMENSIONS.forEach(dim => {
    try {
      getDimension(dim)
        .getEntities({ type: "lildanlid:floatingtext", tags: ["elsty:countdown"] })
        .forEach(entity => {
          try {
            const countdownData = JSON.parse(entity.getDynamicProperty("elsty:countdownData") ?? "null")
            if (!countdownData) return

            // Adjust timezone jika berubah
            if (countdownData.timezone !== serverTimezoneOffset) {
              const timeDiff = (serverTimezoneOffset - countdownData.timezone) * 60 * 60 * 1000
              countdownData.targetTime -= timeDiff
              countdownData.timezone = serverTimezoneOffset
              entity.setDynamicProperty("elsty:countdownData", JSON.stringify(countdownData))
            }

            const now = Date.now()
            const timeLeft = countdownData.targetTime - now

            if (timeLeft <= 0) {
              entity.nameTag = `${countdownData.titleColor}${countdownData.title}\n§r${countdownData.timeColor}Time's up!`
              return
            }

            const seconds = Math.floor(timeLeft / 1000) % 60
            const minutes = Math.floor(timeLeft / (1000 * 60)) % 60
            const hours = Math.floor(timeLeft / (1000 * 60 * 60)) % 24
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))

            let timeString
            switch (countdownData.formatIndex) {
              case 1:
                timeString = `${days}d ${hours}h ${minutes}m`
                break
              case 2:
                timeString = `${hours + days * 24}h ${minutes}m ${seconds}s`
                break
              case 3:
                timeString = `${hours + days * 24}h ${minutes}m`
                break
              default:
                timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`
            }

            entity.nameTag = `${countdownData.titleColor}${countdownData.title}\n§r${countdownData.timeColor}${timeString}`
          } catch (e) {
            console.warn("[FloatingText] Error updating countdown entity:", e)
          }
        })
    } catch (e) {
      console.warn("[FloatingText] Error getting entities in dimension:", dim, e)
    }
  })
}

// ============== EXPORT FUNCTIONS ==============
export { floatingTextMenu }