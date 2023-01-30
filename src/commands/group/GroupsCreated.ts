import { CommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import { DBGroup } from "../../data/Group/DBGroup";

require("dotenv").config();

export default class GroupsCreated extends GroupCommand {
    shortDescription: string = "List all groups created by bot";

    constructor() {
        super(
            'groups-created',
            'List all groups created by bot',
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            [],
            UserLevel.admin
        );
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "groups-created",
            "da": "grupper-oprettet"
        });

        command.setDescriptionLocalizations({
            "en-US": "List all groups created by bot",
            "da": "List alle grupper oprettet af bot"
        });

        return command;
    }

    async execute(interaction: CommandInteraction, botSystem: BotSystem, args: any) {
        // Check permissions
        if (
            !interaction.member
        ) {
            interaction.editReply(botSystem.translator.translateUppercase("you do not have the right permissions to use this command"));
            return;
        }

        if (!interaction.guild) {
            interaction.editReply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            return;
        }

        let groups = await DBGroup.loadFromGuild(interaction.guild.id);

        const exampleEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(botSystem.translator.translateUppercase("Group list")+':')
            .setDescription(groups.map(group => group.name).join('\n'));

        interaction.editReply({ content: "", embeds: [exampleEmbed] });
        return;
    }
};