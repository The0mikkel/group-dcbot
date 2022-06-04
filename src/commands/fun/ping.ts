import { Message } from "discord.js";

module.exports = {
	name: 'ping',
	description: 'Ping!',
	cooldown: 5,
    guildOnly: false,
    args: false,
    aliases: ['pinging'],
    usage: '',
	execute(message: Message) {
		message.channel.send('Pong');
	},
};