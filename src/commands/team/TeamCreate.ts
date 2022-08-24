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
            'Create a team',
            true,
            true,
            1,
            '[team name]',
        )
    }

    async execute(message: Message, botSystem: BotSystem, args: any, autoDelete = false): Promise<void> {
        const translator = botSystem.translator;

        let returnValue = await this.createTeam(message, botSystem, args, autoDelete);

        if (returnValue instanceof DBGroup) {
            let botMessage = message.channel.send(`${translator.translateUppercase("team :group: was created", [`<@&${returnValue.id}>`])}.\n${translator.translateUppercase("to add members beside yourself, please use the :invite command name: command", ["`" + botSystem.guild?.config.prefix + new TeamInvite().name + "`"])}!`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
        }
    }

    async createTeam(message: Message, botSystem: BotSystem, args: any, autoDelete = false): Promise<false | DBGroup> {
        const translator = botSystem.translator;

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
            let botMessage = message.channel.send(translator.translateUppercase("you don't have permission to add new teams"));
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        var rawGroupName = "";
        for (const word in args) {
            rawGroupName = rawGroupName + args[word] + " ";
        }

        const groupName = ASCIIFolder.foldReplacing(rawGroupName).trim();

        if (groupName == "") {
            let botMessage = message.reply(`${translator.translateUppercase("you need to specify a team name")}!`);
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false;
        }

        let dbGroup: DBGroup;
        let teamCreationReturn = await Team.create(botSystem, message, groupName);

        if (!(teamCreationReturn instanceof DBGroup)) {
            let botMessage: Promise<Message>;
            switch (teamCreationReturn) {
                case TeamCreationErrors.roleCreationFailure:
                    botMessage = message.reply(translator.translateUppercase("could not create team :name:", [groupName]));
                    break;
                case TeamCreationErrors.alreadyExist:
                    botMessage = message.reply(translator.translateUppercase("the team already exist, please select another name for the team"));
                    break;
                case TeamCreationErrors.nameLength:
                    botMessage = message.reply(translator.translateUppercase("the team name must not be longer than 100 characters"));
                    break;
                case TeamCreationErrors.channelCreationFailure:
                    botMessage = message.reply(translator.translateUppercase("team was created, but an error occured while creating channel(s) for the team") + " - " + translator.translateUppercase("please contact an admin to further assist"))
                    break;
                case TeamCreationErrors.max:
                    botMessage = message.reply(translator.translateUppercase("there cannot be created anymore teams") + " - " + translator.translateUppercase("please contact an admin to further assist"))
                    break;
                default:
                    botMessage = message.reply(translator.translateUppercase("an error occured while processing the creation of the team") + " - " + translator.translateUppercase("please try again or contact an admin"));
                    break;
            }
            if (autoDelete) BotSystem.autoDeleteMessageByUser(await botMessage);
            return false
        }
        dbGroup = teamCreationReturn;

        let guildMember = message.guild?.members.cache.find(member => member.id === message.author.id);
        if (!guildMember) {
            return false;
        }
        guildMember.roles.add(dbGroup.id);

        return dbGroup;
    }
};