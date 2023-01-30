import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import { Config } from "../../data/Guild/Config";
import ArrayRemover from "../../data/Helper/ArrayRemover";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { Languages } from "../../data/Language/Languages";
import Translate from "../../data/Language/Translate";

require("dotenv").config();

export default class Language extends UtilityCommand {
	active: boolean = false;
	shortDescription: string = "Set language of bot for this guild";

	constructor() {
		super(
			'language',
			'Set language of bot for this guild',
			true,
			true,
			1,
			'[language - en,da]',
			undefined,
			[
				"Administrator"
			],
			UserLevel.admin
		)
	}

	slashCommand(): SlashCommandBuilder {
		let command = super.slashCommand();

		command.setNameLocalizations({
			"en-US": "language",
			"da": "sprog"
		});

		command.setDescriptionLocalizations({
			"en-US": "Set language of bot for this guild",
			"da": "Sæt sprog for bot i denne guild"
		});

		command.addStringOption(option =>
			option.setName('language')
				.setNameLocalizations({
					"en-US": "language",
					"da": "sprog"
				})
				.setDescription("The language you want to set the bot to")
				.setDescriptionLocalizations({
					"en-US": "The language you want to set the bot to",
					"da": "Sproget du vil sætte boten til"
				})
				.setRequired(true)
				.setMinLength(1)
				.setAutocomplete(true)
		);

		return command;
	}

	async executeAutocomplete(interaction: AutocompleteInteraction<CacheType>, botSystem: BotSystem): Promise<void> {
		const languages = Object.values(Languages);

		this.autocompleteHelper(interaction, languages);
	}

	async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem, args: any): Promise<void> {

		interaction.editReply("This command has not yet been implemented in this version");
		return;

		if (
			!interaction.member
		) {
			interaction.editReply(Translate.getInstance().translate("You need to be an administrator to do that"));
			return
		}

		const answer = ASCIIFolder.foldReplacing(args.shift() ?? "");
		answer.trim().toLowerCase();

		let tempLanguage = answer ?? "en"
        if (!Object.values(Languages).includes(tempLanguage as Languages)) {
            tempLanguage = "en";
        }
		Translate.getInstance().setLanguage(Languages[tempLanguage as Languages] ?? Languages.en)
		interaction.editReply("Language now set to "+Translate.getInstance().getLanguage());
	}
};