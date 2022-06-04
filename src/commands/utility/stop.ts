import { Message } from "discord.js";

module.exports = {
	name: 'stop',
	description: 'Crashes the application.',
	guildOnly: true,
	execute(message: Message) {
		process.exit();
	},
};