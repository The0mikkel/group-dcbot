import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";

export default class Server extends UtilityCommand {
	constructor() {
		super(
			"server",
			'Display info about this server.',
			true,
		)
	}

	async execute(message: Message, botSystem: BotSystem) {
		if (message.guild != undefined) {
			message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`);
		}
	}
};