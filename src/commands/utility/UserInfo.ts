import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import Translate from "../../data/Language/Translate";

export default class UserInfo extends UtilityCommand {
	constructor() {
		super(
			'user-info',
			"user info command description"
		);
	}

	async execute(message: Message, botSystem: BotSystem): Promise<void> {
		const translator = botSystem.translator;
		message.channel.send(`${message.author.tag}\n${translator.translateUppercase("your username", [message.author.username])}\n${translator.translateUppercase("your id", [message.author.id])}`);
	};
};