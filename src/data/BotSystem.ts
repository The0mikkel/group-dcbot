import { AutocompleteInteraction, BaseGuildTextChannel, CacheType, ChatInputCommandInteraction, Client, Collection, DMChannel, EmbedBuilder, Interaction, Message, ModalSubmitInteraction, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User, VoiceChannel } from "discord.js";
import { DBGuild } from "./Guild/DBGuild";
import { envType } from "./envType";
import Translate from "./Language/Translate";
import { TextChannels } from "./Types/Channels";

export default class BotSystem {
    public static client: Client;

    guild: DBGuild | undefined
    env: envType;
    translator: Translate;

    constructor() {
        this.guild = undefined;
        this.env = envType[((process.env.env ?? "prod") as keyof typeof envType)] ?? envType.prod;
        this.translator = new Translate();
    }

    static async sendAutoDeleteMessage(channel: TextChannels, message: any, time: number = 30000) {
        try {
            let autoDeleteMessage = await channel.send(message);
            setTimeout(async () => {
                try {
                    await autoDeleteMessage.delete();
                } catch (error) {
                    console.log("Error deleting auto delete message");
                }
            }, time);
        } catch (error) {
            console.log(error)
        }
    }

    static async autoDeleteMessageByUser(message: Message, time: number = 30000) {
        try {
            setTimeout(async () => {
                try {
                    message = await message.fetch();
                    await message.delete();
                } catch (error) {
                    console.log("Error deleting auto delete message");
                }
            }, time);
        } catch (error) {
            console.log(error)
        }
    }

    /**
     * Check if a user has a role
     * 
     * @param interaction The interaction
     * @param user The user
     * @param role The role id
     * 
     * @returns True if the user has the role
     */
    static async checkUserHasRole(interaction: ChatInputCommandInteraction | AutocompleteInteraction<CacheType> | ModalSubmitInteraction, user: User, role: string): Promise<boolean> {
        let exist = interaction.guild?.members.fetch(user.id).then(async (member) => {
            if (member.roles.cache.has(role)) {
                return true;
            } else {
                return false;
            }
        });
        return exist ?? false;
    }

    static async checkIfAdministrator(interaction: Interaction, user: User): Promise<boolean> {
        if (
            (interaction.channel instanceof BaseGuildTextChannel)
            && interaction.channel.permissionsFor(interaction.user)?.has("Administrator")
        ) {
            return true; // User has admin permission
        }
        return false;
    }

    public static createSimpleEmbed(title: string, text: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text)
    }

}