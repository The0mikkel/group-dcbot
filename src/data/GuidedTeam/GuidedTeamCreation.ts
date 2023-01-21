import { DMChannel, Message, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User } from "discord.js";
import TeamCreate from "../../commands/team/TeamCreate";
import BotSystem from "../BotSystem";
import { DBGuild } from "../Guild/DBGuild";
import ASCIIFolder from "../Helper/ascii-folder";
import { DBGroup } from "../Group/DBGroup";
import GuidedTeamCreationPlatform from "./GuidedTeamCreationPlatform";
import { GuidedTeamCreationState } from "./GuidedTeamCreationState";
import Team from "../Group/Team";
import Translate from "../Language/Translate";
import TeamInvite from "../../commands/team/TeamInvite";
import { TextChannels } from "../Types/Channels";

export default class GuidedTeamCreation {
    guild: DBGuild;
    userMessages: Message[];
    botMessages: Message[];
    channel: TextChannels;
    user: User;
    team: DBGroup | null;
    timestamp: Date;
    key: number | undefined;
    state: GuidedTeamCreationState;

    constructor(guild: DBGuild, channel: TextChannels, user: User) {
        this.guild = guild;
        this.channel = channel;
        this.user = user;

        this.userMessages = [];
        this.botMessages = [];
        this.team = null;

        this.timestamp = new Date();
        this.state = GuidedTeamCreationState.created;
    }

    addUserMessage(message: Message) {
        this.userMessages.push(message);
    }

    addBotMessage(message: Message) {
        this.botMessages.push(message);
    }

    async sendBotMessage(message: string) {
        try {
            this.addBotMessage(await this.channel.send("<@"+this.user + ">, "+ Translate.getInstance().translateUppercase(message)));
        } catch (error) {
            console.error(error);
        }
    }

    async removeMessages() {
        this.userMessages.forEach(async message => {
            BotSystem.autoDeleteMessageByUser(message);
        })
        this.botMessages.forEach(async message => {
            BotSystem.autoDeleteMessageByUser(message);
        })
    }

    async step(message: Message | undefined, botSystem: BotSystem) {
        switch (this.state) {
            case GuidedTeamCreationState.created:
                await this.sendBotMessage("write the team name below, to continue");
                this.state = GuidedTeamCreationState.awaitTeamName;
                break;
            case GuidedTeamCreationState.awaitTeamName:
                if (!message) return;
                this.addUserMessage(message);

                let groupName = ASCIIFolder.foldReplacing(message.content.trim()).trim();

                let messageGuildMember = message.guild?.members.cache.get(message.author.id);
                if (messageGuildMember) {
                    message.mentions.members?.set(message.author.id, messageGuildMember);
                }

                const teamCreate = new TeamCreate();
                let groupCreation = await teamCreate.createTeam(message, botSystem, [groupName], true);
                if (!groupCreation) {
                    return;
                }
                this.team = groupCreation;
                let guildMember = message.guild?.members.cache.find(member => member.id === message.author.id);
                if (!guildMember) {
                    return false;
                }
                guildMember.roles.add(this.team.id);

                this.sendBotMessage("mention users, that is to join the team, to continue")
                this.state = GuidedTeamCreationState.awaitTeamMembers;
                break;
            case GuidedTeamCreationState.awaitTeamMembers:
                if (!message || !this.team || this.team == null) return;
                this.addUserMessage(message);

                let role = this.team;

                if (message.mentions.members) {
                    message.mentions.members.forEach(async (member) => {
                        Team.invite(botSystem, role, member, message);
                    });
                }

                this.state = GuidedTeamCreationState.teamCreated;

                this.sendBotMessage("the team has been created");
                this.sendBotMessage(botSystem.translator.translateUppercase("to add members beside yourself, please use the :invite command name: command", ["`" + botSystem.guild?.config.prefix + new TeamInvite().name + "`"]));

                setTimeout(() => {
                    GuidedTeamCreationPlatform.getInstance().removeGuidedTeamCreation(this);
                }, 15000);
                break;
            default:
                if (!message) return;
                // this.addUserMessage(message);
                // console.log(message)
                // console.log(this.state)
                break;
        }
    }
}