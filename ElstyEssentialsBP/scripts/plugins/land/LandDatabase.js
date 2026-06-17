/**
 * @file LandDatabase.js
 * @description Handles land claim data storage and management with support for multiple claims per player
 */

import { system, world } from '../../core.js';

// Cache system for better memory management
const claimCache = new Map();
const playerNameCache = new Map();
const CACHE_LIFETIME = 60000; // 1 minute cache lifetime

export class LandDatabase {
    static CLAIMS_PREFIX = "land_claims_";
    static PLAYER_NAMES_KEY = "land_player_names";
    static CLAIM_COUNTER_KEY = "land_claim_counter";
    static OLD_CLAIMS_KEY = "land_claims"; // Key lama untuk migrasi

    static init() {
        // Initialize database if needed
        system.run(async () => {
            if (!world.getDynamicProperty(this.PLAYER_NAMES_KEY)) {
                world.setDynamicProperty(this.PLAYER_NAMES_KEY, "{}");
            }
            if (!world.getDynamicProperty(this.CLAIM_COUNTER_KEY)) {
                world.setDynamicProperty(this.CLAIM_COUNTER_KEY, "0");
            }
            
            // Cek dan lakukan migrasi jika ada data lama
            await this.migrateOldData();
        });
    }

    static async migrateOldData() {
        try {
            const oldClaimsData = world.getDynamicProperty(this.OLD_CLAIMS_KEY);
            if (!oldClaimsData) return; // Tidak ada data lama

            const oldClaims = JSON.parse(oldClaimsData);
            if (!oldClaims || Object.keys(oldClaims).length === 0) return;

            console.warn("[Land System] Starting data migration...");

            // Kelompokkan klaim berdasarkan pemilik
            const claimsByOwner = {};
            for (const [claimId, claim] of Object.entries(oldClaims)) {
                if (!claim.owner) continue;
                
                if (!claimsByOwner[claim.owner]) {
                    claimsByOwner[claim.owner] = [];
                }
                claimsByOwner[claim.owner].push({
                    ...claim,
                    claimId
                });
            }

            // Simpan klaim ke format baru
            for (const [ownerId, claims] of Object.entries(claimsByOwner)) {
                const claimKey = this.getPlayerClaimKey(ownerId);
                world.setDynamicProperty(claimKey, JSON.stringify(claims));
            }

            // Buat backup data lama dengan timestamp
            const backupKey = `${this.OLD_CLAIMS_KEY}_backup_${Date.now()}`;
            world.setDynamicProperty(backupKey, oldClaimsData);

            // Hapus data lama setelah migrasi berhasil
            world.setDynamicProperty(this.OLD_CLAIMS_KEY, null);

            console.warn("[Land System] Data migration completed successfully!");
            console.warn(`[Land System] Backup saved as: ${backupKey}`);
        } catch (e) {
            console.warn("[Land System] Migration error:", e);
            // Jangan hapus data lama jika terjadi error
        }
    }

    static getPlayerClaimKey(playerId) {
        return `${this.CLAIMS_PREFIX}${playerId}`;
    }

    static generateClaimId(playerId) {
        let counter = 0;
        system.run(() => {
            counter = parseInt(world.getDynamicProperty(this.CLAIM_COUNTER_KEY) || "0");
            const newCounter = counter + 1;
            world.setDynamicProperty(this.CLAIM_COUNTER_KEY, newCounter.toString());
        });
        return `claim_${playerId}_${Date.now()}_${counter + 1}`;
    }

    static cleanupCache() {
        const now = Date.now();
        for (const [key, data] of claimCache.entries()) {
            if (now - data.timestamp > CACHE_LIFETIME) {
                claimCache.delete(key);
            }
        }
        for (const [key, data] of playerNameCache.entries()) {
            if (now - data.timestamp > CACHE_LIFETIME) {
                playerNameCache.delete(key);
            }
        }
    }

    static getPlayerName(playerId) {
        // Check cache first
        const cachedName = playerNameCache.get(playerId);
        if (cachedName && Date.now() - cachedName.timestamp < CACHE_LIFETIME) {
            return cachedName.name;
        }

        let name = playerId;
        system.run(() => {
            try {
                const namesData = JSON.parse(world.getDynamicProperty(this.PLAYER_NAMES_KEY) || "{}");
                name = namesData[playerId] || playerId;

                // Update cache
                playerNameCache.set(playerId, {
                    name,
                    timestamp: Date.now()
                });
            } catch {
                name = playerId;
            }
        });

        return name;
    }

    static updatePlayerName(playerId, playerName) {
        let success = false;
        system.run(() => {
            try {
                const namesData = JSON.parse(world.getDynamicProperty(this.PLAYER_NAMES_KEY) || "{}");
                namesData[playerId] = playerName;
                world.setDynamicProperty(this.PLAYER_NAMES_KEY, JSON.stringify(namesData));

                // Update cache
                playerNameCache.set(playerId, {
                    name: playerName,
                    timestamp: Date.now()
                });

                success = true;
            } catch {
                success = false;
            }
        });
        return success;
    }

    static async getAllClaims() {
        try {
            const allClaims = [];
            const allPlayerIds = [];
            
            const allPlayers = world.getAllPlayers();
            for (const player of allPlayers) {
                allPlayerIds.push(player.id);
                const claims = await this.getPlayerClaims(player.id);
                allClaims.push(...claims);
            }
            
            try {
                const allDynamicProps = world.getDynamicPropertyIds();
                if (allDynamicProps && typeof allDynamicProps[Symbol.iterator] === 'function') {
                    for (const propId of allDynamicProps) {
                        if (propId && propId.startsWith && propId.startsWith(this.CLAIMS_PREFIX)) {
                            const playerId = propId.substring(this.CLAIMS_PREFIX.length);
                            if (!allPlayerIds.includes(playerId)) {
                                allPlayerIds.push(playerId);
                                const claims = await this.getPlayerClaims(playerId);
                                allClaims.push(...claims);
                            }
                        }
                    }
                }
            } catch (dynamicPropsError) {
                // Skip error
            }
            
            return allClaims;
        } catch (e) {
            console.warn("Error getting all claims:", e);
            return [];
        }
    }

    static async getPlayerClaims(playerId) {
        try {
            const claimKey = this.getPlayerClaimKey(playerId);
            const claimsData = world.getDynamicProperty(claimKey);
            return claimsData ? JSON.parse(claimsData) : [];
        } catch (e) {
            console.warn("Error getting player claims:", e);
            return [];
        }
    }

    static async getClaimAtPos(location) {
        return this.getClaimAtPosition(location);
    }

    static async getClaimAtPosition(location) {
        // Optimasi: jika lokasi null/undefined, langsung kembalikan null
        if (!location || typeof location.x !== 'number' || typeof location.z !== 'number') {
            return null;
        }

        const claims = await this.getAllClaims();

        // Jika tidak ada klaim sama sekali, langsung kembalikan null
        if (!claims || claims.length === 0) {
            return null;
        }

        for (const claim of claims) {
            if (this.isPositionInClaim(location, claim)) {
                return claim;
            }
        }
        return null;
    }

    static isPositionInClaim(pos, claim) {
        if (!claim?.pos1 || !claim?.pos2) return false;

        // Ensure we have valid coordinates
        const pos1 = {
            x: Math.floor(claim.pos1.x),
            z: Math.floor(claim.pos1.z)
        };

        const pos2 = {
            x: Math.floor(claim.pos2.x),
            z: Math.floor(claim.pos2.z)
        };

        // Calculate boundaries (only X and Z)
        const minX = Math.min(pos1.x, pos2.x);
        const maxX = Math.max(pos1.x, pos2.x);
        const minZ = Math.min(pos1.z, pos2.z);
        const maxZ = Math.max(pos1.z, pos2.z);

        // Check if position is within boundaries (ignore Y for full vertical protection)
        const x = Math.floor(pos.x);
        const z = Math.floor(pos.z);

        return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
    }

    static async checkClaimOverlap(pos1, pos2) {
        const claims = await this.getAllClaims();

        // Calculate boundaries of new claim
        const minX = Math.min(pos1.x, pos2.x);
        const maxX = Math.max(pos1.x, pos2.x);
        const minZ = Math.min(pos1.z, pos2.z);
        const maxZ = Math.max(pos1.z, pos2.z);

        // Check against all existing claims
        for (const claim of claims) {
            const claimMinX = Math.min(claim.pos1.x, claim.pos2.x);
            const claimMaxX = Math.max(claim.pos1.x, claim.pos2.x);
            const claimMinZ = Math.min(claim.pos1.z, claim.pos2.z);
            const claimMaxZ = Math.max(claim.pos1.z, claim.pos2.z);

            // Check if there's any overlap
            if (!(maxX < claimMinX || minX > claimMaxX || maxZ < claimMinZ || minZ > claimMaxZ)) {
                return {
                    overlaps: true,
                    withClaim: claim
                };
            }
        }

        return {
            overlaps: false,
            withClaim: null
        };
    }

    static async saveLandClaim(playerId, claimData) {
        try {
            const claims = await this.getPlayerClaims(playerId);
            const claimId = this.generateClaimId(playerId);
            
            // Check for overlapping claims across all players
            const allClaims = await this.getAllClaims();
            if (this.checkOverlap(claimData, allClaims)) {
                throw new Error("overlaps");
            }

            const newClaim = {
                ...claimData,
                claimId,
                owner: playerId,
                createdAt: Date.now()
            };

            claims.push(newClaim);
            const claimKey = this.getPlayerClaimKey(playerId);
            world.setDynamicProperty(claimKey, JSON.stringify(claims));
            return claimId;
        } catch (e) {
            console.warn("Error saving land claim:", e);
            throw e;
        }
    }

    static async updateClaim(claimId, updatedData) {
        try {
            // Get all player IDs (both online and offline)
            const allPlayerIds = [];
            
            // First, add online players to the list
            const allPlayers = world.getAllPlayers();
            for (const player of allPlayers) {
                allPlayerIds.push(player.id);
                
                // Check online players' claims
                const claims = await this.getPlayerClaims(player.id);
                const claimIndex = claims.findIndex(c => c.claimId === claimId);
                
                if (claimIndex !== -1) {
                    claims[claimIndex] = {
                        ...claims[claimIndex],
                        ...updatedData,
                        lastModified: Date.now()
                    };
                    
                    const claimKey = this.getPlayerClaimKey(player.id);
                    world.setDynamicProperty(claimKey, JSON.stringify(claims));
                    return true;
                }
            }
            
            // Then, try to scan for offline player claims
            try {
                const allDynamicProps = world.getDynamicPropertyIds();
                
                // Check if allDynamicProps is iterable
                if (allDynamicProps && typeof allDynamicProps[Symbol.iterator] === 'function') {
                    for (const propId of allDynamicProps) {
                        if (propId && propId.startsWith && propId.startsWith(this.CLAIMS_PREFIX)) {
                            const playerId = propId.substring(this.CLAIMS_PREFIX.length);
                            if (!allPlayerIds.includes(playerId)) {
                                const claims = await this.getPlayerClaims(playerId);
                                const claimIndex = claims.findIndex(c => c.claimId === claimId);
                                
                                if (claimIndex !== -1) {
                                    claims[claimIndex] = {
                                        ...claims[claimIndex],
                                        ...updatedData,
                                        lastModified: Date.now()
                                    };
                                    
                                    const claimKey = this.getPlayerClaimKey(playerId);
                                    world.setDynamicProperty(claimKey, JSON.stringify(claims));
                                    return true;
                                }
                            }
                        }
                    }
                }
            } catch (dynamicPropsError) {
                console.warn("Error accessing dynamic properties:", dynamicPropsError);
                // Continue with just the online players' claims
            }
            
            return false;
        } catch (e) {
            console.warn("Error updating claim:", e);
            return false;
        }
    }

    static async removeClaim(claimId) {
        try {
            // Get all player IDs (both online and offline)
            const allPlayerIds = [];
            
            // First, add online players to the list
            const allPlayers = world.getAllPlayers();
            for (const player of allPlayers) {
                allPlayerIds.push(player.id);
                
                // Check online players' claims
                const claims = await this.getPlayerClaims(player.id);
                const claimIndex = claims.findIndex(c => c.claimId === claimId);
                
                if (claimIndex !== -1) {
                    claims.splice(claimIndex, 1);
                    const claimKey = this.getPlayerClaimKey(player.id);
                    world.setDynamicProperty(claimKey, JSON.stringify(claims));
                    return true;
                }
            }
            
            // Then, try to scan for offline player claims
            try {
                const allDynamicProps = world.getDynamicPropertyIds();
                
                // Check if allDynamicProps is iterable
                if (allDynamicProps && typeof allDynamicProps[Symbol.iterator] === 'function') {
                    for (const propId of allDynamicProps) {
                        if (propId && propId.startsWith && propId.startsWith(this.CLAIMS_PREFIX)) {
                            const playerId = propId.substring(this.CLAIMS_PREFIX.length);
                            if (!allPlayerIds.includes(playerId)) {
                                const claims = await this.getPlayerClaims(playerId);
                                const claimIndex = claims.findIndex(c => c.claimId === claimId);
                                
                                if (claimIndex !== -1) {
                                    claims.splice(claimIndex, 1);
                                    const claimKey = this.getPlayerClaimKey(playerId);
                                    world.setDynamicProperty(claimKey, JSON.stringify(claims));
                                    return true;
                                }
                            }
                        }
                    }
                }
            } catch (dynamicPropsError) {
                console.warn("Error accessing dynamic properties:", dynamicPropsError);
                // Continue with just the online players' claims
            }
            
            return false;
        } catch (e) {
            console.warn("Error removing claim:", e);
            return false;
        }
    }

    static removeMember(claimId, memberId) {
        let success = false;
        system.run(async () => {
            try {
                // Get all player IDs (both online and offline)
                const allPlayerIds = [];
                
                // First, check online players
                const allPlayers = world.getAllPlayers();
                for (const player of allPlayers) {
                    allPlayerIds.push(player.id);
                    
                    const claims = await this.getPlayerClaims(player.id);
                    const claimIndex = claims.findIndex(c => c.claimId === claimId);
                    
                    if (claimIndex !== -1) {
                        claims[claimIndex].members = claims[claimIndex].members.filter(m => m.id !== memberId);
                        const claimKey = this.getPlayerClaimKey(player.id);
                        world.setDynamicProperty(claimKey, JSON.stringify(claims));
                        success = true;
                        break;
                    }
                }
                
                // If not found in online players, try offline players
                if (!success) {
                    try {
                        const allDynamicProps = world.getDynamicPropertyIds();
                        
                        // Check if allDynamicProps is iterable
                        if (allDynamicProps && typeof allDynamicProps[Symbol.iterator] === 'function') {
                            for (const propId of allDynamicProps) {
                                if (propId && propId.startsWith && propId.startsWith(this.CLAIMS_PREFIX)) {
                                    const playerId = propId.substring(this.CLAIMS_PREFIX.length);
                                    if (!allPlayerIds.includes(playerId)) {
                                        const claims = await this.getPlayerClaims(playerId);
                                        const claimIndex = claims.findIndex(c => c.claimId === claimId);
                                        
                                        if (claimIndex !== -1) {
                                            claims[claimIndex].members = claims[claimIndex].members.filter(m => m.id !== memberId);
                                            const claimKey = this.getPlayerClaimKey(playerId);
                                            world.setDynamicProperty(claimKey, JSON.stringify(claims));
                                            success = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (dynamicPropsError) {
                        // Continue with just the online players' claims
                    }
                }
            } catch (error) {
                success = false;
            }
        });
        return success;
    }

    static checkOverlap(newClaim, existingClaims) {
        for (const claim of existingClaims) {
            if (this.doClaimsOverlap(newClaim, claim)) {
                return true;
            }
        }
        return false;
    }

    static doClaimsOverlap(claim1, claim2) {
        if (claim1.pos1.dimension !== claim2.pos1.dimension) {
            return false;
        }

        const aLeft = Math.min(claim1.pos1.x, claim1.pos2.x);
        const aRight = Math.max(claim1.pos1.x, claim1.pos2.x);
        const aTop = Math.min(claim1.pos1.z, claim1.pos2.z);
        const aBottom = Math.max(claim1.pos1.z, claim1.pos2.z);

        const bLeft = Math.min(claim2.pos1.x, claim2.pos2.x);
        const bRight = Math.max(claim2.pos1.x, claim2.pos2.x);
        const bTop = Math.min(claim2.pos1.z, claim2.pos2.z);
        const bBottom = Math.max(claim2.pos1.z, claim2.pos2.z);

        return !(aLeft > bRight || aRight < bLeft || aTop > bBottom || aBottom < bTop);
    }
}