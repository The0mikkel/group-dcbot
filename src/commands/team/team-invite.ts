import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import { InviteType } from "../../data/guild/InviteType";
import ASCIIFolder from "../../data/helper/ascii-folder";
import { DBGroup } from "../../data/roles/DBGroup";
import { DBInvite } from "../../data/roles/DBInvite";

require("dotenv").config();

module.exports = {
    name: 'team-invite',
    description: 'Invite a new member to the team',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    cooldown: 5,
    usage: '[team] [team member]',
    async execute(message: Message, args: any) {
        const botSystem = BotSystem.getInstance();
        botSystem.guild?.teamConfig.filterRemoved(message);
        botSystem.guild?.save();

        if (
            !message.member
        ) {
            return message.channel.send("You don't have permission to add new team members!");
        }

        if (
            botSystem.guild?.teamConfig.teamInviteType == InviteType.admin
            && !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You don't have permission to add new team members - Only admins can do that.");
        }

        if (args.length < 2) {
            return message.reply(`You need to specify a group name and group members!`);
        }

        let roleId: string | undefined;
        let groupName: string;
        if (!message.mentions.roles || message.mentions.roles.first() == undefined) {
            groupName = ASCIIFolder.foldMaintaining(args.shift().trim());
            console.log(groupName);
            roleId = message.guild?.roles.cache.find(role => role.name === groupName)?.id;
        } else {
            args.shift();
            roleId = message.mentions.roles.first()?.id ?? undefined;
            groupName = ASCIIFolder.foldMaintaining(message.mentions.roles.first()?.name);
        }
        if (!roleId) {
            message.reply("The team does not exist!");
            return;
        }

        let role = await DBGroup.load(roleId ?? "");
        if (role == undefined) {
            message.reply("The team does not exist!");
            return;
        }

        if (botSystem.guild?.teamConfig.teamInviteType == InviteType.leader && !message.member.permissions.has("ADMINISTRATOR")) {
            if (role?.teamLeader != message.author.id) {
                message.reply("This action can only be performed by the team leader!");
                return;
            }
        } else if (botSystem.guild?.teamConfig.teamInviteType == InviteType.team && !message.member.permissions.has("ADMINISTRATOR")) {
            let currentUser = await message.guild?.members.fetch(message.author.id);
            currentUser?.roles.cache.has(role?.id);
            if (role?.teamLeader != message.author.id) {
                message.reply("This action can only be performed by a member of the team!");
                return;
            }
        }

        let users = [];

        if (!botSystem.guild?.teamConfig.requireInvite) { // Invite not required
            if (message.mentions.members) {
                message.mentions.members.forEach(async (member) => {
                    try {
                        member.roles.add(role?.id ?? "");
                        users.push(member);
                    } catch (error) {
                        console.log(`There was an error adding user: ${member} for the role "${groupName}" and this was caused by: ${error}`)
                    }
                });
            }
            message.channel.send(`Mentioned members, has been added.`);
        } else { // Invite required
            if (message.mentions.members) {
                message.mentions.members.forEach(async (member) => {
                    if (member.roles.cache.has(role?.id)) {
                        return;
                    }
                    try {
                        let dmMessage = await member.send(`You have been invited to the team "${groupName}" by "${message.author.tag}" in the guild "${message.guild?.name}".\nReact below, to join the team!.`);
                        dmMessage.react("✅");
                        dmMessage.react("❌");

                        (new DBInvite(member.id, dmMessage.id, role?.id ?? "", message.guild?.id ?? "")).save();
                    } catch (error) {
                        console.log(`There was an error sending invite to user: ${member} for the role "${groupName}" and this was caused by: ${error}`)
                    }
                });
            }
            message.channel.send(`Invites to team has been send to all mentioned users.`);
        }
    },
};