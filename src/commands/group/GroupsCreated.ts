import { Message, MessageEmbed } from "discord.js";
import Command from "../../data/Command";
import { DBGroup } from "../../data/roles/DBGroup";

require("dotenv").config();

export default class GroupsCreated extends Command {
    constructor() {
        super(
            'groups-created',
            'List all groups created by bot',
            true
        );
    }

    async execute(message: Message, args: any) {
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