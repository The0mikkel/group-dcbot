import { Message, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ASCIIFolder from "../../data/helper/ascii-folder";

require("dotenv").config();

module.exports = {
    name: 'team-guided',
    description: 'Set message to act as a guided team creator - Needs to be executed in the same channel as message',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    usage: '[message id] [emoji]',
    async execute(message: Message, args: any) {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You don't have permission to add new teams!");
        }

        if (args.length < 2) {
            message.reply(`You need to specify a message id and an emoji to use as a reaction!`);
            return false;
        }

        let messageId = ASCIIFolder.foldReplacing(args.shift().trim());
        let emoji = args.shift().trim();

        const botSystem = BotSystem.getInstance();
        
        (await message.channel.messages.fetch(messageId)).react(emoji)

        botSystem.guild?.guidedTeamStart.push(messageId);
        botSystem.guild?.save();

        BotSystem.autoDeleteMessageByUser(message);
        BotSystem.sendAutoDeleteMessage(message.channel, "Guided team creator has been setup!");
    },
};