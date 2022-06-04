import { Message } from "discord.js";

require("dotenv").config();

module.exports = {
    name: 'group',
    description: 'Create a group, by naming the goup and mentioning all users in the group. A role of the same name as the group will be created. You need to be an administrator or have the "Manage channels" permission to use this command.',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    usage: '[group name] [group members]',
    async execute(message: Message, args: any) {
        // Check permissions
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You don't have permission to add new groups!\nYou need to be an administrator to do that.");
        }

        if (!message.guild) {
            return message.reply('I can\'t execute outsite Guilds!');
        }

        // Check if there is any args - Channel id
        if (!args.length)
            return message.reply(`You need to specify a channel, to be able to use this command!`);

        const groupName = args.shift();

        let role = await message.guild.roles.create({
            name: groupName,
            color: undefined,
            mentionable: true,
            reason: 'Group was created by grouper, as per request by ' + message.author.tag,
        })

        let users = [];

        if (message.mentions.members) {
            message.mentions.members.forEach(async (member) => {
                try {
                    member.roles.add(role.id);
                    users.push(member);
                } catch (error) {
                    console.log(`There was an error adding user: ${member} to the channel "${groupName}" and this was caused by: ${error}`)
                }
            });
        }

        message.channel.send(`Group ${role} was created.`);
    },
};