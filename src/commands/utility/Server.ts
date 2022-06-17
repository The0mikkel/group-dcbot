import { Message } from "discord.js";
import Command from "../../data/Command";

export default class Server extends Command {
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