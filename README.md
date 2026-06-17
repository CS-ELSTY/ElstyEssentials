# ELSTY | ESSENTIALS 

<div align="center">

![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)
![Minecraft](https://img.shields.io/badge/Minecraft_Bedrock-26+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**A comprehensive Minecraft Bedrock addon featuring essential gameplay systems and utilities for server management**

[Features](#-features) • [Installation](#-installation) • [Commands](#-commands) • [Configuration](#-configuration) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🎮 Core Systems

- **Advanced Scoreboard System**
  - Real-time player information display
  - Money and bank balance tracking
  - Ping and TPS monitoring
  - Rank and clan information display
  - Date and time display
  - Performance metrics

- **Clear Lag System**
  - Automatic item cleanup at configurable intervals
  - Warning notifications before cleanup
  - Manual cleanup option
  - Configurable settings via in-game UI
  - Admin command access

- **Combat System**
  - HP bonus mechanics
  - Money drops on kills
  - Combat logging prevention

- **Regeneration System**
  - Automatic health regeneration
  - Saturation-based healing

### 👥 Social Features

- **Rank System**
  - Multiple rank tiers (Owner, Admin, Command, Helper, Designer, Builder, Legends, Kingdom, Discord, Youtube, Twitch, Sniper, End, Nether, Space, Fire, Water, Air, Hacker, Diamond, Iron, Gold)
  - Customizable rank display and colors
  - Rank-based permissions
  - Visual rank icons

- **Clan/Guild System**
  - Create and manage clans
  - Clan tags and member management
  - Role-based permissions (leader, coleader, elder, member)
  - Minimum Iron rank required to create guilds

- **Chat System**
  - Custom chat format with ranks
  - Color-coded messages
  - Chat management

### 🏪 Economy

- **Bank System**
  - Deposit and withdraw money
  - Secure storage
  - Balance tracking

- **Shop System**
  - Custom shop interface
  - Configurable items
  - Transaction history

- **Daily Rewards**
  - Daily login bonuses
  - Streak rewards
  - Special rewards for consecutive days

### 🗺️ Teleportation

- **TPA System**
  - Request teleport to other players
  - Accept/deny requests
  - Request management

- **Random Teleport (RTP)**
  - Teleport to random locations
  - Safe location selection
  - Cooldown system

- **Home System**
  - Set home locations
  - Teleport to home
  - Multiple home slots

### 🏡 Land Protection

- **Land Management**
  - Claim land areas
  - Protect builds and items
  - Member access control
  - Visual particle borders

### 🎯 Quest System

- **Multiple Quest Types**
  - Item collection quests
  - Entity kill quests
  - Item crafting quests
  - Block break/place quests
  - Exploration quests

- **Rewards**
  - Money rewards
  - Experience points
  - Special items

### ⚔️ Skills System

- **Skill Trees**
  - Unlockable abilities
  - Level progression
  - Stat bonuses
  - Sync system for abilities

### 🎵 Entertainment

- **Music System**
  - In-game music player
  - Custom sound support
  - Track management

- **Sit System**
  - Sit on blocks
  - Relaxation feature
  - Stand command

### 🎨 UI Features

- **Floating Text**
  - Create permanent text displays
  - Leaderboards
  - Server announcements
  - Custom messages

- **Custom UI**
  - Modern form-based menus
  - Intuitive navigation
  - Visual feedback

### 🔧 Admin Tools

- **Admin Panel**
  - Server management
  - Player management
  - System configuration

- **Command Handler**
  - Extensible command system
  - Permission-based access
  - Custom command registration

---

## 📦 Installation

### Method 1: Manual Installation

1. **Download the Add-on**

2. **Install on Server**
   - Place the `behavior_packs/ElstyEssentialsBP` folder in your server's behavior packs directory
   - Place the `resource_packs/ElstyEssentialsRP` folder in your server's resource packs directory

3. **Configure World**
   - Add both packs to your `world_behavior_packs.json`:
     ```json
     {
       "pack_id": "19179fe6-77f0-4547-94b3-9f9a03b39e11",
       "version": [1, 0, 0]
     }
     ```
   - Add resource pack to `world_resource_packs.json`:
     ```json
     {
       "pack_id": "976a5136-1390-4484-a7ca-b3ec5441b739",
       "version": [1, 0, 0]
     }
     ```

4. **Restart Server**
   - Restart your Minecraft Bedrock server for changes to take effect

### Method 2: Using Bedrock Dedicated Server

1. Extract the addon files
2. Copy folders to:
   - `behavior_packs/` for behavior pack
   - `resource_packs/` for resource pack
3. Enable packs in server properties
4. Restart server

---

## 🎮 Commands

### Player Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/elsty` | Show help message | All Players |
| `/elsty:info` | Server information | All Players |
| `/elsty:rank` | View your rank | All Players |
| `/elsty:clan` | Guild information | Iron+ Rank |
| `/elsty:bank` | Open bank menu | All Players |
| `/elsty:shop` | Shop system | All Players |
| `/elsty:tpa` | Open TPA menu | All Players |
| `/elsty:tpaccept` | Accept TPA request | All Players |
| `/elsty:tpadeny` | Deny TPA request | All Players |
| `/elsty:daily` | Daily rewards | All Players |
| `/elsty:sit` | Sit on targeted block | All Players |
| `/elsty:stand` | Stand up from sitting | All Players |
| `/elsty:land` | Land management | All Players |
| `/elsty:rtp` | Random teleport | All Players |
| `/elsty:home` | Home system | All Players |
| `/elsty:skills` | Open skills menu | All Players |
| `/elsty:skillssync` | Sync skills and abilities | All Players |
| `/elsty:music` | Music player | All Players |
| `/elsty:quest` | Quest system | All Players |
| `/elsty:menu` | Member menu | All Players |

### Admin Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/elsty:admin` | Open admin panel | Admin Only |
| `/elsty:clearlag` | Clear lag management | Admin Only |
| `/elsty:floatingtext` | Floating text menu | Admin Only |
| `/elsty:skillsadmin` | Skills administration | Admin Only |

### Permission Levels

- **Owner** - Full server control
- **Admin** - Administrative functions
- **Command** - Command execution
- **Helper** - Player assistance
- **Designer** - Design permissions
- **Builder** - Building permissions
- **Legends** - Legendary rank
- **Kingdom** - Kingdom rank
- **Discord** - Discord integration
- **Youtube** - Content creator
- **Twitch** - Streamer
- **Sniper** - Special rank
- **End/Nether/Space/Fire/Water/Air** - Element ranks
- **Hacker** - Special rank
- **Diamond/Iron/Gold** - Premium ranks

---

## ⚙️ Configuration

### Main Configuration

The addon includes a comprehensive configuration system located at:
```
behavior_packs/ElstyEssentialsBP/scripts/config/mainConfig.js
```

#### Available Settings

```javascript
export const GlobalConfig = {
    // General settings
    general: {
        debugMode: false,
        updateInterval: 20,        // Ticks between updates (20 = 1 second)
        maxPlayers: 100
    },
    
    // Scoreboard system
    scoreboard: {
        enabled: true,
        updateInterval: 20,
        showClanInfo: true,
        showRankInfo: true,
        showPerformance: true
    },
    
    // Clear lag system
    clearlag: {
        enabled: true,
        defaultInterval: 300,      // Seconds between automatic clears
        warningTimes: [60, 30, 15, 10, 5],
        maxItemsBeforeWarning: 100
    },
    
    // Clan system
    clan: {
        maxClans: 50,
        maxMembersPerClan: 10,
        minNameLength: 3,
        maxNameLength: 15,
        creationCost: 10000        // Cost in game currency
    },
    
    // Performance
    performance: {
        enableTPSCalculation: true,
        enablePingCalculation: true,
        cacheExpiryTime: 30000     // 30 seconds
    }
};
```

### Customization

You can customize the addon by:

1. **Modifying Configuration**
   - Edit `mainConfig.js` to adjust behavior
   - Change intervals, limits, and features

2. **Adding Custom Ranks**
   - Edit `social/ranks/rank_list.js`
   - Define new rank properties

3. **Configuring Shop Items**
   - Edit `social/config/shopItems.js`
   - Add custom items and prices

4. **Customizing Quests**
   - Edit `systems/quest/questConfig.js`
   - Create custom quest chains

---

## 🏗️ Architecture

### Module Structure

```
ElstyEssentialsBP/
├── scripts/
│   ├── main.js              # Entry point & initialization
│   ├── core/
│   │   └── utils.js         # Utility functions
│   ├── commands/
│   │   └── commandHandler.js # Command registration
│   ├── config/
│   │   └── mainConfig.js    # Main configuration
│   ├── function/
│   │   ├── Database.js      # Database utilities
│   │   ├── getAdmin.js      # Admin checks
│   │   ├── getCurrency.js   # Currency management
│   │   ├── getRank.js       # Rank system
│   │   └── moneySystem.js   # Money system
│   ├── social/
│   │   ├── bankSystem.js    # Banking system
│   │   ├── chatSystem.js    # Custom chat
│   │   ├── guildSystem.js   # Clan management
│   │   ├── homeSystem.js    # Home teleportation
│   │   ├── playerTracker.js # Player tracking
│   │   ├── shopSystem.js    # Shop system
│   │   └── ranks/           # Rank system modules
│   ├── systems/
│   │   ├── clearlagSystem.js    # Clear lag
│   │   ├── combatSystem.js      # Combat mechanics
│   │   ├── dailyRewardSystem.js # Daily rewards
│   │   ├── musicSystem.js       # Music player
│   │   ├── regenerationSystem.js # Health regen
│   │   ├── rtpSystem.js         # Random teleport
│   │   ├── scoreboardSystem.js  # Scoreboard
│   │   ├── tpaSystem.js         # TPA system
│   │   ├── quest/               # Quest system
│   │   └── skills/              # Skills system
│   ├── plugins/
│   │   ├── floating-text/       # Floating text
│   │   ├── land/                # Land protection
│   │   └── sit-system/          # Sit system
│   ├── admin/
│   │   └── adminUI.js           # Admin panel
│   └── board/
│       └── nametag.js           # Nametag system
```

### Technical Details

- **Built with:** Minecraft Bedrock Script API
- **Dependencies:**
  - `@minecraft/server` beta-api
  - `@minecraft/server-ui` beta-api
- **Minimum Engine Version:** 26+
- **Current Version:** 1.5.0
- **Architecture:** Modular, event-driven design


---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Minecraft Bedrock Script API team
- The Bedrock community
- All contributors and testers

---

## 📞 Support

For support, questions, or suggestions:

- 📧 Email: fikaamc@gmail.com
- 💬 WhatsApp: [Join our Channel](https://whatsapp.com/channel/0029Vb9NmscAzNbsFcH7ZM37)

---

## 📊 Project Status

✅ **Active Development**

The addon is actively maintained and updated. New features and improvements are regularly added.

**Current Version:** 1.5.0
**Last Updated:** April 2026

---

<div align="center">

**Made with ❤️ by the Elsty Team**

[⬆ Back to Top](#)

</div>