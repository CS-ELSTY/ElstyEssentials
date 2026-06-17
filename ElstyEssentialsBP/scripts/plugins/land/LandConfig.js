import { getScore, setScore } from "../../core/utils.js";

export class LandConfig {
    static getConfig() {
        return {
            pricePerBlock: 1,
            minClaimSize: 10,
            maxClaimSize: 10000,
            maxClaimsPerPlayer: 5,
            requireMoney: true,
            freeClaim: false
        };
    }

    static validateClaim(pos1, pos2) {
        const config = this.getConfig();

        if (pos1.dimension !== pos2.dimension) {
            return { valid: false, message: "Cannot claim across dimensions!" };
        }

        const blocks = this.calculateBlocks(pos1, pos2);

        if (blocks < config.minClaimSize) {
            return { valid: false, message: `Minimum claim size is ${config.minClaimSize} blocks!` };
        }

        if (blocks > config.maxClaimSize) {
            return { valid: false, message: `Maximum claim size is ${config.maxClaimSize} blocks!` };
        }

        return { valid: true, message: "Valid claim", blocks };
    }

    static calculateBlocks(pos1, pos2) {
        const width = Math.abs(pos1.x - pos2.x) + 1;
        const length = Math.abs(pos1.z - pos2.z) + 1;
        return width * length;
    }

    static calculatePrice(blocks) {
        const config = this.getConfig();
        return config.freeClaim ? 0 : blocks * config.pricePerBlock;
    }

    static getPlayerMoney(player) {
        try {
            return getScore(player, "money");
        } catch (error) {
            return 0;
        }
    }

    static removePlayerMoney(player, amount) {
        try {
            const currentScore = getScore(player, "money");
            if (currentScore >= amount) {
                setScore(player, "money", currentScore - amount);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
}