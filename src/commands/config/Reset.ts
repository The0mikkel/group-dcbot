import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";
import { Config } from "../../data/guild/Config";

require("dotenv").config();

export default class Reset extends Command {
    constructor() {
        super(
            'reset',
            'Reset bot for guild',
            true
        )
    }

	async execute(message: Message, args: any) {
        if(
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send("You need to be an administrator to do that.");
            return;
        }
        
        resetGuild(message, args);
        return;
	}
};

async function resetGuild(message: Message, args: any) {
    let guild = BotSystem.getInstance().guild;
    if (!guild) {
        return message.reply(`This command cannot be executed outside a guild!`);
    }

    guild.config = new Config();
    guild.save();

    message.channel.send("Bot has been reset!");
}