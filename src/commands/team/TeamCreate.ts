import { Message, Role } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";
import Team, { TeamCreationErrors } from "../../data/Group/Team";
import TeamInvite from "./TeamInvite";

require("dotenv").config();

export default class TeamCreate extends TeamCommand {
    constructor() {
        super(
            'create-team',
            'Create team with mentioned users - Remember to mention yourself. The first mentioned user, will be the team leader',
            true,
            true,
            1,
            '[team name]',
        )
    }

    async execute(message: Message, botSystem: BotSystem, args: any, autoDelete = false): Promise<void> {
        let returnValue = await this.createTeam(message, botSystem, args, autoDelete);

        if (returnValue instanceof DBGroup) {
            let botMessage = message.channel.send(`Group <@&${returnValue.id}> was created.\nTo add members beside yourself, please use the ${new TeamInvite().name} command!`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
        }
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

        var rawGroupName = "";
        for (const word in args) {
            rawGroupName = rawGroupName + args[word] + " ";
        }

        const groupName = ASCIIFolder.foldReplacing(rawGroupName);
        groupName.trim();

        if (groupName == "") {
            let botMessage = message.reply(`You need to specify a group name!`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        let dbGroup: DBGroup;
        let teamCreationReturn = await Team.createTeam(botSystem, message, groupName);

        if (!(teamCreationReturn instanceof DBGroup)) {
            let botMessage: Promise<Message>;
            switch (teamCreationReturn) {
                case TeamCreationErrors.roleCreationFailure:
                    botMessage = message.reply("Could not create group " + groupName);
                case TeamCreationErrors.alreadyExist:
                    botMessage = message.reply("The team already exist, please select another name for the team!");
                default:
                    botMessage = message.reply("An error occured while processing the creation of the team - Please try again or contact an admin.");
            }
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }
        dbGroup = teamCreationReturn;

        return dbGroup;
    }
};