import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import { Config } from "../../data/guild/Config";

require("dotenv").config();

module.exports = {
    name: 'reset',
	description: 'Reset bot for guild',
    guildOnly: true,
    args: false,
    args_quantity: 0,
    usage: '',
	execute(message: Message, args: any) {
        if(
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You need to be an administrator to do that.");
        }
        
        resetGuild(message, args);
	},
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