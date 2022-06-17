import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";

require("dotenv").config();

export default class EditPrefix extends Command {

    constructor() {
        super(
            'set-prefix',
            'Sets the prefix of the bot',
            true,
            true,
            1,
            '[prefix]',
            undefined,
            ["ADMINISTRATOR"],
            ["prefix"]
        );
    }

    async execute(message: Message, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void> {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send("You need to be an administrator to do that.");
            return;
        }

        // Check if there is any args
        if (!args.length) {
            message.reply(`You need to specify a prefix, to be able to use this command!`);
            return;
        }

        let prefix = args[0];

        let guild = BotSystem.getInstance().guild;
        if (!guild) {
            message.reply(`This command cannot be executed outside a guild!`);
            return
        }

        var ASCIIFolder = require("./../../data/helper/ascii-folder");
        guild.config.prefix = ASCIIFolder.foldReplacing(prefix).trim();

        guild.save();

        message.reply(`The prefix of the bot is now: ${guild.config.prefix}`);
    }
};