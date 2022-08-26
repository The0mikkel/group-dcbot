import { Message, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import { DBGroup } from "../../data/Group/DBGroup";

require("dotenv").config();

export default class GroupsCreated extends GroupCommand {
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

    async execute(message: Message, botSystem: BotSystem, args: any) {
        // Check permissions
        if (
            !message.member
        ) {
            message.channel.send(botSystem.translator.translateUppercase("you do not have the right permissions to use this command"));
            return;
        }

        if (!message.guild) {
            message.reply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            return;
        }

        let groups = await DBGroup.loadFromGuild(message.guild.id);

        const exampleEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(botSystem.translator.translateUppercase("Group list")+':')
            .setDescription(groups.map(group => group.name).join('\n'))
			.setFooter({ text: botSystem.translator.translate('grouper'), iconURL: BotSystem.client?.user?.avatarURL() ?? "" });

        message.channel.send({ embeds: [exampleEmbed] });
        return;
    }
};