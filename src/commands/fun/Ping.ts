import { Message } from "discord.js";
import OtherCommand from "../../data/Command/Types/OtherCommand";

export default class Ping extends OtherCommand {
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