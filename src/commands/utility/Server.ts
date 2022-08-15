import { Message } from "discord.js";
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

	async execute(message: Message, botSystem: BotSystem) {
		const translator = botSystem.translator;
		if (message.guild != undefined) {
			message.channel.send(translator.translateUppercase("server name", [message.guild.name])+"\n"+translator.translateUppercase("total members", [message.guild.memberCount]));
		}
	}
};