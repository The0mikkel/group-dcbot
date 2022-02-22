require("dotenv").config();

module.exports = {
    name: 'bot-edit',
	description: 'Edit message made by the bot. Required administrator privileges.',
    guildOnly: true,
    args: true,
    args_quantity: 3,
    usage: '[channel] [message id] [new message]',
	execute(message, args) {
        if(
            !message.member.hasPermission("ADMINISTRATOR")
        ) {
            return message.channel.send("You need to be an administrator to do that.");
        }

        // Check if there is any args - message id
        if (!args.length)
            return message.reply(`You need to specify a channel, to be able to use this command!`);

        const channelId = args.shift().toLowerCase().substring(2).slice(0, -1);
        const messageId = args.shift().toLowerCase();

        if(message.guild.channels.cache.get(channelId) === undefined)  { 
            //checks if the channel doesn't exist
            //put the action to take here
            return message.reply('You need to specify a channel, to be able to use this command!');
        } 
        channel = message.guild.channels.cache.get(channelId);

        // Checking if announcment message is in args
        if (!args.length)
            return message.channel.send(`You didn't provide any announcment text, ${message.author}!`);

        var announcement = "";
        for (const word in args) {
            announcement = announcement + args[word] + " ";
        }

        channel.messages.fetch(messageId).then(message => {
            if (message.content === undefined) {
                return message.reply('You need to specify a message by id, to be able to use this command!');
            }
            message.edit(announcement);
        }).catch(err => {
            console.error(err);
        });
	},
};