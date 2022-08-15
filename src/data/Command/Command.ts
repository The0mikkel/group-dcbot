import { BaseGuildTextChannel, Message, PermissionResolvable } from "discord.js";
import BotSystem from "../BotSystem";
import { DBGroup } from "../Group/DBGroup";
import Translate from "../Language/Translate";
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
    aliases: string[] = [];
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
        this.name = Translate.getInstance().translate(name);
        this.description = Translate.getInstance().translateUppercase(description);
        this.guildOnly = guildOnly;
        this.args = args;
        this.args_quantity = args_quantity;
        this.usage = usage;
        this.cooldown = cooldown;
        this.permissions = permissions;
        aliases.forEach(alias => {
            this.aliases.push(Translate.getInstance().translate(alias))
        })
        this.category = category;
        this.categoryEmoji = categoryEmoji;
        this.level = level;
    }

    abstract execute(message: Message, botSystem: BotSystem, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void>;


    async authorized(message: Message, botSystem: BotSystem): Promise<boolean> {
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
                return false; // User has no permission
            }

            for (let index = 0; index < this.permissions.length; index++) {
                if (!authorPerms.has(this.permissions[index])) {
                    return false; // The needed permission was missing
                }
            };
        }

        // Authorize by level
        switch (this.level) {
            case UserLevel.admin:
                return await this.authorizedAdmin(message, botSystem);
            case UserLevel.teamAdmin:
                return await this.authorizedTeamAdmin(message, botSystem);
            case UserLevel.teamLeader:
                return await this.authorizedTeamLeader(message, botSystem);
            case UserLevel.team:
                return await this.authorizedTeam(message, botSystem);
            case UserLevel.teamCreate:
                return await this.authorizedTeamCreate(message, botSystem);
            case UserLevel.user: // nothing
            default:
                return true;
        }
    }

    protected async authorizedAdmin(message: Message, botSystem: BotSystem): Promise<boolean> {
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
    protected async authorizedTeamAdmin(message: Message, botSystem: BotSystem): Promise<boolean> {
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
    protected async authorizedTeamLeader(message: Message, botSystem: BotSystem): Promise<boolean> {
        let groups: DBGroup[];
        groups = await DBGroup.loadFromGuild(botSystem.guild?.id);

        let inAnyGroupAsLeader = false;
        groups.forEach(group => {
            if (
                message?.member?.roles.cache.has(group.id)
                && message?.member?.id == group.teamLeader
            ) {
                inAnyGroupAsLeader = true;
                return;
            }
        });

        return inAnyGroupAsLeader; // Should return true if user is a team leader
    }
    protected async authorizedTeam(message: Message, botSystem: BotSystem): Promise<boolean> {

        let groups: DBGroup[];
        groups = await DBGroup.loadFromGuild(botSystem.guild?.id);

        let inAnyGroup = false;
        groups.forEach(group => {
            if (message?.member?.roles.cache.has(group.id)) {
                inAnyGroup = true;
                return;
            }
        });

        return inAnyGroup; // Should return true if user is part of a team
    }

    protected async authorizedTeamCreate(message: Message, botSystem: BotSystem): Promise<boolean> {
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