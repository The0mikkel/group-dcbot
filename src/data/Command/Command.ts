import { BaseGuildTextChannel, CommandInteraction, GuildMemberRoleManager, Message, PermissionResolvable, SlashCommandBuilder } from "discord.js";
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
    ephemeral: boolean = true;

    constructor(
        name: string,
        description: string,
        guildOnly: boolean = false,
        args: boolean = false,
        args_quantity: number = 0,
        usage: string = "",
        cooldown: number = 1,
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
        this.category = Translate.getInstance().translate(category);
        this.categoryEmoji = categoryEmoji;
        this.level = level;
    }

    abstract execute(interaction: CommandInteraction, botSystem: BotSystem, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void>;

    slashCommand(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription("demo"); // this.description
    }

    async authorized(interaction: CommandInteraction, botSystem: BotSystem): Promise<boolean> {
        if (this.permissions.length <= 0 && this.level == UserLevel.user) {
            return true; // Everyone has access
        }

        // Always allow owner to use command
        if (interaction.guild?.ownerId === interaction.user.id) {
            return true;
        }

        // Check permissions
        if (this.permissions.length <= 0) {
            if (!(interaction.channel instanceof BaseGuildTextChannel)) {
                return false; // Permissions based authorization can only be used in BaseGuildTextChannels
            }
            const authorPerms = interaction.channel.permissionsFor(interaction.user);
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
                return await this.authorizedAdmin(interaction, botSystem);
            case UserLevel.teamAdmin:
                return await this.authorizedTeamAdmin(interaction, botSystem);
            case UserLevel.teamLeader:
                return await this.authorizedTeamLeader(interaction, botSystem);
            case UserLevel.team:
                return await this.authorizedTeam(interaction, botSystem);
            case UserLevel.teamCreate:
                return await this.authorizedTeamCreate(interaction, botSystem);
            case UserLevel.user: // nothing
            default:
                return true;
        }
    }

    protected async authorizedAdmin(interaction: CommandInteraction, botSystem: BotSystem): Promise<boolean> {
        if (!botSystem.guild) {
            return false;
        }

        let hasRole = false;
        botSystem.guild?.adminRoles.forEach(role => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(role)) {
                hasRole = true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(role)) {
                hasRole = true;
            }
        });

        if (botSystem.guild.adminRoles.length <= 0) {
            hasRole = false;
        }

        return hasRole;
    }
    protected async authorizedTeamAdmin(interaction: CommandInteraction, botSystem: BotSystem): Promise<boolean> {
        if (!botSystem.guild) {
            return false;
        }
        
        let hasRole = false;
        botSystem.guild?.teamAdminRoles.forEach(role => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(role)) {
                hasRole = true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(role)) {
                hasRole = true;
            }
        });

        if (botSystem.guild.teamAdminRoles.length <= 0) {
            hasRole = false;
        }

        return hasRole;
    }
    protected async authorizedTeamLeader(interaction: CommandInteraction, botSystem: BotSystem): Promise<boolean> {
        let groups: DBGroup[];
        groups = await DBGroup.loadFromGuild(botSystem.guild?.id);

        let inAnyGroupAsLeader = false;
        groups.forEach(group => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(group.id) && interaction?.user.id == group.teamLeader) {
                inAnyGroupAsLeader = true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(group.id) && interaction?.user.id == group.teamLeader) {
                inAnyGroupAsLeader = true;
                return;
            }
        });

        return inAnyGroupAsLeader; // Should return true if user is a team leader
    }
    protected async authorizedTeam(interaction: CommandInteraction, botSystem: BotSystem): Promise<boolean> {

        let groups: DBGroup[];
        groups = await DBGroup.loadFromGuild(botSystem.guild?.id);

        let inAnyGroup = false;
        groups.forEach(group => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(group.id) && interaction?.user.id == group.teamLeader) {
                inAnyGroup = true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(group.id)) {
                inAnyGroup = true;
                return;
            }
        });

        return inAnyGroup; // Should return true if user is part of a team
    }

    protected async authorizedTeamCreate(interaction: CommandInteraction, botSystem: BotSystem): Promise<boolean> {
        let hasRole = false;
        botSystem.guild?.teamConfig.creatorRole.forEach(role => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(role)) {
                hasRole = true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(role)) {
                hasRole = true;
            }
        });
        if (botSystem.guild?.teamConfig.allowEveryone) {
            hasRole = true;
        }

        return hasRole;
    }
}