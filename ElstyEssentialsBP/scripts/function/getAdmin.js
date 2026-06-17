// Elsty Essentials - getAdmin Function
// Check if player has admin permission using tags

export function isAdmin(player) {
  return player.hasTag("admin") || player.hasTag("op") || player.isOp;
}