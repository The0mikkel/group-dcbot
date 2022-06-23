import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import OtherCommand from "../../data/Command/Types/OtherCommand";
import { UserLevel } from "../../data/Command/UserLevel";

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
			UserLevel.user,
    		['pinging'],
		)
	}

	async execute(message: Message, botSystem: BotSystem) {
		message.channel.send('Pong');
	}
};