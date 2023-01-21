import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { InviteType } from "../../data/Guild/InviteType";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";
import { UserLevel } from "../../data/Command/UserLevel";
import Team from "../../data/Group/Team";
import Command from "../../data/Command/Command";

require("dotenv").config();

export default class TeamInvite extends TeamCommand {
    constructor() {
        super(
            "team-invite",
            'Invite a new member to the team',
            true,
            true,
            2,
            '[team] [team member]',
            undefined,
            undefined,
            UserLevel.team,
            ["invite", "invite-to-team"]
        )

    }

    async execute(message: Message, botSystem: BotSystem, args: any): Promise<void> {
        const translator = botSystem.translator;

        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

        if (
            !message.member
        ) {
            message.channel.send(translator.translateUppercase("you don't have permission to add new team members"));
            return;
        }

        if (
            botSystem.guild?.teamConfig.teamInviteType == InviteType.admin
            && (this.level = UserLevel.admin)
            && !this.authorized(message, botSystem)
        ) {
            message.channel.send(translator.translateUppercase("you don't have permission to add new team members") + " - " + translator.translateUppercase("only admins can do that"));
            return;
        }

        if (args.length < 1) {
            message.reply(translator.translateUppercase(`you need to specify a team name and group members`));
            return;
        }

        let roleId: string | undefined;
        let groupName: string;
        if (!message.mentions.roles || message.mentions.roles.first() == undefined) {
            groupName = ASCIIFolder.foldReplacing(args.shift().trim());
            console.log(groupName);
            roleId = message.guild?.roles.cache.find(role => role.name === groupName)?.id;
        } else {
            args.shift();
            roleId = message.mentions.roles.first()?.id ?? undefined;
            groupName = ASCIIFolder.foldReplacing(message.mentions.roles.first()?.name);
        }
        if (!roleId) {
            message.reply(translator.translateUppercase("the team does not exist"));
            return;
        }

        let role: DBGroup;
        let loadReturn = await DBGroup.load(roleId ?? "") ?? undefined;
        if (loadReturn == undefined) {
            message.reply(translator.translateUppercase("the team does not exist"));
            return;
        } else {
            role = loadReturn
        }

        if (!(await this.authorizedAdmin(message, botSystem) && await this.authorizedTeamAdmin)) {
            if (botSystem.guild?.teamConfig.teamInviteType == InviteType.leader && !message.member.permissions.has("Administrator")) {
                let currentUser = await message.guild?.members.fetch(message.author.id);
                if (!(currentUser?.roles.cache.has(role.id) && role?.teamLeader == message.author.id)) {
                    message.reply(translator.translateUppercase("this action can only be performed by :role:", ["the team leader"]));
                    return;
                }
            } else if (botSystem.guild?.teamConfig.teamInviteType == InviteType.team && !message.member.permissions.has("Administrator")) {
                let currentUser = await message.guild?.members.fetch(message.author.id);
                if (!currentUser?.roles.cache.has(role.id)) {
                    message.reply(translator.translateUppercase("this action can only be performed by :role:", ["a member of the team"]));
                    return;
                }
            }
        }

        if (message.mentions.members) {
            message.mentions.members.forEach(async (member) => {
                Team.invite(botSystem, role, member, message);
            });
        }

        message.channel.send(translator.translateUppercase(`Invites to team has been send to all mentioned users`));
    }
};