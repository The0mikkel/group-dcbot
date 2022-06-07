import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";

module.exports = {
	name: 'stop',
	description: 'Crashes the application.',
	guildOnly: true,
	execute(message: Message) {
		process.exit();
		// BotSystem.sendAutoDeleteMessage(message.channel, "This action has been removed!");
	},
};