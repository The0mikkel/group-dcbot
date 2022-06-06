import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import { DBGroup } from "../../data/roles/DBGroup";
import { DBInvite } from "../../data/roles/DBInvite";

require("dotenv").config();

module.exports = {
    name: 'create-team',
    description: 'Create team with mentioned users - Remember to mention yourself. The first mentioned user, will be the team leader',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    cooldown: 5,
    usage: '[team name] [team-leader] [members...]',
    async execute(message: Message, args: any) {
        const botSystem = BotSystem.getInstance();
        botSystem.guild?.teamConfig.filterRemoved(message);
        botSystem.guild?.save();

        let hasRole = false;
        botSystem.guild?.teamConfig.creatorRole.forEach(role => {
            if (message?.member?.roles.cache.has(role)) {
                hasRole = true;
            }
        });
        
        if (botSystem.guild?.teamConfig.allowEveryone) {
            hasRole = true;
        }

        if (
            !message.member
            || (
                !message.member.permissions.has("ADMINISTRATOR")
                && !hasRole
            )
        ) {
            return message.channel.send("You don't have permission to add new teams!");
        }

        if (args.length < 2)
            return message.reply(`You need to specify a group name and group members!`);

        var ASCIIFolder = require("./../../data/helper/ascii-folder");
        const groupName = ASCIIFolder.foldMaintaining(args.shift());
        groupName.trim();

        let roleLookup = message.guild?.roles.cache.find(role => role.name === groupName);
        if (roleLookup) {
            message.reply("The team already exist, please select another name for the team!");
            return;
        }

        let role = await message.guild?.roles.create({
            name: groupName,
            color: undefined,
            mentionable: true,
            reason: 'Group was created by grouper, as per request by ' + message.author.tag,
        })

        if (role == undefined) {
            message.reply("Could not create group "+groupName);
            return
        }

        let dbGroup: DBGroup;
        dbGroup = new DBGroup(role?.id, message.guild?.id ?? "", role?.name ?? "", message.author.id, "", Date.now());


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
            message.channel.send(`Group ${role} was created. Role was added to mentioned users.`);
        } else { // Invite required
            let membersCount = 0;
            let randomMemberId = "";
            if (message.mentions.members) {
                message.mentions.members.forEach(async (member) => {
                    if (membersCount == 0) {
                        randomMemberId = member.id;
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

                dbGroup.teamLeader = args.shift().toLowerCase().substring(2).trim().slice(0, -1) ?? randomMemberId;
            }
            message.channel.send(`Group ${role} was created. Invites to team was send to all mentioned users.`);
        }

        await dbGroup.save();

    },
};