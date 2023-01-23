import { ChatInputCommandInteraction, Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import { envType } from "../../data/envType";

export default class Stop extends UtilityCommand {
	active: boolean = false;

	constructor() {
		super(
			"stop",
			'Crashes the application.',
			true,
			undefined,
			undefined,
			undefined,
			undefined,
			[
				"Administrator"
			]
		)
	}

	async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
		if (botSystem.env == envType.dev) console.log("stopping");
		else console.log("User is not allowed to stop system");
		if (botSystem.env == envType.dev) process.exit();
	}
};