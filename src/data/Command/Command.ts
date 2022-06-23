import { BaseGuildTextChannel, Message, PermissionResolvable, User } from "discord.js";
import BotSystem from "../BotSystem";
import { envType } from "../envType";
import CommandType from "./Types/CommandType";
import { UserLevel } from "./UserLevel";

export default abstract class Command implements CommandType {
    name: string; // Command
    description: string;
    guildOnly: boolean;
    args: boolean;
    args_quantity: number;
    usage: string;
    cooldown: number;
    permissions: PermissionResolvable[];
    level: UserLevel;
    aliases: string[];
    category: string;
    categoryEmoji: string;

    constructor(
        name: string,
        description: string,
        guildOnly: boolean = false,
        args: boolean = false,
        args_quantity: number = 0,
        usage: string = "",
        cooldown: number = 5,
        permissions: PermissionResolvable[] = [],
        level: UserLevel = UserLevel.user,
        aliases: string[] = [],
        category: string,
        categoryEmoji: string
    ) {
        this.name = name;
        this.description = description;
        this.guildOnly = guildOnly;
        this.args = args;
        this.args_quantity = args_quantity;
        this.usage = usage;
        this.cooldown = cooldown;
        this.permissions = permissions;
        this.aliases = aliases;
        this.category = category;
        this.categoryEmoji = categoryEmoji;
        this.level = level;
    }

    abstract execute(message: Message, botSystem: BotSystem, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void>;


    authorized(message: Message, botSystem: BotSystem): boolean {
        if (this.permissions.length <= 0 && this.level == UserLevel.user) {
            return true; // Everyone has access
        }

        // Always allow owner to use command
        if (message.guild?.ownerId === message.author.id) {
            return true;
        }

        // Check permissions
        if (this.permissions.length <= 0) {
            if (!(message.channel instanceof BaseGuildTextChannel)) {
                return false; // Permissions based authorization can only be used in BaseGuildTextChannels
            }
            const authorPerms = message.channel.permissionsFor(message.author);
            if (!authorPerms) {
                if (botSystem.env == envType.dev) console.log("No permissions found");
                return false; // User has no permission
            }

            for (let index = 0; index < this.permissions.length; index++) {
                if (!authorPerms.has(this.permissions[index])) {
                    if (botSystem.env == envType.dev) console.log("Permissions missing");
                    return false; // The needed permission was missing
                }
            };
        }

        // Authorize by level
        switch (this.level) {
            case UserLevel.admin:
                return this.authorizedAdmin(message, botSystem);
            case UserLevel.teamAdmin:
                return this.authorizedTeamAdmin(message, botSystem);
            case UserLevel.teamLeader:
                return this.authorizedTeamLeader(message, botSystem);
            case UserLevel.team:
                return this.authorizedTeam(message, botSystem);
            case UserLevel.teamCreate:
                return this.authorizedTeamCreate(message, botSystem);
            case UserLevel.user: // nothing
            default:
                return true;
        }
    }

    private authorizedAdmin(message: Message, botSystem: BotSystem): boolean {
        let hasRole = true;
        botSystem.guild?.adminRoles.forEach(role => {
            if (!message?.member?.roles.cache.has(role)) {
                hasRole = false;
            }
        });

        if (!botSystem.guild) {
            return false;
        }

        if (botSystem.guild.adminRoles.length <= 0) {
            hasRole = false;
        }

        return hasRole;
    }
    private authorizedTeamAdmin(message: Message, botSystem: BotSystem): boolean {
        let hasRole = true;
        botSystem.guild?.teamAdminRoles.forEach(role => {
            if (!message?.member?.roles.cache.has(role)) {
                hasRole = false;
            }
        });

        if (!botSystem.guild) {
            return false;
        }

        if (botSystem.guild.teamAdminRoles.length <= 0) {
            hasRole = false;
        }

        return hasRole;
    }
    private authorizedTeamLeader(message: Message, botSystem: BotSystem): boolean {
        return true; // Should return true if user is a team leader
    }
    private authorizedTeam(message: Message, botSystem: BotSystem): boolean {
        return true; // Should return true if user is part of a team
    }

    private authorizedTeamCreate(message: Message, botSystem: BotSystem): boolean {
        let hasRole = false;
        botSystem.guild?.teamConfig.creatorRole.forEach(role => {
            if (message.member?.roles.cache.has(role)) {
                hasRole = true;
            }
        });
        if (botSystem.guild?.teamConfig.allowEveryone) {
            hasRole = true;
        }
        return hasRole;
    }
}