import { CommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ConfigCommand from "../../data/Command/Types/ConfigCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import { Config } from "../../data/Guild/Config";

require("dotenv").config();

export default class Reset extends ConfigCommand {
    constructor() {
        super(
            'reset',
            'Reset bot for guild',
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            [],
            UserLevel.admin
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "reset",
            "da": "reset"
        });

        command.setDescriptionLocalizations({
            "en-US": "Reset bot for guild",
            "da": "Nulstil botten for serveren"
        });

        return command;
    }

	async execute(interaction: CommandInteraction, botSystem: BotSystem) {
        if(
            !interaction.member
        ) {
            interaction.editReply(botSystem.translator.translateUppercase("you need to be an administrator to do that"));
            return;
        }
        
        resetGuild(interaction, botSystem);
        return;
	}
};

async function resetGuild(interaction: CommandInteraction,botSystem: BotSystem) {
    let guild = botSystem.guild;
    if (!guild) {
        return interaction.editReply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
    }

    guild.config = new Config();
    await guild.save();

    interaction.editReply(botSystem.translator.translateUppercase("bot has been reset"));
}