import { Message, MessageEmbed, Util } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import { DBGuild } from "../../data/Guild/DBGuild";
import { InviteType } from "../../data/Guild/InviteType";
import { TeamConfig as DBTeamConfig } from "../../data/Guild/TeamConfig";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import BotSystemEmbed from "../../data/Helper/BotSystemEmbed";
import Colors from "../../data/Helper/Colors";

require("dotenv").config();

export default class TeamConfig extends TeamCommand {
    constructor() {
        super(
            'team-config',
            'See available team configuration commands',
            true,
            false,
            0,
            '[command]',
            0,
            ["ADMINISTRATOR"],
            UserLevel.admin,
        );
    }

    async execute(message: Message, botSystem: BotSystem, args: any) {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            message.channel.send("You don't have permission to add new teams!");
            return;
        }

        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

        if (!botSystem.guild) {
            message.reply("Cannot execute the command here");
            return;
        }

        const botImage = message.client.user?.avatarURL() ?? "";

        const secondCommandWord = ASCIIFolder.foldReplacing(args?.shift()?.trim().toLowerCase() ?? "");
        switch (secondCommandWord) {
            case "roles":
                console.log("Roles reached!")
                writeRolesCreateTeamList(message, botSystem);
                break;
            case "add-role":
                message.mentions.roles.forEach(async (role) => {
                    try {
                        botSystem.guild?.teamConfig.addCreatorRole(role.id);
                    } catch (error) {
                        console.log(error)
                    }
                });

                await botSystem.guild?.save();

                message.reply("Roles added!");
                writeRolesCreateTeamList(message, botSystem);
                break;
            case "role-everyone":

                botSystem.guild.teamConfig.allowEveryone = !botSystem.guild.teamConfig.allowEveryone;

                await botSystem.guild?.save();

                if (botSystem.guild.teamConfig.allowEveryone) {
                    message.reply("Everyone can now create a team.");
                } else {
                    message.reply("Team creation has been restricted to the following roles:")
                    writeRolesCreateTeamList(message, botSystem);
                }
                break;
            case "rem-role":
                message.mentions.roles.forEach(async (role) => {
                    try {
                        botSystem.guild?.teamConfig.removeCreatorRole(role.id);
                    } catch (error) {
                        console.log(error)
                    }
                });

                await botSystem.guild?.save();

                message.reply("Roles removed!");
                writeRolesCreateTeamList(message, botSystem);
                break;
            case "invite":
                message.reply("Invite to join team is currently " + (botSystem.guild?.teamConfig.requireInvite ? "active" : "inactive"));
                break;
            case "set-invite":
                const setInviteBooleanText = (args?.shift()?.trim().toLowerCase() ?? "false");
                if (setInviteBooleanText === "true" || setInviteBooleanText === "yes" || setInviteBooleanText === "1") {
                    botSystem.guild.teamConfig.requireInvite = true;
                } else {
                    botSystem.guild.teamConfig.requireInvite = false;
                }
                await botSystem.guild.save();
                message.reply("Invite to join team is now " + (botSystem.guild?.teamConfig.requireInvite ? "active" : "inactive"));
                break;
            case "invite-by":
                const setInviteTypeText = ASCIIFolder.foldReplacing(args?.shift()?.trim().toLowerCase() ?? "");

                switch (setInviteTypeText) {
                    case "":
                        message.reply("Sending invites, are currently limited to " + botSystem.guild.teamConfig.teamInviteType.toString())
                        break;
                    case "admin":
                        botSystem.guild.teamConfig.teamInviteType = InviteType.admin;
                        message.reply("Sending invites, are now updated to be limited to " + InviteType[botSystem.guild.teamConfig.teamInviteType])
                        break;
                    case "leader":
                        botSystem.guild.teamConfig.teamInviteType = InviteType.leader
                        message.reply("Sending invites, are now updated to be limited to " + InviteType[botSystem.guild.teamConfig.teamInviteType])
                        break;
                    case "team":
                        botSystem.guild.teamConfig.teamInviteType = InviteType.team
                        message.reply("Sending invites, are now updated to be limited to " + InviteType[botSystem.guild.teamConfig.teamInviteType])
                        break;
                    default:
                        message.reply("I did not know the restriction type. Please use either admin, leader or team.")
                        break;
                }

                await botSystem.guild.save();
                break;
            case "defaults":
                let colorDisplay;
                colorDisplay = Colors.getColor(botSystem.guild.teamConfig.defaultColor);
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Default settings for new team roles", (
                        "**Hoist:** " + (botSystem.guild.teamConfig.defaultHoist ? "True" : "False") + "\n"
                        + "**Color:** " + colorDisplay + "\n"
                        + "**Mentionable:** " + (botSystem.guild.teamConfig.defaultMentionable ? "True" : "False")
                    ))]
                })
                break;
            case "default-hoist":
                botSystem.guild.teamConfig.defaultHoist = !botSystem.guild.teamConfig.defaultHoist;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Default setting of hoist on new team roles has been updated!", (
                        "Hoist is now set to " + (botSystem.guild.teamConfig.defaultHoist ? "True" : "False")
                    ))]
                })
                break;
            case "default-color":
                try {
                    botSystem.guild.teamConfig.defaultColor = Util.resolveColor(args?.shift()?.trim().toUpperCase() ?? "DEFAULT");
                    botSystem.guild.save();
                    message.reply({
                        embeds: [BotSystemEmbed.embedCreator("Default color for new team roles has been updated!", (
                            "The default color for new team roles is now set to " + Colors.getColor(botSystem.guild.teamConfig.defaultColor)
                        ), botSystem.guild.teamConfig.defaultColor)]
                    })
                } catch (error) {
                    message.reply({
                        embeds: [BotSystemEmbed.embedCreator("Error updating default team color", (
                            "The default color has not been updated, due to an error that occured - Maybe the color you tried to enter is not a valid color."
                        ))]
                    })
                }
                break;
            case "default-mentionable":
                botSystem.guild.teamConfig.defaultMentionable = !botSystem.guild.teamConfig.defaultMentionable;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Default setting of mentionable on new team roles has been updated!", (
                        "Mentionable is now set to " + (botSystem.guild.teamConfig.defaultMentionable ? "True" : "False")
                    ))]
                })
                break;
            case "channel-creation":
                let categoriesNamesOverviewText: string = "";
                botSystem.guild.teamConfig.defaultCategoryText.forEach(category => {
                    if (!message.guild) return;
                    const searchedCategory = DBGuild.getCategoryFromId(category, message.guild);
                    if (!searchedCategory) return;
                    categoriesNamesOverviewText += ", " + searchedCategory.name;
                });
                categoriesNamesOverviewText = categoriesNamesOverviewText.substring(2);
                categoriesNamesOverviewText = categoriesNamesOverviewText == "" ? "-" : categoriesNamesOverviewText;

                let categoriesNamesOverviewVoice: string = "";
                botSystem.guild.teamConfig.defaultCategoryVoice.forEach(category => {
                    if (!message.guild) return;
                    const searchedCategory = DBGuild.getCategoryFromId(category, message.guild);
                    if (!searchedCategory) return;
                    categoriesNamesOverviewVoice += ", " + searchedCategory.name;
                });
                categoriesNamesOverviewVoice = categoriesNamesOverviewVoice.substring(2);
                categoriesNamesOverviewVoice = categoriesNamesOverviewVoice == "" ? "-" : categoriesNamesOverviewVoice;

                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Settings for channel creation on team creation", (
                        "**Text channel:** " + (botSystem.guild.teamConfig.createTextOnTeamCreation ? "True" : "False") + "\n"
                        + "**Voice channel:** " + (botSystem.guild.teamConfig.createVoiceOnTeamCreation ? "True" : "False") + "\n"
                        + "**Text Category:** " + categoriesNamesOverviewText + "\n"
                        + "**Voice Category:** " + categoriesNamesOverviewVoice
                    ))]
                })
                break;
            case "channel-category-text":
                let categoriesText = [];
                for (let index = 0; index < args.length; index++) {
                    categoriesText.push(ASCIIFolder.foldReplacing(args[index].trim().toLowerCase() ?? ""));
                }

                botSystem.guild.teamConfig.defaultCategoryText = categoriesText;
                botSystem.guild.save();

                let categoriesNames = "";
                categoriesText.forEach(category => {
                    if (!message.guild) return;
                    categoriesNames += ", " + DBGuild.getCategoryFromId(category, message.guild)?.name;
                });
                categoriesNames = categoriesNames.substring(2);

                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Category for creation of **text** channesl in has been updated!", (
                        "Default category is now set to: " + (categoriesNames ?? "*Unknown*")
                    ))]
                })
                break;
            case "channel-category-voice":
                let categoriesVoice = [];
                for (let index = 0; index < args.length; index++) {
                    categoriesVoice.push(ASCIIFolder.foldReplacing(args[index].trim().toLowerCase() ?? ""));
                }

                botSystem.guild.teamConfig.defaultCategoryVoice = categoriesVoice;
                botSystem.guild.save();

                let categoriesNamesVoice = "";
                categoriesVoice.forEach(category => {
                    if (!message.guild) return;
                    categoriesNamesVoice += ", " + DBGuild.getCategoryFromId(category, message.guild)?.name;
                });
                categoriesNamesVoice = categoriesNamesVoice.substring(2);

                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Category for creation of **voice** channesl in has been updated!", (
                        "Default category is now set to: " + (categoriesNamesVoice ?? "*Unknown*")
                    ))]
                })
                break;
            case "toggle-text-channel":
                botSystem.guild.teamConfig.createTextOnTeamCreation = !botSystem.guild.teamConfig.createTextOnTeamCreation;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Text channel creation for team on team creation has been updated!", (
                        "Text channel creation is now set to " + (botSystem.guild.teamConfig.createTextOnTeamCreation ? "True" : "False")
                    ))]
                })
                break;
            case "toggle-voice-channel":
                botSystem.guild.teamConfig.createVoiceOnTeamCreation = !botSystem.guild.teamConfig.createVoiceOnTeamCreation;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator("Voice channel creation for team on team creation has been updated!", (
                        "Voice channel creation is now set to " + (botSystem.guild.teamConfig.createVoiceOnTeamCreation ? "True" : "False")
                    ))]
                })
                break;
            default:
                const DBTeamConfigCommandEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Command list:')
                    .setDescription(
                        `
                            **Roles:**
                            - roles - See list of roles, that can create teams 
                            - role-everyone - Toggle if everyone should be able to create a team 
                            - add-role [role] - Add role, that can create team 
                            - rem-role [role] - Remove role, that can create team 

                            **Invite:**
                            - invite - Check if invite is currently required before a member is added to a team
                            - set-invite [true/false] - Set if a member can only be added through an invite
                            - invite-by [admin/leader/team] - Set, who can add new members to a team

                            **Default role:**
                            - defaults - See the default settings for a team role
                            - default-hoist - Set if the team role should be displayed seperatly in the users list
                            - default-color - Set the default color of the role for a team
                            - default-mentionable - Set if the team role should be mentionable

                            **Channel creation:**
                            - channel-creation - See current setup for creation of channel on team creation
                            - channel-category-text - Set category (id) where new text channels will be created in
                            - channel-category-voice - Set category (id) where new voice channels will be created in
                            - toggle-text-channel - Toggle creation of text channel on team creation
                            - toggle-voice-channel - Toggle creation of voice channel on team creation
                        `
                    )
                    .setFooter({ text: 'Grouper', iconURL: botImage });
                message.reply("Currently, there are the following")
                message.channel.send({ embeds: [DBTeamConfigCommandEmbed] });
                return;
        }
    }
};

function writeRolesCreateTeamList(message: Message, botSystem: BotSystem) {
    const botImage = message.client.user?.avatarURL() ?? "";
    const teamRoles = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Roles, that can create teams:')
        .setDescription(botSystem.guild?.teamConfig.allowEveryone ? "***Everyone***" : (botSystem.guild?.teamConfig.creatorRole ?? []).map(role => DBTeamConfig.getRoleName(role, message)).join('\n'))
        .setFooter({ text: 'Grouper', iconURL: botImage });
    message.channel.send({ embeds: [teamRoles] });
}