import { Message } from "discord.js";
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
            ["ADMINISTRATOR"],
            UserLevel.admin
        )
    }

	async execute(message: Message, botSystem: BotSystem, args: any) {
        if(
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send(botSystem.translator.translateUppercase("you need to be an administrator to do that"));
            return;
        }
        
        resetGuild(message, args, botSystem);
        return;
	}
};

async function resetGuild(message: Message, args: any, botSystem: BotSystem) {
    let guild = botSystem.guild;
    if (!guild) {
        return message.reply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
    }

    guild.config = new Config();
    await guild.save();

    message.channel.send(botSystem.translator.translateUppercase("bot has been reset"));
}