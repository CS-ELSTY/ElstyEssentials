// Elsty Essentials - getClan Function
// Get player clan/guild information

import { guildSystem } from "../social/guildSystem.js";

export function getClan(player) {
  try {
    const guild = guildSystem.getPlayerGuild(player.name);
    if (guild) {
      return guild.tag || guild.name;
    }
    return null;
  } catch (error) {
    console.warn(`[getClan] Error getting clan for ${player?.name}:`, error);
    return null;
  }
}