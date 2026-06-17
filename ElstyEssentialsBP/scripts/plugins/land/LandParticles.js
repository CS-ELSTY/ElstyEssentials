import { world, system } from '../../core.js';
import { LandDatabase } from './LandDatabase.js';

export class LandParticles {
    // Add cooldown tracking with ticks (20 ticks = 1 second)
    static lastParticleUpdate = new Map();
    static PARTICLE_COOLDOWN_TICKS = 200; // 10 seconds (20 ticks * 10)
    static currentTick = 0;

    static {
        // Initialize tick counter
        system.runInterval(() => {
            this.updateTick();
            this.cleanupCooldowns();
        }, 1);
    }

    // Update tick counter
    static updateTick() {
        this.currentTick++;
        if (this.currentTick >= Number.MAX_SAFE_INTEGER) {
            this.currentTick = 0;
        }
    }

    static async shouldShowParticles(pos) {
        const claim = await LandDatabase.getClaimAtPos(pos);
        if (!claim) {
            return true;
        }
        return true;
    }

    static async showLandOutline(pos1, pos2) {
        if (!pos1 || !pos2) return;

        const players = world.getAllPlayers();
        let shouldShowParticles = false;
        
        for (const player of players) {
            const lastUpdate = this.lastParticleUpdate.get(player.id) || 0;
            const ticksPassed = this.currentTick - lastUpdate;
            
            if (ticksPassed < this.PARTICLE_COOLDOWN_TICKS) {
                continue;
            }
            
            // Check if player is in range
            if (Math.abs(player.location.x - pos1.x) < 10 && 
                Math.abs(player.location.z - pos1.z) < 10) {
                shouldShowParticles = true;
                this.lastParticleUpdate.set(player.id, this.currentTick);
            }
        }

        if (!shouldShowParticles) {
            return;
        }

        const minX = Math.min(pos1.x, pos2.x);
        const maxX = Math.max(pos1.x, pos2.x);
        const minY = Math.min(pos1.y, pos2.y);
        const maxY = Math.max(pos1.y, pos2.y);
        const minZ = Math.min(pos1.z, pos2.z);
        const maxZ = Math.max(pos1.z, pos2.z);

        const density = 0.5;
        const dimension = world.getDimension("overworld");
        const particleInterval = 1;

        try {
            for (let y = minY; y <= maxY; y += density) {
                if (Math.floor(y) % particleInterval === 0) {
                    dimension.spawnParticle("minecraft:endrod", { x: minX, y: y, z: minZ });
                    dimension.spawnParticle("minecraft:endrod", { x: maxX, y: y, z: minZ });
                    dimension.spawnParticle("minecraft:endrod", { x: minX, y: y, z: maxZ });
                    dimension.spawnParticle("minecraft:endrod", { x: maxX, y: y, z: maxZ });
                }
            }

            for (let x = minX; x <= maxX; x += density) {
                if (Math.floor(x) % particleInterval === 0) {
                    dimension.spawnParticle("minecraft:endrod", { x: x, y: minY, z: minZ });
                    dimension.spawnParticle("minecraft:endrod", { x: x, y: minY, z: maxZ });
                    dimension.spawnParticle("minecraft:endrod", { x: x, y: maxY, z: minZ });
                    dimension.spawnParticle("minecraft:endrod", { x: x, y: maxY, z: maxZ });
                }
            }

            for (let z = minZ; z <= maxZ; z += density) {
                if (Math.floor(z) % particleInterval === 0) {
                    dimension.spawnParticle("minecraft:endrod", { x: minX, y: minY, z: z });
                    dimension.spawnParticle("minecraft:endrod", { x: maxX, y: minY, z: z });
                    dimension.spawnParticle("minecraft:endrod", { x: minX, y: maxY, z: z });
                    dimension.spawnParticle("minecraft:endrod", { x: maxX, y: maxY, z: z });
                }
            }
        } catch (error) {
            if (!error.toString().includes('LocationInUnloadedChunkError')) {
                console.warn("Error spawning outline particles:", error);
            }
        }
    }

    static async showSelectionPreview(pos, posNumber) {
        if (!pos) return;

        try {
            const dimension = world.getDimension("overworld");
            
            const verticalCount = 10;
            for (let i = 0; i < verticalCount; i++) {
                dimension.spawnParticle("minecraft:endrod", {
                    x: pos.x,
                    y: pos.y + i * 0.3,
                    z: pos.z
                });
            }

            const radius = 0.5;
            const circlePoints = 16;
            for (let i = 0; i < circlePoints; i++) {
                const angle = (i / circlePoints) * Math.PI * 2;
                dimension.spawnParticle("minecraft:endrod", {
                    x: pos.x + Math.cos(angle) * radius,
                    y: pos.y + 0.5,
                    z: pos.z + Math.sin(angle) * radius
                });
            }

            const markerCount = 5;
            const markerParticle = "minecraft:endrod";
            for (let i = 0; i < markerCount; i++) {
                dimension.spawnParticle(markerParticle, {
                    x: pos.x + (Math.random() * 0.4 - 0.2),
                    y: pos.y + 1 + (Math.random() * 0.4),
                    z: pos.z + (Math.random() * 0.4 - 0.2)
                });
            }
        } catch (error) {
            if (!error.toString().includes('LocationInUnloadedChunkError')) {
                console.warn("Error spawning preview particles:", error);
            }
        }
    }

    static async scheduleOutlineUpdates(pos1, pos2, duration = 5) {
        if (!pos1 || !pos2) return;
        
        const startTime = Date.now();
        const interval = 5;

        const runScheduledUpdate = async () => {
            if (Date.now() - startTime < duration * 1000) {
                await this.showLandOutline(pos1, pos2);
                system.runTimeout(() => runScheduledUpdate(), interval);
            }
        };

        runScheduledUpdate();
    }

    // Add cleanup method to prevent memory leaks
    static cleanupCooldowns() {
        for (const [playerId, lastUpdate] of this.lastParticleUpdate.entries()) {
            const ticksPassed = this.currentTick - lastUpdate;
            if (ticksPassed > this.PARTICLE_COOLDOWN_TICKS * 2) {
                this.lastParticleUpdate.delete(playerId);
            }
        }
    }
}