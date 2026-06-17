import { system, world } from "../../core.js"
import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { LandConfig } from "./LandConfig.js"
import { LandDatabase } from "./LandDatabase.js"
import { LandParticles } from "./LandParticles.js"
import { LandProtection } from "./LandProtection.js"

LandDatabase.init()
LandProtection.init()

const positions = new WeakMap()
let cachedConfig = null,
  lastConfigUpdate = 0
const CONFIG_CACHE_TIME = 1000,
  NOTIFICATION_DELAY = 10

const getConfig = () => {
  const now = Date.now()
  if (!cachedConfig || now - lastConfigUpdate > CONFIG_CACHE_TIME) {
    cachedConfig = LandConfig.getConfig()
    lastConfigUpdate = now
  }
  return cachedConfig
}

class LandSystem {
  static setPosition(player, posNum) {
    const pos = {
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y),
      z: Math.floor(player.location.z),
      dimension: player.dimension.id.split(":")[1],
    }

    const rotation = player.getRotation()
    const facing = Math.floor(rotation.y)

    if (facing >= -45 && facing < 45) {
      pos.z += 1
    } else if (facing >= 45 && facing < 135) {
      pos.x -= 1
    } else if (facing >= 135 || facing < -135) {
      pos.z -= 1
    } else if (facing >= -135 && facing < -45) {
      pos.x += 1
    }

    const playerPos = positions.get(player) || {}

    if (posNum === 2 && playerPos.pos1 && playerPos.pos1.dimension !== pos.dimension) {
      this.sendErrorMessage(player, "Cannot set position 2 in a different dimension!")
      return
    }

    playerPos[posNum === 1 ? "pos1" : "pos2"] = pos
    positions.set(player, playerPos)

    // Overlap detection when setting Pos 2
    if (posNum === 2 && playerPos.pos1) {
      LandDatabase.checkClaimOverlap(playerPos.pos1, pos).then(res => {
        if (res.overlaps) {
          this.sendErrorMessage(player, "Area overlaps with another claim!")
          playerPos.pos2 = undefined
          positions.set(player, playerPos)
          return
        }
        system.runTimeout(() => {
          LandParticles.showSelectionPreview(pos, posNum)
          if (playerPos.pos1 && playerPos.pos2) {
            LandParticles.scheduleOutlineUpdates(playerPos.pos1, playerPos.pos2, 5)
            this.showClaimInfo(player)
          }
        }, 1)
      })
    } else {
      system.runTimeout(() => {
        LandParticles.showSelectionPreview(pos, posNum)
        if (playerPos.pos1 && playerPos.pos2) {
          LandParticles.scheduleOutlineUpdates(playerPos.pos1, playerPos.pos2, 5)
          this.showClaimInfo(player)
        }
      }, 1)
    }
  }

  static resetPositions(player) {
    positions.delete(player)
  }

  static showClaimInfo(player) {
    const { pos1, pos2 } = positions.get(player) || {}
    if (!pos1 || !pos2) return

    if (pos1.dimension !== pos2.dimension) {
      this.sendErrorMessage(player, "Cannot claim across different dimensions!")
      return
    }

    const { valid, message, blocks } = LandConfig.validateClaim(pos1, pos2)
    if (!valid) return player.sendMessage(`Error: ${message}`)
    const config = getConfig(),
      price = LandConfig.calculatePrice(blocks)
    player.sendMessage(`=== Claim Information ===\n` + `Total Blocks: ${blocks}\n` + `Price per Block: $${config.pricePerBlock}\n` + `Total Price: $${price}\n` + `Min/Max Size: ${config.minClaimSize}/${config.maxClaimSize}\n` + `Dimension: ${pos1.dimension}`)
  }

  static async showClaimConfirmation(player) {
    const { pos1, pos2 } = positions.get(player) || {}
    if (!pos1 || !pos2) return this.sendErrorMessage(player, "Please set both positions first!")
    const { valid, message, blocks } = LandConfig.validateClaim(pos1, pos2)
    if (!valid) return this.sendErrorMessage(player, message)
    const config = getConfig(),
      price = LandConfig.calculatePrice(blocks),
      playerMoney = LandConfig.getPlayerMoney(player)
    const claims = await LandDatabase.getPlayerClaims(player.id)
    if (claims.length >= config.maxClaimsPerPlayer) return this.sendErrorMessage(player, `Max claims reached (${config.maxClaimsPerPlayer})`)
    if (config.requireMoney && !config.freeClaim && playerMoney < price) return this.sendErrorMessage(player, `Need $${price}, have $${playerMoney}`)

    const response = await new ModalFormData()
      .title("Confirm Land Claim")
      .textField("Claim Name\nGive your land a unique name", "e.g. My House", { defaultValue: "" })
      .toggle(`Confirm Claim\n${config.freeClaim ? "Free Claim Available" : `Cost: $${price}`}`, { defaultValue: false })
      .submitButton("CLAIM LAND")
      .show(player)

    if (response.canceled || !response.formValues[1]) return

    const claimName = response.formValues[0]?.trim() || "Unnamed Claim"
    try {
      const claimId = await LandDatabase.saveLandClaim(player.id, {
        pos1,
        pos2,
        name: claimName,
        permissions: LandProtection.getDefaultPermissions(),
        members: [],
        allowEntry: false,
        settings: {
          pvp: false,
          mobSpawning: false,
          explosions: false,
          protectedDimensions: ["overworld", "nether", "the_end"],
        },
      })
      if (config.requireMoney && !config.freeClaim) {
        if (!LandConfig.removePlayerMoney(player, price)) {
          // Kalau gagal ambil uang, hapus claim yang baru saja dibuat
          await LandDatabase.removeClaim(claimId)
          return this.sendErrorMessage(player, "Payment failed!")
        }
      }
      this.sendSuccessMessage(player, `Land claimed successfully!\n` + `• Name: ${claimName}\n` + `• Size: ${blocks} blocks\n` + `• Cost: ${config.freeClaim ? "FREE" : `$${price}`}\n` + `• ID: ${claimId}\n` + `• Protection: Enabled by default`)
      this.resetPositions(player)
    } catch (e) {
      this.sendErrorMessage(player, e.message?.includes("overlaps") ? "This area overlaps with another claim!" : "Failed to save claim!")
    }
  }

  static async showMyClaims(player) {
    const claims = await LandDatabase.getPlayerClaims(player.id),
      config = getConfig()
    const form = new ActionFormData().title("My Land Claims").body(`Claims: ${claims.length}/${config.maxClaimsPerPlayer}\nSelect a claim`)
    if (claims.length) {
      for (let i = 0; i < claims.length; i++) {
        const c = claims[i]
        if (c?.pos1 && c?.pos2) {
          form.button(`${c.name || `Claim at ${c.pos1.x}, ${c.pos1.z}`}\nSize: ${LandConfig.calculateBlocks(c.pos1, c.pos2)} blocks | Members: ${c.members?.length || 0}`, "textures/ui/icon_best3")
        }
      }
    } else {
      form.button("No Claims Yet", "textures/ui/icon_sign")
    }
    const { canceled, selection } = await form.show(player)
    if (canceled || claims.length === 0) return system.runTimeout(() => LandMember(player), 1)
    const validClaims = claims.filter(c => c?.pos1 && c?.pos2)
    selection >= 0 && selection < validClaims.length ? this.showMyClaimDetails(player, validClaims[selection]) : this.sendErrorMessage(player, "Invalid selection") && system.runTimeout(() => LandMember(player), 1)
  }

  static async showMyClaimDetails(player, claim) {
    if (!claim?.pos1 || !claim?.pos2) return this.sendErrorMessage(player, "Invalid claim data") && system.runTimeout(() => this.showMyClaims(player), 1)
    const blocks = LandConfig.calculateBlocks(claim.pos1, claim.pos2),
      members = claim.members || []

    const membersList = members
      .map(m => {
        const activePerms = []
        if (m.permissions) {
          if (m.permissions.break) activePerms.push("break")
          if (m.permissions.place) activePerms.push("place")
          if (m.permissions.interact) activePerms.push("interact")
          if (m.permissions.container) activePerms.push("container")
          if (m.permissions.doors) activePerms.push("doors")
          if (m.permissions.redstone) activePerms.push("redstone")
          if (m.permissions.use) activePerms.push("use")
          if (m.permissions.entry) activePerms.push("entry")
        }
        return `- ${m.name} (${activePerms.join(", ") || "No permissions"})`
      })
      .join("\n")

    const form = new ActionFormData()
      .title(claim.name || "Claim Details")
      .body(`=== Claim Info ===\nID: ${claim.claimId}\nBlocks: ${blocks}\nMembers: ${members.length}\nFrom: ${claim.pos1.x}, ${claim.pos1.y}, ${claim.pos1.z}\nTo: ${claim.pos2.x}, ${claim.pos2.y}, ${claim.pos2.z}\n\nMembers:\n${membersList || "No members"}`)
      .button("Manage Members", "textures/ui/permissions_member_star")
      .button("Entry Settings", "textures/ui/icon_import")
      .button("Land Settings", "textures/ui/button_custom/settings")
      .button("Rename Claim", "textures/ui/mining_fatigue_effect")
      .button("Remove Claim", "textures/ui/trash")
      .button("Back", "textures/ui/arrow_left")
    const { canceled, selection } = await form.show(player)
    if (canceled) return system.runTimeout(() => this.showMyClaims(player), 1)
    ;[() => this.showMemberManagement(player, claim), () => this.showEntrySettings(player, claim), () => this.showLandSettings(player, claim), () => this.showRenameClaimForm(player, claim), () => this.showRemoveConfirmation(player, claim), () => this.showMyClaims(player)][selection]?.()
  }

  static async showEntrySettings(player, claim) {
    if (!claim?.pos1 || !claim?.pos2) return this.sendErrorMessage(player, "Invalid claim data") && system.runTimeout(() => this.showMyClaims(player), 1)

    const { canceled, formValues } = await new ModalFormData()
      .title("Entry Settings")
      .toggle("Allow all players entry", { defaultValue: claim.allowEntry === true })
      .submitButton("SAVE SETTINGS")
      .show(player)

    if (canceled) return system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)

    try {
      const updatedClaim = { ...claim, allowEntry: formValues[0] === true }
      const success = await LandDatabase.updateClaim(claim.claimId, updatedClaim)

      if (success) {
        LandProtection.clearClaimCache(claim.claimId)
        this.sendSuccessMessage(player, `Access settings updated! ${formValues[0] ? "All players can enter" : "Only members are allowed"}`)

        // Refresh claim data
        const claims = await LandDatabase.getPlayerClaims(player.id)
        const refreshedClaim = claims.find(c => c.claimId === claim.claimId)
        if (refreshedClaim) {
          system.runTimeout(() => this.showMyClaimDetails(player, refreshedClaim), 1)
          return
        }
      } else {
        this.sendErrorMessage(player, "Failed to update settings!")
      }
    } catch (e) {
      console.warn("Entry settings error:", e)
      this.sendErrorMessage(player, "Error updating settings!")
    }

    system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)
  }

  static async showRenameClaimForm(player, claim) {
    if (!claim?.pos1 || !claim?.pos2) return this.sendErrorMessage(player, "Invalid claim data") && system.runTimeout(() => this.showMyClaims(player), 1)
    const { canceled, formValues } = await new ModalFormData()
      .title("Rename Claim")
      .textField("New name", "e.g. My House", { defaultValue: claim.name || "" })
      .submitButton("SAVE NAME")
      .show(player)
    if (canceled) return system.runTimeout(() => this.showMyClaims(player), 1)
    const newName = formValues[0]?.trim() || "Unnamed Claim",
      updatedClaim = { ...claim, name: newName }
    LandDatabase.updateClaim(claim.claimId, updatedClaim) ? this.queueNotification(player, `Renamed to: ${newName}`) : this.queueNotification(player, "Failed to rename!", true)
    system.runTimeout(() => this.showMyClaims(player), NOTIFICATION_DELAY * 3)
  }

  static async showMemberManagement(player, claim) {
    if (!claim?.pos1 || !claim?.pos2) return this.sendErrorMessage(player, "Invalid claim data") && system.runTimeout(() => this.showMyClaims(player), 1)

    const members = claim.members || []
    const form = new ActionFormData().title("Manage Members").body(`Current members: ${members.length}\nSelect an action:`)

    if (members.length > 0) {
      form.button("Configure Members\nEdit permissions", "textures/ui/permissions_member_star")
    }
    form.button("Add Member\nAdd new member", "textures/ui/color_plus").button("Remove Member\nRemove existing member", "textures/ui/trash").button("Back", "textures/ui/arrow_left")

    const { canceled, selection } = await form.show(player)
    if (canceled) return system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)

    let action
    if (members.length > 0) {
      action = [() => this.showMemberSettings(player, claim), () => this.showAddMember(player, claim), () => this.showRemoveMember(player, claim), () => this.showMyClaimDetails(player, claim)][selection]
    } else {
      action = [() => this.showAddMember(player, claim), () => this.showRemoveMember(player, claim), () => this.showMyClaimDetails(player, claim)][selection]
    }
    action?.()
  }

  static async showMemberSettings(player, claim) {
    const members = claim.members || []
    if (!members.length) {
      this.sendErrorMessage(player, "No members to configure!")
      return system.runTimeout(() => this.showMemberManagement(player, claim), 1)
    }

    const form = new ActionFormData().title("Member Settings").body("Select a member to configure permissions:")

    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      const activePerms = Object.entries(m.permissions || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          const permMap = {
            break: "Break",
            place: "Place",
            interact: "Interact",
            container: "Container",
            doors: "Doors",
            redstone: "Redstone",
            use: "Use",
            entry: "Entry",
          }
          return permMap[key] || key
        })
        .join(", ")

      form.button(`${m.name}\n${activePerms || "No permissions"}`, "textures/ui/button_custom/kepala_player")
    }
    form.button("Back", "textures/ui/arrow_left")

    const { canceled, selection } = await form.show(player)
    if (canceled || selection === members.length) {
      return system.runTimeout(() => this.showMemberManagement(player, claim), 1)
    }

    const selectedMember = members[selection]
    await this.showPermissionSelection(player, claim, { name: selectedMember.name }, true)
  }

  static async showAddMember(player, claim) {
    const availablePlayers = world.getAllPlayers().filter(p => p.name !== player.name)
    if (!availablePlayers.length) return this.sendErrorMessage(player, "No players online!") && system.runTimeout(() => this.showMemberManagement(player, claim), 1)

    const form = new ActionFormData().title("Add Member").body("Select player to add:")

    for (let i = 0; i < availablePlayers.length; i++) {
      const p = availablePlayers[i]
      const isMember = claim.members?.some(m => m.name === p.name)
      form.button(`${p.name}\n${isMember ? "Already member" : "Add"}`, "textures/ui/button_custom/kepala_player")
    }
    form.button("Back", "textures/ui/arrow_left")

    const { canceled, selection } = await form.show(player)
    if (canceled || selection === availablePlayers.length) return system.runTimeout(() => this.showMemberManagement(player, claim), 1)

    const selectedPlayer = availablePlayers[selection]
    if (claim.members?.some(m => m.name === selectedPlayer.name)) {
      this.sendErrorMessage(player, "Player is already a member!")
      return system.runTimeout(() => this.showMemberManagement(player, claim), 1)
    }

    this.showPermissionSelection(player, claim, selectedPlayer)
  }

  static async showRemoveMember(player, claim) {
    const members = claim.members || []
    if (!members.length) return this.sendErrorMessage(player, "No members!") && system.runTimeout(() => this.showMemberManagement(player, claim), 1)

    const form = new ActionFormData().title("Remove Member").body("Select member to remove:")

    const validMembers = members.filter(m => m && m.name)
    for (let i = 0; i < validMembers.length; i++) {
      const m = validMembers[i]
      form.button(`${m.name}\nClick to remove`, "textures/ui/button_custom/kepala_player")
    }
    form.button("Back", "textures/ui/arrow_left")

    const { canceled, selection } = await form.show(player)
    if (canceled || selection === validMembers.length) {
      return system.runTimeout(() => this.showMemberManagement(player, claim), 1)
    }

    try {
      const removedMember = validMembers[selection]
      const updatedMembers = members.filter(m => m.name !== removedMember.name)
      const updatedClaim = { ...claim, members: updatedMembers }

      const success = await LandDatabase.updateClaim(claim.claimId, updatedClaim)
      if (success) {
        this.sendSuccessMessage(player, `Removed ${removedMember.name} from claim`)
        LandProtection.clearClaimCache(claim.claimId)
        claim.members = updatedMembers
      } else {
        this.sendErrorMessage(player, "Failed to remove member!")
      }
    } catch (e) {
      console.warn("Remove member error:", e)
      this.sendErrorMessage(player, "Error removing member!")
    }

    system.runTimeout(() => this.showMemberManagement(player, { ...claim }), 1)
  }

  static async showPermissionSelection(player, claim, targetPlayer, isSettings = false) {
    const existingMember = claim.members?.find(m => m.name === targetPlayer.name)
    const { canceled, formValues } = await new ModalFormData()
      .title(`Permissions for ${targetPlayer.name}`)
      .toggle("Break blocks", { defaultValue: existingMember?.permissions?.break ?? false })
      .toggle("Place blocks", { defaultValue: existingMember?.permissions?.place ?? false })
      .toggle("Interact with blocks", { defaultValue: existingMember?.permissions?.interact ?? false })
      .toggle("Open containers", { defaultValue: existingMember?.permissions?.container ?? false })
      .toggle("Use doors/gates", { defaultValue: existingMember?.permissions?.doors ?? false })
      .toggle("Use redstone", { defaultValue: existingMember?.permissions?.redstone ?? false })
      .toggle("Use items", { defaultValue: existingMember?.permissions?.use ?? false })
      .toggle("Allow Entry", { defaultValue: existingMember?.permissions?.entry ?? false })
      .toggle("Allow PvP (ON: Can PvP, OFF: Cannot PvP)", { defaultValue: existingMember?.permissions?.pvp ?? false })
      .submitButton("SAVE PERMISSIONS")
      .show(player)

    if (canceled) return system.runTimeout(() => this.showMemberManagement(player, claim), 1)

    const permissions = {
      break: formValues[0],
      place: formValues[1],
      interact: formValues[2],
      container: formValues[3],
      doors: formValues[4],
      redstone: formValues[5],
      use: formValues[6],
      entry: formValues[7],
      pvp: formValues[8],
    }

    try {
      if (existingMember) {
        const updatedMembers = claim.members.map(m => (m.name === targetPlayer.name ? { ...m, permissions } : m))
        const updatedClaim = { ...claim, members: updatedMembers }
        if (await LandDatabase.updateClaim(claim.claimId, updatedClaim)) {
          this.queueNotification(player, `Permissions updated for ${targetPlayer.name}`)
          LandProtection.clearClaimCache(claim.claimId)
          claim.members = updatedMembers
        } else {
          this.queueNotification(player, "Failed to update permissions!", true)
        }
      } else {
        const newMember = {
          name: targetPlayer.name,
          permissions,
          addedAt: Date.now(),
        }
        const updatedClaim = {
          ...claim,
          members: [...(claim.members || []), newMember],
        }
        if (await LandDatabase.updateClaim(claim.claimId, updatedClaim)) {
          this.queueNotification(player, `Added ${targetPlayer.name} with permissions`)
          LandProtection.clearClaimCache(claim.claimId)
          claim.members = updatedClaim.members
        } else {
          this.queueNotification(player, "Failed to add member!", true)
        }
      }
    } catch (e) {
      console.warn("Permission update error:", e)
      this.queueNotification(player, "Error updating permissions!", true)
    }

    system.runTimeout(() => (isSettings ? this.showMemberManagement(player, claim) : this.showMemberSettings(player, claim)), 1)
  }

  static async showLandSettings(player, claim) {
    if (!claim?.pos1 || !claim?.pos2) {
      this.sendErrorMessage(player, "Invalid claim data")
      return system.runTimeout(() => this.showMyClaims(player), 1)
    }

    const settings = claim.settings || {}

    const form = new ModalFormData()
      .title("Land Settings")
      .toggle("Allow Entry\nAllow players to enter your claim", { defaultValue: claim.allowEntry === true })
      .toggle("PvP Protection\nDisable PvP in your claim", { defaultValue: settings.pvp === false })
      .toggle("Mob Spawning\nAllow mobs to spawn in your claim", { defaultValue: settings.mobSpawning !== false })
      .toggle("Allow Explosions\nAllow TNT and creeper explosions", { defaultValue: settings.explosions === true })
      .toggle("Protect in Overworld", { defaultValue: settings.protectedDimensions?.includes("overworld") ?? true })
      .toggle("Protect in Nether", { defaultValue: settings.protectedDimensions?.includes("nether") ?? true })
      .toggle("Protect in The End", { defaultValue: settings.protectedDimensions?.includes("the_end") ?? true })

    const response = await form.show(player)
    if (response.canceled) {
      return system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)
    }

    try {
      const protectedDimensions = []
      if (response.formValues[4]) protectedDimensions.push("overworld")
      if (response.formValues[5]) protectedDimensions.push("nether")
      if (response.formValues[6]) protectedDimensions.push("the_end")

      const updatedSettings = {
        ...settings,
        pvp: !response.formValues[1],
        mobSpawning: response.formValues[2],
        explosions: response.formValues[3],
        protectedDimensions,
      }

      const updatedClaim = {
        ...claim,
        settings: updatedSettings,
        allowEntry: response.formValues[0],
      }

      const success = await LandDatabase.updateClaim(claim.claimId, updatedClaim)

      if (success) {
        LandProtection.clearClaimCache(claim.claimId)
        this.sendSuccessMessage(player, "Land settings updated successfully!\n" + `• Entry: ${response.formValues[0] ? "Allowed" : "Denied"}\n` + `• PvP: ${!response.formValues[1] ? "Enabled" : "Disabled"}\n` + `• Mob Spawning: ${response.formValues[2] ? "Enabled" : "Disabled"}\n` + `• Explosions: ${response.formValues[3] ? "Enabled" : "Disabled"}\n` + `• Protected Dimensions: ${protectedDimensions.join(", ") || "None"}`)

        claim.settings = updatedSettings
        claim.allowEntry = response.formValues[0]
      } else {
        this.sendErrorMessage(player, "Failed to update settings!")
      }
    } catch (e) {
      console.warn("Land settings error:", e)
      this.sendErrorMessage(player, "Error updating settings!")
    }

    system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)
  }

  static sendSuccessMessage(player, message) {
    player.sendMessage(`§a§l✓ §r§7${message}`)
    player.runCommand(`playsound random.levelup @s`)
  }

  static sendErrorMessage(player, message) {
    player.sendMessage(`§c§l! §r§7${message}`)
    player.runCommand(`playsound note.bass @s`)
  }

  static queueNotification(player, message, isError = false) {
    system.runTimeout(() => {
      if (isError) {
        this.sendErrorMessage(player, message)
      } else {
        this.sendSuccessMessage(player, message)
      }
    }, NOTIFICATION_DELAY * 3)
  }

  static async showRemoveConfirmation(player, claim) {
    const { canceled, formValues } = await new ModalFormData().title("Remove Claim").toggle("Confirm removal", { defaultValue: false }).submitButton("REMOVE CLAIM").show(player)
    if (canceled || !formValues[0]) return system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)
    ;(await LandDatabase.removeClaim(claim.claimId)) ? (this.sendSuccessMessage(player, "Claim removed!"), this.resetPositions(player), system.runTimeout(() => this.showMyClaims(player), 1)) : this.sendErrorMessage(player, "Failed to remove!") && system.runTimeout(() => this.showMyClaimDetails(player, claim), 1)
  }
}

export async function LandMember(player) {
  const { pos1, pos2 } = positions.get(player) || {},
    pos1Set = pos1 ? "✓" : "✗",
    pos2Set = pos2 ? "✓" : "✗"
  let overlap = false
  let overlapMsg = ""
  if (pos1 && pos2) {
    const res = await LandDatabase.checkClaimOverlap(pos1, pos2)
    if (res.overlaps) {
      overlap = true
      overlapMsg = "\n§cArea overlaps with another claim! Please choose another location."
    }
  }
  const claimInfo =
    pos1 && pos2 ?
      LandConfig.validateClaim(pos1, pos2).valid ?
        `\nBlocks: ${LandConfig.calculateBlocks(pos1, pos2)}\nPrice: ${getConfig().freeClaim ? "FREE" : `$${LandConfig.calculatePrice(LandConfig.calculateBlocks(pos1, pos2))}`}`
      : `\n${LandConfig.validateClaim(pos1, pos2).message}`
    : ""
  const form = new ActionFormData().title("LAND MANAGEMENT").body(`Position Status:\nPos 1: ${pos1Set}\nPos 2: ${pos2Set}${claimInfo}${overlapMsg}\n*Enable entry protection for safety*`).button("Set Pos 1", "textures/ui/icon_recipe_item")
  if (overlap) {
    form.button("Set Pos 2 (Overlap!)", "textures/ui/icon_recipe_construction")
  } else {
    form.button(pos1 ? "Set Pos 2" : "Set Pos 2\nSet Pos 1 first!", "textures/ui/icon_recipe_construction")
  }
  form.button("Reset", "textures/ui/refresh")
  if (overlap) {
    form.button("Claim (Overlap!)", "textures/ui/icon_sign")
  } else {
    form.button("Claim", "textures/ui/icon_sign")
  }
  form.button("My Claims", "textures/ui/mashup_world")
  form
    .show(player)
    .then(({ canceled, selection }) => {
      if (canceled) return
      const showMenu = () => system.runTimeout(() => LandMember(player), 1)
      ;[
        () => {
          const x = Math.floor(player.location.x)
          const y = Math.floor(player.location.y)
          const z = Math.floor(player.location.z)
          LandSystem.setPosition(player, 1)
          player.sendMessage(`§aPos 1: ${x}, ${y}, ${z}`)
          showMenu()
        },
        overlap ? undefined : (
          () => {
            if (pos1) {
              const x = Math.floor(player.location.x)
              const y = Math.floor(player.location.y)
              const z = Math.floor(player.location.z)
              LandSystem.setPosition(player, 2)
              player.sendMessage(`§aPos 2: ${x}, ${y}, ${z}`)
              showMenu()
            } else {
              player.sendMessage("§cSet Pos 1 first!")
              showMenu()
            }
          }
        ),
        () => (LandSystem.resetPositions(player), player.sendMessage("§aPositions reset"), showMenu()),
        overlap ? undefined : () => LandSystem.showClaimConfirmation(player).finally(showMenu),
        () => LandSystem.showMyClaims(player),
      ][selection]?.()
    })
    .catch(e => (console.warn("Land menu error:", e), player.sendMessage("§cError occurred")))
}