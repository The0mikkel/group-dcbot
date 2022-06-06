import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";

require("dotenv").config();

module.exports = {
    name: 'set-prefix',
    description: 'Sets the prefix of the bot',
    guildOnly: true,
    args: true,
    args_quantity: 1,
    usage: '[prefix]',
    async execute(message: Message, args: any) {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You need to be an administrator to do that.");
        }

        // Check if there is any args
        if (!args.length)
            return message.reply(`You need to specify a prefix, to be able to use this command!`);

        let prefix = args[0];

        let guild = BotSystem.getInstance().guild;
        if (!guild) {
            return message.reply(`This command cannot be executed outside a guild!`);
        }

        var ASCIIFolder = require("./../../data/helper/ascii-folder");
        guild.config.prefix = ASCIIFolder.foldReplacing(prefix).trim();

        guild.save();

        message.reply(`The prefix of the bot is now: ${guild.config.prefix}`);
    },
};