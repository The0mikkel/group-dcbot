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
    static async create(botSystem: BotSystem, message: Message, groupName: string): Promise<DBGroup | TeamCreationErrors> {
        try {
            if (!message.guild) {
                if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
                return TeamCreationErrors.generalError;
            }

            let roleLookup = message.guild.roles.cache.find(role => role.name === groupName);
            if (roleLookup) {
                if (botSystem.env == envType.dev) console.log("Role name already exists - Stopping team creation")
                return TeamCreationErrors.alreadyExist;
            }

            if (groupName.length > 100) {
                return TeamCreationErrors.nameLength;
            }

            if ((message.guild?.roles.cache.size ?? 0) >= 250) {
                return TeamCreationErrors.max;
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
            await dbGroup.save();

            let teamCreation = await Team.channelCreationHandler(botSystem, message, dbGroup);
            if (teamCreation != false) {
                return teamCreation;
            }

            return dbGroup;
        } catch (error) {
            console.log("Team creation error: " + error)
            return TeamCreationErrors.generalError;
        }
    }

    private static async channelCreationHandler(botSystem: BotSystem, message: Message, dbGroup: DBGroup): Promise<false | TeamCreationErrors> {
        if (botSystem.guild?.teamConfig.createTextOnTeamCreation) {
            const textChannel = await Team.channelCreation(botSystem, message, dbGroup, ChannelTypes.GUILD_TEXT);
            if (!(textChannel instanceof GuildChannel)) return textChannel;
            dbGroup.textChannel = textChannel.id ?? undefined;
        }
        if (botSystem.guild?.teamConfig.createVoiceOnTeamCreation) {
            const voiceChannel = await Team.channelCreation(botSystem, message, dbGroup, ChannelTypes.GUILD_VOICE);
            if (!(voiceChannel instanceof GuildChannel)) return voiceChannel;
            dbGroup.voiceChannel = voiceChannel.id ?? undefined;
        }
        await dbGroup.save();
        return false;
    }

    private static async channelCreation(botSystem: BotSystem, message: Message, dbGroup: DBGroup, channelType: ChannelTypes.GUILD_TEXT | ChannelTypes.GUILD_VOICE): Promise<TextChannel | VoiceChannel | TeamCreationErrors> {
        try {
            if (!message.guild) {
                return TeamCreationErrors.generalError;
            }

            // Channel creation
            let channel: void | TextChannel | VoiceChannel;
            try {
                channel = await message.guild.channels.create(dbGroup.name, { type: channelType, reason: 'Team text channel created for team ' + dbGroup.name }).catch(console.error);
            } catch (error) {
                return TeamCreationErrors.channelCreationFailure;
            }
            if (!channel || !(message.channel instanceof GuildChannel)) {
                return TeamCreationErrors.channelCreationFailure;
            }

            // Parent / category
            let cateogies: string[] | undefined;

            if (channelType == ChannelTypes.GUILD_TEXT) {
                cateogies = botSystem.guild?.teamConfig.defaultCategoryText;
            } else {
                cateogies = botSystem.guild?.teamConfig.defaultCategoryVoice;
            }
            if (cateogies) {
                if (cateogies.length == 0) return channel;
                for (let index = 0; index < cateogies.length; index++) {
                    let category = DBGuild.getCategoryFromId(cateogies[index], message.guild);
                    if (!(category instanceof CategoryChannel)) {
                        continue;
                    }

                    if (category.children.size >= 50) {
                        continue;
                    }

                    await channel.setParent(category.id);
                    break;
                }
            }

            // Permissions
            const everyoneRole = message.guild.roles.everyone;
            let newPermissions: OverwriteData[] = [
                { id: everyoneRole.id, deny: ['VIEW_CHANNEL', 'CONNECT'] }
            ];
            botSystem.guild?.adminRoles.forEach(role => {
                newPermissions.push({ id: role, allow: ['VIEW_CHANNEL', 'CONNECT'] })
            });
            botSystem.guild?.teamAdminRoles.forEach(role => {
                newPermissions.push({ id: role, allow: ['VIEW_CHANNEL', 'CONNECT'] })
            });
            newPermissions.push({ id: dbGroup.id, allow: ['VIEW_CHANNEL', 'CONNECT'] })

            try {
                await channel.permissionOverwrites.set(newPermissions);
            } catch (error) {
                console.log(`There was an error updating base channel permissions for channel "${dbGroup.name}" and this was caused by: ${error}`);
                return TeamCreationErrors.channelCreationFailure;
            }

            return channel;
        } catch (error) {
            console.log("Channel creation error: " + error)
            return TeamCreationErrors.generalError;
        }
    }

    static async invite(botSystem: BotSystem, dbGroup: DBGroup, user: GuildMember, message: Message): Promise<boolean | TeamInviteErrors> {
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
            `You have been invited to the team "${dbGroup.name}" by "${message.author.tag}" in the guild "${message.guild?.name}".\nThe invite is valid for 24 hour(s)!`
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

        const collector = inviteMessage.createMessageComponentCollector({ time: 86400000 });
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

    static async delete(botSystem: BotSystem, message: Message, dbGroup: DBGroup): Promise<true | TeamDeleteErrors> {
        try {
            if (!message.guild || !dbGroup.id) {
                if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
                return TeamDeleteErrors.generalError;
            }

            let textChannel = message.guild.channels.cache.find(channel => channel.id == dbGroup.textChannel);
            let voiceChannel = message.guild.channels.cache.find(channel => channel.id == dbGroup.voiceChannel);

            console.log("text", dbGroup.textChannel, textChannel, "voice", dbGroup.voiceChannel, voiceChannel);

            if (textChannel) {
                try {
                    await textChannel.delete("Team deleted").catch(error => console.log(error));
                } catch (error) { console.log(error) }
            }
            if (voiceChannel) {
                try {
                    await voiceChannel.delete("Team deleted").catch(error => console.log(error));
                } catch (error) { console.log(error) }
            }

            let role = await message.guild.roles.fetch(dbGroup.id);
            if (role) {
                try {
                    await role.delete("Team deleted").catch(error => console.log(error));
                } catch (error) { console.log(error) }
            }

            dbGroup.delete();

            return true;
        } catch (error) {
            console.log(error);
            return TeamDeleteErrors.generalError;
        }

    }
}

export enum TeamCreationErrors {
    generalError,
    roleCreationFailure,
    channelCreationFailure,
    nameLength,
    alreadyExist,
    max
}

export enum TeamInviteErrors {
    generalError
}

export enum TeamDeleteErrors {
    generalError
}