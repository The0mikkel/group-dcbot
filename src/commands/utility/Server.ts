import { Message } from "discord.js";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";

export default class Server extends UtilityCommand {
	constructor() {
		super(
			"server",
			'Display info about this server.',
			true,
		)
	}

	async execute(message: Message) {
		if (message.guild != undefined) {
			message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`);
		}
	}
};