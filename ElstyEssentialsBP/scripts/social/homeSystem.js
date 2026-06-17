import { ActionFormData, ModalFormData, system, world } from "../core.js"
import { checkPlayerRank, getPlayerRank } from "./ranks/rank.js";

// Configuration
const getHomeCfg = () => {
  try {
    const s = world.getDynamicProperty("homeConfig")
    return s ? JSON.parse(s) : { maxHomes: 5, minY: -64, teleportDelay: 3 }
  } catch {
    return { maxHomes: 5, minY: -64, teleportDelay: 3 }
  }
}

// Function to get max homes based on player's rank
const getMaxHomesByRank = (player) => {
  // Get player's rank tag (just the icon, e.g., "")
  const rankTag = getPlayerRank(player);
  
  // Define max homes for different ranks (using just the icon as key)
  const rankMaxHomes = {
    // Admin/Owner ranks - higher limits
    "": 20, // Owner
    "": 15, // Admin
    "": 10, // Command
    "": 8,   // Helper
    "": 8,   // Designer
    "": 8,   // Builder
    
    // High-tier ranks
    "": 7,   // Legends
    "": 7,   // Kingdom
    "": 7,   // Discord
    "": 7,   // Youtube
    "": 7,   // Twitch
    
    // Mid-tier ranks
    "": 6,   // Sniper
    "": 6,   // End
    "": 6,   // Nether
    "": 6,   // Space
    "": 6,   // Fire
    "": 6,   // Water
    "": 6,   // Air
    "": 6,   // Hacker
    
    // Lower-tier ranks
    "": 5,   // Diamond
    "": 4,   // Iron
    "": 4,   // Gold
    "": 3,   // VIP
    
    // Default ranks
    "": 2,   // Stone
    "": 1,   // Noob
    "": 1,   // Dead
    "": 2,   // Kill
    "": 2,   // Pixel
    "": 2,   // Member (default)
  };
  
  // Return the max homes for the player's rank, or default value
  return rankMaxHomes[rankTag] || 2; // Default to 2 homes for Member rank and others
}

// Default icon for homes
const DEFAULT_HOME_ICON = "textures/ui/icon_bell"

// Messages
const msg = {
  max: '{"rawtext":[{"text":"§c⚠ Max home reached!"}]}',
  invalid: '{"rawtext":[{"text":"§c⚠ Invalid home name!"}]}',
  exist: '{"rawtext":[{"text":"§c⚠ Name already exists!"}]}',
  none: '{"rawtext":[{"text":"§c⚠ No home set!"}]}',
  move: '{"rawtext":[{"text":"§c✘ Teleport cancelled - You moved!"}]}',
  ok: n => `{"rawtext":[{"text":"§a✔ Welcome to §6${n}§a!"}]}`,
  del: n => `{"rawtext":[{"text":"§a✔ Home §6${n}§a deleted!"}]}`,
  new: n => `{"rawtext":[{"text":"§a✔ Home §6${n}§a created!"}]}`,
}

// Utility functions
const isValidHomeName = name => {
  if (name == null || typeof name !== "string") return false
  const trimmed = String(name).trim()
  return trimmed.length > 0 && trimmed.length <= 20 && !/[\x00-\x1F\x7F"\\]/.test(trimmed)
}

const getDimColor = dim => {
  const colors = { overworld: "§a", nether: "§c", the_end: "§d" }
  return colors[dim] || "§7"
}

const getHomes = pl => {
  const homes = []
  const tags = pl.getTags()

  for (const tag of tags) {
    if (!tag.startsWith('{"Home":{')) continue

    try {
      const parsed = JSON.parse(tag)
      if (parsed?.Home) homes.push(parsed.Home)
    } catch {
      pl.removeTag(tag) // Clean invalid tags
    }
  }
  return homes
}

const findHomeTag = (pl, uuid) => pl.getTags().find(t => t.includes(`"UUID":"${uuid}"`))

const updateHomeTag = (pl, oldHome, newHome) => {
  const tag = findHomeTag(pl, oldHome.UUID)
  if (tag) {
    pl.removeTag(tag)
    pl.addTag(JSON.stringify({ Home: newHome }))
    return true
  }
  return false
}

const createHomeObj = (name, desc, wmsg, location, dim) => ({
  Name: String(name).trim(),
  Description: String(desc).trim() || undefined,
  Pos: `${Math.trunc(location.x)} ${Math.trunc(location.y)} ${Math.trunc(location.z)}`,
  Dimension: dim,
  Icon: DEFAULT_HOME_ICON,
  WelcomeMessage: String(wmsg).trim() || undefined,
  UUID: `${dim}:${Math.trunc(location.x)}:${Math.trunc(location.y)}:${Math.trunc(location.z)}`,
})

// Main menu
function homeMenu(pl) {
  const cfg = getHomeCfg()
  const homes = getHomes(pl)
  const maxHomes = getMaxHomesByRank(pl) // Get max homes based on player's rank
  
  // Debug logging to verify rank detection
  console.warn(`[HomeSystem] Player: ${pl.name}, Rank: ${getPlayerRank(pl)}, MaxHomes: ${maxHomes}`)

  new ActionFormData()
    .title("Home System")
    .body(`§e=== Home Management ===\n§fHomes: §b${homes.length}§7/§c${maxHomes}\n§7Choose option:`)
    .button("§2Create Home", "textures/ui/color_plus")
    .button("§cManage Homes", "textures/ui/icon_setting")
    .button("§bView Homes", "textures/ui/icon_map")
    .show(pl)
    .then(r => {
      if (r?.canceled === true) return

      const actions = [
        () => (homes.length >= maxHomes 
          ? (pl.runCommand(`titleraw @s actionbar ${msg.max}`), pl.runCommand("playsound note.bass @s")) 
          : createHome(pl, homes, maxHomes)), 
        () => (homes.length ? manageHome(pl, homes) : pl.runCommand(`titleraw @s actionbar ${msg.none}`)), 
        () => (homes.length ? viewHome(pl, homes) : pl.runCommand(`titleraw @s actionbar ${msg.none}`))
      ]

      if (r.selection !== undefined) {
        actions[r.selection]?.()
      }
    })
}

// Create home
function createHome(pl, homes, maxHomes) {
  new ModalFormData()
    .title("§6§lCreate Home")
    .textField(`§eEnter home name\n§7Homes: ${homes.length}/${maxHomes}`, "Home Name")
    .textField("§eDescription (optional)", "Enter description...")
    .textField("§eWelcome Message (optional)", "Welcome to my home!")
    .show(pl)
    .then(r => {
      if (r?.canceled === true || !r.formValues[0]) {
        pl.sendMessage("§c§lYou must assign a name to your home.")
        return
      }

      const [name, desc, wmsg] = r.formValues
      const trimmedName = String(name).trim()

      if (trimmedName.length === 0) {
        pl.sendMessage("§c§lHome name cannot be empty!")
        return
      }

      if (trimmedName.length > 20) {
        pl.sendMessage("§c§lHome name too long! Max 20 characters.")
        return
      }

      if (homes.some(h => h.Name.toLowerCase() === trimmedName.toLowerCase())) {
        pl.sendMessage(`§c§lHome "${trimmedName}" already exists!`)
        return
      }

      const dim = pl.dimension.id.replace("minecraft:", "")
      const home = createHomeObj(trimmedName, desc, wmsg, pl.location, dim)

      pl.addTag(JSON.stringify({ Home: home }))
      pl.sendMessage(`§a§l✓ Home "${trimmedName}" set!`)
      pl.runCommand("playsound random.orb @s")
    })
}

// Manage homes
function manageHome(pl, homes) {
  const fm = new ActionFormData().title("§cManage Homes").body("§eSelect home:")

  homes.forEach(home => {
    fm.button(`${home.Name}§r\n§8${home.Description || home.Pos}`, home.Icon || DEFAULT_HOME_ICON)
  })

  fm.show(pl).then(r => {
    if (!r.canceled && r.selection !== undefined) {
      editHome(pl, homes[r.selection])
    }
  })
}

// Edit home options
function editHome(pl, home) {
  new ActionFormData()
    .title(`§bEdit: ${home.Name}`)
    .body([`§eName: §f${home.Name}`, `§eLoc: §f${home.Pos}`, `§eDim: §f${home.Dimension}`, home.Description ? `§eDesc: §f${home.Description}` : "", home.WelcomeMessage ? `§eWelcome: §f${home.WelcomeMessage}` : ""].filter(Boolean).join("\n"))
    .button("§eUpdate Loc", "textures/ui/levitation_effect")
    .button("§bEdit", "textures/ui/icon_setting")
    .button("§cDelete", "textures/ui/icon_trash")
    .show(pl)
    .then(r => {
      if (r?.canceled === true) return

      const actions = [() => updateHomeLoc(pl, home), () => editHomeDetail(pl, home), () => delHome(pl, home)]

      if (r.selection !== undefined) {
        actions[r.selection]()
      }
    })
}

// View and teleport
function viewHome(pl, homes) {
  const fm = new ActionFormData().title("Your Homes").body("§eSelect home to teleport:")

  homes.forEach(home => {
    fm.button(`${home.Name}§r\n${getDimColor(home.Dimension)}${home.Dimension}§8: ${home.Pos}`, home.Icon || DEFAULT_HOME_ICON)
  })

  fm.show(pl).then(r => {
    if (!r.canceled && r.selection !== undefined) {
      tpHome(pl, homes[r.selection])
    }
  })
}

// Update location
function updateHomeLoc(pl, home) {
  const { x, y, z } = pl.location
  const dim = pl.dimension.id.replace("minecraft:", "")
  const newHome = {
    ...home,
    Pos: `${Math.trunc(x)} ${Math.trunc(y)} ${Math.trunc(z)}`,
    Dimension: dim,
    UUID: `${dim}:${Math.trunc(x)}:${Math.trunc(y)}:${Math.trunc(z)}`,
  }

  if (updateHomeTag(pl, home, newHome)) {
    pl.sendMessage(`§a✔ Location updated for "${home.Name}"`)
    pl.runCommand("playsound random.levelup @s")
  }
}

// Edit details
function editHomeDetail(pl, home) {
  new ModalFormData()
    .title(`§6§lEdit: ${home.Name}`)
    .textField("§eNew Name", "Enter name...", String(home.Name))
    .textField("§eDescription (optional)", "Enter description...", home.Description ? String(home.Description) : "")
    .textField("§eWelcome Message (optional)", "Enter message...", home.WelcomeMessage ? String(home.WelcomeMessage) : "")
    .show(pl)
    .then(r => {
      if (r?.canceled === true) return

      const [name, desc, wmsg] = r.formValues
      const trimmedName = String(name).trim()

      if (trimmedName.length > 20) {
        pl.sendMessage("§c§lHome name too long! Max 20 characters.")
        return
      }

      const homes = getHomes(pl)
      if (trimmedName !== home.Name && homes.some(h => h.UUID !== home.UUID && h.Name.toLowerCase() === trimmedName.toLowerCase())) {
        pl.sendMessage("§c§lA home with this name already exists!")
        return
      }

      const newHome = {
        ...home,
        Name: trimmedName || home.Name,
        Description: String(desc).trim() || undefined,
        WelcomeMessage: String(wmsg).trim() || undefined,
      }

      if (updateHomeTag(pl, home, newHome)) {
        pl.sendMessage(`§a✔ Home "${newHome.Name}" updated!`)
        pl.runCommand("playsound random.levelup @s")
      }
    })
}

// Delete home
function delHome(pl, home) {
  new ActionFormData()
    .title("§cConfirm Delete")
    .body(`§eDelete home "${home.Name}"?\n§cThis cannot be undone!`)
    .button("§cYes", "textures/ui/icon_trash")
    .button("§aNo", "textures/ui/icon_cancel")
    .show(pl)
    .then(r => {
      if (!r.canceled && r.selection === 0) {
        const tag = findHomeTag(pl, home.UUID)
        if (tag) {
          pl.removeTag(tag)
          pl.sendMessage(`§a✔ Home "${home.Name}" deleted.`)
          pl.runCommand("playsound random.break @s")
        }
      }
    })
}

// Teleport with progress bar
function tpHome(pl, home) {
  const cfg = getHomeCfg()
  const { Name, Pos, Dimension, WelcomeMessage } = home
  const coords = Pos.split(" ")

  if (coords.length !== 3) return

  const [x, y, z] = coords
  const pos0 = { ...pl.location }
  let cd = cfg.teleportDelay
  let frame = 0

  const intv = system.runInterval(() => {
    const { location } = pl
    if (Math.abs(pos0.x - location.x) > 0.1 || Math.abs(pos0.y - location.y) > 0.1 || Math.abs(pos0.z - location.z) > 0.1) {
      system.clearRun(intv)
      pl.runCommand(`titleraw @s actionbar ${msg.move}`)
      pl.runCommand("playsound note.bass @s")
      return
    }

    const totalFrames = cfg.teleportDelay * 20
    const progress = (cd / cfg.teleportDelay) * 10 - (frame / totalFrames) * 10
    const trans = ["▏", "▎", "▍", "▌", "▋", "▊", "▉"]
    const full = Math.max(0, Math.floor(progress))
    let bar = "█".repeat(full)
    const frac = progress - full

    if (frac > 0 && full < 10) bar += trans[Math.floor(frac * trans.length)]
    bar += " ".repeat(Math.max(0, 10 - bar.length))

    pl.onScreenDisplay.setActionBar(`§e⚡ Teleporting [§b${bar}§e] §b${cd}s`)

    if (++frame >= 20) {
      frame = 0
      cd--
    }

    if (cd <= 0) {
      system.clearRun(intv)
      pl.runCommand(`execute in ${Dimension} run tp @s ${x} ${y} ${z}`)
      pl.runCommand(`titleraw @s actionbar ${msg.ok(Name)}`)
      if (WelcomeMessage) pl.sendMessage(`§e➤ ${WelcomeMessage}`)
      pl.runCommand("playsound random.levelup @s")
    }
  }, 1)
}

export { homeMenu as HomeSystem }