import { CommandInteraction, Message, SlashCommandBuilder } from "discord.js";
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

	slashCommand(): SlashCommandBuilder {
		let command = super.slashCommand();

		command.setNameLocalizations({
			"en-US": "ping",
			"da": "ping"
		});

		command.setDescriptionLocalizations({
			"en-US": "Ping!",
			"da": "Ping!"
		});

		return command;
	}

	async execute(interaction: CommandInteraction, botSystem: BotSystem) {
		await interaction.editReply({ content: 'Pong!' });
	}
};