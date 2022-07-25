import { CategoryChannel, GuildChannel, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed, OverwriteData, Role, TextChannel, User, VoiceChannel } from "discord.js";
import { ChannelTypes } from "discord.js/typings/enums";
import BotSystem from "../BotSystem";
import { envType } from "../envType";
import { DBGuild } from "../Guild/DBGuild";
import ASCIIFolder from "../Helper/ascii-folder";
import { DBGroup } from "./DBGroup";

export default class Team {

    /**
     * Creates a team with the specified name
     * 
     * @param botSystem 
     * @param message 
     * @param groupName Name of the new group - Will be validated to ensure it is unique but not sanitized
     * @returns 
     */
    static async createTeam(botSystem: BotSystem, message: Message, groupName: string): Promise<DBGroup | TeamCreationErrors> {

        let roleLookup = message.guild?.roles.cache.find(role => role.name === groupName);
        if (roleLookup) {
            if (botSystem.env == envType.dev) console.log("Role name already exists - Stopping team creation")
            return TeamCreationErrors.alreadyExist;
        }

        if (groupName.length > 100) {
            return TeamCreationErrors.nameLength;
        }

        let role = await message.guild?.roles.create({
            name: groupName,
            color: botSystem.guild?.teamConfig.defaultColor ?? "DEFAULT",
            mentionable: botSystem.guild?.teamConfig.defaultMentionable ?? false,
            hoist: botSystem.guild?.teamConfig.defaultHoist ?? false,
            reason: 'Group was created by grouper, as per request by ' + message.author.tag,
        })

        if (role == undefined) {
            if (botSystem.env == envType.dev) console.log("Role not created or something else happened - Role not defined - Stopping team creation")
            return TeamCreationErrors.roleCreationFailure;
        }

        if (botSystem.guild === undefined) {
            if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
            return TeamCreationErrors.generalError;
        }

        let dbGroup: DBGroup;
        dbGroup = new DBGroup(role.id, botSystem.guild.id, ASCIIFolder.foldReplacing(role.name), message.author.id, message.author.id, Date.now());
        Team.channelCreationHandler(botSystem, message, dbGroup);
        await dbGroup.save();

        return dbGroup;
    }

    private static async channelCreationHandler(botSystem: BotSystem, message: Message, dbGroup: DBGroup): Promise<void> {
        if (botSystem.guild?.teamConfig.createTextOnTeamCreation) {
            Team.channelCreation(botSystem, message, dbGroup, ChannelTypes.GUILD_TEXT);
        }
        if (botSystem.guild?.teamConfig.createVoiceOnTeamCreation) {
            Team.channelCreation(botSystem, message, dbGroup, ChannelTypes.GUILD_VOICE);
        }
    }

    private static async channelCreation(botSystem: BotSystem, message: Message, dbGroup: DBGroup, channelType: ChannelTypes.GUILD_TEXT | ChannelTypes.GUILD_VOICE): Promise<void> {
        if (!message.guild) {
            return;

        }
        let channel: void | TextChannel | VoiceChannel;
        channel = await message.guild.channels.create(dbGroup.name, { type: channelType, reason: 'Team text channel created for team ' + dbGroup.name }).catch(console.error);
        if (!channel) {
            return;
        }
        if (!(message.channel instanceof GuildChannel)) {
            return;
        }
        try {
            channel.setParent(botSystem.guild?.teamConfig.defaultCategory ?? "");
        } catch (error) {
            console.log(`There was an error creating channel "${dbGroup.name}" and this was caused by: ${error}`);
            return;
        }

        const everyoneRole = message.guild.roles.everyone;

        let newPermissions: OverwriteData[] = [
            { type: 'role', id: everyoneRole.id, deny: ['VIEW_CHANNEL', 'CONNECT'] }
        ];
        botSystem.guild?.adminRoles.forEach(role => {
            newPermissions.push({ type: 'role', id: role, allow: ['VIEW_CHANNEL', 'CONNECT'] })
        });
        botSystem.guild?.teamAdminRoles.forEach(role => {
            newPermissions.push({ type: 'role', id: role, allow: ['VIEW_CHANNEL', 'CONNECT'] })
        });
        newPermissions.push({ type: 'role', id: dbGroup.id, allow: ['VIEW_CHANNEL', 'CONNECT'] })

        try {
            await channel.permissionOverwrites.set(newPermissions, "Updated permissions to default team channel permissions");
        } catch (error) {
            console.log(`There was an error updating base channel permissions for channel "${dbGroup.name}" and this was caused by: ${error}`);
            return;
        }
    }

    static async sendInvite(botSystem: BotSystem, dbGroup: DBGroup, user: GuildMember, message: Message): Promise<boolean | TeamInviteErrors> {
        if (botSystem.guild === undefined) {
            return TeamInviteErrors.generalError;
        }

        if (!botSystem.guild.teamConfig.requireInvite) { // Invite not required
            try {
                user.roles.add(dbGroup.id);
            } catch (error) {
                console.log(`There was an error adding user: ${user} for the role "${dbGroup.name}" and this was caused by: ${error}`)
            }
        } else { // Invite required
            try {
                Team.sendUserInvite(botSystem, dbGroup, user, message);
            } catch (error) {
                console.log(`There was an error sending invite to user: ${user} for the role "${dbGroup.name}" and this was caused by: ${error}`)
            }
        }

        await dbGroup.save();

        return true;
    }

    private static async sendUserInvite(botSystem: BotSystem, dbGroup: DBGroup, user: GuildMember, message: Message): Promise<void> {
        let confirmEmbed = Team.createSimpleEmbed(
            "You have been invited!",
            `You have been invited to the team "${dbGroup.name}" by "${message.author.tag}" in the guild "${message.guild?.name}".\nThe invite is valid for 1 hour!`
        )
        const buttons = new MessageActionRow();

        let actions = ["✅ Accept", "❌ Decline"];
        for (let index = 0; index < actions.length; index++) {
            try {
                const buttonType = actions[index] == actions[0] ? 'SUCCESS' : 'DANGER';
                buttons.addComponents(
                    new MessageButton()
                        .setCustomId(`confirm-team-invite;${actions[index]}`)
                        .setLabel(actions[index])
                        .setStyle(buttonType),
                );
            } catch (error) {
                console.error(error);
            }
        }
        const inviteMessage = await user.send({ embeds: [confirmEmbed], components: [buttons] });

        const collector = inviteMessage.createMessageComponentCollector({ time: 3600000 });
        collector.on('collect', async i => {
            if (!i.customId) {
                return;
            }

            if (i.customId.startsWith("confirm-team-invite;")) {
                const action = i.customId.split(";")[1] ?? "";
                if (action == actions[0]) {
                    // Check team still exist
                    let role = message.guild?.roles.cache.get(dbGroup.id);
                    if (!role) {
                        try {
                            i.update({ embeds: [Team.createSimpleEmbed("An error occured!", `The team is no longer available in the guild "${message.guild?.name}"`)], components: [] });
                        } catch (error) {
                            console.log(error)
                        }
                        return;
                    }

                    // Add role to user
                    try {
                        await user.roles.add(dbGroup.id);
                        i.update({ embeds: [Team.createSimpleEmbed("Invite accepted!", `You have been added to the team "${role.name}" in the guild "${message.guild?.name}"`)], components: [] });
                    } catch (error) {
                        console.log(error)
                    }
                } else {
                    i.update({ embeds: [Team.createSimpleEmbed("Invite declined!", `You declined the invite to the team to the team ${dbGroup.name} in the guild "${message.guild?.name}"`)], components: [] });
                }
            }
        });
        collector.on('end', () => BotSystem.autoDeleteMessageByUser(inviteMessage, 0));
    }

    private static createSimpleEmbed(title: string, text: string): MessageEmbed {
        return new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text)
    }
}

export enum TeamCreationErrors {
    generalError,
    roleCreationFailure,
    nameLength,
    alreadyExist
}

export enum TeamInviteErrors {
    generalError
}