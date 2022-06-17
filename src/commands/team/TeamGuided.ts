import { Message, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";
import ASCIIFolder from "../../data/helper/ascii-folder";

require("dotenv").config();

export default class TeamGuided extends Command {
    constructor() {
        super(
            'team-guided',
            'Set message to act as a guided team creator - Needs to be executed in the same channel as message',
            true,
            true,
            2,
            '[message id] [emoji]',
        );
    }

    async execute(message: Message, args: any) {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send("You don't have permission to add new teams!");
            return;
        }

        if (args.length < 2) {
            message.reply(`You need to specify a message id and an emoji to use as a reaction!`);
            return;
        }

        let messageId = ASCIIFolder.foldReplacing(args.shift().trim());
        let emoji = args.shift().trim();

        const botSystem = BotSystem.getInstance();
        
        (await message.channel.messages.fetch(messageId)).react(emoji)

        botSystem.guild?.guidedTeamStart.push(messageId);
        botSystem.guild?.save();

        BotSystem.autoDeleteMessageByUser(message);
        BotSystem.sendAutoDeleteMessage(message.channel, "Guided team creator has been setup!");
    }
};