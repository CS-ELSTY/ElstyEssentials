// Main configuration file for Elsty Essentials addon
// This file defines global settings and module configurations

export const GlobalConfig = {
    // General settings
    general: {
        debugMode: false,
        updateInterval: 20, // Ticks between updates (20 = 1 second)
        maxPlayers: 100
    },
    
    // Scoreboard system settings
    scoreboard: {
        enabled: true,
        updateInterval: 20, // Ticks between updates
        showClanInfo: true,
        showRankInfo: true,
        showPerformance: true
    },
    
    // Clear lag system settings
    clearlag: {
        enabled: true,
        defaultInterval: 300, // Seconds between automatic clears
        warningTimes: [60, 30, 15, 10, 5],
        maxItemsBeforeWarning: 100
    },
    
    // Clan system settings
    clan: {
        maxClans: 50,
        maxMembersPerClan: 10,
        minNameLength: 3,
        maxNameLength: 15,
        creationCost: 10000 // Cost in game currency to create a clan
    },
    
    // Performance settings
    performance: {
        enableTPSCalculation: true,
        enablePingCalculation: true,
        cacheExpiryTime: 30000 // 30 seconds
    }
};

// Function to update configuration at runtime (for admin commands)
export function updateConfig(newSettings) {
    // This would merge new settings with existing ones
    // Implementation would depend on specific needs
    console.warn("Configuration update feature would be implemented here");
}