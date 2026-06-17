// Core Money Functions - Pure Logic, No Circular Dependencies
import { world } from "@minecraft/server";

// Money storage key
const MONEY_KEY = "player_money_";

// Get player's money from dynamic property or scoreboard
export function getMoney(player) {
    try {
        // Try to get from scoreboard "money" objective first
        const scoreboard = world.scoreboard;
        if (scoreboard) {
            const objective = scoreboard.getObjective("money");
            if (objective) {
                if (player.scoreboardIdentity && typeof objective.getScore === 'function') {
                    try {
                        const score = objective.getScore(player.scoreboardIdentity);
                        if (typeof score === 'number' && !isNaN(score)) {
                            return BigInt(score);
                        }
                    } catch (e) {
                        // Fall back to dynamic property
                    }
                }

                // Try getScores method
                if (typeof objective.getScores === 'function') {
                    try {
                        const scores = objective.getScores();
                        if (Array.isArray(scores)) {
                            for (const scoreInfo of scores) {
                                if (scoreInfo.participant && scoreInfo.participant.displayName === player.name) {
                                    return BigInt(scoreInfo.score || 0);
                                }
                            }
                        }
                    } catch (e) {
                        // Fall back to dynamic property
                    }
                }
            }
        }

        // Fall back to dynamic property
        const money = player.getDynamicProperty(MONEY_KEY + player.name);
        return money ? BigInt(String(money)) : 0n;
    } catch {
        return 0n;
    }
}

// Set player's money
export function setMoney(player, amount) {
    // Save to dynamic property
    player.setDynamicProperty(MONEY_KEY + player.name, String(amount));

    // Also sync to scoreboard "money" objective
    try {
        const scoreboard = world.scoreboard;
        if (scoreboard) {
            const objective = scoreboard.getObjective("money");
            if (objective && player.scoreboardIdentity) {
                try {
                    objective.setScore(player.scoreboardIdentity, Number(amount));
                } catch (e) {
                    console.warn(`[MoneySystem] Failed to sync money to scoreboard for ${player.name}:`, e);
                }
            }
        }
    } catch (e) {
        console.warn(`[MoneySystem] Error syncing money to scoreboard:`, e);
    }
}

// Add money to player - CORE FUNCTION
export function addMoney(player, amount) {
    const current = getMoney(player);
    setMoney(player, current + BigInt(amount));
}

// Remove money from player
export function removeMoney(player, amount) {
    const current = getMoney(player);
    const amt = BigInt(amount);
    if (amt > current) return false;
    setMoney(player, current - amt);
    return true;
}

// Get formatted money with metric numbers
export function getFormattedMoney(player) {
    const money = getMoney(player);
    return formatNumber(money.toString());
}

// Format number with metric system (K, M, B, T, etc.)
export function formatNumber(num) {
    if (!num || num === "0") return "0";

    const n = BigInt(num);
    const absN = n < 0n ? -n : n;

    if (absN >= 1000000000000000n) return (n / 1000000000000n).toString() + "T";
    if (absN >= 1000000000000n) return (Number(n) / 1000000000000).toFixed(2).replace(/\.00$/, "") + "T";
    if (absN >= 1000000000n) return (Number(n) / 1000000000).toFixed(2).replace(/\.00$/, "") + "B";
    if (absN >= 1000000n) return (Number(n) / 1000000).toFixed(2).replace(/\.00$/, "") + "M";
    if (absN >= 1000n) return (Number(n) / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

// Get score from scoreboard objective
export function getScore(player, objectiveId) {
    try {
        const scoreboard = world.scoreboard;
        if (!scoreboard) return 0;

        const objective = scoreboard.getObjective(objectiveId);
        if (!objective) return 0;

        // Method 1: Try getScore with scoreboardIdentity
        if (player.scoreboardIdentity && typeof objective.getScore === 'function') {
            try {
                const score = objective.getScore(player.scoreboardIdentity);
                if (typeof score === 'number' && !isNaN(score)) {
                    return score;
                }
            } catch (e) {
                // Try next method
            }
        }

        // Method 2: Try getScores array
        if (typeof objective.getScores === 'function') {
            try {
                const scores = objective.getScores();
                if (Array.isArray(scores)) {
                    for (const scoreInfo of scores) {
                        if (scoreInfo.participant && scoreInfo.participant.displayName === player.name) {
                            return scoreInfo.score || 0;
                        }
                    }
                }
            } catch (e) {
                // Try next method
            }
        }

        // Method 3: Command-based fallback
        try {
            const result = player.runCommand(`scoreboard players test @s ${objectiveId} * *`);
            if (result && result.successCount > 0) {
                const match = result.statusMessage?.match(/(\-?\d+)/);
                if (match) {
                    const score = parseInt(match[1]);
                    if (!isNaN(score)) return score;
                }
            }
        } catch (e) {
            // All methods failed
        }

        return 0;
    } catch (e) {
        return 0;
    }
}