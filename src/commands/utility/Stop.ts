import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import { envType } from "../../data/envType";

export default class Stop extends UtilityCommand {
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