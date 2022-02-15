require("dotenv").config();
const announcer_role = process.env.announcer_role;

module.exports = {
    name: 'announce',
	description: 'Announce to specific channel!',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    usage: '[channel] [message]',
	execute(message, args) {
        if (!message.member.roles.cache.has(announcer_role)) 
        return;
        // Check if there is any args - Channel id
        if (!args.length)
            return message.reply(`You need to specify a channel, to be able to use this command!`);

        const channel = args.shift().toLowerCase().substring(2).slice(0, -1);
        
        if(message.guild.channels.cache.get(channel) === undefined)  { 
            //checks if the channel doesn't exist
            //put the action to take here
            return message.reply('You need to specify a channel, to be able to use this command!');
        } 

        // Checking if announcment message is in args
        if (!args.length)
            return message.channel.send(`You didn't provide any announcment text, ${message.author}!`);

        var announcement = "";
        for (const word in args) {
            announcement = announcement + args[word] + " ";
        }
        
        message.client.channels.cache.get(channel).send(announcement);
	},
};