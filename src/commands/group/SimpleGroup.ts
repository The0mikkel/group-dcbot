import { CategoryChannel, DMChannel, GuildChannel, Message } from "discord.js";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import ASCIIFolder from "../../data/helper/ascii-folder";

require("dotenv").config();

export default class SimpleGroup extends GroupCommand {
    constructor() {
        super(
            'simple-group',
            'Create a simple group, by naming the goup and mentioning all users in the group. The group will be created in the current category. You need to be an administrator or have the "Manage channels" permission to use this command.',
            true,
            true,
            2,
            '[group name] [group members / roles]',
        )
    }

    async execute(message: Message, args: any) {
        // Check permissions
        if (
            !message.member
            || !message.member.permissions.has("MANAGE_CHANNELS")
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send("You don't have permission to add new groups!\nYou need to be an administrator to do that.");
            return;
        }

        if (!message.guild) {
            message.reply('I can\'t execute outsite Guilds!');
            return;
        }

        // Check if there is any args - Channel id
        if (!args.length) {
            message.reply(`You need to specify a channel, to be able to use this command!`);
            return;
        }

        const groupName = ASCIIFolder.foldReplacing(args.shift());

        let tempChannel: void | CategoryChannel;
        let channel: CategoryChannel;
        try {
            tempChannel = await message.guild.channels.create(groupName, { type: 'GUILD_CATEGORY', reason: 'Needed a new group called ' + groupName }).catch(console.error);
            if (!tempChannel) {
                throw new Error("Channel not created");
            }
            channel = tempChannel;
            if (!(message.channel instanceof GuildChannel)) {
                throw new Error("Channel not supported");
            }
            channel.setParent(message.channel.parent);
        } catch (error) {
            console.log(`There was an error creating channel "${groupName}" and this was caused by: ${error}`);
            message.reply('there was an error trying to execute that command!');
            return;
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await channel.permissionOverwrites.set([
                { type: 'member', id: message.author.id, allow: ['VIEW_CHANNEL'] },
                { type: 'role', id: everyoneRole.id, deny: ['VIEW_CHANNEL'] },
            ]);

            if (message.client.user) {
                await channel.permissionOverwrites.set([
                    { type: 'member', id: message.client.user.id, allow: ['VIEW_CHANNEL'] }
                ])
            }
        } catch (error) {
            console.log(`There was an error updating base channel permissions for channel "${groupName}" and this was caused by: ${error}`);
            message.reply('there was an error trying to execute that command!');
            return;
        }

        let users = [];

        message.mentions.users.forEach(async (element) => {
            try {
                await channel.permissionOverwrites.edit(element, {
                    VIEW_CHANNEL: true
                })
                users.push(element);
            } catch (error) {
                console.log(`There was an error adding user: ${element} to the channel "${groupName}" and this was caused by: ${error}`)
            }
        });

        message.mentions.roles.forEach(async (element) => {
            try {
                await channel.permissionOverwrites.edit(element, {
                    VIEW_CHANNEL: true
                })
                users.push(element);
            } catch (error) {
                console.log(`There was an error adding role: ${element} to the channel "${groupName}" and this was caused by: ${error}`)
            }
        });

        message.channel.send(`Group ${channel} was created in the category ${message.channel.parent}`);
    }
};