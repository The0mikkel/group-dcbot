import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import { Config } from "../../data/guild/Config";
import ArrayRemover from "../../data/helper/ArrayRemover";
import ASCIIFolder from "../../data/helper/ascii-folder";

require("dotenv").config();

module.exports = {
	name: 'clean-channel',
	description: 'See or set the current channel to be a clean channel - All new messages will be deleted by the bot.',
	guildOnly: true,
	args: false,
	args_quantity: 0,
	usage: '[true/false]',
	async execute(message: Message, args: any) {
		if (
			!message.member
			|| !message.member.permissions.has("ADMINISTRATOR")
		) {
			return message.channel.send("You need to be an administrator to do that.");
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
			return false;
		}
	},
};