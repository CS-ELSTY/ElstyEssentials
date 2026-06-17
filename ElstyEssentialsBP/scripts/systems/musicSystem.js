import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// --- DAFTAR MUSIK ---
const MUSIC_LIST = [
    {
        buttonName: "§fTakut - Lagu Idgitaf",
        soundId: "takut_idgitaf",
        icon: "textures/menu/music/record.png"
    }
];

/**
 * Menampilkan menu pemutar musik kepada pemain.
 * @param {Player} player Pemain yang akan menampilkan UI.
 */
export function showMusicMenu(player) {
    const form = new ActionFormData()
        .title("§l§fPEMUTAR MUSIK")
        .body(" Pilih musik untuk diputar atau hentikan musik yang sedang berjalan.");

    MUSIC_LIST.forEach(music => {
        form.button(music.buttonName, music.icon);
    });

    form.button("§fStop Musik", "textures/ui/cancel");

    form.show(player).then(response => {
        // PERBAIKAN: Gunakan 'response.canceled' untuk memeriksa apakah form ditutup.
        if (response.canceled) return;

        const selection = response.selection;

        if (selection < MUSIC_LIST.length) {
            const selectedMusic = MUSIC_LIST[selection];

            player.playSound(selectedMusic.soundId, { volume: 1.0 });
            player.sendMessage(`§aMemutar musik: ${selectedMusic.soundId}`);

        } else {
            // Stop all music sounds
            MUSIC_LIST.forEach(music => {
                player.stopSound(music.soundId);
            });
            player.sendMessage("§eMusik telah dihentikan.");
        }
    });
}

/**
 * Handler untuk command musik
 * @param {Player} player Pemain yang menjalankan command
 */
export function handleMusicCommand(player) {
    showMusicMenu(player);
}