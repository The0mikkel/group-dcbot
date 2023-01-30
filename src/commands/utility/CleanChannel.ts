import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ArrayRemover from "../../data/Helper/ArrayRemover";

require("dotenv").config();

export default class CleanChannel extends UtilityCommand {
	shortDescription: string = "See or set the current channel to be a clean channel - All new messages will be deleted by the bot.";

	constructor() {
		super(
			'clean-channel',
			'See or set the current channel to be a clean channel - All new messages will be deleted by the bot.',
			true,
			undefined,
			undefined,
			'[true/false]',
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
			"en-US": "clean-channel",
			"da": "ren-kanal"
		});

		command.setDescriptionLocalizations({
			"en-US": "See or set the current channel to be a clean channel - All new messages will be deleted by the bot.",
			"da": "Se eller sæt den nuværende kanal til at være en ren kanal - Alle nye beskeder vil blive slettet."
		});

		command.addBooleanOption(option =>
			option.setName('clean')
				.setNameLocalizations({
					"en-US": "clean",
					"da": "ren"
				})
				.setDescription("Set the current channel to be a clean channel")
				.setDescriptionLocalizations({
					"en-US": "Set the current channel to be a clean channel",
					"da": "Sæt den nuværende kanal til at være en ren kanal"
				})
				.setRequired(false)
		);

		return command;
	}

	async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {
		if (!interaction.member) {
			interaction.editReply("You need to be an administrator to do that.");
			return
		}
		if (!interaction.guild) {
			interaction.editReply({ content: botSystem.translator.translateUppercase("i can't execute that command outside guilds") });
			return;
		}

		const answer = interaction.options.getBoolean('clean');
		if (answer === true) {
			if (botSystem.guild?.cleanChannels.includes(interaction.channelId)) {
				interaction.editReply("The current channel is already a clean channel");
			} else {
				botSystem.guild?.cleanChannels.push(interaction.channelId);
				await botSystem.guild?.save();
				interaction.editReply("The current channel is now set as a clean channel, and new messages will be deleted");
			}
		} else if (answer === false) {
			if (!botSystem.guild?.cleanChannels.includes(interaction.channelId)) {
				interaction.editReply("The current channel is already not a clean channel");
			} else {
				if (botSystem.guild?.cleanChannels)
					botSystem.guild.cleanChannels = ArrayRemover.arrayRemove(botSystem.guild?.cleanChannels, interaction.channelId);

				await botSystem.guild?.save();
				interaction.editReply("The current channel is now set as a not clean channel, and messages will not be deleted");
			}
		} else {
			interaction.editReply("The current channel is " + (botSystem.guild?.cleanChannels.includes(interaction.channelId) ? "" : "not ") + "setup as a clean channel");
			return;
		}
	}
};