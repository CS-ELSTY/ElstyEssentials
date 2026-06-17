import { system, world } from "../../core.js"
import { LandDatabase } from "./LandDatabase.js"
import { LandParticles } from "./LandParticles.js"
import { PROTECTED_BLOCKS } from "./ProtectedItems.js"

const CACHE_CONFIG = {
  CLEANUP_INTERVAL: 60000,
  MAX_SIZE: 100,
  NOTIFICATION_COOLDOWN: 500,
  PERMISSION_CACHE_TIME: 5000,
  LIFETIME: 5000,
}

const CACHE_STORAGE = {
  playerSneakStates: new Map(),
  lastPlayerPositions: new Map(),
  lastLandInfo: new Map(),
  lastNotifications: new Map(),
  claimCache: new Map(),
  notificationCache: new Map(),
  permissionCache: new Map(),
  playerEffects: new Map(),
  // Tambahan untuk tracking land sebelumnya
  playerCurrentLand: new Map(),
  playerLastLandNotification: new Map(),
}

const MESSAGES = {
  PROTECTION: action => `§c§l! §r§7${action}`,
  ENTRY: () => `§c§l! §r§7You cannot enter this area`,
  ITEM_FRAME: "§c§l! §r§7You cannot interact with item frames",
  FLUID: "§c§l! §r§7You cannot place fluids here",
  ENTER_LAND: (landName, owner) => `§6§l[LAND] §r§eEntering §b${landName}§e owned by §a${owner}`,
  LEAVE_LAND: (landName, owner) => `§6§l[LAND] §r§eLeaving §b${landName}§e owned by §a${owner}`,
  ENTER_WILDERNESS: () => `§6§l[LAND] §r§aNow in wilderness area`,
}

const BLOCK_CATEGORIES = {
  storage: PROTECTED_BLOCKS.STORAGE,
  furnace: PROTECTED_BLOCKS.FURNACES,
  crafting: PROTECTED_BLOCKS.CRAFTING,
  utility: PROTECTED_BLOCKS.UTILITY,
  redstone: PROTECTED_BLOCKS.REDSTONE,
  interactive: PROTECTED_BLOCKS.INTERACTIVE,
  door: PROTECTED_BLOCKS.DOORS,
}

const CATEGORY_MESSAGES = {
  storage: "You cannot access storage blocks",
  furnace: "You cannot use furnaces",
  crafting: "You cannot use crafting blocks",
  utility: "You cannot use utility blocks",
  redstone: "You cannot use redstone",
  interactive: "You cannot interact with this block",
  door: "You cannot use doors",
  sign: "You cannot edit signs",
}

function cleanupCaches() {
  const now = Date.now()
  const { claimCache, notificationCache, permissionCache, lastNotifications, lastLandInfo, playerLastLandNotification } = CACHE_STORAGE

  if (claimCache.size > CACHE_CONFIG.MAX_SIZE) {
    const oldEntries = [...claimCache.entries()].sort((a, b) => a[1].time - b[1].time).slice(0, Math.floor(CACHE_CONFIG.MAX_SIZE / 2))
    oldEntries.forEach(([key]) => claimCache.delete(key))
  }

  ;[
    [notificationCache, CACHE_CONFIG.NOTIFICATION_COOLDOWN],
    [lastNotifications, CACHE_CONFIG.NOTIFICATION_COOLDOWN],
    [lastLandInfo, CACHE_CONFIG.LIFETIME],
    [playerLastLandNotification, 1000], // 1 second cooldown untuk notifikasi land
  ].forEach(([cache, timeout]) => {
    for (const [key, time] of cache) {
      if (now - time > timeout) cache.delete(key)
    }
  })

  for (const [key, data] of permissionCache) {
    if (now - data.timestamp > CACHE_CONFIG.PERMISSION_CACHE_TIME) {
      permissionCache.delete(key)
    }
  }
}

function sendNotification(player, type, message, sound = "note.bass") {
  const now = Date.now()
  const key = `${player.id}_${type}`
  const lastTime = CACHE_STORAGE.lastNotifications.get(key)

  if (lastTime && now - lastTime < CACHE_CONFIG.NOTIFICATION_COOLDOWN) return

  CACHE_STORAGE.lastNotifications.set(key, now)
  player.sendMessage(message)

  if (sound) {
    system.run(() => player.runCommand(`playsound ${sound} @s`))
  }
}

function sendLandNotification(player, message, sound = "random.orb") {
  const now = Date.now()
  const key = `land_notif_${player.id}`
  const lastTime = CACHE_STORAGE.playerLastLandNotification.get(key)

  // Cooldown 1 detik untuk notifikasi land
  if (lastTime && now - lastTime < 1000) return

  CACHE_STORAGE.playerLastLandNotification.set(key, now)
  player.sendMessage(message)

  if (sound) {
    system.run(() => player.runCommand(`playsound ${sound} @s`))
  }
}

function showAngryParticle(player, location) {
  system.run(() => {
    player.dimension.runCommand(`particle minecraft:villager_angry ${location.x + 0.5} ${location.y + 0.5} ${location.z + 0.5}`)
  })
}

function applyWeaknessEffect(player, claim) {
  if (!CACHE_STORAGE.playerEffects.has(player.id)) {
    CACHE_STORAGE.playerEffects.set(player.id, {
      claimId: claim.claimId,
      effect: system.runInterval(() => {
        try {
          player.runCommand(`effect @s weakness 1 255 true`)
        } catch (error) {
          // Error handling without console.warn
        }
      }, 20),
    })
  }
}

function removeWeaknessEffect(player) {
  if (CACHE_STORAGE.playerEffects.has(player.id)) {
    const effectData = CACHE_STORAGE.playerEffects.get(player.id)
    system.clearRun(effectData.effect)
    CACHE_STORAGE.playerEffects.delete(player.id)
    try {
      player.runCommand(`effect @s clear`)
    } catch (error) {
      // Error handling without console.warn
    }
  }
}

function isClaimMember(player, claim) {
  return claim?.members?.some(m => m.id === player.id || m.name === player.name)
}

function isMemberAllowPvp(player, claim) {
  const member = claim?.members?.find(m => m.id === player.id || m.name === player.name)
  return member?.permissions?.pvp === true
}

function handleLandTransition(player, currentPos) {
  const currentClaim = LandProtection.getClaimFromCache(currentPos);
  const playerId = player.id;
  const previousClaim = CACHE_STORAGE.playerCurrentLand.get(playerId);

  // Jika masih di land yang sama, tidak perlu notifikasi
  if (currentClaim?.claimId === previousClaim?.claimId) {
    return;
  }

  const now = Date.now();
  const lastNotifTime = CACHE_STORAGE.playerLastLandNotification.get(playerId) || 0;
  
  // Cooldown 1 detik antara notifikasi
  if (now - lastNotifTime < 1000) {
    return;
  }

  CACHE_STORAGE.playerLastLandNotification.set(playerId, now);

  // Keluar dari land sebelumnya
  if (previousClaim && !currentClaim) {
    const ownerName = LandDatabase.getPlayerName(previousClaim.owner) || "Unknown";
    sendLandNotification(player, MESSAGES.LEAVE_LAND(previousClaim.name || "Unnamed Land", ownerName), "random.orb");
    CACHE_STORAGE.playerCurrentLand.set(playerId, null);
  }
  // Masuk ke land baru
  else if (currentClaim && currentClaim.claimId !== previousClaim?.claimId) {
    const ownerName = LandDatabase.getPlayerName(currentClaim.owner) || "Unknown";
    sendLandNotification(player, MESSAGES.ENTER_LAND(currentClaim.name || "Unnamed Land", ownerName), "random.orb");
    CACHE_STORAGE.playerCurrentLand.set(playerId, currentClaim);
  }
  // Dari wilderness ke wilderness (tidak perlu notifikasi)
  else if (!currentClaim && !previousClaim) {
    // Do nothing
  }
  // Pindah dari satu land ke land lain
  else if (currentClaim && previousClaim && currentClaim.claimId !== previousClaim.claimId) {
    const previousOwnerName = LandDatabase.getPlayerName(previousClaim.owner) || "Unknown";
    const currentOwnerName = LandDatabase.getPlayerName(currentClaim.owner) || "Unknown";
    
    sendLandNotification(player, MESSAGES.LEAVE_LAND(previousClaim.name || "Unnamed Land", previousOwnerName), "random.orb");
    system.runTimeout(() => {
      sendLandNotification(player, MESSAGES.ENTER_LAND(currentClaim.name || "Unnamed Land", currentOwnerName), "random.orb");
    }, 200);
    
    CACHE_STORAGE.playerCurrentLand.set(playerId, currentClaim);
  }
}

export class LandProtection {
  static claimCache = CACHE_STORAGE.claimCache
  static notificationCache = CACHE_STORAGE.notificationCache
  static permissionCache = CACHE_STORAGE.permissionCache

  static getDefaultPermissions() {
    return {
      break: false,
      place: false,
      interact: false,
      container: false,
      doors: false,
      redstone: false,
      attack: false,
      use: false,
      entry: false,
    }
  }

  static async isPlayerInClaim(player) {
    if (!player?.location) return null

    const pos = {
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y),
      z: Math.floor(player.location.z),
    }

    return this.getClaimFromCache(pos)
  }

  static clearClaimCache(claimId) {
    if (!claimId) return

    for (const [key, value] of this.claimCache.entries()) {
      if (value.claim?.claimId === claimId) {
        this.claimCache.delete(key)
      }
    }
  }

  static updateClaimInCache(claimId, updatedData) {
    if (!claimId) return

    for (const [key, value] of this.claimCache.entries()) {
      if (value.claim?.claimId === claimId) {
        value.claim = { ...value.claim, ...updatedData }
      }
    }
  }

  static hasPermission(player, claim, action) {
    const tags = player.getTags()
    if (tags.includes("admin") || claim.owner === player.id) return true

    const currentDimension = player.dimension.id.split(":")[1]
    if (!claim.settings?.protectedDimensions?.includes(currentDimension)) return true

    if (action === "entry" && claim.allowEntry === true) return true

    const member = claim.members?.find(m => m.id === player.id || m.name === player.name)
    if (!member) return false

    const permissionMap = {
      break: "break",
      place: "place",
      interact: "interact",
      container: "container",
      doors: "doors",
      redstone: "redstone",
      attack: "attack",
      use: "use",
      entry: "entry",
    }

    const mappedPermission = permissionMap[action] || action
    return member.permissions?.[mappedPermission] === true
  }

  static checkBlockInteraction(player, block, claim) {
    if (!block || !player || !claim || claim.owner === player.id) return false

    const blockId = block.typeId.toLowerCase()

    if (blockId.includes("sign") && !this.hasPermission(player, claim, "interact")) {
      sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot edit signs"), "note.bass")
      return true
    }

    if (BLOCK_CATEGORIES.storage.some(id => blockId.includes(id.toLowerCase())) && !this.hasPermission(player, claim, "container")) {
      sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot access containers"), "note.bass")
      return true
    }

    if (BLOCK_CATEGORIES.door.some(id => blockId.includes(id.toLowerCase())) && !this.hasPermission(player, claim, "doors")) {
      sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot use doors"), "note.bass")
      return true
    }

    if (BLOCK_CATEGORIES.redstone.some(id => blockId.includes(id.toLowerCase())) && !this.hasPermission(player, claim, "redstone")) {
      sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot use redstone"), "note.bass")
      return true
    }

    if (!this.hasPermission(player, claim, "interact")) {
      for (const [category, blocks] of Object.entries(BLOCK_CATEGORIES)) {
        if (blocks.some(id => blockId.includes(id.toLowerCase()))) {
          sendNotification(player, "PROTECTION", MESSAGES.PROTECTION(CATEGORY_MESSAGES[category]), "note.bass")
          return true
        }
      }
    }

    return false
  }

  static init() {
    system.runInterval(cleanupCaches, CACHE_CONFIG.CLEANUP_INTERVAL)

    world.afterEvents.entitySpawn.subscribe(ev => {
      try {
        const entity = ev.entity
        if (!entity || typeof entity.isValid !== "function") return

        const location = entity.location
        if (!location || typeof location !== "object") return
        if (entity.typeId === "minecraft:player" || entity.typeId.includes("item") || entity.typeId.includes("arrow") || entity.typeId.includes("projectile") || entity.typeId.includes("particle") || entity.typeId.includes("effect")) return

        const isNaturalSpawn = !ev.cause?.type || ev.cause.type === "natural" || ev.cause.type === "spawner" || ev.cause.type === "breeding"

        if (isNaturalSpawn) {
          const pos = {
            x: Math.floor(location.x),
            y: Math.floor(location.y),
            z: Math.floor(location.z),
          }

          const claim = this.getClaimFromCache(pos)
          const currentDimension = entity.dimension.id.split(":")[1]

          if (claim) {
            if (claim.settings?.mobSpawning === false && claim.settings?.protectedDimensions?.includes(currentDimension)) {
              entity.dimension.spawnParticle("minecraft:smoke_particle", {
                x: pos.x + 0.5,
                y: pos.y + 0.5,
                z: pos.z + 0.5,
              })
              entity.kill()
            }
          }
        }
      } catch (error) {
        // Error handling without console.warn
      }
    })

    world.beforeEvents.explosion.subscribe(event => {
      try {
        if (!event.source?.location) return
        const explosionLoc = event.source.location
        const claim = this.getClaimFromCache({ x: Math.floor(explosionLoc.x), y: Math.floor(explosionLoc.y), z: Math.floor(explosionLoc.z) })
        const currentDimension = event.source.dimension.id.split(":")[1]

        if (claim) {
          if (claim.settings?.explosions !== true && claim.settings?.protectedDimensions?.includes(currentDimension)) {
            event.cancel = true
          }
        }
      } catch (error) {
        // Error handling without console.warn
      }
    })

    world.beforeEvents.playerBreakBlock.subscribe(event => {
      try {
        const { player, block } = event
        const claim = this.getClaimFromCache({ x: block.location.x, y: block.location.y, z: block.location.z })
        const currentDimension = player.dimension.id.split(":")[1]

        if (claim) {
          if (!claim.settings?.protectedDimensions?.includes(currentDimension)) {
            return
          }

          if (block.typeId.includes("frame")) {
            const itemFrame = block.dimension.getEntities({
              location: block.location,
              type: block.typeId.includes("glow") ? "minecraft:glow_frame" : "minecraft:frame",
            })[0]

            if (itemFrame?.getComponent("minecraft:item_container")?.container?.size > 0) {
              event.cancel = true
              sendNotification(player, "PROTECTION", MESSAGES.ITEM_FRAME, "note.bass")
              return
            }
          }

          if (!this.hasPermission(player, claim, "break")) {
            event.cancel = true
            sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot break blocks"), "note.bass")
          }
        }
      } catch (error) {
        // Error handling without console.warn
      }
    })

    world.beforeEvents.playerPlaceBlock.subscribe(event => {
      const { player, block } = event
      const currentDimension = player.dimension.id.split(":")[1]
      const inventory = player?.getComponent("minecraft:inventory")
      const isFluidRelated = inventory?.container && typeof player.selectedSlot === "number" && inventory.container.getItem(player.selectedSlot)?.typeId?.toLowerCase().includes("bucket")

      const blockLocation = { x: Math.floor(block.location.x), y: Math.floor(block.location.y), z: Math.floor(block.location.z) }
      const claim = this.getClaimFromCache(blockLocation)

      if (claim && !claim.settings?.protectedDimensions?.includes(currentDimension)) return

      if (claim && claim.owner !== player.id && (!this.hasPermission(player, claim, "place") || (isFluidRelated && !this.hasPermission(player, claim, "interact")))) {
        event.cancel = true
        const message = isFluidRelated ? "You cannot place fluids" : "You cannot place blocks"
        sendNotification(player, "PROTECTION", MESSAGES.PROTECTION(message), "note.bass")
      }
    })

    world.beforeEvents.playerInteractWithEntity.subscribe(event => {
      const { player, target: entity } = event
      if (entity?.typeId?.includes("sign")) {
        const location = entity.location
        const claim = this.getClaimFromCache({ x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) })
        if (claim && claim.owner !== player.id && !this.hasPermission(player, claim, "interact")) {
          event.cancel = true
          sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot edit signs"), "note.bass")
        }
      }
    })

    world.beforeEvents.playerInteractWithBlock.subscribe(event => {
      const { player, block, itemStack } = event
      const claim = this.getClaimFromCache({ x: block.location.x, y: block.location.y, z: block.location.z })
      if (!claim || claim.owner === player.id || player.getTags().includes("admin")) return

      if (itemStack && !this.hasPermission(player, claim, "use")) {
        const now = Date.now()
        const notifKey = `use_item_${player.id}_${block.location.x}_${block.location.y}_${block.location.z}`
        const lastNotif = CACHE_STORAGE.notificationCache.get(notifKey)

        const isUsableItem = itemStack.typeId.toLowerCase().includes("bucket") || itemStack.typeId.toLowerCase().includes("bone_meal") || itemStack.typeId.toLowerCase().includes("spawn_egg") || itemStack.typeId.toLowerCase().includes("shear")

        if (isUsableItem) {
          event.cancel = true
          if (!lastNotif || now - lastNotif > CACHE_CONFIG.NOTIFICATION_COOLDOWN * 2) {
            CACHE_STORAGE.notificationCache.set(notifKey, now)
            sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot use items here"), "note.bass")
            showAngryParticle(player, block.location)
          }
          return
        }
      }

      if (block.typeId.includes("frame") && !this.hasPermission(player, claim, "interact")) {
        event.cancel = true
        const now = Date.now()
        const notifKey = `frame_${player.id}`
        const lastNotif = CACHE_STORAGE.notificationCache.get(notifKey)

        if (!lastNotif || now - lastNotif > CACHE_CONFIG.NOTIFICATION_COOLDOWN) {
          CACHE_STORAGE.notificationCache.set(notifKey, now)
          sendNotification(player, "PROTECTION", MESSAGES.PROTECTION("You cannot interact with item frames"), "note.bass")
          showAngryParticle(player, block.location)
        }
        return
      }

      const blockId = block.typeId.toLowerCase()
      for (const [category, blocks] of Object.entries(BLOCK_CATEGORIES)) {
        if (blocks.some(id => blockId.includes(id.toLowerCase()))) {
          const requiredPerm =
            category === "door" ? "doors"
            : category === "storage" ? "container"
            : category === "redstone" ? "redstone"
            : "interact"

          if (!this.hasPermission(player, claim, requiredPerm)) {
            event.cancel = true
            const now = Date.now()
            const notifKey = `${category}_${player.id}`
            const lastNotif = CACHE_STORAGE.notificationCache.get(notifKey)

            if (!lastNotif || now - lastNotif > CACHE_CONFIG.NOTIFICATION_COOLDOWN) {
              CACHE_STORAGE.notificationCache.set(notifKey, now)
              sendNotification(player, "PROTECTION", MESSAGES.PROTECTION(CATEGORY_MESSAGES[category]), "note.bass")
              showAngryParticle(player, block.location)
            }
            break
          }
        }
      }
    })

    // Sistem utama untuk mengecek perpindahan land
    system.runInterval(() => {
      const players = world.getAllPlayers()
      for (const player of players) {
        if (!player?.location) continue

        const currentPos = { x: Math.floor(player.location.x), y: Math.floor(player.location.y), z: Math.floor(player.location.z) }
        const lastPos = CACHE_STORAGE.lastPlayerPositions.get(player.id)
        const claim = this.getClaimFromCache(currentPos)
        const currentDimension = player.dimension.id.split(":")[1]

        // Handle land transition notifications
        handleLandTransition(player, currentPos);

        if (!claim || claim.owner === player.id || !claim.settings?.protectedDimensions?.includes(currentDimension)) {
          CACHE_STORAGE.lastPlayerPositions.set(player.id, currentPos)
          if (CACHE_STORAGE.playerEffects.has(player.id)) {
            removeWeaknessEffect(player)
          }
          continue
        }

        if (claim.settings?.pvp === false) {
          const member = claim.members?.find(m => m.id === player.id || m.name === player.name)
          if (!member || member.permissions?.pvp !== true) {
            if (!CACHE_STORAGE.playerEffects.has(player.id)) {
              applyWeaknessEffect(player, claim)
            }
          } else if (CACHE_STORAGE.playerEffects.has(player.id)) {
            removeWeaknessEffect(player)
          }
        } else if (CACHE_STORAGE.playerEffects.has(player.id)) {
          removeWeaknessEffect(player)
        }

        if (!this.hasPermission(player, claim, "entry")) {
          if (lastPos) {
            const lastPosInClaim = this.getClaimFromCache(lastPos)
            if (!lastPosInClaim || lastPosInClaim.claimId !== claim.claimId) {
              try {
                player.teleport({ x: lastPos.x + 0.5, y: lastPos.y, z: lastPos.z + 0.5 })
                sendNotification(player, "ENTRY", MESSAGES.ENTRY(), "note.bass")
              } catch (e) {
                const angle = Math.atan2(player.location.z - currentPos.z, player.location.x - currentPos.x) || 0
                const newPos = {
                  x: currentPos.x - Math.cos(angle) * 3,
                  y: currentPos.y,
                  z: currentPos.z - Math.sin(angle) * 3,
                }
                player.teleport(newPos)
              }
            } else {
              const angle = Math.atan2(player.location.z, player.location.x) || 0
              const newPos = {
                x: currentPos.x - Math.cos(angle) * 3,
                y: currentPos.y,
                z: currentPos.z - Math.sin(angle) * 3,
              }
              player.teleport(newPos)
              sendNotification(player, "ENTRY", MESSAGES.ENTRY(), "note.bass")
            }
          } else {
            const angle = Math.atan2(player.location.z, player.location.x) || 0
            const newPos = {
              x: currentPos.x - Math.cos(angle) * 3,
              y: currentPos.y,
              z: currentPos.z - Math.sin(angle) * 3,
            }
            player.teleport(newPos)
            sendNotification(player, "ENTRY", MESSAGES.ENTRY(), "note.bass")
          }
        } else {
          CACHE_STORAGE.lastPlayerPositions.set(player.id, currentPos)
        }
      }
    }, 5)

    system.runInterval(() => {
      const players = world.getAllPlayers()
      cleanupCaches()
      for (const player of players) {
        const currentPos = { x: Math.floor(player.location.x), y: Math.floor(player.location.y), z: Math.floor(player.location.z) }
        const lastPos = CACHE_STORAGE.lastPlayerPositions.get(player.id)
        const hasMovedSignificantly = !lastPos || Math.abs(lastPos.x - currentPos.x) > 0.5 || Math.abs(lastPos.y - currentPos.y) > 0.5 || Math.abs(lastPos.z - currentPos.z) > 0.5
        CACHE_STORAGE.lastPlayerPositions.set(player.id, currentPos)
        const wasSneaking = CACHE_STORAGE.playerSneakStates.get(player.id) || false
        const isSneaking = player.isSneaking
        CACHE_STORAGE.playerSneakStates.set(player.id, isSneaking)
        if (isSneaking && (hasMovedSignificantly || !wasSneaking)) {
          const claim = this.getClaimFromCache(currentPos)
          if (claim) {
            const lastInfo = CACHE_STORAGE.lastLandInfo.get(player.id)
            const owner = LandDatabase.getPlayerName(claim.owner) || "Unknown"
            const currentInfo = `${owner}'s Land (${claim.claimId || "Unknown"})`
            if (!lastInfo || lastInfo !== currentInfo) {
              CACHE_STORAGE.lastLandInfo.set(player.id, currentInfo)
              LandParticles.showLandOutline(claim.pos1, claim.pos2)
              player.onScreenDisplay.setActionBar(`§e${currentInfo}`)
            }
          } else CACHE_STORAGE.lastLandInfo.delete(player.id)
        } else if (!isSneaking && wasSneaking) CACHE_STORAGE.lastLandInfo.delete(player.id)
      }
    }, 10)

    world.beforeEvents.fluidPlaceEvent?.subscribe?.(event => {
      const player = event.source
      if (!player?.isValid?.() || !player?.location) return
      const location = { x: Math.floor(event.block?.location?.x || player.location.x), y: Math.floor(event.block?.location?.y || player.location.y), z: Math.floor(event.block?.location?.z || player.location.z) }
      const claim = this.getClaimFromCache(location)
      if (claim && claim.owner !== player.id && !this.hasPermission(player, claim, "interact")) {
        event.cancel = true
        sendNotification(player, "PROTECTION", MESSAGES.FLUID, "note.bass")
      }
    })
  }

  // ... (sisanya tetap sama, getClaimFromCache dan method lainnya)

  static getClaimFromCache(location) {
    if (!location || typeof location.x !== "number" || typeof location.z !== "number") {
      return null
    }

    const posKey = `${Math.floor(location.x)},${Math.floor(location.z)}`
    const cached = CACHE_STORAGE.claimCache.get(posKey)
    if (cached && Date.now() - cached.time < CACHE_CONFIG.LIFETIME) {
      return cached.claim
    }

    try {
      // Get all player IDs from the dynamic property storage
      const allPlayerIds = []
      const allPlayers = world.getAllPlayers()
      let allClaims = []

      // First, add online players to the list and get their claims
      for (const player of allPlayers) {
        allPlayerIds.push(player.id)
        const claimKey = LandDatabase.getPlayerClaimKey(player.id)
        const playerClaimsData = world.getDynamicProperty(claimKey)
        if (playerClaimsData) {
          try {
            const playerClaims = JSON.parse(playerClaimsData)
            allClaims = allClaims.concat(playerClaims)
          } catch (parseError) {
            // Skip invalid JSON data
          }
        }
      }

      // Then, try to scan for offline player claims
      try {
        const allDynamicProps = world.getDynamicPropertyIds()

        // Check if allDynamicProps is iterable
        if (allDynamicProps && typeof allDynamicProps[Symbol.iterator] === "function") {
          for (const propId of allDynamicProps) {
            if (propId && propId.startsWith && propId.startsWith(LandDatabase.CLAIMS_PREFIX)) {
              const playerId = propId.substring(LandDatabase.CLAIMS_PREFIX.length)
              if (!allPlayerIds.includes(playerId)) {
                const playerClaimsData = world.getDynamicProperty(propId)
                if (playerClaimsData) {
                  try {
                    const playerClaims = JSON.parse(playerClaimsData)
                    allClaims = allClaims.concat(playerClaims)
                  } catch (parseError) {
                    // Skip invalid JSON data
                  }
                }
              }
            }
          }
        }
      } catch (dynamicPropsError) {
        // Continue with just the online players' claims
      }

      if (allClaims.length === 0) {
        CACHE_STORAGE.claimCache.set(posKey, { claim: null, time: Date.now() })
        return null
      }

      for (const claim of allClaims) {
        if (!claim?.pos1 || !claim?.pos2) continue

        const pos1 = { x: Math.floor(claim.pos1.x), z: Math.floor(claim.pos1.z) }
        const pos2 = { x: Math.floor(claim.pos2.x), z: Math.floor(claim.pos2.z) }
        const minX = Math.min(pos1.x, pos2.x)
        const maxX = Math.max(pos1.x, pos2.x)
        const minZ = Math.min(pos1.z, pos2.z)
        const maxZ = Math.max(pos1.z, pos2.z)
        const x = Math.floor(location.x)
        const z = Math.floor(location.z)

        if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
          CACHE_STORAGE.claimCache.set(posKey, { claim, time: Date.now() })
          return claim
        }
      }

      CACHE_STORAGE.claimCache.set(posKey, { claim: null, time: Date.now() })
      return null
    } catch (e) {
      return null
    }
  }

  static revokeAccess(player, claim, memberId) {
    if (!claim?.claimId || !claim?.owner) return false

    try {
      const claimKey = LandDatabase.getPlayerClaimKey(claim.owner)
      const playerClaimsData = world.getDynamicProperty(claimKey)
      if (!playerClaimsData) return false

      const playerClaims = JSON.parse(playerClaimsData)
      const claimIndex = playerClaims.findIndex(c => c.claimId === claim.claimId)

      if (claimIndex === -1) return false

      const targetClaim = playerClaims[claimIndex]
      if (!targetClaim?.members) return false

      targetClaim.members = targetClaim.members.filter(m => m.id !== memberId && m.name !== LandDatabase.getPlayerName(memberId))

      if (!targetClaim.accessHistory) targetClaim.accessHistory = []
      targetClaim.accessHistory.push({
        playerName: LandDatabase.getPlayerName(memberId),
        action: "revoked",
        timestamp: Date.now(),
      })

      playerClaims[claimIndex] = targetClaim
      world.setDynamicProperty(claimKey, JSON.stringify(playerClaims))
      this.clearClaimCache(claim.claimId)

      return true
    } catch (e) {
      return false
    }
  }

  static setMemberPermissions(claimId, targetName, permissions) {
    try {
      // First, we need to find which player owns this claim
      let claimOwner = null
      let playerClaims = null
      let claimIndex = -1

      // Check online players first
      const allPlayers = world.getAllPlayers()
      for (const player of allPlayers) {
        const claimKey = LandDatabase.getPlayerClaimKey(player.id)
        const playerClaimsData = world.getDynamicProperty(claimKey)

        if (playerClaimsData) {
          try {
            const claims = JSON.parse(playerClaimsData)
            const foundClaimIndex = claims.findIndex(c => c.claimId === claimId)

            if (foundClaimIndex !== -1) {
              claimOwner = player.id
              playerClaims = claims
              claimIndex = foundClaimIndex
              break
            }
          } catch (parseError) {
            // Skip invalid JSON data
          }
        }
      }

      // If not found in online players, try to check offline players
      if (!claimOwner) {
        try {
          const allDynamicProps = world.getDynamicPropertyIds()

          // Check if allDynamicProps is iterable
          if (allDynamicProps && typeof allDynamicProps[Symbol.iterator] === "function") {
            for (const propId of allDynamicProps) {
              if (propId && propId.startsWith && propId.startsWith(LandDatabase.CLAIMS_PREFIX)) {
                const playerId = propId.substring(LandDatabase.CLAIMS_PREFIX.length)
                const playerClaimsData = world.getDynamicProperty(propId)

                if (playerClaimsData) {
                  try {
                    const claims = JSON.parse(playerClaimsData)
                    const foundClaimIndex = claims.findIndex(c => c.claimId === claimId)

                    if (foundClaimIndex !== -1) {
                      claimOwner = playerId
                      playerClaims = claims
                      claimIndex = foundClaimIndex
                      break
                    }
                  } catch (parseError) {
                    // Skip invalid JSON data
                  }
                }
              }
            }
          }
        } catch (dynamicPropsError) {
          // Continue with just the online players' claims
        }
      }

      if (!claimOwner || !playerClaims || claimIndex === -1) return false

      const claim = playerClaims[claimIndex]
      if (!claim.members) claim.members = []

      const memberIndex = claim.members.findIndex(m => m.name === targetName)
      if (memberIndex === -1) {
        claim.members.push({ name: targetName, permissions })
      } else {
        claim.members[memberIndex].permissions = permissions
      }

      playerClaims[claimIndex] = claim
      const claimKey = LandDatabase.getPlayerClaimKey(claimOwner)
      world.setDynamicProperty(claimKey, JSON.stringify(playerClaims))
      return true
    } catch (e) {
      return false
    }
  }

  static sendProtectionMessage(player, message, owner) {
    sendNotification(player, "PROTECTION", `§c${message} (Owner: ${owner})`, "note.bass")
  }

  static getBlockCategory(blockId) {
    const id = blockId.toLowerCase()
    for (const [category, blocks] of Object.entries(BLOCK_CATEGORIES)) {
      if (blocks.some(b => id.includes(b.toLowerCase()))) return category
    }
    if (id.includes("sign")) return "sign"
    return null
  }

  static getProtectionMessage(category) {
    return CATEGORY_MESSAGES[category] || "You cannot interact with this block"
  }
}

export { isClaimMember, isMemberAllowPvp }