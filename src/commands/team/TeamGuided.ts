import { Message, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ASCIIFolder from "../../data/Helper/ascii-folder";

require("dotenv").config();

export default class TeamGuided extends TeamCommand {
    constructor() {
        super(
            'team-guided',
            'Set message to act as a guided team creator - Needs to be executed in the same channel as message',
            true,
            true,
            2,
            '[message id] [emoji]',
            undefined,
            undefined,
            UserLevel.admin
        );
    }

    async execute(message: Message, botSystem: BotSystem, args: any) {
        if (args.length < 2) {
            message.reply(`You need to specify a message id and an emoji to use as a reaction!`);
            return;
        }

        let messageId = ASCIIFolder.foldReplacing(args.shift().trim());
        let emoji = args.shift().trim();
        
        (await message.channel.messages.fetch(messageId)).react(emoji)

        botSystem.guild?.guidedTeamStart.push(messageId);
        await botSystem.guild?.save();

        BotSystem.autoDeleteMessageByUser(message);
        BotSystem.sendAutoDeleteMessage(message.channel, "Guided team creator has been setup!");
    }
};