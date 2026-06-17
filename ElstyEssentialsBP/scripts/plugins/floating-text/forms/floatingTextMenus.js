// Elsty Essentials - Floating Text Forms
// Berdasarkan arsitektur referensi CONTOH_ADDON_LAIN
import { ActionFormData, ModalFormData, world, system } from "../../../core.js"
import { getSortedObjectives, MONEY_DISPLAY_OPTIONS, getMoneyDisplayMode, setMoneyDisplayMode } from "../leaderboard.js"
import { isAdmin } from "../../../function/getAdmin.js"

const COLORS = {
  names: ["§4Dark Red§r", "§cRed§r", "§6Gold§r", "§eYellow§r", "§2Dark Green§r", "§aGreen§r", "§bAqua§r", "§3Dark Aqua§r", "§1Dark Blue§r", "§9Blue§r", "§dLight Purple§r", "§5Dark Purple§r", "§fWhite§r", "§7Gray§r", "§8Dark Gray§r", "§0Black§r"],
  codes: ["§4", "§c", "§6", "§e", "§2", "§a", "§b", "§3", "§1", "§9", "§d", "§5", "§f", "§7", "§8", "§0"],
}

const DIMENSIONS = ["overworld", "nether", "the_end"]

const formatPos = (pos, offset = 0) => `${pos.x.toFixed(2)} ${(pos.y + offset).toFixed(2)} ${pos.z.toFixed(2)}`

const parsePos = (str, offset = 0) => {
  const [x, y, z] = str.trim().split(" ", 3).map(Number)
  return { x, y: y + offset, z }
}

// ============== MAIN MENU ==============
export function floatingTextMenu(viewer, error) {
  // Check if player is admin
  if (!isAdmin(viewer)) {
    viewer.sendMessage("§c§lYou don't have permission to access this menu!")
    viewer.playSound("note.bass")
    return
  }

  let moneyDisplayText
  switch (getMoneyDisplayMode()) {
    case MONEY_DISPLAY_OPTIONS.FULL:
      moneyDisplayText = "§aFull"
      break
    case MONEY_DISPLAY_OPTIONS.STARS:
      moneyDisplayText = "§e****"
      break
    case MONEY_DISPLAY_OPTIONS.TRUNCATED:
    default:
      moneyDisplayText = "§bTruncated"
      break
  }

  new ActionFormData()
    .title("§6§lFloating Text Menu")
    .body(error ?? "")
    .button("§a§lNew Floating Text", "textures/ui/book_addtextpage_default")
    .button("§b§lNew Floating Leaderboard", "textures/ui/book_addpicture_default")
    .button("§e§lNew Countdown", "textures/ui/timer")
    .button("§d§lEdit Loaded Texts", "textures/ui/icon_book_writable")
    .button(`§fMoney Display: ${moneyDisplayText}`, "textures/ui/debug_glyph_color")
    .show(viewer)
    .then(({ selection, canceled }) => {
      if (canceled) return
      const actions = [newText, newLeaderboard, createCountdownText, showTexts, toggleMoneyDisplayMode]
      actions[selection]?.(viewer)
    })
}

// ============== NEW TEXT ==============
export function newText(viewer) {
  if (!isAdmin(viewer)) {
    viewer.sendMessage("§c§lYou don't have permission to create floating text!")
    viewer.playSound("note.bass")
    return
  }

  new ModalFormData()
    .title("§6§lNew Floating Text")
    .textField("§eText to Display", "Use \\n for new lines")
    .textField("§ePosition (X Y Z)", "Format: X Y Z")
    .show(viewer)
    .then(({ formValues, canceled }) => {
      if (canceled) return

      const pos = parsePos(formValues[1] || formatPos(viewer.location), -0.58)

      try {
        const entity = viewer.dimension.spawnEntity("lildanlid:floatingtext", pos)
        entity.triggerEvent("text")
        entity.nameTag = (formValues[0] || "Floating Text").replace(/\\n/g, "\n")
        entity.setDynamicProperty("elsty:fixedPosition", JSON.stringify(pos))
        entity.addTag("elsty:text")
        entity.addTag("fixed_position")
        viewer.playSound("random.levelup")
      } catch (e) {
        viewer.sendMessage("§c§lFailed to spawn entity: " + e.message)
      }
    })
}

// ============== NEW LEADERBOARD ==============
export function newLeaderboard(viewer) {
  if (!isAdmin(viewer)) {
    viewer.sendMessage("§c§lYou don't have permission to create leaderboard!")
    viewer.playSound("note.bass")
    return
  }

  const sortedObjectives = getSortedObjectives()
  const objectives = sortedObjectives.map(obj => obj.id)
  const objectiveNames = sortedObjectives.map(obj => obj.displayName)
  const pos = viewer.location

  const form = new ModalFormData()
    .title("§6§lNew Floating Leaderboard")
    .textField("§eLeaderboard Title", "Custom title")
    .dropdown("§eScoreboard Objective", objectiveNames, { defaultValueIndex: 0 })
    .textField("§ePosition (X Y Z)", "Format: X Y Z")
    .dropdown("§eSort Order", ["Ascending", "Descending"], { defaultValueIndex: 1 })
    .toggle("§eShow Numbers (#1, #2)", { defaultValue: true })
    .dropdown("§eNumber Color", COLORS.names, { defaultValueIndex: 2 })
    .dropdown("§eName Color", COLORS.names, { defaultValueIndex: 12 })
    .dropdown("§eScore Color", COLORS.names, { defaultValueIndex: 1 })
    .slider("§eLines to Display", 1, 15)

  form.show(viewer).then(response => {
    if (response.canceled) return

    const values = response.formValues
    const pos = parsePos(values[2] || formatPos(pos), -0.58)

    try {
      const entity = viewer.dimension.spawnEntity("lildanlid:floatingtext", pos)
      entity.triggerEvent("scoreboard")

      // Data structure: [title, objectiveId, sortDesc, showNumbers, enumColor, nameColor, scoreColor, limit, cachedScores, cachedNumericScores, playtimeUnit]
      entity.setDynamicProperty("elsty:scoreboardData", JSON.stringify([
        values[0] || "Leaderboard",  // title
        objectives[values[1]],        // objectiveId
        values[3],                    // sortDesc
        values[4],                    // showNumbers
        COLORS.codes[values[5]],      // enumColor
        COLORS.codes[values[6]],      // nameColor
        COLORS.codes[values[7]],      // scoreColor
        values[8],                    // limit
        {},                           // cachedScores
        {},                           // cachedNumericScores
        2                             // playtimeUnit (default: hours)
      ]))

      entity.nameTag = "LOADING..."
      entity.setDynamicProperty("elsty:fixedPosition", JSON.stringify(pos))
      viewer.playSound("random.levelup")
    } catch (e) {
      viewer.sendMessage("§c§lFailed to spawn entity: " + e.message)
    }
  })
}

// ============== NEW COUNTDOWN ==============
export function createCountdownText(viewer) {
  if (!isAdmin(viewer)) {
    viewer.sendMessage("§c§lYou don't have permission to create countdown!")
    viewer.playSound("note.bass")
    return
  }

  const timezone = world.getDynamicProperty("time:timezone") || "UTC+7"
  const timezoneOffset = parseInt(timezone.replace("UTC", "")) || 7

  const now = new Date()
  now.setHours(now.getHours() + timezoneOffset - new Date().getTimezoneOffset() / 60)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const defaultDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

  new ModalFormData()
    .title("§6§lCountdown Text")
    .textField("§eTitle", "Event title")
    .textField("§eTarget Date", "YYYY-MM-DD")
    .textField("§eTarget Time", "HH:MM")
    .dropdown("§eFormat", ["Days, Hours, Minutes, Seconds", "Days, Hours, Minutes", "Hours, Minutes, Seconds", "Hours, Minutes"], { defaultValueIndex: 0 })
    .dropdown("§eTitle Color", COLORS.names, { defaultValueIndex: 5 })
    .dropdown("§eTime Color", COLORS.names, { defaultValueIndex: 2 })
    .textField("§ePosition (X Y Z)", "Format: X Y Z")
    .show(viewer)
    .then(({ formValues, canceled }) => {
      if (canceled) return

      const title = formValues[0] || "Event Countdown"
      const dateStr = formValues[1] || defaultDate
      const timeStr = formValues[2] || defaultTime
      const formatIndex = formValues[3]
      const titleColor = COLORS.codes[formValues[4]]
      const timeColor = COLORS.codes[formValues[5]]
      const pos = parsePos(formValues[6] || formatPos(viewer.location), -0.58)

      try {
        const [year, month, day] = dateStr.split("-").map(Number)
        const [hours, minutes] = timeStr.split(":").map(Number)
        const targetDate = new Date(Date.UTC(year, month - 1, day, hours - timezoneOffset, minutes, 0))
        const timestamp = targetDate.getTime()

        if (isNaN(timestamp)) {
          viewer.sendMessage("§cInvalid date or time format. Please try again.")
          return
        }

        const entity = viewer.dimension.spawnEntity("lildanlid:floatingtext", pos)
        entity.triggerEvent("text")

        entity.nameTag = `${titleColor}${title}\n§rLoading countdown...`
        entity.setDynamicProperty("elsty:fixedPosition", JSON.stringify(pos))
        entity.setDynamicProperty("elsty:countdownData", JSON.stringify({
          title,
          targetTime: timestamp,
          formatIndex,
          titleColor,
          timeColor,
          created: Date.now(),
          timezone: timezoneOffset,
        }))
        entity.addTag("elsty:countdown")
        entity.addTag("fixed_position")

        viewer.sendMessage(`§aCountdown created successfully!\n§7Using timezone: UTC${timezoneOffset >= 0 ? "+" : ""}${timezoneOffset}`)
        viewer.playSound("random.levelup")
      } catch (error) {
        viewer.sendMessage("§cError creating countdown: " + error.message)
      }
    })
}

// ============== EDIT TEXT ==============
export function editText(viewer, entity) {
  const pos = entity.location

  new ModalFormData()
    .title("§6§lEdit Text")
    .textField("§eText to Display", "Use \\n for new lines")
    .textField("§ePosition (X Y Z)", "Format: X Y Z")
    .toggle("§c§lDelete Floating Text?§r", { defaultValue: false })
    .show(viewer)
    .then(response => {
      if (response.canceled) return

      const values = response.formValues

      if (values[2]) {
        entity.remove()
        viewer.sendMessage("§aFloating text has been deleted successfully!")
        viewer.playSound("random.break")
        return
      }

      const newPos = parsePos(values[1] || formatPos(pos, 0.58), -0.58)
      entity.nameTag = (values[0] || entity.nameTag.replace(/\n/g, "\\n")).replace(/\\n/g, "\n")
      entity.teleport(newPos)
      entity.setDynamicProperty("elsty:fixedPosition", JSON.stringify(newPos))
      viewer.playSound("random.levelup")
    })
}

// ============== EDIT LEADERBOARD ==============
export function editLeaderboard(viewer, entity) {
  const pos = entity.location
  const sortedObjectives = getSortedObjectives()
  const objectives = sortedObjectives.map(obj => obj.id)
  const objectiveNames = sortedObjectives.map(obj => obj.displayName)
  const data = JSON.parse(entity.getDynamicProperty("elsty:scoreboardData"))
  const objectiveIndex = objectives.indexOf(data[1])

  const moneyDisplayOptions = ["Full (123456789)", "Truncated (123.4M)", "Stars (****)"]
  let currentMoneyDisplayMode = getMoneyDisplayMode()
  let moneyDisplayIndex = 1

  switch (currentMoneyDisplayMode) {
    case MONEY_DISPLAY_OPTIONS.FULL:
      moneyDisplayIndex = 0
      break
    case MONEY_DISPLAY_OPTIONS.STARS:
      moneyDisplayIndex = 2
      break
    case MONEY_DISPLAY_OPTIONS.TRUNCATED:
    default:
      moneyDisplayIndex = 1
      break
  }

  const form = new ModalFormData()
    .title("§6§lEdit Leaderboard")
    .textField("§eLeaderboard Title", "Title")
    .dropdown("§eScoreboard Objective", objectiveNames, { defaultValueIndex: objectiveIndex >= 0 ? objectiveIndex : 0 })
    .textField("§ePosition (X Y Z)", "Format: X Y Z")
    .dropdown("§eSort Order", ["Ascending", "Descending"], { defaultValueIndex: data[2] ? 1 : 0 })
    .toggle("§eShow Numbers", { defaultValue: data[3] })
    .dropdown("§eNumber Color", COLORS.names, { defaultValueIndex: Math.max(0, COLORS.codes.indexOf(data[4])) })
    .dropdown("§eName Color", COLORS.names, { defaultValueIndex: Math.max(0, COLORS.codes.indexOf(data[5])) })
    .dropdown("§eScore Color", COLORS.names, { defaultValueIndex: Math.max(0, COLORS.codes.indexOf(data[6])) })
    .slider("§eLines to Display", 1, 15)

  if (data[1] === "money") {
    form.dropdown("§eMoney Display Format", moneyDisplayOptions, moneyDisplayIndex)
  }

  form.toggle("§c§lDelete Leaderboard", { defaultValue: false })
  form.show(viewer).then(response => {
    if (response.canceled) return

    const values = response.formValues
    const deleteIndex = data[1] === "money" ? 10 : 9

    if (values[deleteIndex]) {
      entity.remove()
      viewer.sendMessage("§aLeaderboard has been deleted successfully!")
      viewer.playSound("random.break")
      return
    }

    if (objectives[values[1]] === "money") {
      const moneyFormatIndex = data[1] === "money" ? values[9] : moneyDisplayIndex
      let newMoneyDisplayMode

      switch (moneyFormatIndex) {
        case 0:
          newMoneyDisplayMode = MONEY_DISPLAY_OPTIONS.FULL
          break
        case 2:
          newMoneyDisplayMode = MONEY_DISPLAY_OPTIONS.STARS
          break
        case 1:
        default:
          newMoneyDisplayMode = MONEY_DISPLAY_OPTIONS.TRUNCATED
          break
      }

      setMoneyDisplayMode(newMoneyDisplayMode)
    }

    const newPos = parsePos(values[2], -0.58)
    entity.nameTag = "LOADING..."
    entity.setDynamicProperty("elsty:scoreboardData", JSON.stringify([
      values[0],
      objectives[values[1]],
      values[3],
      values[4],
      COLORS.codes[values[5]],
      COLORS.codes[values[6]],
      COLORS.codes[values[7]],
      values[8],
      data[8],
      data[9],
      data[10]
    ]))
    entity.teleport(newPos)
    entity.setDynamicProperty("elsty:fixedPosition", JSON.stringify(newPos))
    viewer.sendMessage("§aLeaderboard has been updated successfully!")
    viewer.playSound("random.levelup")
  })
}

// ============== EDIT COUNTDOWN ==============
export function editCountdown(viewer, entity) {
  const timezone = world.getDynamicProperty("time:timezone") || "UTC+7"
  const timezoneOffset = parseInt(timezone.replace("UTC", "")) || 7

  const countdownData = JSON.parse(entity.getDynamicProperty("elsty:countdownData"))
  if (!countdownData) {
    viewer.sendMessage("§cError: Countdown data not found")
    return
  }

  const targetDate = new Date(countdownData.targetTime)
  targetDate.setHours(targetDate.getHours() + timezoneOffset)

  const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`
  const timeStr = `${String(targetDate.getHours()).padStart(2, "0")}:${String(targetDate.getMinutes()).padStart(2, "0")}`

  new ModalFormData()
    .title("§6§lEdit Countdown")
    .textField("§eTitle", "Title")
    .textField("§eTarget Date", "YYYY-MM-DD")
    .textField("§eTarget Time", "HH:MM")
    .dropdown("§eFormat", ["Days, Hours, Minutes, Seconds", "Days, Hours, Minutes", "Hours, Minutes, Seconds", "Hours, Minutes"], { defaultValueIndex: countdownData.formatIndex })
    .dropdown("§eTitle Color", COLORS.names, { defaultValueIndex: Math.max(0, COLORS.codes.indexOf(countdownData.titleColor)) })
    .dropdown("§eTime Color", COLORS.names, { defaultValueIndex: Math.max(0, COLORS.codes.indexOf(countdownData.timeColor)) })
    .textField("§ePosition (X Y Z)", "Format: X Y Z")
    .toggle("§c§lDelete Countdown", { defaultValue: false })
    .show(viewer)
    .then(({ formValues, canceled }) => {
      if (canceled) return

      if (formValues[7]) {
        entity.remove()
        viewer.sendMessage("§aCountdown has been deleted successfully!")
        viewer.playSound("random.break")
        return
      }

      const title = formValues[0] || "Event Countdown"
      const dateStr = formValues[1]
      const timeStr = formValues[2]
      const formatIndex = formValues[3]
      const titleColor = COLORS.codes[formValues[4]]
      const timeColor = COLORS.codes[formValues[5]]
      const pos = parsePos(formValues[6], -0.58)

      try {
        const [year, month, day] = dateStr.split("-").map(Number)
        const [hours, minutes] = timeStr.split(":").map(Number)
        const targetDate = new Date(Date.UTC(year, month - 1, day, hours - timezoneOffset, minutes, 0))
        const timestamp = targetDate.getTime()

        if (isNaN(timestamp)) {
          viewer.sendMessage("§cInvalid date or time format. Please try again.")
          return
        }

        entity.setDynamicProperty("elsty:countdownData", JSON.stringify({
          title,
          targetTime: timestamp,
          formatIndex,
          titleColor,
          timeColor,
          created: countdownData.created,
          timezone: timezoneOffset,
        }))
        entity.teleport(pos)
        entity.setDynamicProperty("elsty:fixedPosition", JSON.stringify(pos))
        viewer.sendMessage(`§aCountdown has been updated successfully!\n§7Using timezone: UTC${timezoneOffset >= 0 ? "+" : ""}${timezoneOffset}`)
        viewer.playSound("random.levelup")
      } catch (error) {
        viewer.sendMessage("§cError updating countdown: " + error.message)
      }
    })
}

// ============== SHOW TEXTS ==============
export function showTexts(viewer) {
  if (!isAdmin(viewer)) {
    viewer.sendMessage("§c§lYou don't have permission to edit floating texts!")
    viewer.playSound("note.bass")
    return
  }

  const getDimension = name => world.getDimension(name)
  const entities = DIMENSIONS.flatMap(dim => {
    try {
      return getDimension(dim).getEntities({ type: "lildanlid:floatingtext" })
    } catch (e) {
      return []
    }
  })

  if (!entities.length) {
    floatingTextMenu(viewer, "§cNo loaded Floating Texts found in the world.")
    return
  }

  const ui = new ActionFormData()
    .title("§6§lEdit Nearby Texts")
    .body("§7Note: Only texts that are in loaded chunks will show up.")

  entities.forEach(entity => {
    const isScoreboard = entity.matches({ families: ["scoreboard"] })
    const isCountdown = entity.hasTag("elsty:countdown")
    let buttonText = entity.nameTag.replace(/\n.+/g, "")

    if (isScoreboard) {
      buttonText += "§r\n§8[Leaderboard]"
    } else if (isCountdown) {
      buttonText += "§r\n§8[Countdown]"
    } else {
      buttonText += "§r\n§8[Text]"
    }

    ui.button(buttonText)
  })

  ui.show(viewer).then(response => {
    if (response.canceled) return

    const entity = entities[response.selection]

    if (entity.matches({ families: ["scoreboard"] })) {
      editLeaderboard(viewer, entity)
    } else if (entity.hasTag("elsty:countdown")) {
      editCountdown(viewer, entity)
    } else {
      editText(viewer, entity)
    }
  })
}

// ============== TOGGLE MONEY DISPLAY ==============
export function toggleMoneyDisplayMode(viewer) {
  const currentMode = getMoneyDisplayMode()
  let newMode

  switch (currentMode) {
    case MONEY_DISPLAY_OPTIONS.FULL:
      newMode = MONEY_DISPLAY_OPTIONS.TRUNCATED
      break
    case MONEY_DISPLAY_OPTIONS.TRUNCATED:
      newMode = MONEY_DISPLAY_OPTIONS.STARS
      break
    case MONEY_DISPLAY_OPTIONS.STARS:
    default:
      newMode = MONEY_DISPLAY_OPTIONS.FULL
      break
  }

  setMoneyDisplayMode(newMode)

  let modeText
  switch (newMode) {
    case MONEY_DISPLAY_OPTIONS.FULL:
      modeText = "§aFull (123456789)"
      break
    case MONEY_DISPLAY_OPTIONS.STARS:
      modeText = "§e****"
      break
    case MONEY_DISPLAY_OPTIONS.TRUNCATED:
    default:
      modeText = "§bTruncated (123.4M)"
      break
  }

  viewer.sendMessage(`§fMoney Display Mode: ${modeText}`)
  floatingTextMenu(viewer)
}
