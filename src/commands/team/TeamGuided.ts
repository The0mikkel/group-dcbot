import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ASCIIFolder from "../../data/Helper/ascii-folder";

require("dotenv").config();

export default class TeamGuided extends TeamCommand {
    active = false;
    shortDescription: string = "Set message to act as a guided team creator - Needs to be executed in the same channel as message";

    constructor() {
        super(
            'team-guided',
            'Set message to act as a guided team creator - Needs to be executed in the same channel as message',
            true,
            true,
            2,
            '[message id] [emoji]',
            undefined,
            undefined,
            UserLevel.admin
        );
    }

    slashCommand(): SlashCommandBuilder {
        let command = new SlashCommandBuilder()

        command.setName(this.name)
            .setNameLocalizations({
                "en-US": "team-guided",
                "da": "hold-guided"
            })
            .setDescription(this.description)
            .setDescriptionLocalizations({
                "en-US": "Set message to act as a guided team creator - Needs to be executed in the same channel as message",
                "da": "Sæt besked til at fungere som en guided team creator - skal udføres i samme kanal som beskeden"
            })
            .addStringOption(option =>
                option.setName('message-id')
                    .setNameLocalizations({
                        "en-US": "message-id",
                        "da": "besked-id"
                    })
                    .setDescription("The message id of the message you want to use as a guided team creator")
                    .setDescriptionLocalizations({
                        "en-US": "The message id of the message you want to use as a guided team creator",
                        "da": "Besked id'et på beskeden du vil bruge som guided team creator"
                    })
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('emoji')
                    .setNameLocalizations({
                        "en-US": "emoji",
                        "da": "emoji"
                    })
                    .setDescription("The emoji you want to use as a reaction to the message")
                    .setDescriptionLocalizations({
                        "en-US": "The emoji you want to use as a reaction to the message",
                        "da": "Emoji'en du vil bruge som reaktion på beskeden"
                    })
                    .setRequired(true)
            );

        return command;
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
        if (interaction.channel == null) {
            interaction.editReply(botSystem.translator.translateUppercase("cannot execute the command here"));
            return;
        }
        let message = interaction.options.getString('message-id', true);

        let messageId = ASCIIFolder.foldReplacing(message?.trim());
        let emoji = (interaction.options.getString('emoji')?.trim() ?? "👍");

        try {
            (await interaction.channel.messages.fetch(messageId)).react(emoji ?? "👍")
        } catch (error) {
            console.error(error);
        }

        botSystem.guild?.guidedTeamStart.push(messageId);
        await botSystem.guild?.save();

        interaction.editReply(botSystem.translator.translateUppercase("Guided team creator has been setup!"));
    }
};