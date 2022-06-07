import { Message, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ASCIIFolder from "../../data/helper/ascii-folder";

require("dotenv").config();

module.exports = {
    name: 'team-guided-in-memory',
    description: 'Set message to act as a guided team creator - Needs to be executed in the same channel as message',
    guildOnly: true,
    args: false,
    args_quantity: 0,
    usage: '[message id] [emoji]',
    async execute(message: Message, args: any) {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You don't have permission to add new teams!");
        }

        console.log(BotSystem.getInstance().openGuidedTeamCreations);
    },
};