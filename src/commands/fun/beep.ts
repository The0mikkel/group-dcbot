import { Message } from "discord.js";

module.exports = {
	name: 'beep',
	description: 'Beep!',
	execute(message: Message) {
		message.channel.send('Boop');
	},
};