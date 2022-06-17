import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";
import { envType } from "../../data/envType";

export default class Stop extends Command {
	constructor() {
		super(
			"stop",
			'Crashes the application.',
			true
		)
	}

	async execute(message: Message) {
		if (BotSystem.getInstance().env == envType.dev) console.log("stopping");
		else console.log("User is not allowed to stop system");
		if (BotSystem.getInstance().env == envType.dev) process.exit();
	}
};