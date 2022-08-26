import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ConfigCommand from "../../data/Command/Types/ConfigCommand";
import { UserLevel } from "../../data/Command/UserLevel";

require("dotenv").config();

export default class EditPrefix extends ConfigCommand {

    constructor() {
        super(
            'set-prefix',
            'Sets the prefix of the bot',
            true,
            true,
            1,
            '[prefix]',
            undefined,
            [],
            UserLevel.admin,
            ["prefix"]
        );
    }

    async execute(message: Message, botSystem: BotSystem, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void> {
        if (
            !message.member
        ) {
            message.channel.send(botSystem.translator.translateUppercase("you need to be an administrator to do that"));
            return;
        }

        // Check if there is any args
        if (!args.length) {
            message.reply(botSystem.translator.translateUppercase("you need to specify a prefix, to be able to use this command"));
            return;
        }

        let prefix = args[0];

        let guild = botSystem.guild;
        if (!guild) {
            message.reply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            return
        }

        var ASCIIFolder = require("./../../data/Helper/ascii-folder");
        guild.config.prefix = ASCIIFolder.foldReplacing(prefix).trim();

        await guild.save();

        message.reply(botSystem.translator.translateUppercase("the prefix of the bot is now: :prefix:", [guild.config.prefix]));
    }
};