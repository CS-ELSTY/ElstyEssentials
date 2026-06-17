import { system, world } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

// Constants
const MAX_CLAN_NAME_LENGTH = 20;
const MAX_CLAN_MEMBERS = 12;
const MAX_CLAN_DESC_LENGTH = 100;
const CLAN_COLORS = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"];

// Clan database class with different structure
export class GuildSystem {
    constructor() {
        this.guilds = new Map();
        this.playerGuilds = new Map();
        this.invites = new Map();
        // Don't initialize here anymore - wait for world ready
    }

    initialize() {
        try {
            const savedData = world.getDynamicProperty("guildSystemData");
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // Load guilds
                if (parsed.guilds) {
                    for (const [id, guild] of Object.entries(parsed.guilds)) {
                        this.guilds.set(id, guild);
                    }
                }
                
                // Load player guilds
                if (parsed.playerGuilds) {
                    for (const [playerName, guildId] of Object.entries(parsed.playerGuilds)) {
                        this.playerGuilds.set(playerName, guildId);
                    }
                }
                
                // Load invites
                if (parsed.invites) {
                    for (const [playerName, invite] of Object.entries(parsed.invites)) {
                        this.invites.set(playerName, invite);
                    }
                }
            }
        } catch (error) {
            console.warn("Error initializing guild system:", error);
        }
    }

    // Method to manually initialize when world is ready
    async initializeWhenReady() {
        // Wait a bit to ensure world is ready
        return new Promise(resolve => {
            let attempts = 0;
            const tryInitialize = () => {
                try {
                    // Try to access a simple world property to check if it's ready
                    const testProperty = world.getDynamicProperty("test");
                    
                    // If we get here without error, initialize
                    this.initialize();
                    console.warn("[Guild System] Initialized successfully");
                    resolve();
                } catch (e) {
                    // If not ready yet, try again after a delay
                    if (attempts < 10) {  // Try up to 10 times
                        attempts++;
                        system.runTimeout(tryInitialize, 20); // Wait 1 second (20 ticks)
                    } else {
                        console.warn("[Guild System] Failed to initialize after 10 attempts");
                        resolve();
                    }
                }
            };
            system.runTimeout(tryInitialize, 20); // Wait 1 second initially
        });
    }

    // Existing methods stay the same...
    createGuild(leader, name, tag, description, color = "white") {
        if (!leader || !name || !tag) return false;
        
        // Check if player already has a guild
        if (this.playerGuilds.has(leader.name)) {
            return false;
        }
        
        // Check if name or tag already exists
        for (const [id, guild] of this.guilds) {
            if (guild.name.toLowerCase() === name.toLowerCase() || 
                guild.tag.toLowerCase() === tag.toLowerCase()) {
                return false;
            }
        }
        
        const guildId = this.generateId();
        const newGuild = {
            id: guildId,
            name: name,
            tag: tag,
            description: description || "",
            color: color,
            leader: leader.name,
            members: {
                [leader.name]: { role: "leader", joinedAt: Date.now() }
            },
            createdAt: Date.now(),
            level: 1,
            xp: 0,
            bank: 0
        };
        
        this.guilds.set(guildId, newGuild);
        this.playerGuilds.set(leader.name, guildId);
        
        // Save to dynamic property
        this.saveData();
        
        return newGuild;
    }

    generateId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    getGuildById(id) {
        return this.guilds.get(id) || null;
    }
    
    getGuildByPlayer(playerName) {
        const guildId = this.playerGuilds.get(playerName);
        if (!guildId) return null;
        return this.getGuildById(guildId);
    }
    
    getPlayerGuild(playerName) {
        return this.getGuildByPlayer(playerName);
    }
    
    joinGuild(playerName, guildId) {
        const guild = this.getGuildById(guildId);
        if (!guild) return false;
        
        // Check if player already in a guild
        if (this.playerGuilds.has(playerName)) {
            return false;
        }
        
        // Check if guild is full
        if (Object.keys(guild.members).length >= MAX_CLAN_MEMBERS) {
            return false;
        }
        
        // Add player to guild
        guild.members[playerName] = { role: "member", joinedAt: Date.now() };
        this.playerGuilds.set(playerName, guildId);
        
        // Save data
        this.saveData();
        
        return true;
    }
    
    leaveGuild(playerName) {
        const guildId = this.playerGuilds.get(playerName);
        if (!guildId) return false;
        
        const guild = this.getGuildById(guildId);
        if (!guild) return false;
        
        // Check if player is leader
        if (guild.leader === playerName) {
            // If only member is the leader, disband guild
            if (Object.keys(guild.members).length <= 1) {
                this.disbandGuild(guildId);
                return true;
            } else {
                // Transfer leadership to first other member
                for (const memberName in guild.members) {
                    if (memberName !== playerName) {
                        guild.leader = memberName;
                        break;
                    }
                }
            }
        }
        
        // Remove player from guild members
        delete guild.members[playerName];
        
        // Remove player's guild association
        this.playerGuilds.delete(playerName);
        
        // Save data
        this.saveData();
        
        return true;
    }
    
    disbandGuild(guildId) {
        const guild = this.guilds.get(guildId);
        if (!guild) return false;
        
        // Remove all player guild associations
        for (const memberName in guild.members) {
            this.playerGuilds.delete(memberName);
        }
        
        // Remove guild
        this.guilds.delete(guildId);
        
        // Remove any invites for this guild
        for (const [playerName, invite] of this.invites) {
            if (invite.guildId === guildId) {
                this.invites.delete(playerName);
            }
        }
        
        // Save data
        this.saveData();
        
        return true;
    }
    
    saveData() {
        try {
            const data = {
                guilds: Object.fromEntries(this.guilds),
                playerGuilds: Object.fromEntries(this.playerGuilds),
                invites: Object.fromEntries(this.invites)
            };
            world.setDynamicProperty("guildSystemData", JSON.stringify(data));
        } catch (error) {
            console.warn("Error saving guild data:", error);
        }
    }
    
    // Invite system
    sendInvite(inviterName, targetPlayerName, guildId) {
        const guild = this.getGuildById(guildId);
        if (!guild) return false;
        
        // Check if target player is already in a guild
        if (this.playerGuilds.has(targetPlayerName)) {
            return false;
        }
        
        // Create invite
        const invite = {
            inviter: inviterName,
            guildId: guildId,
            sentAt: Date.now()
        };
        
        this.invites.set(targetPlayerName, invite);
        
        // Save data
        this.saveData();
        
        return true;
    }
    
    acceptInvite(playerName) {
        const invite = this.invites.get(playerName);
        if (!invite) return false;
        
        // Join the guild
        const success = this.joinGuild(playerName, invite.guildId);
        
        // Remove invite
        this.invites.delete(playerName);
        
        // Save data
        this.saveData();
        
        return success;
    }
    
    declineInvite(playerName) {
        if (this.invites.has(playerName)) {
            this.invites.delete(playerName);
            return true;
        }
        return false;
    }
    
    getGuildList() {
        return Array.from(this.guilds.values());
    }
}

// Create the guild system instance but don't initialize it yet
export const guildSystem = new GuildSystem();

// Export the initialization function to be called when world is ready
export async function initializeGuildSystem() {
    await guildSystem.initializeWhenReady();
}

export async function showGuildMenu(player) {
    // Initialize guild system if not already done
    if (guildSystem.guilds.size === 0) {
        await guildSystem.initializeWhenReady();
    }
    
    // Check if player is in a guild
    const playerGuild = guildSystem.getGuildByPlayer(player.name);
    
    if (playerGuild) {
        // Player is in a guild - show guild management menu
        const guildMenu = new ActionFormData()
            .title(`§6Guild: ${playerGuild.name} [${playerGuild.tag}]`)
            .body(`§eMembers: ${Object.keys(playerGuild.members).length}/${MAX_CLAN_MEMBERS}\n§7Description: ${playerGuild.description || 'None'}`)
            .button("Guild Info", "textures/ui/info_outline")
            .button("Member List", "textures/ui/permissions_member")
            .button("Leave Guild", "textures/ui/exit_to_app")
            .button("§cClose", "textures/ui/cancel");
        
        if (playerGuild.leader === player.name) {
            guildMenu.button("Guild Settings", "textures/ui/settings_glyph_color_2x");
            guildMenu.button("Manage Members", "textures/ui/permissions");
            guildMenu.button("Disband Guild", "textures/ui/trash");
        }
        
        const response = await guildMenu.show(player);
        
        if (response.canceled) return;
        
        const selection = response.selection;
        
        if (selection === 0) { // Guild Info
            await showGuildInfo(player, playerGuild);
        } else if (selection === 1) { // Member List
            await showMemberList(player, playerGuild);
        } else if (selection === 2) { // Leave Guild
            const confirmForm = new ActionFormData()
                .title("§cConfirm Leave Guild")
                .body(`Are you sure you want to leave ${playerGuild.name}?`)
                .button("§cYes", "textures/ui/red_x")
                .button("§aNo", "textures/ui/cancel");
            
            const confirmResponse = await confirmForm.show(player);
            
            if (!confirmResponse.canceled && confirmResponse.selection === 0) {
                const success = guildSystem.leaveGuild(player.name);
                if (success) {
                    player.sendMessage("§aYou have left the guild!");
                } else {
                    player.sendMessage("§cFailed to leave guild.");
                }
            }
        } else if (selection === 3) { // Close or Leader options start here
            if (playerGuild.leader === player.name) {
                // Handle leader options
                if (response.selection === 4) { // Guild Settings
                    await showGuildSettings(player, playerGuild);
                } else if (response.selection === 5) { // Manage Members
                    await showManageMembers(player, playerGuild);
                } else if (response.selection === 6) { // Disband Guild
                    await showDisbandGuild(player, playerGuild);
                }
            }
        }
    } else {
        // Player is not in a guild - show creation/join options
        const joinMenu = new ActionFormData()
            .title("§6Guild System")
            .body("§eJoin or create a guild!")
            .button("§aCreate Guild\n§7Create your own guild", "textures/ui/plus")
            .button("§bBrowse Guilds\n§7Join an existing guild", "textures/ui/refresh")
            .button("§cClose", "textures/ui/cancel");
        
        const response = await joinMenu.show(player);
        
        if (response.canceled) return;
        
        if (response.selection === 0) { // Create Guild
            await showCreateGuildForm(player);
        } else if (response.selection === 1) { // Browse Guilds
            await showGuildList(player);
        }
    }
}

async function showGuildInfo(player, guild) {
    const infoForm = new MessageFormData()
        .title(`§6Guild Info: ${guild.name}`)
        .body(`§eTag: §f[${guild.tag}]\n§eDescription: §f${guild.description || 'None'}\n§eLeader: §f${guild.leader}\n§eMembers: §f${Object.keys(guild.members).length}/${MAX_CLAN_MEMBERS}\n§eLevel: §f${guild.level}\n§eCreated: §f${new Date(guild.createdAt).toLocaleDateString()}`)
        .button1("§7Close")
        .button2("§aBack");
    
    const response = await infoForm.show(player);
    
    if (!response.canceled && response.selection === 1) {
        await showGuildMenu(player);
    }
}

async function showMemberList(player, guild) {
    let body = "§eGuild Members:\n";
    for (const memberName in guild.members) {
        const member = guild.members[memberName];
        const role = memberName === guild.leader ? "§c[LEADER] " : "§7[MEMBER] ";
        body += `${role}§f${memberName} §8(Joined: ${new Date(member.joinedAt).toLocaleDateString()})\n`;
    }
    
    const listForm = new MessageFormData()
        .title(`§6Members: ${guild.name}`)
        .body(body)
        .button1("§7Close")
        .button2("§aBack");
    
    const response = await listForm.show(player);
    
    if (!response.canceled && response.selection === 1) {
        await showGuildMenu(player);
    }
}

async function showCreateGuildForm(player) {
    const form = new ModalFormData()
        .title("§6§lCreate Guild")
        .textField("§eGuild Name", "Enter name (max 20 chars)")
        .textField("§eGuild Tag", "Enter tag (3-5 chars)")
        .textField("§eDescription (optional)", "Guild description");
    
    const response = await form.show(player);
    
    if (response.canceled) return;
    
    const [name, tag, description] = response.formValues;
    
    // Validate inputs
    if (!name || String(name).trim().length < 2 || String(name).trim().length > MAX_CLAN_NAME_LENGTH) {
        player.sendMessage("§c§lGuild name must be between 2 and 20 characters!");
        return;
    }
    
    if (!tag || String(tag).trim().length < 2 || String(tag).trim().length > 5) {
        player.sendMessage("§c§lGuild tag must be between 2 and 5 characters!");
        return;
    }
    
    const newGuild = guildSystem.createGuild(player, String(name).trim(), String(tag).trim(), String(description).trim());
    
    if (newGuild) {
        player.sendMessage(`§a§lSuccessfully created guild "${name}" with tag [${tag}]!`);
    } else {
        player.sendMessage("§c§lFailed to create guild. Name or tag may already be taken, or you're already in a guild.");
    }
}

async function showGuildList(player) {
    const guilds = guildSystem.getGuildList();
    
    if (guilds.length === 0) {
        player.sendMessage("§eNo guilds available to join.");
        await showGuildMenu(player);
        return;
    }
    
    const listForm = new ActionFormData()
        .title("§6Available Guilds")
        .body("§eSelect a guild to join:");
    
    for (const guild of guilds) {
        const memberCount = Object.keys(guild.members).length;
        listForm.button(`${guild.name} [${guild.tag}]\n§7Members: ${memberCount}/${MAX_CLAN_MEMBERS}\n§7${guild.description || 'No description'}`);
    }
    
    listForm.button("§cBack");
    
    const response = await listForm.show(player);
    
    if (response.canceled || response.selection === guilds.length) {
        await showGuildMenu(player);
        return;
    }
    
    const selectedGuild = guilds[response.selection];
    if (selectedGuild) {
        // Check if player is already in a guild
        if (guildSystem.getGuildByPlayer(player.name)) {
            player.sendMessage("§cYou are already in a guild!");
            return;
        }
        
        // Check if guild is full
        if (Object.keys(selectedGuild.members).length >= MAX_CLAN_MEMBERS) {
            player.sendMessage("§cThis guild is full!");
            return;
        }
        
        // Send invite or join directly (simplified)
        const success = guildSystem.joinGuild(player.name, selectedGuild.id);
        if (success) {
            player.sendMessage(`§aYou joined guild "${selectedGuild.name}"!`);
        } else {
            player.sendMessage("§cFailed to join guild.");
        }
    }
}

async function showGuildSettings(player, guild) {
    // Only leaders can access this
    if (guild.leader !== player.name) {
        player.sendMessage("§c§lOnly the guild leader can access settings!");
        return;
    }
    
    const settingsForm = new ModalFormData()
        .title("§6§lGuild Settings")
        .textField("§eNew Name", "Enter new name", String(guild.name))
        .textField("§eNew Description", "Enter new description", guild.description ? String(guild.description) : "");
    
    const response = await settingsForm.show(player);
    
    if (response.canceled) return;
    
    const [newName, newDesc] = response.formValues;
    
    // Validate new name
    if (newName && String(newName).trim().length >= 2 && String(newName).trim().length <= MAX_CLAN_NAME_LENGTH) {
        // Check if name is already taken by another guild
        let nameTaken = false;
        for (const [id, g] of guildSystem.guilds) {
            if (g.id !== guild.id && g.name.toLowerCase() === String(newName).trim().toLowerCase()) {
                nameTaken = true;
                break;
            }
        }
        
        if (!nameTaken) {
            guild.name = String(newName).trim();
            player.sendMessage("§a§lGuild name updated!");
        }
    }
    
    if (newDesc !== undefined) {
        guild.description = String(newDesc).trim();
        player.sendMessage("§a§lGuild description updated!");
    }
    
    // Save data
    guildSystem.saveData();
    
    await showGuildMenu(player);
}

async function showManageMembers(player, guild) {
    // Only leaders can manage members
    if (guild.leader !== player.name) {
        player.sendMessage("§cOnly the guild leader can manage members!");
        return;
    }
    
    if (Object.keys(guild.members).length <= 1) {
        player.sendMessage("§cNo other members to manage!");
        await showGuildMenu(player);
        return;
    }
    
    const manageForm = new ActionFormData()
        .title("§6Manage Members")
        .body("§eSelect a member to manage:");
    
    for (const memberName in guild.members) {
        if (memberName !== player.name) { // Don't show self
            const role = memberName === guild.leader ? "LEADER" : "MEMBER";
            manageForm.button(`${memberName}\n§7Role: ${role}`);
        }
    }
    
    manageForm.button("§cBack");
    
    const response = await manageForm.show(player);
    
    if (response.canceled || response.selection >= Object.keys(guild.members).length - 1) {
        await showGuildMenu(player);
        return;
    }
    
    // Get the selected member (excluding the player themselves from the list)
    const members = Object.keys(guild.members).filter(name => name !== player.name);
    const selectedMember = members[response.selection];
    
    if (selectedMember) {
        await showMemberActions(player, guild, selectedMember);
    }
}

async function showMemberActions(player, guild, memberName) {
    const actionForm = new ActionFormData()
        .title(`§6Actions for ${memberName}`)
        .button("§ePromote Member", "textures/ui/filledStar")
        .button("§7Demote Member", "textures/ui/emptyStar")
        .button("§cKick Member", "textures/ui/red_x")
        .button("§8Back");
    
    const response = await actionForm.show(player);
    
    if (response.canceled) return;
    
    if (response.selection === 0) { // Promote
        player.sendMessage("§ePromotion feature would be implemented here!");
    } else if (response.selection === 1) { // Demote
        player.sendMessage("§7Demotion feature would be implemented here!");
    } else if (response.selection === 2) { // Kick
        // Confirm kick
        const confirmForm = new ActionFormData()
            .title(`§cConfirm Kick ${memberName}`)
            .button("§cYes, Kick", "textures/ui/red_x")
            .button("§aNo, Cancel", "textures/ui/cancel");
        
        const confirmResponse = await confirmForm.show(player);
        
        if (!confirmResponse.canceled && confirmResponse.selection === 0) {
            // Remove member from guild
            delete guild.members[memberName];
            guildSystem.playerGuilds.delete(memberName);
            
            // Save data
            guildSystem.saveData();
            
            player.sendMessage(`§a${memberName} has been kicked from the guild!`);
        }
    } else if (response.selection === 3) { // Back
        await showManageMembers(player, guild);
        return;
    }
    
    if (response.selection !== 3) {
        await showGuildMenu(player);
    }
}

async function showDisbandGuild(player, guild) {
    // Only leaders can disband
    if (guild.leader !== player.name) {
        player.sendMessage("§cOnly the guild leader can disband the guild!");
        return;
    }
    
    const confirmForm = new ActionFormData()
        .title("§cConfirm Disband Guild")
        .body(`§eThis will permanently delete the guild "${guild.name}" and remove all members!\n§cThis action cannot be undone!`)
        .button("§cYes, Disband", "textures/ui/trash")
        .button("§aCancel", "textures/ui/cancel");
    
    const confirmResponse = await confirmForm.show(player);
    
    if (!confirmResponse.canceled && confirmResponse.selection === 0) {
        const success = guildSystem.disbandGuild(guild.id);
        if (success) {
            player.sendMessage(`§aGuild "${guild.name}" has been disbanded!`);
        } else {
            player.sendMessage("§cFailed to disband guild.");
        }
    }
    
    await showGuildMenu(player);
}