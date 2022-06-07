import { DMChannel, Message, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User } from "discord.js";
import BotSystem from "../BotSystem";
import { DBGuild } from "../guild/DBGuild";
import ASCIIFolder from "../helper/ascii-folder";
import { DBGroup } from "../roles/DBGroup";
import { DBInvite } from "../roles/DBInvite";
import { GuidedTeamCreationState } from "./GuidedTeamCreationState";

export default class GuidedTeamCreation {
    guild: DBGuild;
    userMessages: Message[];
    botMessages: Message[];
    channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel;
    user: User;
    team: DBGroup | null;
    invites: DBInvite[];
    timestamp: Date;
    key: number | undefined;
    state: GuidedTeamCreationState;

    constructor(guild: DBGuild, channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel, user: User) {
        this.guild = guild;
        this.channel = channel;
        this.user = user;

        this.userMessages = [];
        this.botMessages = [];
        this.team = null;
        this.invites = [];

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
            this.addBotMessage(await this.channel.send(message));
        } catch (error) {
            console.error(error);
        }
    }

    async removeMessages() {
        try {
            this.userMessages.forEach(async message => {
                try {
                    await message.delete();
                } catch (error) {
                    console.log("Tried to delete message, but an error occurred!");
                }
            })
            this.botMessages.forEach(async message => {
                try {
                    await message.delete();
                } catch (error) {
                    console.log("Tried to delete message, but an error occurred!");
                }
            })
        } catch (error) {
            console.log(error)
        }

    }

    async step(message: Message | undefined) {
        let botSystem = BotSystem.getInstance();

        switch (this.state) {
            case GuidedTeamCreationState.created:
                await this.sendBotMessage("Write the team name below, to continue");
                this.state = GuidedTeamCreationState.awaitTeamName;
                break;
            case GuidedTeamCreationState.awaitTeamName:
                if (!message) return;
                this.addUserMessage(message);

                let groupName = ASCIIFolder.foldReplacing(message.content);

                let messageGuildMember = message.guild?.members.cache.get(message.author.id);
                if (messageGuildMember) {
                    message.mentions.members?.set(message.author.id, messageGuildMember);
                }

                let groupCreation = await require("../../commands/team/team-create").execute(message, [groupName, "<!" + message.author.id + ">"], true);
                if (!groupCreation) {
                    return;
                }
                this.team = groupCreation;
                this.sendBotMessage("Mention users, that is to join the team, to continue")
                this.state = GuidedTeamCreationState.awaitTeamMembers;
                break;
            case GuidedTeamCreationState.awaitTeamMembers:
                if (!message || !this.team || this.team == null) return;
                this.addUserMessage(message);

                let role = this.team;

                if (!botSystem.guild?.teamConfig.requireInvite) { // Invite not required
                    if (message.mentions.members) {
                        message.mentions.members.forEach(async (member) => {
                            try {
                                member.roles.add(role.id ?? "");
                            } catch (error) {
                                console.log(`There was an error adding user: ${member} for the role "${this.team?.name ?? "ukendt"}" and this was caused by: ${error}`)
                            }
                        });
                    }
                    // this.sendBotMessage(`Mentioned members, has been added.`);
                } else { // Invite required
                    if (message.mentions.members) {
                        message.mentions.members.forEach(async (member) => {
                            if (member.roles.cache.has(role.id)) {
                                return;
                            }
                            try {
                                let dmMessage = await member.send(`You have been invited to the team "${this.team?.name ?? "ukendt"}" by "${message.author.tag}" in the guild "${message.guild?.name}".\nReact below, to join the team!.`);
                                dmMessage.react("✅");
                                dmMessage.react("❌");

                                (new DBInvite(member.id, dmMessage.id, role?.id ?? "", message.guild?.id ?? "")).save();
                            } catch (error) {
                                console.log(`There was an error sending invite to user: ${member} for the role "${this.team?.name ?? "ukendt"}" and this was caused by: ${error}`)
                            }
                        });
                    }
                    // this.sendBotMessage(`Invites to team has been send to all mentioned users.`);
                }

                this.state = GuidedTeamCreationState.teamCreated;

                this.sendBotMessage("The team has been created!\nMore members can be added, by running the team-invite command.")

                setTimeout(() => {
                    botSystem.removeGuidedTeamCreation(this);
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