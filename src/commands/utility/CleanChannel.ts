import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";
import { Config } from "../../data/guild/Config";
import ArrayRemover from "../../data/helper/ArrayRemover";
import ASCIIFolder from "../../data/helper/ascii-folder";

require("dotenv").config();

export default class CleanChannel extends Command {
	constructor() {
		super(
			'clean-channel',
			'See or set the current channel to be a clean channel - All new messages will be deleted by the bot.',
			true,
			undefined,
			undefined,
			'[true/false]'
		)
	}

	async execute(message: Message, args: any): Promise<void> {
		if (
			!message.member
			|| !message.member.permissions.has("ADMINISTRATOR")
		) {
			message.channel.send("You need to be an administrator to do that.");
			return
		}

		const answer = ASCIIFolder.foldReplacing(args.shift() ?? "");
		answer.trim().toLowerCase();

		const botSystem = BotSystem.getInstance();

		if (answer == "true" || answer == "yes" || answer == "1") {
			if (botSystem.guild?.cleanChannels.includes(message.channelId)) {
				message.reply("The current channel is already a clean channel");
			} else {
				botSystem.guild?.cleanChannels.push(message.channelId);
				await botSystem.guild?.save();
				message.reply("The current channel is now set as a clean channel, and new messages will be deleted");
			}
		} else if (answer == "false" || answer == "no" || answer == "0") {
			if (botSystem.guild?.cleanChannels.includes(message.channelId)) {
				message.reply("The current channel is already not a clean channel");
			} else {
				if (botSystem.guild?.cleanChannels)
					botSystem.guild.cleanChannels = ArrayRemover.arrayRemove(botSystem.guild?.cleanChannels, message.channelId);

				await botSystem.guild?.save();
				message.reply("The current channel is now set as a not clean channel, and messages will not be deleted");
			}
		} else {
			message.reply("The current channel is " + (botSystem.guild?.cleanChannels.includes(message.channelId) ? "" : "not ") + "setup as a clean channel");
			return;
		}
	}
};