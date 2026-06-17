import { system, world } from "../core.js";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

// TPA requests storage
const _tpa = {};
const TPA_TIMEOUT = 30; // seconds
const TPA_COUNTDOWN = 3; // countdown seconds

// Track pending teleports
const pendingTeleports = new Map(); // senderName => { target, originalLocation, interval }

// Find player by name
function findPlayerByName(name) {
  const players = world.getPlayers();
  for (const player of players) {
    if (player.name.toLowerCase() === name.toLowerCase()) {
      return player;
    }
  }
  return null;
}

// Send TPA request
export function sendTPARequest(sender, targetName) {
  const target = findPlayerByName(targetName);

  if (!target) {
    sender.sendMessage("§c⚠ Player tidak ditemukan atau offline!");
    return;
  }

  if (target.id === sender.id) {
    sender.sendMessage("§c⚠ Anda tidak bisa teleport ke diri sendiri!");
    return;
  }

  const key = `${target.name}::${sender.name}`;

  if (key in _tpa) {
    sender.sendMessage(`§c⚠ Anda sudah memiliki request pending ke §e${target.name}§c!`);
    return;
  }

  // Create request
  _tpa[key] = {
    tick: system.currentTick,
    runner: system.runInterval(() => {
      const elapsed = system.currentTick - _tpa[key].tick;
      const elapsedSeconds = Math.floor(elapsed / 20);

      if (elapsedSeconds >= TPA_TIMEOUT) {
        sender.sendMessage(`§c⚠ Request TPA ke §e${target.name} §c telah kadaluarsa!`);
        target.sendMessage(`§c⚠ Request TPA dari §e${sender.name} §c telah kadaluarsa!`);
        system.clearRun(_tpa[key].runner);
        delete _tpa[key];
      }
    })
  };

  // Notify both players
  target.sendMessage(`§a§l[TPA] §r§e${sender.name} §amau teleport ke lokasi Anda!`);
  target.sendMessage(`§7Ketik §f/tpaaccept §7untuk menerima atau §f/tpadeny §7untuk menolak.`);

  sender.sendMessage(`§a§l[TPA] §r§aRequest TPA dikirim ke §e${target.name}§a!`);
  sender.sendMessage(`§7Request akan kadaluarsa dalam §e${TPA_TIMEOUT} detik§7.`);
}

// Accept TPA request with countdown
export function acceptTPARequest(player, senderName = null) {
  let key;

  if (senderName) {
    // Accept specific player
    key = Object.keys(_tpa).find(k => k === `${player.name}::${senderName}`);
  } else {
    // Accept first pending request
    key = Object.keys(_tpa).find(k => k.startsWith(`${player.name}::`));
  }

  if (!key) {
    player.sendMessage("§c⚠ Tidak ada request TPA yang pending!");
    return;
  }

  const senderNameActual = key.split('::')[1];
  const sender = findPlayerByName(senderNameActual);

  if (!sender) {
    player.sendMessage(`§c⚠ Player §e${senderNameActual} §ctidak ditemukan atau offline!`);
    system.clearRun(_tpa[key].runner);
    delete _tpa[key];
    return;
  }

  // Check if sender already has pending teleport
  if (pendingTeleports.has(sender.name)) {
    player.sendMessage(`§c⚠ §e${sender.name} §csedang dalam proses teleport!`);
    return;
  }

  // Store original location and start countdown
  const originalLocation = { ...sender.location };
  pendingTeleports.set(sender.name, {
    target: player,
    originalLocation: originalLocation
  });

  // Start countdown
  let countdown = TPA_COUNTDOWN;
  const pos0 = sender.location;

  sender.sendMessage(`§a§l[TPA] §r§e${player.name} §amenerima request Anda!`);
  sender.sendMessage(`§7Teleport dalam §e${countdown} detik§7...`);

  player.sendMessage(`§a§l[TPA] §r§aMenerima request dari §e${sender.name}§a!`);
  player.sendMessage(`§7§e${sender.name} §7akan teleport dalam §e${countdown} detik§7...`);

  const interval = system.runInterval(() => {
    const currentPos = sender.location;

    // Check if player moved
    if (Math.abs(currentPos.x - pos0.x) > 0.1 ||
        Math.abs(currentPos.y - pos0.y) > 0.1 ||
        Math.abs(currentPos.z - pos0.z) > 0.1) {

      // Cancel teleport - player moved
      system.clearRun(interval);
      pendingTeleports.delete(sender.name);
      sender.sendMessage("§c⚠ Teleport dibatalkan - Anda bergerak!");
      player.sendMessage(`§c⚠ Teleport §e${sender.name} §cdibatalkan - dia bergerak!`);
      system.clearRun(_tpa[key].runner);
      delete _tpa[key];
      return;
    }

    // Update countdown display
    const barLen = 10;
    const progress = (countdown / TPA_COUNTDOWN) * barLen;
    const full = Math.floor(progress);
    let bar = "█".repeat(full);
    bar += " ".repeat(Math.max(0, barLen - bar.length));
    sender.onScreenDisplay.setActionBar(`§eTPA Countdown [§b${bar}§e] §b${countdown}s`);

    countdown--;

    if (countdown <= 0) {
      // Teleport
      system.clearRun(interval);
      pendingTeleports.delete(sender.name);

      try {
        const targetLocation = player.location;
        const targetDimension = player.dimension;
        const targetRotation = player.getRotation();

        sender.teleport(targetLocation, {
          dimension: targetDimension,
          rotation: targetRotation
        });

        sender.sendMessage(`§a§l[TPA] §r§aTeleport berhasil ke §e${player.name}§a!`);
        sender.onScreenDisplay.setActionBar("§aTeleport berhasil!");
        sender.runCommand("playsound mob.endermen.portal @s ~ ~ ~ 1 1 1");

        player.sendMessage(`§a§l[TPA] §r§e${sender.name} §ateleport ke lokasi Anda!`);

        system.clearRun(_tpa[key].runner);
        delete _tpa[key];
      } catch (error) {
        player.sendMessage(`§c⚠ Gagal teleport: ${error.message}`);
        sender.sendMessage(`§c⚠ Gagal teleport: ${error.message}`);
        sender.onScreenDisplay.setActionBar("§cGagal teleport!");
        system.clearRun(_tpa[key].runner);
        delete _tpa[key];
      }
    }
  }, 20); // Check every second (20 ticks)
}

// Deny TPA request
export function denyTPARequest(player, senderName = null) {
  let key;

  if (senderName) {
    // Deny specific player
    key = Object.keys(_tpa).find(k => k === `${player.name}::${senderName}`);
  } else {
    // Deny first pending request
    key = Object.keys(_tpa).find(k => k.startsWith(`${player.name}::`));
  }

  if (!key) {
    player.sendMessage("§c⚠ Tidak ada request TPA yang pending!");
    return;
  }

  const senderNameActual = key.split('::')[1];
  const sender = findPlayerByName(senderNameActual);

  if (sender) {
    sender.sendMessage(`§c§l[TPA] §r§e${player.name} §cmenolak request TPA Anda!`);
  }

  player.sendMessage(`§c§l[TPA] §r§cRequest TPA dari §e${senderNameActual} §cditolak!`);

  system.clearRun(_tpa[key].runner);
  delete _tpa[key];
}

// Show TPA menu
export function showTPAMenu(player) {
  const ui = new ActionFormData();

  ui.title("§6§lTPA System");
  ui.body("§ePilih aksi TPA:\n\n§f• Kirim request teleport\n§f• Terima request pending\n§f• Tolak request pending");

  ui.button("§a§lSend Request\n§7Kirim TPA", "textures/ui/icon_import");
  ui.button("§b§lAccept\n§7Terima TPA", "textures/ui/icon_check");
  ui.button("§c§lDeny\n§7Tolak TPA", "textures/ui/icon_cancel");
  ui.button("§7§lCancel", "textures/ui/arrow_left");

  ui.show(player).then(res => {
    if (res.canceled) return;

    switch (res.selection) {
      case 0:
        showSendTPAMenu(player);
        break;
      case 1:
        showAcceptTPAMenu(player);
        break;
      case 2:
        showDenyTPAMenu(player);
        break;
    }
  });
}

// Show send TPA menu
function showSendTPAMenu(player) {
  const players = world.getPlayers();
  const playerList = players
    .filter(p => p.id !== player.id)
    .map(p => p.name);

  if (playerList.length === 0) {
    player.sendMessage("§c⚠ Tidak ada player lain online!");
    return;
  }

  const ui = new ActionFormData();
  ui.title("§a§lSend TPA Request");
  ui.body("§ePilih player untuk teleport:");

  for (const playerName of playerList) {
    ui.button(`§f${playerName}`, "textures/ui/Mobs");
  }

  ui.button("§7§lBack", "textures/ui/arrow_left");

  ui.show(player).then(res => {
    if (res.canceled || res.selection === playerList.length) {
      showTPAMenu(player);
      return;
    }

    const targetName = playerList[res.selection];
    sendTPARequest(player, targetName);
  });
}

// Show accept TPA menu
function showAcceptTPAMenu(player) {
  const pendingRequests = Object.keys(_tpa)
    .filter(k => k.startsWith(`${player.name}::`))
    .map(k => k.split('::')[1]);

  if (pendingRequests.length === 0) {
    player.sendMessage("§c⚠ Tidak ada request TPA yang pending!");
    return;
  }

  if (pendingRequests.length === 1) {
    acceptTPARequest(player, pendingRequests[0]);
    return;
  }

  const ui = new ActionFormData();
  ui.title("§b§lAccept TPA Request");
  ui.body("§ePilih request untuk diterima:");

  for (const senderName of pendingRequests) {
    ui.button(`§f${senderName}`, "textures/ui/Mobs");
  }

  ui.button("§7§lBack", "textures/ui/arrow_left");

  ui.show(player).then(res => {
    if (res.canceled || res.selection === pendingRequests.length) {
      showTPAMenu(player);
      return;
    }

    acceptTPARequest(player, pendingRequests[res.selection]);
  });
}

// Show deny TPA menu
function showDenyTPAMenu(player) {
  const pendingRequests = Object.keys(_tpa)
    .filter(k => k.startsWith(`${player.name}::`))
    .map(k => k.split('::')[1]);

  if (pendingRequests.length === 0) {
    player.sendMessage("§c⚠ Tidak ada request TPA yang pending!");
    return;
  }

  if (pendingRequests.length === 1) {
    denyTPARequest(player, pendingRequests[0]);
    return;
  }

  const ui = new ActionFormData();
  ui.title("§c§lDeny TPA Request");
  ui.body("§ePilih request untuk ditolak:");

  for (const senderName of pendingRequests) {
    ui.button(`§f${senderName}`, "textures/ui/Mobs");
  }

  ui.button("§7§lBack", "textures/ui/arrow_left");

  ui.show(player).then(res => {
    if (res.canceled || res.selection === pendingRequests.length) {
      showTPAMenu(player);
      return;
    }

    denyTPARequest(player, pendingRequests[res.selection]);
  });
}