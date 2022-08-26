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

require(`dotenv`).config();

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
            [],
            UserLevel.admin,
        );
    }

    async execute(message: Message, botSystem: BotSystem, args: any) {
        const translator = botSystem.translator;

        if (
            !message.member
        ) {
            message.channel.send(translator.translateUppercase(`you don't have permission to add new teams`));
            return;
        }

        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

        if (!botSystem.guild) {
            message.reply(translator.translateUppercase(`cannot execute the command here`));
            return;
        }

        const botImage = message.client.user?.avatarURL() ?? ``;

        // TODO: Make switch use translation for key words for allow for full language change
        const secondCommandWord = ASCIIFolder.foldReplacing(args?.shift()?.trim().toLowerCase() ?? ``);
        switch (secondCommandWord) {
            case `roles`:
                writeRolesCreateTeamList(message, botSystem);
                break;
            case `add-role`:
                message.mentions.roles.forEach(async (role) => {
                    try {
                        botSystem.guild?.teamConfig.addCreatorRole(role.id);
                    } catch (error) {
                        console.log(error)
                    }
                });

                await botSystem.guild?.save();

                message.reply(translator.translateUppercase(`roles added`));
                writeRolesCreateTeamList(message, botSystem);
                break;
            case `role-everyone`:

                botSystem.guild.teamConfig.allowEveryone = !botSystem.guild.teamConfig.allowEveryone;

                await botSystem.guild?.save();

                if (botSystem.guild.teamConfig.allowEveryone) {
                    message.reply(translator.translateUppercase(`everyone can now create a team`));
                } else {
                    message.reply(translator.translateUppercase(`Team creation has been restricted to the following roles`))
                    writeRolesCreateTeamList(message, botSystem);
                }
                break;
            case `rem-role`:
                message.mentions.roles.forEach(async (role) => {
                    try {
                        botSystem.guild?.teamConfig.removeCreatorRole(role.id);
                    } catch (error) {
                        console.log(error)
                    }
                });

                await botSystem.guild?.save();

                message.reply(translator.translateUppercase(`roles removed`));
                writeRolesCreateTeamList(message, botSystem);
                break;
            case `invite`:
                message.reply(translator.translateUppercase(`invite to join team is currently :boolean:`, [(botSystem.guild?.teamConfig.requireInvite ? `active` : `inactive`)]));
                break;
            case `set-invite`:
                const setInviteBooleanText = (args?.shift()?.trim().toLowerCase() ?? `false`);
                if (setInviteBooleanText === `true` || setInviteBooleanText === `yes` || setInviteBooleanText === `1`) {
                    botSystem.guild.teamConfig.requireInvite = true;
                } else {
                    botSystem.guild.teamConfig.requireInvite = false;
                }
                await botSystem.guild.save();
                message.reply(translator.translateUppercase(`invite to join team is now :boolean:`, [translator.translate((botSystem.guild?.teamConfig.requireInvite ? `active` : `inactive`))]));
                break;
            case `invite-by`:
                const setInviteTypeText = ASCIIFolder.foldReplacing(args?.shift()?.trim().toLowerCase() ?? ``);

                switch (setInviteTypeText) {
                    case ``:
                        message.reply(translator.translateUppercase(`sending invites, are currently limited to :role:`, [translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())]))
                        break;
                    case `admin`:
                        botSystem.guild.teamConfig.teamInviteType = InviteType.admin;
                        message.reply(translator.translateUppercase(`sending invites, are now limited to :role:`, [translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())]))
                        break;
                    case `leader`:
                        botSystem.guild.teamConfig.teamInviteType = InviteType.leader
                        message.reply(translator.translateUppercase(`sending invites, are now limited to :role:`, [translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())]))
                        break;
                    case `team`:
                        botSystem.guild.teamConfig.teamInviteType = InviteType.team
                        message.reply(translator.translateUppercase(`sending invites, are now limited to :role:`, [translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())]))
                        break;
                    default:
                        message.reply(`${translator.translateUppercase(`i did not know the restriction type`)}. ${translator.translateUppercase(`please use either admin, leader or team`)}.`)
                        break;
                }

                await botSystem.guild.save();
                break;
            case `defaults`:
                let colorDisplay;
                colorDisplay = Colors.getColor(botSystem.guild.teamConfig.defaultColor);
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`default settings for new team roles`), (
                        `**${translator.translateUppercase("Hoist")}:** ${translator.translateUppercase((botSystem.guild.teamConfig.defaultHoist ? `True` : `False`))}\n`
                        + `**${translator.translateUppercase("Color")}:** ` + colorDisplay + `\n`
                        + `**${translator.translateUppercase("Mentionable")}:** ${translator.translateUppercase((botSystem.guild.teamConfig.defaultMentionable ? `True` : `False`))}`
                    ))]
                })
                break;
            case `default-hoist`:
                botSystem.guild.teamConfig.defaultHoist = !botSystem.guild.teamConfig.defaultHoist;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase("default setting of hoist on new team roles has been updated"), (
                        `${translator.translateUppercase("Hoist is now set to")} ` + translator.translate(botSystem.guild.teamConfig.defaultHoist ? `True` : `False`)
                    ))]
                })
                break;
            case `default-color`:
                try {
                    botSystem.guild.teamConfig.defaultColor = Util.resolveColor(args?.shift()?.trim().toUpperCase() ?? `DEFAULT`);
                    botSystem.guild.save();
                    message.reply({
                        embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`default color for new team roles has been updated`), (
                            translator.translateUppercase("the default color for new team roles is now set to :color:", [Colors.getColor(botSystem.guild.teamConfig.defaultColor)])
                        ), botSystem.guild.teamConfig.defaultColor)]
                    })
                } catch (error) {
                    message.reply({
                        embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`error updating default team color`), (
                            translator.translateUppercase("default color error update failed")
                        ))]
                    })
                }
                break;
            case `default-mentionable`:
                botSystem.guild.teamConfig.defaultMentionable = !botSystem.guild.teamConfig.defaultMentionable;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase("default setting of mentionable on new team roles has been updated"), (
                        `${translator.translateUppercase("mentionable is now set to")} ${translator.translateUppercase((botSystem.guild.teamConfig.defaultMentionable ? `True` : `False`))} `
                    ))]
                })
                break;
            case `channel-creation`:
                let categoriesNamesOverviewText: string = ``;
                botSystem.guild.teamConfig.defaultCategoryText.forEach(category => {
                    if (!message.guild) return;
                    const searchedCategory = DBGuild.getCategoryFromId(category, message.guild);
                    if (!searchedCategory) return;
                    categoriesNamesOverviewText += `, ` + searchedCategory.name;
                });
                categoriesNamesOverviewText = categoriesNamesOverviewText.substring(2);
                categoriesNamesOverviewText = categoriesNamesOverviewText == `` ? `-` : categoriesNamesOverviewText;

                let categoriesNamesOverviewVoice: string = ``;
                botSystem.guild.teamConfig.defaultCategoryVoice.forEach(category => {
                    if (!message.guild) return;
                    const searchedCategory = DBGuild.getCategoryFromId(category, message.guild);
                    if (!searchedCategory) return;
                    categoriesNamesOverviewVoice += `, ` + searchedCategory.name;
                });
                categoriesNamesOverviewVoice = categoriesNamesOverviewVoice.substring(2);
                categoriesNamesOverviewVoice = categoriesNamesOverviewVoice == `` ? `-` : categoriesNamesOverviewVoice;

                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`settings for channel creation on team creation`), (
                        `**${translator.translateUppercase("text channel")}:** ` + translator.translateUppercase(botSystem.guild.teamConfig.createTextOnTeamCreation ? `True` : `False`) + `\n`
                        + `**${translator.translateUppercase("voice channel")}:** ` + translator.translateUppercase(botSystem.guild.teamConfig.createVoiceOnTeamCreation ? `True` : `False`) + `\n`
                        + `**${translator.translateUppercase("text category")}:** ` + categoriesNamesOverviewText + `\n`
                        + `**${translator.translateUppercase("voice category")}:** ` + categoriesNamesOverviewVoice
                    ))]
                })
                break;
            case `channel-category-text`:
                let categoriesText = [];
                for (let index = 0; index < args.length; index++) {
                    categoriesText.push(ASCIIFolder.foldReplacing(args[index].trim().toLowerCase() ?? ``));
                }

                botSystem.guild.teamConfig.defaultCategoryText = categoriesText;
                botSystem.guild.save();

                let categoriesNames = ``;
                categoriesText.forEach(category => {
                    if (!message.guild) return;
                    categoriesNames += `, ` + DBGuild.getCategoryFromId(category, message.guild)?.name;
                });
                categoriesNames = categoriesNames.substring(2);

                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`category for creation of :type: channel in has been updated`, [translator.translate('text')]), (
                        translator.translateUppercase(`default category is now set to :names:`, [(categoriesNames ?? `*${translator.translateUppercase("Unknown")}*`)])
                    ))]
                })
                break;
            case `channel-category-voice`:
                let categoriesVoice = [];
                for (let index = 0; index < args.length; index++) {
                    categoriesVoice.push(ASCIIFolder.foldReplacing(args[index].trim().toLowerCase() ?? ``));
                }

                botSystem.guild.teamConfig.defaultCategoryVoice = categoriesVoice;
                botSystem.guild.save();

                let categoriesNamesVoice = ``;
                categoriesVoice.forEach(category => {
                    if (!message.guild) return;
                    categoriesNamesVoice += `, ` + DBGuild.getCategoryFromId(category, message.guild)?.name;
                });
                categoriesNamesVoice = categoriesNamesVoice.substring(2);

                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`category for creation of :type: channel in has been updated`, [translator.translate('voice')]), (
                        translator.translateUppercase(`default category is now set to :names:`, [(categoriesNamesVoice ?? `*${translator.translateUppercase("Unknown")}*`)])
                    ))]
                })
                break;
            case `toggle-text-channel`:
                botSystem.guild.teamConfig.createTextOnTeamCreation = !botSystem.guild.teamConfig.createTextOnTeamCreation;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(":type: channel creation for team on team creation has been updated", [translator.translate("text")]), (
                        translator.translateUppercase(`:type: channel creation is now set to :boolean:`, [translator.translateUppercase('text'), translator.translateUppercase(botSystem.guild.teamConfig.createTextOnTeamCreation ? `True` : `False`)])
                    ))]
                })
                break;
            case `toggle-voice-channel`:
                botSystem.guild.teamConfig.createVoiceOnTeamCreation = !botSystem.guild.teamConfig.createVoiceOnTeamCreation;
                botSystem.guild.save();
                message.reply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(":type: channel creation for team on team creation has been updated", [translator.translate("voice")]), (
                        translator.translateUppercase(`:type: channel creation is now set to :boolean:`, [translator.translateUppercase('voice'), translator.translateUppercase(botSystem.guild.teamConfig.createVoiceOnTeamCreation ? `True` : `False`)])
                    ))]
                })
                break;
            default:
                // TODO: Make list implement translation
                const DBTeamConfigCommandEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(translator.translateUppercase('command list')+":")
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
                    .setFooter({ text: BotSystem.client.user?.username ?? "Bot", iconURL: botImage });
                message.reply(translator.translateUppercase(`currently, there are the following`))
                message.channel.send({ embeds: [DBTeamConfigCommandEmbed] });
                return;
        }
    }
};

function writeRolesCreateTeamList(message: Message, botSystem: BotSystem) {
    const botImage = message.client.user?.avatarURL() ?? ``;
    const teamRoles = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(botSystem.translator.translateUppercase('Roles, that can create teams:'))
        .setDescription(botSystem.guild?.teamConfig.allowEveryone ? `***${botSystem.translator.translateUppercase("Everyone")}***` : (botSystem.guild?.teamConfig.creatorRole ?? []).map(role => DBTeamConfig.getRoleName(role, message)).join('\n'))
        .setFooter({ text: BotSystem.client.user?.username ?? "Bot", iconURL: botImage });
    message.channel.send({ embeds: [teamRoles] });
}