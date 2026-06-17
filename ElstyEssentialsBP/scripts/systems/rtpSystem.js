import { system, world } from "../core.js";
import { ActionFormData } from "@minecraft/server-ui";

const cooldowns = new Map();
const pending = new Map();
const rtpQueue = new Map(); // playerName => { loc, old, tick }
const CENTER = [0, 0];

const msg = {
  title: "§6§lRandom Teleport",
  cd: s => `§cCooldown! Wait §e${s} §csec`,
  wait: "§eFinding safe location...",
  move: "§cTeleport cancelled - You moved!",
  cancel: "§cRandom teleport cancelled",
  error: "§cFailed to process teleport request",
  under: "§cPlease wait, still processing previous teleport",
};

// Default configuration
const RTP_CONFIG = {
  maxUses: 3,
  cooldownTime: 5 * 60,
  maxDistance: 2000,
  teleportDelay: 3
};

export function random_tp(pl) {
  const cfg = getRTPConfig();
  const now = Date.now();
  let ts = cooldowns.get(pl.name) || [];
  ts = ts.filter(t => now - t < cfg.cooldownTime * 1000);

  if (ts.length >= cfg.maxUses) {
    const sisa = Math.ceil((cfg.cooldownTime * 1000 - (now - ts[0])) / 1000);
    pl.onScreenDisplay.setActionBar(msg.cd(sisa));
    return;
  }

  if (pending.has(pl.name) || rtpQueue.has(pl.name)) {
    pl.onScreenDisplay.setActionBar(msg.under);
    return;
  }

  const sisa = cfg.maxUses - ts.length;

  // Jalankan UI di dalam system.run() agar punya izin penuh
  system.run(() => {
    const form = new ActionFormData()
      .title(msg.title)
      .body(`§eRandom Teleport Adventure\n\n§fRemaining: §b${sisa}§f/§b${cfg.maxUses}\n§fCooldown: §c${cfg.cooldownTime / 60}m\n§fMax: §b${cfg.maxDistance} blocks\n§fTeleport Countdown: §b${cfg.teleportDelay || 3}s`)
      .button("§bTeleport Now", "textures/ui/icon_winter")
      .button("§cCancel", "textures/ui/cancel");

    form.show(pl)
      .then(res => handleRTP(pl, ts, now, res))
      .catch(() => pl.onScreenDisplay.setActionBar(msg.error));
  });
}

function doRandomTeleport(pl, ts, now) {
  const cfg = getRTPConfig();
  const x = Math.floor(Math.random() * (cfg.maxDistance * 2 + 1)) - cfg.maxDistance;
  const z = Math.floor(Math.random() * (cfg.maxDistance * 2 + 1)) - cfg.maxDistance;
  const fakeY = 320;
  const loc = { x, y: fakeY, z };
  const oldLoc = { ...pl.location, dim: pl.dimension.id };
  pl.addTag(`rtpOld\`${JSON.stringify(oldLoc)}`);
  try {
    if (!pl || !pl.dimension) throw new Error("Player tidak valid");
    pl.teleport({ x: CENTER[0], y: 320, z: CENTER[1] }, { dimension: world.getDimension("overworld") });
    pl.teleport(loc, { dimension: world.getDimension("overworld") });
    rtpQueue.set(pl.name, { loc, old: oldLoc, tick: 0 });
    pl.onScreenDisplay.setActionBar(msg.wait);
    ts.push(now);
    cooldowns.set(pl.name, ts);
  } catch (e) {
    pending.delete(pl.name);
    rtpQueue.delete(pl.name);
    pl?.onScreenDisplay?.setActionBar(msg.error);
  }
}

function doRandomTeleportWithCountdown(pl, ts, now, cb) {
  const cfg = getRTPConfig();
  const DELAY = cfg.teleportDelay || 3;
  const pos0 = pl.location;
  let cd = DELAY,
    frame = 0;
  pending.set(pl.name, true);
  const barLen = 10;
  const intv = system.runInterval(() => {
    const pos = pl.location;
    if (Math.abs(pos.x - pos0.x) > 0.1 || Math.abs(pos.y - pos0.y) > 0.1 || Math.abs(pos.z - pos0.z) > 0.1) {
      system.clearRun(intv);
      pending.delete(pl.name);
      pl.onScreenDisplay.setActionBar(msg.move);
      return;
    }
    const totalFrames = DELAY * 20;
    const progress = (cd / DELAY) * barLen - (frame / totalFrames) * barLen;
    const trans = ["▏", "▎", "▍", "▌", "▋", "▊", "▉"];
    const full = Math.max(0, Math.floor(progress));
    let bar = "█".repeat(full);
    const frac = progress - full;
    if (frac > 0 && full < barLen) bar += trans[Math.floor(frac * trans.length)];
    bar += " ".repeat(Math.max(0, barLen - bar.length));
    pl.onScreenDisplay.setActionBar(`§eTeleport Countdown [§b${bar}§e] §b${cd}s`);
    frame++;
    if (frame >= 20) {
      frame = 0;
      cd--;
    }
    if (cd <= 0) {
      system.clearRun(intv);
      pending.delete(pl.name);
      cb();
    }
  }, 1);
}

function handleRTP(pl, ts, now, res) {
  if (res.canceled || res.selection === 1) {
    pl.onScreenDisplay.setActionBar(msg.cancel);
    return;
  }
  try {
    doRandomTeleportWithCountdown(pl, ts, now, () => doRandomTeleport(pl, ts, now));
  } catch {
    pl.onScreenDisplay.setActionBar(msg.error);
    pending.delete(pl.name);
  }
}

// Interval hanya cek player di rtpQueue, bukan all player
system.runInterval(() => {
  for (const [name, data] of rtpQueue) {
    const pl = world.getPlayers().find(p => p.name === name);
    if (!pl) {
      rtpQueue.delete(name);
      continue;
    }
    let y = data.loc.y;
    let blk = pl.dimension.getBlock({ x: data.loc.x, y, z: data.loc.z });
    while (y >= -64 && blk && (blk.isAir || blk.isLiquid || blk.typeId === "minecraft:cave_air")) {
      y--;
      blk = pl.dimension.getBlock({ x: data.loc.x, y, z: data.loc.z });
    }
    if (y >= -64 && blk && typeof blk.x === "number" && typeof blk.y === "number" && typeof blk.z === "number") {
      const fy = Math.round(blk.y + 1);
      try {
        pl.teleport({ x: blk.x + 0.5, y: fy, z: blk.z + 0.5 }, { dimension: world.getDimension("overworld") });
        pl.removeTag(`rtpLoad\`${JSON.stringify(data.loc)}`);
        pl.removeTag(`rtpOld\`${JSON.stringify(data.old)}`);
        pl.onScreenDisplay.setActionBar(`§fYou have been teleported to §bX: ${Math.round(blk.x + 0.5)} Y: ${fy} Z: ${Math.round(blk.z + 0.5)}`);
        pl.runCommand("playsound mob.endermen.portal @s ~ ~ ~ 1 1 1");
      } catch (e) {
        pl?.onScreenDisplay?.setActionBar(msg.error);
      }
      rtpQueue.delete(name);
    }
  }
}, 2); // interval bisa diubah, misal 2 tick (100ms) biar lebih ringan

world.beforeEvents.playerLeave.subscribe(({ playerName }) => {
  if (pending.has(playerName)) pending.delete(playerName);
  if (rtpQueue.has(playerName)) rtpQueue.delete(playerName);
  const pl = world.getPlayers().find(p => p.name === playerName);
  if (pl) {
    const old = pl.getTags().find(t => t.startsWith("rtpOld`"));
    if (old) {
      const { x, y, z, dim } = JSON.parse(old.split("`")[1]);
      system.run(() => {
        try {
          pl.teleport({ x, y, z }, { dimension: world.getDimension(dim) });
          pl.removeTag(old);
        } catch {}
      });
    }
  }
});

export function getRTPConfig() {
  try {
    const s = world.getDynamicProperty("rtpConfig");
    if (s) return JSON.parse(s);
  } catch {}
  return { maxUses: 3, cooldownTime: 5 * 60, maxDistance: 2000, teleportDelay: 3 };
}

export function random_tp_instant(pl) {
  const cfg = getRTPConfig();
  const now = Date.now();
  let ts = cooldowns.get(pl.name) || [];
  ts = ts.filter(t => now - t < cfg.cooldownTime * 1000);
  if (ts.length >= cfg.maxUses) {
    const sisa = Math.ceil((cfg.cooldownTime * 1000 - (now - ts[0])) / 1000);
    system.run(() => {
      pl.onScreenDisplay.setActionBar(msg.cd(sisa));
    });
    return;
  }
  if (pending.has(pl.name) || rtpQueue.has(pl.name)) {
    system.run(() => {
      pl.onScreenDisplay.setActionBar(msg.under);
    });
    return;
  }
  system.run(() => {
    doRandomTeleportWithCountdown(pl, ts, now, () => doRandomTeleport(pl, ts, now));
  });
}

// Command handler untuk integrasi dengan sistem lain
export function handleRTPCommand(player, args = []) {
  if (args.length > 0) {
    const subCmd = args[0].toLowerCase();

    // Admin reset cooldown
    if (subCmd === "reset" && (player.hasTag("admin") || player.hasTag("op"))) {
      if (args.length < 2) {
        cooldowns.delete(player.name);
        player.sendMessage("§aYour RTP cooldown has been reset!");
      } else {
        const targetName = args[1];
        cooldowns.delete(targetName);
        player.sendMessage(`§aReset RTP cooldown for ${targetName}!`);
      }
      return;
    }

    // Info command
    if (subCmd === "info") {
      const info = getRTPInfo(player);
      let message = `§6§lRTP INFO\n§7━━━━━━━━━━\n\n`;
      message += `§eStatus: ${info.onCooldown ? '§cOn Cooldown' : '§aReady'}\n`;

      if (info.onCooldown) {
        message += `§eTime remaining: §c${info.formattedRemaining}\n`;
      }

      message += `§eMax distance: §b${info.config.maxDistance} blocks\n`;
      message += `§eCooldown: §c${info.config.cooldownTime / 60} minutes\n`;
      message += `§eUses: §b${info.config.maxUses} per cooldown`;

      player.sendMessage(message);
      return;
    }
  }

  // Default: open RTP
  random_tp(player);
}

// Get RTP info for player - FUNCTION YANG DIPERLUKAN
export function getRTPInfo(player) {
  const cfg = getRTPConfig();
  const now = Date.now();
  let ts = cooldowns.get(player.name) || [];
  ts = ts.filter(t => now - t < cfg.cooldownTime * 1000);

  const remainingUses = cfg.maxUses - ts.length;
  const onCooldown = remainingUses <= 0;

  let remainingTime = 0;
  if (ts.length > 0) {
    remainingTime = Math.ceil((cfg.cooldownTime * 1000 - (now - ts[0])) / 1000);
  }

  function formatTime(seconds) {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    }
    return `${seconds}s`;
  }

  return {
    onCooldown: onCooldown,
    remainingTime: remainingTime,
    formattedRemaining: formatTime(remainingTime),
    remainingUses: remainingUses,
    config: cfg
  };
}

// Get RTP statistics
export function getRTPStats() {
  return {
    totalCooldowns: cooldowns.size,
    activePlayers: Array.from(cooldowns.keys()),
    pendingPlayers: Array.from(pending.keys()),
    queuePlayers: Array.from(rtpQueue.keys())
  };
}

// Initialize RTP system
export function initializeRTPSystem() {
  console.warn("[RTP System] Random Teleport System initialized");
}

export default {
  random_tp,
  handleRTPCommand,
  getRTPInfo,
  getRTPStats,
  initializeRTPSystem
};