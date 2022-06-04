import { Message } from "discord.js";

module.exports = {
	name: 'user-info',
	description: 'Display info about yourself.',
	execute(message: Message) {
		message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
	},
};