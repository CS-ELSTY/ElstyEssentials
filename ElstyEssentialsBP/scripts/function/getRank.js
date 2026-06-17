// Elsty Essentials - getRank Function
// Get player rank display

import { getPlayerRank, getRankInfo } from "../social/ranks/rank.js";

export function getRank(player) {
  try {
    const rankTag = getPlayerRank(player);
    const rankInfo = getRankInfo(rankTag);
    
    if (rankInfo) {
      return `${rankInfo.color}${rankInfo.prefix}`;
    }
    
    return "§7Member";
  } catch (error) {
    console.warn(`[getRank] Error getting rank for ${player?.name}:`, error);
    return "§7Member";
  }
}