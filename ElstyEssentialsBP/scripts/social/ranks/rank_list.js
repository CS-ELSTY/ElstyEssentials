import { world, system, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const ADMIN_WA_NUMBER = "62882003166946";

system.runInterval(() => {
  for (let player of world.getPlayers()) {
    if (player.hasTag("ranklist")) {
      rank(player);
      player.removeTag("ranklist");
    }
  }
});  

export function rank(player) {
  const ui = new ActionFormData();
  
  ui.title("§6§lRANK SHOP");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§6§l      PREMIUM RANKS\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§fTingkatkan pengalaman bermain Anda\n" +
    "§fdengan membeli rank premium!\n\n" +
    "§e⚡ §fAkses Command + (plus commands)\n" +
    "§e🎁 §fPrefix Eksklusif di Chat\n" +
    "§e🌟 §fFitur Gameplay Spesial\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§7※ Hubungi nomor di atas untuk pembelian\n" +
    "§7※ Contact above number to purchase"
  );
  
  // Rank utama dengan harga - DIURUTKAN dari TERKECIL ke TERBESAR
  ui.button(" §lNOOB\n§62K §8| §aView Features", "textures/ui/friend_glyph_desaturated");
  ui.button(" §lSTONE\n§65K §8| §aView Features", "textures/blocks/stone");
  ui.button(" §lIRON\n§610K §8| §aView Features", "textures/items/iron_ingot");
  ui.button(" §lVIP\n§615K §8| §aView Features", "textures/ui/icon_recipe_equipment");
  ui.button(" §lGOLD\n§625K §8| §aView Features", "textures/items/gold_ingot");
  ui.button(" §lDIAMOND\n§645K §8| §aView Features", "textures/items/diamond");
  ui.button("§6§lMORE RANKS\n§aClick to view all", "textures/ui/icon_more");
  ui.button("§c§lCLOSE MENU", "textures/ui/cancel");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    switch (res.selection) {
      case 0:
        rankNoob(player);
        break;
      case 1:
        rankStone(player);
        break;
      case 2:
        rankIron(player);
        break;
      case 3:
        rankVIP(player);
        break;
      case 4:
        rankGold(player);
        break;
      case 5:
        rankDiamond(player);
        break;
      case 6:
        showAllRanks(player);
        break;
      case 7:
        player.playSound("note.pling");
        break;
    }
  });
}

export function rankVIP(player) {
  const ui = new ActionFormData();
  
  ui.title("§c§lVIP RANK ");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§c§l        VIP FEATURES\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§6§lHarga: §e5,000\n\n" +
    "§a✓ §fCommand + yang didapatkan:\n" +
    "§7• §b+feed §8- Isi kekenyangan\n" +
    "§7• §b+nightvision §8- Penglihatan malam\n" +
    "§7• §b+heal §8- Sembuhkan diri\n" +
    "§7• §b+clear §8- Hapus efek\n" +
    "§6🎯 §ePrefix: §c\n" +
    "§6🌈 §eWarna: §cMerah\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§e⚠ Hubungi nomor di atas untuk pembelian"
  );
  
  ui.button("§c§lBUY VIP\n§7Konfirmasi pembelian", "textures/ui/icon_check");
  ui.button("§7§lBACK TO MENU", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) {
      player.sendMessage("§a§l[SUCCESS] §r§aUntuk membeli rank VIP, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 1) {
      rank(player);
    }
  });
}

export function rankGold(player) {
  const ui = new ActionFormData();
  
  ui.title("§6§lGOLD RANK ");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§6§l       GOLD FEATURES\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§6§lHarga: §e15,000\n\n" +
    "§a✓ §fCommand + yang didapatkan:\n" +
    "§7• §b+fly §8- Terbang bebas\n" +
    "§7• §b+fly off §8- Matikan terbang\n" +
    "§7• §b+feed §8- Isi kekenyangan\n" +
    "§7• §b+clear §8- Hapus efek\n\n" +
    "§7• §b+nightvision §8- Penglihatan malam\n" +
    "§7• §b+heal §8- Sembuhkan diri\n" +
    "§7• §b+haste §8- Efek haste\n" +
    "§6🎯 §ePrefix: §6\n" +
    "§6🌈 §eWarna: §bBiru\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§e⚠ Hubungi nomor di atas untuk pembelian"
  );
  
  ui.button("§6§lBUY GOLD\n§7Konfirmasi pembelian", "textures/ui/icon_check");
  ui.button("§7§lBACK TO MENU", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) {
      player.sendMessage("§a§l[SUCCESS] §r§aUntuk membeli rank GOLD, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 1) {
      rank(player);
    }
  });
}

export function rankDiamond(player) {
  const ui = new ActionFormData();
  
  ui.title("§b§lDIAMOND RANK ");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§b§l     DIAMOND FEATURES\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§6§lHarga: §e20,000\n\n" +
    "§a✓ §fCommand + yang didapatkan:\n" +
    "§7• §b+fly §8- Terbang bebas\n" +
    "§7• §b+fly off §8- Matikan terbang\n" +
    "§7• §b+feed §8- Isi kekenyangan\n" +
    "§7• §b+nightvision §8- Penglihatan malam\n" +
    "§7• §b+heal §8- Sembuhkan diri\n" +
    "§7• §b+weather §8- Cuaca cerah\n" +
    "§7• §b+haste §8- Efek haste\n" +
    "§7• §b+day §8- Waktu siang\n" +
    "§7• §b+clear §8- Hapus efek\n" +
    "§7• §b+vanish §8- Menghilang\n\n" +
    "§6🎯 §ePrefix: §b\n" +
    "§6🌈 §eWarna: §bBiru\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§e⚠ Hubungi nomor di atas untuk pembelian"
  );
  
  ui.button("§b§lBUY DIAMOND\n§7Konfirmasi pembelian", "textures/ui/icon_check");
  ui.button("§7§lBACK TO MENU", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) {
      player.sendMessage("§a§l[SUCCESS] §r§aUntuk membeli rank DIAMOND, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 1) {
      rank(player);
    }
  });
}

export function rankIron(player) {
  const ui = new ActionFormData();
  
  ui.title("§d§lIRON RANK ");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§d§l        IRON FEATURES\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§6§lHarga: §e10,000\n\n" +
    "§a✓ §fCommand + yang didapatkan:\n" +
    "§7• §b+feed §8- Isi kekenyangan\n" +
    "§7• §b+nightvision §8- Penglihatan malam\n" +
    "§7• §b+heal §8- Sembuhkan diri\n" +
    "§7• §b+clear §8- Hapus efek\n\n" +
    "§6🎯 §ePrefix: §d\n" +
    "§6🌈 §eWarna: §dUngu\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§e⚠ Hubungi nomor di atas untuk pembelian"
  );
  
  ui.button("§d§lBUY IRON\n§7Konfirmasi pembelian", "textures/ui/icon_check");
  ui.button("§7§lBACK TO MENU", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) {
      player.sendMessage("§a§l[SUCCESS] §r§aUntuk membeli rank IRON, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 1) {
      rank(player);
    }
  });
}

export function rankStone(player) {
  const ui = new ActionFormData();
  
  ui.title("§8§lSTONE RANK ");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§8§l       STONE FEATURES\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§6§lHarga: §e3,000\n\n" +
    "§a✓ §fCommand + yang didapatkan:\n" +
    "§7• §b+feed §8- Isi kekenyangan\n" +
    "§7• §b+heal §8- Sembuhkan diri\n" +
    "§7• §b+clear §8- Hapus efek\n\n" +
    "§6🎯 §ePrefix: §8\n" +
    "§6🌈 §eWarna: §8Abu-abu\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§e⚠ Hubungi nomor di atas untuk pembelian"
  );
  
  ui.button("§8§lBUY STONE\n§7Konfirmasi pembelian", "textures/ui/icon_check");
  ui.button("§7§lBACK TO MENU", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) {
      player.sendMessage("§a§l[SUCCESS] §r§aUntuk membeli rank STONE, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 1) {
      rank(player);
    }
  });
}

export function rankNoob(player) {
  const ui = new ActionFormData();
  
  ui.title("§7§lNOOB RANK ");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§7§l        NOOB FEATURES\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§6§lHarga: §e2,000\n\n" +
    "§a✓ §fCommand + yang didapatkan:\n" +
    "§7• §b+feed §8- Isi kekenyangan\n" +
    "§7• §b+clear §8- Hapus efek\n\n" +
    "§6🎯 §ePrefix: §7\n" +
    "§6🌈 §eWarna: §7Abu-abu muda\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§e⚠ Hubungi nomor di atas untuk pembelian"
  );
  
  ui.button("§7§lBUY NOOB\n§7Konfirmasi pembelian", "textures/ui/icon_check");
  ui.button("§7§lBACK TO MENU", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) {
      player.sendMessage("§a§l[SUCCESS] §r§aUntuk membeli rank NOOB, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 1) {
      rank(player);
    }
  });
}

export function showAllRanks(player) {
  const ui = new ActionFormData();
  
  ui.title("§6§lALL RANKS");
  ui.body(
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "§6§l      COMPLETE RANK LIST\n" +
    "§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "§fSemua rank memberikan akses ke\n" +
    "§fcommand + (plus commands) spesial!\n\n" +
    "§6📞 §lKontak Admin:\n" +
    "§eWA: §a" + ADMIN_WA_NUMBER + "\n\n" +
    "§7Pilih rank untuk melihat detail fitur"
  );
  
  // Semua rank dari data yang diberikan
  ui.button(" §lVIP\n§615K", "textures/ui/icon_recipe_equipment");
  ui.button(" §lDIAMOND\n§645K", "textures/items/diamond");
  ui.button(" §lIRON\n§610K", "textures/items/iron_ingot");
  ui.button(" §lGOLD\n§625K", "textures/items/gold_ingot");
  ui.button(" §lSTONE\n§65K", "textures/blocks/stone");
  ui.button(" §lNOOB\n§62K", "textures/ui/friend_glyph_desaturated");
  ui.button(" §lEND\n§615K", "textures/blocks/end_stone");
  ui.button(" §lNETHER\n§615K", "textures/blocks/netherrack");
  ui.button(" §lSPACE\n§620K", "textures/ui/star_outline");
  ui.button(" §lFIRE\n§618K", "textures/blocks/fire_0");
  ui.button(" §lWATER\n§618K", "textures/blocks/water_placeholder");
  ui.button(" §lAIR\n§615K", "textures/ui/wind");
  ui.button(" §lTWITCH\n§625K", "textures/ui/twitch_icon");
  ui.button(" §lYOUTUBE\n§630K", "textures/ui/icon_youtube");
  ui.button(" §lSNIPER\n§620K", "textures/items/bow_standby");
  ui.button(" §lCOMMAND\n§625K", "textures/ui/command_icon");
  ui.button(" §lBUILDER\n§620K", "textures/ui/icon_recipe_construction");
  ui.button(" §lLEGENDS\n§635K", "textures/ui/trophy_icon");
  ui.button(" §lDISCORD\n§625K", "textures/ui/icon_discord");
  ui.button(" §lHELPER\n§615K", "textures/ui/icon_favorite");
  ui.button(" §lKINGDOM\n§630K", "textures/ui/crown_icon");
  ui.button(" §lDEAD\n§68K", "textures/ui/skull_icon");
  ui.button(" §lHACKER\n§625K", "textures/ui/icon_warning");
  ui.button(" §lDESIGNER\n§622K", "textures/ui/icon_paint");
  ui.button("§7§lBACK", "textures/ui/back_button");
  
  ui.show(player).then((res) => {
    if (res.canceled) return;
    
    if (res.selection === 0) rankVIP(player);
    else if (res.selection === 1) rankDiamond(player);
    else if (res.selection === 2) rankIron(player);
    else if (res.selection === 3) rankGold(player);
    else if (res.selection === 4) rankStone(player);
    else if (res.selection === 5) rankNoob(player);
    else if (res.selection >= 6 && res.selection <= 25) {
      player.sendMessage("§a§l[INFO] §r§aUntuk informasi rank ini, hubungi Admin di WA: §e" + ADMIN_WA_NUMBER);
      player.playSound("random.orb");
    } else if (res.selection === 26) {
      rank(player);
    }
  });
}