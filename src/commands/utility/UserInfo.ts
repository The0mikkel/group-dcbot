import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import Translate from "../../data/Language/Translate";

export default class UserInfo extends UtilityCommand {
	constructor() {
		super(
			'user-info',
			"user info command description"
		);
	}

	slashCommand(): SlashCommandBuilder {
		let command = super.slashCommand();

		command.setNameLocalizations({
			"en-US": "user-info",
			"da": "bruger-info"
		});

		command.setDescriptionLocalizations({
			"en-US": "Get information about the user",
			"da": "Få information om brugeren"
		});

		return command;
	}

	async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {
		const translator = botSystem.translator;
		interaction.editReply(`${interaction.user.tag}\n${translator.translateUppercase("your username", [interaction.user.username])}\n${translator.translateUppercase("your id", [interaction.user.id])}`);
	};
};