import { AutocompleteFocusedOption, AutocompleteInteraction, BaseGuildTextChannel, CacheType, CommandInteraction, GuildMemberRoleManager, Interaction, Message, ModalSubmitInteraction, PermissionResolvable, SlashCommandBuilder } from "discord.js";
import BotSystem from "../BotSystem";
import { envType } from "../envType";
import { DBGroup } from "../Group/DBGroup";
import Translate from "../Language/Translate";
import CommandType from "./Interfaces/CommandType";
import { UserLevel } from "./UserLevel";

export default abstract class Command implements CommandType {
    active: boolean = true;
    name: string; // Command
    description: string;
    shortDescription: string = "";
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
    deferReply: boolean = true;
    ephemeral: boolean = true;
    isModal: boolean = false;

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

        if (this.shortDescription == "") {
            this.shortDescription = this.description;
        }
        if (this.shortDescription.length > 100) {
            this.shortDescription = this.shortDescription.substring(0, 97) + "...";
        }
    }

    abstract execute(interaction: CommandInteraction, botSystem: BotSystem, autoDelete: boolean, autoDeleteTime: number): Promise<void>;

    async executeModal(interaction: ModalSubmitInteraction, botSystem: BotSystem): Promise<void> {
        return;
    }

    async executeAutocomplete(interaction: AutocompleteInteraction, botSystem: BotSystem): Promise<void> {
        await this.autocompleteHelper(interaction);
        return;
    }

    protected async autocompleteHelper(interaction: AutocompleteInteraction, choices: string[] = [], focusedOption: AutocompleteFocusedOption | null = null): Promise<void> {
        if (focusedOption == null) {
            focusedOption = interaction.options.getFocused(true);
        }

        const filtered = choices.filter(choice => choice.startsWith(focusedOption?.value ?? "")).slice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    }

    slashCommand(): SlashCommandBuilder {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.shortDescription)
            .setDMPermission(this.guildOnly ? false : true);
    }

    async authorized(interaction: Interaction, botSystem: BotSystem): Promise<boolean> {
        if (this.permissions.length <= 0 && this.level == UserLevel.user) {
            return true; // Everyone has access
        }

        // Always allow owner to use command
        if (interaction.guild?.ownerId === interaction.user.id) {
            return true;
        }

        if ((await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
            return true; // User has admin permission
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

    protected async authorizedAdmin(interaction: Interaction, botSystem: BotSystem): Promise<boolean> {
        if (!botSystem.guild) {
            return false;
        }

        if ((await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
            return true; // User has admin permission
        }

        let roles = interaction?.member?.roles;
        botSystem.guild?.adminRoles.forEach(role => {
            if (Array.isArray(roles) && roles.includes(role)) {
                return true
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(role)) {
                return true
            }
        });

        return false;
    }
    protected async authorizedTeamAdmin(interaction: Interaction, botSystem: BotSystem): Promise<boolean> {
        if (!botSystem.guild) {
            return false;
        }

        if ((await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
            return true; // User has admin permission
        }

        let roles = interaction?.member?.roles;
        botSystem.guild?.teamAdminRoles.forEach(role => {
            if (Array.isArray(roles) && roles.includes(role)) {
                return true
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(role)) {
                return true
            }
        });

        return false;
    }
    protected async authorizedTeamLeader(interaction: Interaction, botSystem: BotSystem): Promise<boolean> {
        if ((await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
            return true; // User has admin permission
        }

        let groups: DBGroup[];
        groups = await DBGroup.loadFromGuild(botSystem.guild?.id);

        let roles = interaction?.member?.roles;
        groups.forEach(group => {
            if (Array.isArray(roles) && roles.includes(group.id) && interaction?.user.id == group.teamLeader) {
                return true
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(group.id) && interaction?.user.id == group.teamLeader) {
                return true
            }
        });

        return false;
    }
    protected async authorizedTeam(interaction: Interaction, botSystem: BotSystem): Promise<boolean> {
        if ((await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
            return true; // User has admin permission
        }

        let groups: DBGroup[];
        groups = await DBGroup.loadFromGuild(botSystem.guild?.id);

        groups.forEach(group => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(group.id) && interaction?.user.id == group.teamLeader) {
                return true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(group.id)) {
                return true;
            }
        });

        return false;
    }

    protected async authorizedTeamCreate(interaction: Interaction, botSystem: BotSystem): Promise<boolean> {
        if ((await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
            return true; // User has admin permission
        }

        botSystem.guild?.teamConfig.creatorRole.forEach(role => {
            let roles = interaction?.member?.roles;
            if (Array.isArray(roles) && roles.includes(role)) {
                return true;
            }

            if (interaction?.member?.roles instanceof GuildMemberRoleManager && interaction?.member?.roles.cache.has(role)) {
                return true;
            }
        });
        if (botSystem.guild?.teamConfig.allowEveryone) {
            return true;
        }

        return false;
    }
}