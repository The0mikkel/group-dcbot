import { Message } from "discord.js";
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
	constructor() {
		super(
			'language',
			'Set language of bot for this guild',
			true,
			true,
			1,
			'[language - en,da]',
			undefined,
			undefined,
			UserLevel.admin
		)
	}

	async execute(message: Message, botSystem: BotSystem, args: any): Promise<void> {
		if (
			!message.member
		) {
			message.channel.send(Translate.getInstance().translate("You need to be an administrator to do that"));
			return
		}

		const answer = ASCIIFolder.foldReplacing(args.shift() ?? "");
		answer.trim().toLowerCase();

		let tempLanguage = answer ?? "en"
        if (!Object.values(Languages).includes(tempLanguage as Languages)) {
            tempLanguage = "en";
        }
		Translate.getInstance().setLanguage(Languages[tempLanguage as Languages] ?? Languages.en)
		message.reply("Language now set to "+Translate.getInstance().getLanguage());
	}
};