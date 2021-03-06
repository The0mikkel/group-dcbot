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
            ["ADMINISTRATOR"],
            UserLevel.admin
        );
    }

    async execute(message: Message, botSystem: BotSystem, args: any) {
        // Check permissions
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send("You don't have permission to add new groups!\nYou need to be an administrator to do that.");
            return;
        }

        if (!message.guild) {
            message.reply('I can\'t execute outsite Guilds!');
            return;
        }

        let groups = await DBGroup.loadFromGuild(message.guild.id);

        const exampleEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Group list:')
            .setDescription(groups.map(group => group.name).join('\n'))
            .setFooter({ text: 'Grouper', iconURL: 'https://cdn.discordapp.com/avatars/943231088438947890/31cfc4f6fe63a45a471c8c898e74efea.png?size=256' });

        message.channel.send({ embeds: [exampleEmbed] });
        return;
    }
};