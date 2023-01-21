import { CommandInteraction, Message } from "discord.js";
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

	async execute(interaction: CommandInteraction, botSystem: BotSystem) {
		if (!interaction.isChatInputCommand()) return;

		try {
			await interaction.editReply({ content: 'Pong!' });
		} catch (error) {
			console.log("interaction error! | ", error);
		}
		console.log("Ping done!");
	}
};