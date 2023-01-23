import { AutocompleteInteraction, CommandInteraction, Interaction, ModalSubmitInteraction, PermissionResolvable, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../BotSystem";
import { UserLevel } from "../UserLevel";

export default interface CommandType {
    /**
     * Whether the command is active
     */
    active: boolean;
    /**
     * Command name
     */
    name: string;
    /**
     * Command description. Used in help command, and as a base for slash command description.
     */
    description: string;
    /**
     * Command short description. Used in slash command description.
     */
    shortDescription: string;
    /**
     * Whether the command can only be used in a guild
     */
    guildOnly: boolean;
    /**
     * Whether the command has args.
     * 
     * @deprecated Replaced with slash command builder
     */
    args: boolean;
    /**
     * The number of args the command needs
     * 
     * @deprecated Replaced with slash command builder
     */
    args_quantity: number;
    /**
     * Description of how the command is used
     */
    usage: string;
    /**
     * Minimum number of seconds between executions from one user
     */
    cooldown: number;
    /**
     * Permissions needed for the command
     */
    permissions: PermissionResolvable[];
    /**
     * User level needed for the command
     */
    level: UserLevel;
    /**
     * Aliases of the command. These aliases can be used instead of the name
     */
    aliases: string[];
    /**
     * Category of the command
     */
    category: string;
    /**
     * Category emoji
     */
    categoryEmoji: string;
    /**
     * Whether the intercation should be deferred
     */
    deferReply: boolean;
    /**
     * Whether the reply should be ephemeral (only shown to the user executing the command)
     */
    ephemeral: boolean;
    /**
     * Whether the command is a modal command
     */
    isModal: boolean;

    /**
     * Authorizes the command to be executed
     * 
     * @param interaction Interaction that triggered the command
     * @param botSystem BotSystem instance
     * 
     * @returns Whether the command is authorized. Asynchronous
     */
    authorized(interaction: Interaction, botSystem: BotSystem): Promise<boolean>;

    /**
     * Returns the slash command builder
     * 
     * @returns Slash command builder used to create the slash command
     */
    slashCommand(): SlashCommandBuilder;

    /**
     * Executes the command
     * 
     * @param interaction Interaction that triggered the command
     * @param botSystem BotSystem instance
     * @param args Arguments of the command
     * @param autoDelete Whether the command should be deleted after execution
     * @param autoDeleteTime Time in seconds after which the command should be deleted
     *  
     * @returns void
     */
    execute(interaction: CommandInteraction, botSystem: BotSystem, autoDelete: boolean, autoDeleteTime: number): Promise<void>;

    /**
     * Executes the modal command
     * 
     * @param interaction Interaction that triggered the command
     * @param botSystem BotSystem instance
     * 
     * @returns void
     */
    executeModal(interaction: ModalSubmitInteraction, botSystem: BotSystem): Promise<void>;

    /**
     * Exectutes the autocomplete command
     * 
     * @param interaction Interaction that triggered the command
     * @param botSystem BotSystem instance
     */
    executeAutocomplete(interaction: AutocompleteInteraction, botSystem: BotSystem): Promise<void>;
}