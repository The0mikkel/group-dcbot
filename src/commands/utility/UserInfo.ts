import { Message } from "discord.js";
import Command from "../../data/Command";

export default class UserInfo extends Command {
	constructor() {
		super(
			'user-info',
			'Display info about yourself.'
		);
	}

	async execute(message: Message): Promise<void> {
		message.channel.send(`${message.author.tag}\nYour username: ${message.author.username}\nYour ID: ${message.author.id}`);
	};
};