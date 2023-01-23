import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import Translate from "../../data/Language/Translate";

export default class Server extends UtilityCommand {
	constructor() {
		super(
			"server",
			"server command description",
			true,
		)
	}

	slashCommand(): SlashCommandBuilder {
		let command = super.slashCommand();

		command.setNameLocalizations({
			"en-US": "server",
			"da": "server"
		});

		command.setDescriptionLocalizations({
			"en-US": "Get information about the server",
			"da": "Få information om serveren"
		});

		return command;
	}

	async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
		const translator = botSystem.translator;
		if (interaction.guild != undefined) {
			interaction.editReply(translator.translateUppercase("server name", [interaction.guild.name]) + "\n" + translator.translateUppercase("total members", [interaction.guild.memberCount]));
		} else {
			interaction.editReply({ content: translator.translateUppercase("i can't execute that command outside guilds") });
		}
	}
};