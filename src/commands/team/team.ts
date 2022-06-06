import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import { DBGroup } from "../../data/roles/DBGroup";
import { DBInvite } from "../../data/roles/DBInvite";

require("dotenv").config();

module.exports = {
    name: 'team',
    description: 'Get information about a team',
    guildOnly: true,
    args: true,
    args_quantity: 1,
    usage: '[team]',
    async execute(message: Message, args: any) {
        message.reply("Still work in progress - Sorry");
    },
};