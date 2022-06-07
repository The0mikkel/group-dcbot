import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";

module.exports = {
	name: 'stop',
	description: 'Crashes the application.',
	guildOnly: true,
	execute(message: Message) {
		if (
            !message.member
            || message.member.id != "209692688415457282"
        ) {
            return;
        }

		process.exit();
	},
};