import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";

require("dotenv").config();

export default class Group extends GroupCommand {
    constructor() {
        super(
            'group',
            'group command description',
            true,
            true,
            2,
            '[group name] [group members]',
            undefined,
            ["ADMINISTRATOR"],
            UserLevel.admin
        )
    }

    async execute(message: Message, botSystem: BotSystem, args: any) {
        // Check permissions
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send(botSystem.translator.translateUppercase("you do not have the right permissions to use this command"));
            return;
        }

        if (!message.guild) {
            message.reply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            return;
        }

        if (!args.length) {
            message.reply(botSystem.translator.translateUppercase("you need to specify a group name and group members"));
            return;
        }

        const groupName = ASCIIFolder.foldReplacing(args.shift());

        let role = await message.guild.roles.create({
            name: groupName,
            color: undefined,
            mentionable: true,
            reason: 'Group was created by grouper, as per request by ' + message.author.tag,
        })

        try {
            await (new DBGroup(role.id, message.guild.id, role.name, message.author.id, "", Date.now())).save()
        } catch (error) {
            console.log(error);
        }


        let users = [];

        if (message.mentions.members) {
            message.mentions.members.forEach(async (member) => {
                try {
                    member.roles.add(role.id);
                    users.push(member);
                } catch (error) {
                    console.log(`There was an error adding user: ${member} for the role "${groupName}" and this was caused by: ${error}`)
                }
            });
        }

        message.channel.send(botSystem.translator.translateUppercase("group :group name: was created", [role]));
        return;
    }
};