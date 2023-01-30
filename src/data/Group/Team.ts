import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CategoryChannel, ChannelType, ChatInputCommandInteraction, EmbedBuilder, GuildChannel, GuildMember, Message, OverwriteData, Role, TextChannel, ThreadChannel, User, VoiceChannel } from "discord.js";
import BotSystem from "../BotSystem";
import { envType } from "../envType";
import { DBGuild } from "../Guild/DBGuild";
import ASCIIFolder from "../Helper/ascii-folder";
import { DBGroup } from "./DBGroup";
import { DBTeamInvite } from "./DBTeamInvite";

export default class Team {

    /**
     * Creates a team with the specified name
     * 
     * @param botSystem 
     * @param message 
     * @param groupName Name of the new group - Will be validated to ensure it is unique but not sanitized
     * @param teamLeader The team leader of the team - If not specified, the message author will be used
     * @returns 
     */
    static async create(botSystem: BotSystem, interaction: ChatInputCommandInteraction, groupName: string, teamLeader: string = ""): Promise<DBGroup | TeamCreationErrors> {
        try {
            if (!interaction.guild) {
                if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
                return TeamCreationErrors.generalError;
            }

            let roleLookup = interaction.guild.roles.cache.find(role => role.name === groupName);
            if (roleLookup) {
                if (botSystem.env == envType.dev) console.log("Role name already exists - Stopping team creation")
                return TeamCreationErrors.alreadyExist;
            }

            if (groupName.length > 100) {
                return TeamCreationErrors.nameLength;
            }

            if ((interaction.guild?.roles.cache.size ?? 0) >= 250) {
                return TeamCreationErrors.max;
            }

            let role = await interaction.guild?.roles.create({
                name: groupName,
                color: botSystem.guild?.teamConfig.defaultColor ?? "Default",
                mentionable: botSystem.guild?.teamConfig.defaultMentionable ?? false,
                hoist: botSystem.guild?.teamConfig.defaultHoist ?? false,
                reason: 'Group was created by grouper, as per request by ' + interaction.user.tag,
            })

            if (role == undefined) {
                if (botSystem.env == envType.dev) console.log("Role not created or something else happened - Role not defined - Stopping team creation")
                return TeamCreationErrors.roleCreationFailure;
            }

            if (botSystem.guild === undefined) {
                if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
                return TeamCreationErrors.generalError;
            }

            if (teamLeader == "" || teamLeader == undefined || teamLeader == null) {
                teamLeader = interaction.user.id;
            }

            let dbGroup: DBGroup;
            dbGroup = new DBGroup(role.id, botSystem.guild.id, ASCIIFolder.foldReplacing(role.name), interaction.user.id, teamLeader, Date.now());
            await dbGroup.save();

            let teamCreation = await Team.channelCreationHandler(botSystem, interaction, dbGroup);
            if (teamCreation != false) {
                return teamCreation;
            }

            return dbGroup;
        } catch (error) {
            console.error("Team creation error: " + error)
            return TeamCreationErrors.generalError;
        }
    }

    private static async channelCreationHandler(botSystem: BotSystem, interaction: ChatInputCommandInteraction, dbGroup: DBGroup): Promise<false | TeamCreationErrors> {
        if (botSystem.guild?.teamConfig.createTextOnTeamCreation) {
            const textChannel = await Team.channelCreation(botSystem, interaction, dbGroup, ChannelType.GuildText);
            if (!(textChannel instanceof GuildChannel)) return textChannel;
            dbGroup.textChannel = textChannel.id ?? undefined;
        }
        if (botSystem.guild?.teamConfig.createVoiceOnTeamCreation) {
            const voiceChannel = await Team.channelCreation(botSystem, interaction, dbGroup, ChannelType.GuildVoice);
            if (!(voiceChannel instanceof GuildChannel)) return voiceChannel;
            dbGroup.voiceChannel = voiceChannel.id ?? undefined;
        }
        await dbGroup.save();
        return false;
    }

    private static async channelCreation(botSystem: BotSystem, interaction: ChatInputCommandInteraction, dbGroup: DBGroup, channelType: ChannelType.GuildText | ChannelType.GuildVoice): Promise<TextChannel | VoiceChannel | TeamCreationErrors> {
        try {
            if (!interaction.guild) {
                return TeamCreationErrors.generalError;
            }

            // Channel creation
            let channel: void | TextChannel | VoiceChannel;
            try {
                channel = await interaction.guild.channels.create({
                    name: dbGroup.name,
                    type: channelType, reason: 'Team text channel created for team ' + dbGroup.name
                }).catch(console.error);
            } catch (error) {
                if (botSystem.env == envType.dev) console.log("Error creating channel - ", error);
                return TeamCreationErrors.channelCreationFailure;
            }
            if (!channel || (!(interaction.channel instanceof GuildChannel) && !(interaction.channel instanceof ThreadChannel))) {
                if (botSystem.env == envType.dev) console.log("Channel type not correct for creation of channels");
                return TeamCreationErrors.channelCreationFailure;
            }

            // Parent / category
            let cateogies: string[] | undefined;

            if (channelType == ChannelType.GuildText) {
                cateogies = botSystem.guild?.teamConfig.defaultCategoryText;
            } else {
                cateogies = botSystem.guild?.teamConfig.defaultCategoryVoice;
            }
            if (cateogies) {
                if (cateogies.length != 0) {
                    for (let index = 0; index < cateogies.length; index++) {
                        let category = DBGuild.getCategoryFromId(cateogies[index], interaction.guild);
                        if (!(category instanceof CategoryChannel)) {
                            continue;
                        }

                        if (category.children.cache.size >= 50) {
                            continue;
                        }

                        await channel.setParent(category.id);
                        break;
                    }
                }
            }

            // Permissions
            const everyoneRole = interaction.guild.roles.everyone;
            let newPermissions: OverwriteData[] = [
                { id: everyoneRole.id, deny: ['ViewChannel', 'Connect'] }
            ];
            botSystem.guild?.adminRoles.forEach(role => {
                newPermissions.push({ id: role, allow: ['ViewChannel', 'Connect'] })
            });
            botSystem.guild?.teamAdminRoles.forEach(role => {
                newPermissions.push({ id: role, allow: ['ViewChannel', 'Connect'] })
            });
            newPermissions.push({ id: dbGroup.id, allow: ['ViewChannel', 'Connect'] })

            try {
                await channel.permissionOverwrites.set(newPermissions);
            } catch (error) {
                console.error(`There was an error updating base channel permissions for channel "${dbGroup.name}" and this was caused by: ${error}`);
                return TeamCreationErrors.channelCreationFailure;
            }

            return channel;
        } catch (error) {
            console.error("Channel creation error: " + error)
            return TeamCreationErrors.generalError;
        }
    }

    static async invite(botSystem: BotSystem, dbGroup: DBGroup, user: GuildMember, interaction: ChatInputCommandInteraction): Promise<boolean | TeamInviteErrors> {
        if (botSystem.guild === undefined) {
            return TeamInviteErrors.generalError;
        }

        if (!botSystem.guild.teamConfig.requireInvite) { // Invite not required
            try {
                user.roles.add(dbGroup.id);
            } catch (error) {
                console.error(`There was an error adding user: ${user} for the role "${dbGroup.name}" and this was caused by: ${error}`)
            }
        } else { // Invite required
            try {
                Team.sendUserInvite(botSystem, dbGroup, user, interaction);
            } catch (error) {
                console.error(`There was an error sending invite to user: ${user} for the role "${dbGroup.name}" and this was caused by: ${error}`)
            }
        }

        await dbGroup.save();

        return true;
    }

    private static async sendUserInvite(botSystem: BotSystem, dbGroup: DBGroup, user: GuildMember, interaction: ChatInputCommandInteraction): Promise<void> {
        const inviteTime = 24;

        let confirmEmbed = Team.createSimpleEmbed(
            botSystem.translator.translateUppercase("you have been invited"),
            `${botSystem.translator.translateUppercase("you have been invited to the team :team: by :team leader: in the guild :guild:", [dbGroup.name, interaction.user.tag, interaction.guild?.name])}.\n${botSystem.translator.translateUppercase("the invite is valid for :hours: hour(s)", [inviteTime])}!`
        )
        const buttons = new ActionRowBuilder<ButtonBuilder>();

        let invite = new DBTeamInvite(
            user.id,
            dbGroup.id,
            interaction.guild?.id ?? "",
            inviteTime,
            new Date(),
            (await interaction.user.fetch()).id
        );
        await invite.save();

        let actions = ["✅ " + botSystem.translator.translateUppercase("accept"), "❌ " + botSystem.translator.translateUppercase("decline")];
        for (let index = 0; index < actions.length; index++) {
            try {
                const buttonType = actions[index] == actions[0] ? ButtonStyle.Success : ButtonStyle.Danger;
                buttons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm-team-invite;${index};${invite._id}`)
                        .setLabel(actions[index])
                        .setStyle(buttonType),
                );
            } catch (error) {
                console.error(error);
            }
        }
        let inviteMessage: void | Message<boolean>
        try {
            inviteMessage = await user.send({ embeds: [confirmEmbed], components: [buttons] }).catch(error => {
                console.error(error);
            });
        } catch (error) {
            console.error(error);
            return;
        }

        if (!inviteMessage) {
            return;
        }

        const collector = inviteMessage.createMessageComponentCollector({ time: inviteTime * 60 * 60 * 1000 });
        collector.on('end', () => { if (inviteMessage) BotSystem.autoDeleteMessageByUser(inviteMessage, 0); });
    }

    private static createSimpleEmbed(title: string, text: string): EmbedBuilder {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text)
    }

    static async delete(botSystem: BotSystem, interaction: ChatInputCommandInteraction, dbGroup: DBGroup): Promise<true | TeamDeleteErrors> {
        try {
            if (!interaction.guild || !dbGroup.id) {
                if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
                return TeamDeleteErrors.generalError;
            }

            let textChannel = interaction.guild.channels.cache.find(channel => channel.id == dbGroup.textChannel);
            let voiceChannel = interaction.guild.channels.cache.find(channel => channel.id == dbGroup.voiceChannel);

            if (textChannel) {
                try {
                    await textChannel.delete("Team deleted").catch(error => console.error(error));
                } catch (error) { console.error(error) }
            }
            if (voiceChannel) {
                try {
                    await voiceChannel.delete("Team deleted").catch(error => console.error(error));
                } catch (error) { console.error(error) }
            }

            let role = await interaction.guild.roles.fetch(dbGroup.id);
            if (role) {
                try {
                    await role.delete("Team deleted").catch(error => console.error(error));
                } catch (error) { console.error(error) }
            }

            dbGroup.delete();

            return true;
        } catch (error) {
            console.error(error);
            return TeamDeleteErrors.generalError;
        }

    }

    static async checkIfAllowedToCreate(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<true | TeamCreationErrors> {
        let translator = botSystem.translator;

        if (!interaction.guild) {
            if (botSystem.env == envType.dev) console.log("No guild provided - Stopping team creation")
            return TeamCreationErrors.generalError;
        }

        if (!interaction.member) {
            if (botSystem.env == envType.dev) console.log("No member provided - Stopping team creation")
            return TeamCreationErrors.generalError;
        }


        let hasRole = false;
        let roles = botSystem.guild?.teamConfig.creatorRole ?? [];

        for (let index = 0; index < roles.length; index++) {
            if (await BotSystem.checkUserHasRole(interaction, interaction.user, roles[index])) {
                hasRole = true;
                break;
            }
        }

        if (botSystem.guild?.teamConfig.allowEveryone) {
            hasRole = true;
        }

        if (
            !interaction.member
            || (
                !BotSystem.checkIfAdministrator(interaction, interaction.user)
                && !hasRole
            )
        ) {
            return TeamCreationErrors.permission;
        }

        return true;
    }
}

export enum TeamCreationErrors {
    generalError = "generalError",
    roleCreationFailure = "roleCreationFailure",
    channelCreationFailure = "channelCreationFailure",
    nameLength = "nameLength",
    alreadyExist = "alreadyExist",
    max = "max",
    permission = "permission"
}

export enum TeamInviteErrors {
    generalError = "generalError",
}

export enum TeamDeleteErrors {
    generalError = "generalError",
}