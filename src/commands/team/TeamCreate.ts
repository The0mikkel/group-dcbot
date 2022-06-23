import { Message, Role } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import ASCIIFolder from "../../data/helper/ascii-folder";
import { DBGroup } from "../../data/roles/DBGroup";
import { DBInvite } from "../../data/roles/DBInvite";

require("dotenv").config();

export default class TeamCreate extends TeamCommand {
    constructor() {
        super(
            'create-team',
            'Create team with mentioned users - Remember to mention yourself. The first mentioned user, will be the team leader',
            true,
            true,
            2,
            '[team name] [team-leader] [members...]',
        )
    }

    async execute(message: Message, botSystem: BotSystem, args: any, autoDelete = false): Promise<void> {
        await this.createTeam(message, botSystem, args, autoDelete);
    }

    async createTeam(message: Message, botSystem: BotSystem, args: any, autoDelete = false): Promise<false | DBGroup> {
        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

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
            let botMessage = message.channel.send("You don't have permission to add new teams!");
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        if (args.length < 2) {
            let botMessage = message.reply(`You need to specify a group name and group members!`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        const groupName = ASCIIFolder.foldReplacing(args.shift());
        groupName.trim();

        if (groupName == "") {
            let botMessage = message.reply(`You need to specify a group name!`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        let roleLookup = message.guild?.roles.cache.find(role => role.name === groupName);
        if (roleLookup) {
            let botMessage = message.reply("The team already exist, please select another name for the team!");
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        let role = await message.guild?.roles.create({
            name: groupName,
            color: undefined,
            mentionable: true,
            reason: 'Group was created by grouper, as per request by ' + message.author.tag,
        })

        if (role == undefined) {
            let botMessage = message.reply("Could not create group " + groupName);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        let dbGroup: DBGroup;
        dbGroup = new DBGroup(role?.id, message.guild?.id ?? "", ASCIIFolder.foldReplacing(role?.name ?? ""), message.author.id, "", Date.now());


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
            let botMessage = message.channel.send(`Group ${role} was created. Role was added to mentioned users.`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
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

                        await (new DBInvite(member.id, dmMessage.id, role?.id ?? "", message.guild?.id ?? "")).save();
                    } catch (error) {
                        console.log(`There was an error sending invite to user: ${member} for the role "${groupName}" and this was caused by: ${error}`)
                    }
                });

                dbGroup.teamLeader = args.shift().toLowerCase().substring(2).trim().slice(0, -1) ?? randomMemberId;
            }
            let botMessage = message.channel.send(`Group ${role} was created. Invites was send to all mentioned users.`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
        }

        await dbGroup.save();
        return dbGroup;
    }
};