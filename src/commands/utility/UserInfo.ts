import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";

export default class UserInfo extends UtilityCommand {
	constructor() {
		super(
			'user-info',
			'Display info about yourself.'
		);
	}

	async execute(message: Message, botSystem: BotSystem): Promise<void> {
		message.channel.send(`${message.author.tag}\nYour username: ${message.author.username}\nYour ID: ${message.author.id}`);
	};
};