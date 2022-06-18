import { Message } from "discord.js";
import Command from "../../data/Command";

export default class Ping extends Command {
	constructor() {
		super(
			'ping',
			'Ping!',
			false,
			false,
			undefined,
			undefined,
			undefined,
			undefined,
    		['pinging'],
		)
	}

	async execute(message: Message) {
		message.channel.send('Pong');
	}
};