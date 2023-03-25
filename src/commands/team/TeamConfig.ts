import { ChannelType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder, Message, PermissionFlagsBits, resolveColor, SlashCommandBuilder } from "discord.js";
import { cp } from "fs";
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
    private allowedCategories: number = 5;

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

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            'en-US': 'team-config',
            da: 'hold-konfiguration',
        });

        command.setDescriptionLocalizations({
            'en-US': 'See available team configuration commands',
            da: 'Se tilgængelige kommandoer til at konfigurere hold',
        });

        command.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('roles')
                .setDescription('See current roles, that can create a new team')
                .setNameLocalizations({
                    'en-US': 'roles',
                    da: 'roller',
                })
                .setDescriptionLocalizations({
                    'en-US': 'See current roles, that can create a new team',
                    da: 'Se nuværende roller, som kan oprette et nyt hold',
                })
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('add-role')
                .setDescription('Add a role, that can create a new team')
                .setNameLocalizations({
                    'en-US': 'add-role',
                    da: 'tilføj-rolle',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Add a role, that can create a new team',
                    da: 'Tilføj en rolle, som kan oprette et nyt hold',
                })
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('The role you want to add')
                        .setNameLocalizations({
                            'en-US': 'role',
                            da: 'rolle',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'The role you want to add',
                            da: 'Rollen du vil tilføje',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('role-everyone')
                .setDescription('Set if everyone can create a new team')
                .setNameLocalizations({
                    'en-US': 'role-everyone',
                    da: 'rolle-alle',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set if everyone can create a new team',
                    da: 'Indstil om alle kan oprette et nyt hold',
                })
                .addBooleanOption((option) =>
                    option
                        .setName('everyone')
                        .setDescription('If everyone can create a new team')
                        .setNameLocalizations({
                            'en-US': 'everyone',
                            da: 'alle',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'If everyone can create a new team',
                            da: 'Hvis alle kan oprette et nyt hold',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('rem-role')
                .setDescription('Remove a role, that can create a new team')
                .setNameLocalizations({
                    'en-US': 'rem-role',
                    da: 'fjern-rolle',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Remove a role, that can create a new team',
                    da: 'Fjern en rolle, som kan oprette et nyt hold',
                })
                .addRoleOption((option) =>
                    option
                        .setName('role')
                        .setDescription('The role you want to remove')
                        .setNameLocalizations({
                            'en-US': 'role',
                            da: 'rolle',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'The role you want to remove',
                            da: 'Rollen du vil fjerne',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('invite')
                .setDescription('see or set if you want an invite to be sent, when inviting a user to a team')
                .setNameLocalizations({
                    'en-US': 'invite',
                    da: 'invitation',
                })
                .setDescriptionLocalizations({
                    'en-US': 'see or set if you want an invite to be sent, when inviting a user to a team',
                    da: 'Se eller indstil, om du vil have en invitation sendt, når du inviterer en bruger til et hold',
                })
                .addBooleanOption((option) =>
                    option
                        .setName('invite')
                        .setDescription('If you want an invite to be sent, when inviting a user to a team')
                        .setNameLocalizations({
                            'en-US': 'invite',
                            da: 'invitation',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'If you want an invite to be sent, when inviting a user to a team',
                            da: 'Hvis du vil have en invitation sendt, når du inviterer en bruger til et hold',
                        })
                        .setRequired(false)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('invite-by')
                .setDescription('Set, who can add new members to a team')
                .setNameLocalizations({
                    'en-US': 'invite-by',
                    da: 'invitation-af',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set, who can add new members to a team',
                    da: 'Indstil, hvem der kan tilføje nye medlemmer til et hold',
                })
                .addStringOption((option) =>
                    option
                        .setName('invite-by')
                        .setDescription('Who can add new members to a team')
                        .setNameLocalizations({
                            'en-US': 'invite-by',
                            da: 'invitation-af',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'Who can add new members to a team',
                            da: 'Hvem der kan tilføje nye medlemmer til et hold',
                        })
                        .setRequired(true)
                        .addChoices(
                            {
                                name: 'Team',
                                value: 'team',
                            },
                            {
                                name: 'Team leader',
                                value: 'leader',
                            },
                            {
                                name: 'Admin',
                                value: 'admin',
                            }
                        )
                        .setRequired(false)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('transfer-by')
                .setDescription('Set, who can transfer the team leader')
                .setNameLocalizations({
                    'en-US': 'transfer-by',
                    da: 'overfør-af',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set, who can transfer the team leader',
                    da: 'Indstil, hvem der kan overføre holdlederen',
                })
                .addStringOption((option) =>
                    option
                        .setName('transfer-by')
                        .setDescription('Who can transfer the team leader')
                        .setNameLocalizations({
                            'en-US': 'transfer-by',
                            da: 'overfør-af',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'Who can transfer the team leader',
                            da: 'Hvem der kan overføre holdlederen',
                        })
                        .setRequired(false)
                        .addChoices(
                            {
                                name: 'Team leader',
                                value: 'leader',
                            },
                            {
                                name: 'Team Admin',
                                value: 'team-admin',
                            },
                            {
                                name: 'Admin',
                                value: 'admin',
                            }
                        )
                )
        );


        command.addSubcommand((subcommand) =>
            subcommand
                .setName('defaults')
                .setDescription('See current default team settings')
                .setNameLocalizations({
                    'en-US': 'defaults',
                    da: 'standarder',
                })
                .setDescriptionLocalizations({
                    'en-US': 'See current default team settings',
                    da: 'Se nuværende standardindstillinger for hold',
                })
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('default-hoist')
                .setDescription('Set if the default team should be hoisted')
                .setNameLocalizations({
                    'en-US': 'default-hoist',
                    da: 'standard-hejs',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set if the default team should be hoisted',
                    da: 'Indstil om standardholdet skal hejses',
                })
                .addBooleanOption((option) =>
                    option
                        .setName('hoist')
                        .setDescription('If the default team should be hoisted')
                        .setNameLocalizations({
                            'en-US': 'hoist',
                            da: 'hejs',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'If the default team should be hoisted',
                            da: 'Hvis standardholdet skal hejses',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('default-color')
                .setDescription('Set the default color of the default team')
                .setNameLocalizations({
                    'en-US': 'default-color',
                    da: 'standard-farve',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set the default color of the default team',
                    da: 'Indstil standardfarven på standardholdet',
                })
                .addStringOption((option) =>
                    option
                        .setName('color')
                        .setDescription('The color you want the default team to have')
                        .setNameLocalizations({
                            'en-US': 'color',
                            da: 'farve',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'The color you want the default team to have',
                            da: 'Farven du vil have standardholdet skal have',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('default-mentionable')
                .setDescription('Set if the default team should be mentionable')
                .setNameLocalizations({
                    'en-US': 'default-mentionable',
                    da: 'standard-nævnbar',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set if the default team should be mentionable',
                    da: 'Indstil om standardholdet skal kunne nævnes',
                })
                .addBooleanOption((option) =>
                    option
                        .setName('mentionable')
                        .setDescription('If the default team should be mentionable')
                        .setNameLocalizations({
                            'en-US': 'mentionable',
                            da: 'nævnbar',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'If the default team should be mentionable',
                            da: 'Hvis standardholdet skal kunne nævnes',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('channel-creation')
                .setDescription('See what settings is set for channel creation when creating a new team')
                .setNameLocalizations({
                    'en-US': 'channel-creation',
                    da: 'kanaloprettelse',
                })
                .setDescriptionLocalizations({
                    'en-US': 'See what settings is set for channel creation when creating a new team',
                    da: 'Se hvilke indstillinger der er indstillet for kanaloprettelse, når du opretter et nyt hold',
                })
        );

        command.addSubcommand((subcommand) => {
            subcommand
                .setName('channel-category-text')
                .setDescription('Set the categories for text channels when creating a new team')
                .setNameLocalizations({
                    'en-US': 'channel-category-text',
                    da: 'kanalkategori-tekst',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set the categories for text channels when creating a new team',
                    da: 'Indstil kategorierne for tekstkanaler, når du opretter et nyt hold',
                })

            for (let index = 0; index < this.allowedCategories; index++) {
                subcommand.addChannelOption((option) =>
                    option
                        .setName(`category-${index + 1}`)
                        .setDescription(`The category for text channel ${index + 1}`)
                        .setNameLocalizations({
                            'en-US': `category-${index + 1}`,
                            da: `kategori-${index + 1}`,
                        })
                        .setDescriptionLocalizations({
                            'en-US': `The category for text channel ${index + 1}`,
                            da: `Kategorien for tekstkanal ${index + 1}`,
                        })
                        .setRequired(index == 0 ? true : false)
                );
            }
            return subcommand;
        });

        command.addSubcommand((subcommand) => {
            subcommand
                .setName('channel-category-voice')
                .setDescription('Set the categories for voice channels when creating a new team')
                .setNameLocalizations({
                    'en-US': 'channel-category-voice',
                    da: 'kanalkategori-voice',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Set the categories for voice channels when creating a new team',
                    da: 'Indstil kategorierne for stemmekanaler, når du opretter et nyt hold',
                })

            for (let index = 0; index < this.allowedCategories; index++) {
                subcommand.addChannelOption((option) =>
                    option
                        .setName(`category-${index + 1}`)
                        .setDescription(`The category for voice channel ${index + 1}`)
                        .setNameLocalizations({
                            'en-US': `category-${index + 1}`,
                            da: `kategori-${index + 1}`,
                        })
                        .setDescriptionLocalizations({
                            'en-US': `The category for voice channel ${index + 1}`,
                            da: `Kategorien for tekstkanal ${index + 1}`,
                        })
                        .setRequired(index == 0 ? true : false)
                );
            }
            return subcommand;
        });

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('toggle-text-channel')
                .setDescription('Toggle if a text channel should be created when creating a new team')
                .setDescriptionLocalizations({
                    'en-US': 'Toggle if a text channel should be created when creating a new team',
                    da: 'Slå til/fra, om en tekstkanal skal oprettes, når du opretter et nyt hold',
                })
                .addBooleanOption((option) =>
                    option
                        .setName('toggle')
                        .setDescription('If a text channel should be created when creating a new team')
                        .setNameLocalizations({
                            'en-US': 'toggle',
                            da: 'til-fra',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'If a text channel should be created when creating a new team',
                            da: 'Hvis en tekstkanal skal oprettes, når du opretter et nyt hold',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('toggle-voice-channel')
                .setDescription('Toggle if a voice channel should be created when creating a new team')
                .setDescriptionLocalizations({
                    'en-US': 'Toggle if a voice channel should be created when creating a new team',
                    da: 'Slå til/fra, om en stemmekanal skal oprettes, når du opretter et nyt hold',
                })
                .addBooleanOption((option) =>
                    option
                        .setName('toggle')
                        .setDescription('If a voice channel should be created when creating a new team')
                        .setNameLocalizations({
                            'en-US': 'toggle',
                            da: 'til-fra',
                        })
                        .setDescriptionLocalizations({
                            'en-US': 'If a voice channel should be created when creating a new team',
                            da: 'Hvis en stemmekanal skal oprettes, når du opretter et nyt hold',
                        })
                        .setRequired(true)
                )
        );

        command.addSubcommand((subcommand) =>
            subcommand
                .setName('help')
                .setDescription('Get information about this command')
                .setNameLocalizations({
                    'en-US': 'help',
                    da: 'hjælp',
                })
                .setDescriptionLocalizations({
                    'en-US': 'Get information about this command',
                    da: 'Få information om denne kommando',
                })
        );

        return command;
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
        const translator = botSystem.translator;

        if (
            !interaction.member
        ) {
            interaction.editReply(translator.translateUppercase(`you don't have permission to add new teams`));
            return;
        }
        if (!botSystem.guild) {
            interaction.editReply(translator.translateUppercase(`cannot execute the command here`));
            return;
        }

        botSystem.guild?.teamConfig.filterRemoved(interaction);
        await botSystem.guild?.save();



        // TODO: Make switch use translation for key words for allow for full language change
        const secondCommandWord = ASCIIFolder.foldReplacing(interaction.options.getSubcommand()?.trim()?.toLowerCase() ?? ``) ?? "";
        switch (secondCommandWord) {
            case `roles`:
                writeRolesCreateTeamList(interaction, botSystem);
                break;
            case `add-role`:

                interaction.options.getRole('role')?.id && botSystem.guild?.teamConfig.addCreatorRole(interaction.options.getRole('role')?.id ?? "");
                await botSystem.guild?.save();

                interaction.editReply(translator.translateUppercase(`roles added`));
                writeRolesCreateTeamList(interaction, botSystem);
                break;
            case `role-everyone`:

                let allowEveryone = interaction.options.getBoolean('everyone') ?? false;

                botSystem.guild.teamConfig.allowEveryone = allowEveryone;

                await botSystem.guild?.save();

                if (botSystem.guild.teamConfig.allowEveryone) {
                    interaction.editReply(translator.translateUppercase(`everyone can now create a team`));
                } else {
                    interaction.editReply(translator.translateUppercase(`Team creation has been restricted to the following roles`))
                    writeRolesCreateTeamList(interaction, botSystem);
                }
                break;
            case `rem-role`:
                interaction.options.getRole('role')?.id && botSystem.guild?.teamConfig.removeCreatorRole(interaction.options.getRole('role')?.id ?? "");
                await botSystem.guild?.save();

                interaction.editReply(translator.translateUppercase(`roles removed`));
                writeRolesCreateTeamList(interaction, botSystem);
                break;
            case `invite`:
                let inviteSetting = interaction.options.getBoolean('invite') ?? null;

                if (inviteSetting !== null) {
                    botSystem.guild.teamConfig.requireInvite = inviteSetting;
                    await botSystem.guild.save();
                    interaction.editReply(translator.translateUppercase(`invite to join team is now :boolean:`, [translator.translate((botSystem.guild?.teamConfig.requireInvite ? `active` : `inactive`))]));
                    return;
                }

                interaction.editReply(translator.translateUppercase(`invite to join team is currently :boolean:`, [(botSystem.guild?.teamConfig.requireInvite ? `active` : `inactive`)]));
                break;
            case `invite-by`:
                let inviteType = interaction.options.getString('invite-by');

                const setInviteTypeText = ASCIIFolder.foldReplacing(inviteType?.trim().toLowerCase() ?? ``);

                switch (setInviteTypeText) {
                    case ``:
                        interaction.editReply(translator.translateUppercase(`sending invites, are currently limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())}*`]))
                        break;
                    case `admin`:
                        botSystem.guild.teamConfig.teamInviteType = InviteType.admin;
                        interaction.editReply(translator.translateUppercase(`sending invites, are now limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())}*`]))
                        break;
                    case `leader`:
                        botSystem.guild.teamConfig.teamInviteType = InviteType.leader
                        interaction.editReply(translator.translateUppercase(`sending invites, are now limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())}*`]))
                        break;
                    case `team`:
                        botSystem.guild.teamConfig.teamInviteType = InviteType.team
                        interaction.editReply(translator.translateUppercase(`sending invites, are now limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamInviteType.toString())}*`]))
                        break;
                    default:
                        interaction.editReply(`${translator.translateUppercase(`i did not know the restriction type`)}. ${translator.translateUppercase(`please use either admin, leader or team`)}.`)
                        break;
                }

                await botSystem.guild.save();
                break;
            case `transfer-by`:
                let transferType = interaction.options.getString('transfer-by');

                const setTransferTypeText = ASCIIFolder.foldReplacing(transferType?.trim().toLowerCase() ?? ``);

                switch (setTransferTypeText) {
                    default:
                    case ``:
                        interaction.editReply(translator.translateUppercase(`transferring teams, are currently limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamTransferType.toString())}*`]))
                        break;
                    case `admin`:
                        botSystem.guild.teamConfig.teamTransferType = UserLevel.admin;
                        interaction.editReply(translator.translateUppercase(`transferring teams, are now limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamTransferType.toString())}*`]))
                        break;
                    case `team-admin`:
                        botSystem.guild.teamConfig.teamTransferType = UserLevel.teamAdmin;
                        interaction.editReply(translator.translateUppercase(`transferring teams, are now limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamTransferType.toString())}*`]))
                        break;
                    case `leader`:
                        botSystem.guild.teamConfig.teamTransferType = UserLevel.teamLeader
                        interaction.editReply(translator.translateUppercase(`transferring teams, are now limited to :role:`, [`*${translator.translate(botSystem.guild.teamConfig.teamTransferType.toString())}*`]))
                        break;
                }

                await botSystem.guild.save();
                break;
            case `defaults`:
                let colorDisplay;
                colorDisplay = Colors.getColor(botSystem.guild.teamConfig.defaultColor);
                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`default settings for new team roles`), (
                        `**${translator.translateUppercase("Hoist")}:** ${translator.translateUppercase((botSystem.guild.teamConfig.defaultHoist ? `True` : `False`))}\n`
                        + `**${translator.translateUppercase("Color")}:** ` + colorDisplay + `\n`
                        + `**${translator.translateUppercase("Mentionable")}:** ${translator.translateUppercase((botSystem.guild.teamConfig.defaultMentionable ? `True` : `False`))}`
                    ))]
                })
                break;
            case `default-hoist`:
                let defaultHoist = interaction.options.getBoolean('hoist') ?? false;

                botSystem.guild.teamConfig.defaultHoist = defaultHoist;
                botSystem.guild.save();
                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase("default setting of hoist on new team roles has been updated"), (
                        `${translator.translateUppercase("Hoist is now set to")} ` + translator.translate(botSystem.guild.teamConfig.defaultHoist ? `True` : `False`)
                    ))]
                })
                break;
            case `default-color`:
                try {
                    let colorText = interaction.options.getString('color')?.trim().toLowerCase() ?? "default";
                    let color = (colorText.charAt(0).toUpperCase() + colorText.slice(1)) as ColorResolvable;

                    botSystem.guild.teamConfig.defaultColor = resolveColor(color);
                    botSystem.guild.save();
                    interaction.editReply({
                        embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`default color for new team roles has been updated`), (
                            translator.translateUppercase("the default color for new team roles is now set to :color:", [Colors.getColor(botSystem.guild.teamConfig.defaultColor)])
                        ), botSystem.guild.teamConfig.defaultColor)]
                    })
                } catch (error) {
                    interaction.editReply({
                        embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`error updating default team color`), (
                            translator.translateUppercase("default color error update failed")
                        ))]
                    })
                }
                break;
            case `default-mentionable`:
                let defaultMentionable = interaction.options.getBoolean('mentionable') ?? false;

                botSystem.guild.teamConfig.defaultMentionable = defaultMentionable;
                botSystem.guild.save();
                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase("default setting of mentionable on new team roles has been updated"), (
                        `${translator.translateUppercase("mentionable is now set to")} ${translator.translateUppercase((botSystem.guild.teamConfig.defaultMentionable ? `True` : `False`))} `
                    ))]
                })
                break;
            case `channel-creation`:
                let categoriesNamesOverviewText: string = ``;
                botSystem.guild.teamConfig.defaultCategoryText.forEach(category => {
                    if (!interaction.guild) return;
                    const searchedCategory = DBGuild.getCategoryFromId(category, interaction.guild);
                    if (!searchedCategory) return;
                    categoriesNamesOverviewText += `, ` + searchedCategory.name;
                });
                categoriesNamesOverviewText = categoriesNamesOverviewText.substring(2);
                categoriesNamesOverviewText = categoriesNamesOverviewText == `` ? `-` : categoriesNamesOverviewText;

                let categoriesNamesOverviewVoice: string = ``;
                botSystem.guild.teamConfig.defaultCategoryVoice.forEach(category => {
                    if (!interaction.guild) return;
                    const searchedCategory = DBGuild.getCategoryFromId(category, interaction.guild);
                    if (!searchedCategory) return;
                    categoriesNamesOverviewVoice += `, ` + searchedCategory.name;
                });
                categoriesNamesOverviewVoice = categoriesNamesOverviewVoice.substring(2);
                categoriesNamesOverviewVoice = categoriesNamesOverviewVoice == `` ? `-` : categoriesNamesOverviewVoice;

                interaction.editReply({
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

                for (let index = 0; index < 5; index++) {
                    let channel = interaction.options.getChannel(`category-${index + 1}`);
                    if (channel) {
                        if (channel.type !== ChannelType.GuildCategory) {
                            continue;
                        }
                        categoriesText.push(channel.id);
                    }
                }

                botSystem.guild.teamConfig.defaultCategoryText = categoriesText;
                botSystem.guild.save();

                let categoriesNames = ``;
                categoriesText.forEach(category => {
                    if (!interaction.guild) return;
                    categoriesNames += `, ` + DBGuild.getCategoryFromId(category, interaction.guild)?.name;
                });
                categoriesNames = categoriesNames.substring(2);

                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`category for creation of :type: channel in has been updated`, [translator.translate('text')]), (
                        translator.translateUppercase(`default category is now set to :names:`, [(categoriesNames ?? `*${translator.translateUppercase("Unknown")}*`)])
                    ))]
                })
                break;
            case `channel-category-voice`:
                let categoriesVoice = [];

                for (let index = 0; index < 5; index++) {
                    let channel = interaction.options.getChannel(`category-${index + 1}`);
                    if (channel) {
                        if (channel.type !== ChannelType.GuildCategory) {
                            continue;
                        }
                        categoriesVoice.push(channel.id);
                    }
                }

                botSystem.guild.teamConfig.defaultCategoryVoice = categoriesVoice;
                botSystem.guild.save();

                let categoriesNamesVoice = ``;
                categoriesVoice.forEach(category => {
                    if (!interaction.guild) return;
                    categoriesNamesVoice += `, ` + DBGuild.getCategoryFromId(category, interaction.guild)?.name;
                });
                categoriesNamesVoice = categoriesNamesVoice.substring(2);

                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(`category for creation of :type: channel in has been updated`, [translator.translate('voice')]), (
                        translator.translateUppercase(`default category is now set to :names:`, [(categoriesNamesVoice ?? `*${translator.translateUppercase("Unknown")}*`)])
                    ))]
                })
                break;
            case `toggle-text-channel`:


                botSystem.guild.teamConfig.createTextOnTeamCreation = interaction.options.getBoolean('toggle') ?? false;
                botSystem.guild.save();
                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(":type: channel creation for team on team creation has been updated", [translator.translate("text")]), (
                        translator.translateUppercase(`:type: channel creation is now set to :boolean:`, [translator.translateUppercase('text'), translator.translateUppercase(botSystem.guild.teamConfig.createTextOnTeamCreation ? `True` : `False`)])
                    ))]
                })
                break;
            case `toggle-voice-channel`:
                botSystem.guild.teamConfig.createVoiceOnTeamCreation = interaction.options.getBoolean('toggle') ?? false;
                botSystem.guild.save();
                interaction.editReply({
                    embeds: [BotSystemEmbed.embedCreator(translator.translateUppercase(":type: channel creation for team on team creation has been updated", [translator.translate("voice")]), (
                        translator.translateUppercase(`:type: channel creation is now set to :boolean:`, [translator.translateUppercase('voice'), translator.translateUppercase(botSystem.guild.teamConfig.createVoiceOnTeamCreation ? `True` : `False`)])
                    ))]
                })
                break;
            default:
                // TODO: Make list implement translation
                const DBTeamConfigCommandEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(translator.translateUppercase('command list') + ":")
                    .setDescription(
                        `
                            **Roles:**
                            - roles - See list of roles, that can create teams 
                            - role-everyone - Toggle if everyone should be able to create a team 
                            - add-role [role] - Add role, that can create team 
                            - rem-role [role] - Remove role, that can create team 

                            **Invite:**
                            - invite - Check if invite is currently required before a member is added to a team
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
                    );
                interaction.editReply(translator.translateUppercase(`currently, there are the following`))
                interaction.editReply({ embeds: [DBTeamConfigCommandEmbed] });
                return;
        }
    }
};

function writeRolesCreateTeamList(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
    let text = ``;

    if (botSystem.guild?.teamConfig.allowEveryone) {
        text = `***${botSystem.translator.translateUppercase("Everyone")}***`;
    } else {
        text = (botSystem.guild?.teamConfig.creatorRole ?? []).map(role => DBTeamConfig.getRoleName(role, interaction))?.join('\n')
    }

    if (text === `` || text === undefined || text === null) {
        text = `*${botSystem.translator.translateUppercase("none")}*`;
    }

    const teamRoles = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(botSystem.translator.translateUppercase('Roles, that can create teams:'))
        .setDescription(text)
    interaction.editReply({ embeds: [teamRoles] });
}