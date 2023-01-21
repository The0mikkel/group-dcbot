import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ConfigCommand from "../../data/Command/Types/ConfigCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import Translate from "../../data/Language/Translate";

require("dotenv").config();

export default class BotRoles extends ConfigCommand {

    constructor() {
        super(
            'config-bot-roles',
            'Configure roles for the bot',
            true,
            false,
            0,
            '[prefix]',
            undefined,
            undefined,
            UserLevel.admin
        );

        this.botImage = "";
    }

    botImage: string;

    slashCommand(): SlashCommandBuilder {
        let slashCommand = super.slashCommand();

        slashCommand.setNameLocalizations({
            "en-US": "config-bot-roles",
            "da": "konfigurer-bot-roller"
        });

        slashCommand.setDescriptionLocalizations({
            "en-US": "Configure roles for the bot", 
            "da": "Konfigurer roller til bot"
        });

        slashCommand.addStringOption(option =>
            option.setName("level")
                .setDescription("The level the role should be allocated to")
                .setDescriptionLocalizations({
                    "en-US": "The level the role should be allocated to",
                    "da": "Niveauet rollen skal tildeles"
                })
                .setNameLocalizations({
                    "en-US": "level",
                    "da": "niveau"
                })
                .setRequired(true)
                .addChoices(
                    { name: "Admin", value: "admin" },
                    { name: "Team Admin", value: "teamadmin" },
                )
        );

        slashCommand.addRoleOption(option =>
            option.setName("role")
                .setDescription("The role to add/remove")
                .setDescriptionLocalizations({
                    "en-US": "The role to add/remove",
                    "da": "Rollen der skal tilføjes/fjernes"
                })
                .setNameLocalizations({
                    "en-US": "role",
                    "da": "rolle"
                })
                .setRequired(false)
        );

        return slashCommand;
    }

    async execute(interaction: CommandInteraction, botSystem: BotSystem, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void> {
        await botSystem.guild?.save();

        const translator = botSystem.translator;

        if (!botSystem.guild) {
            interaction.editReply({ content: translator.translateUppercase("i can't execute that command outside guilds") });
            return;
        }

        let roleLevel = interaction.options.get("level")?.value;
        let role = interaction.options.get("role")?.value;

        switch (roleLevel) {
            case "admin":
                let roles: any[] = [];

                if (role == null) {
                    let roleNames: string[] = []
                    botSystem.guild.adminRoles.forEach(role => {
                        let name = interaction.guild?.roles.cache.get(role)?.name;
                        if (!name) return;
                        roleNames.push(name);
                    });
                    this.sendBasicEmbed(interaction, translator.translateUppercase("current :level: roles", ["Admin"]), translator.translateUppercase("the following role(s) are categorized as :level: roles", ["admin"]) + ":\n" + roleNames.join(",\n"))
                    return;
                }

                console.log(role);

                let guildRole = interaction.guild?.roles.cache.find(r => r.id === role);
                if (guildRole) {
                    try {
                        if (!botSystem.guild?.addAdminRole(guildRole.id)) {
                            this.sendConfirmEmbed(
                                interaction,
                                translator.translateUppercase("Confirm deletion"),
                                translator.translateUppercase("the role :name: already exist as an :level:, would you like to the delete it from the list of :level: roles?", [guildRole.name, "admin", "admin"]),
                                async (i: any) => {
                                    if (!guildRole) return;
                                    botSystem.guild?.removeAdminRole(guildRole.id);
                                    await botSystem.guild?.save();
                                    await i.update({ embeds: [this.basicEmbedContent(translator.translateUppercase("Role removed from bot"), translator.translateUppercase("the role is no longer an :level: role", ["admin"]))], components: [] })
                                },
                                async (i: any) => {
                                    await i.update({ embeds: [this.basicEmbedContent(translator.translateUppercase("Action cancelled"), translator.translateUppercase("The action has been canceled"))], components: [] })
                                }
                            )
                        } else {
                            roles.push(guildRole.name);
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }

                await botSystem.guild?.save();
                if (roles.length > 0) {
                    this.sendBasicEmbed(interaction, translator.translateUppercase(":level: role added", ["Admin"]), translator.translateUppercase("the following role(s) has been added") + ":\n" + roles.join(",\n"))
                }
                break;
            case "teamadmin":
                let teamRoles: any[] = [];

                if (role == null) {
                    let roleNames: string[] = []
                    botSystem.guild.teamAdminRoles.forEach(role => {
                        let name = interaction.guild?.roles.cache.get(role)?.name;
                        if (!name) return;
                        roleNames.push(name);
                    });
                    this.sendBasicEmbed(interaction, translator.translateUppercase("current :level: roles", ["Team Admin"]), translator.translateUppercase("the following role(s) are categorized as :level: roles", ["Team Admin"]) + ":\n" + roleNames.join(",\n"))
                    return;
                }

                console.log(role);

                let guildTeamRole = interaction.guild?.roles.cache.find(r => r.id === role);
                if (guildTeamRole) {
                    try {
                        if (!botSystem.guild?.addTeamAdminRole(guildTeamRole.id)) {
                            this.sendConfirmEmbed(
                                interaction,
                                translator.translateUppercase("Confirm deletion"),
                                translator.translateUppercase("the role :name: already exist as an :level:, would you like to the delete it from the list of :level: roles?", [guildTeamRole.name, "Team Admin", "Team Admin"]),
                                async (i: any) => {
                                    if (!guildTeamRole) return;
                                    botSystem.guild?.removeTeamAdminRole(guildTeamRole.id);
                                    await botSystem.guild?.save();
                                    await i.update({ embeds: [this.basicEmbedContent(translator.translateUppercase("Role removed from bot"), translator.translateUppercase("the role is no longer an :level: role", ["Team Admin"]))], components: [] })
                                },
                                async (i: any) => {
                                    await i.update({ embeds: [this.basicEmbedContent(translator.translateUppercase("Action cancelled"), translator.translateUppercase("The action has been canceled"))], components: [] })
                                }
                            )
                        } else {
                            teamRoles.push(guildTeamRole.name);
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }

                await botSystem.guild?.save();
                if (teamRoles.length > 0) {
                    this.sendBasicEmbed(interaction, translator.translateUppercase(":level: role added", ["Team Admin"]), translator.translateUppercase("the following role(s) has been added") + ":\n" + teamRoles.join(",\n"))
                }
                break;
            default:
                return;
        }
    }

    private basicEmbedContent(title: string, text: string) {
        return new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text);
    }

    async sendBasicEmbed(interaction: CommandInteraction, title: string, text: string) {
        if (this.botImage == "") {
            this.botImage = BotSystem.client.user?.avatarURL() ?? "";
        }

        const basicEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text);

        return await interaction.editReply({ embeds: [basicEmbed] });
    }

    async sendConfirmEmbed(interaction: CommandInteraction, title: string, text: string, confirmEvent: any, cancelEvent: any) {
        if (this.botImage == "") {
            this.botImage = BotSystem.client.user?.avatarURL() ?? "";
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text);

        const buttons = new ActionRowBuilder<ButtonBuilder>();

        let actions = ["Confirm", "Cancel"];
        for (let index = 0; index < actions.length; index++) {
            try {
                const buttonType = actions[index] == actions[0] ? ButtonStyle.Success : ButtonStyle.Secondary;
                buttons.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm-embed-bot-roles;${actions[index]}`)
                        .setLabel(Translate.getInstance().translate(actions[index]))
                        .setStyle(buttonType),
                );
            } catch (error) {
                console.error(error);
            }
        }

        const confirmMessage = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] });

        const collector = confirmMessage.createMessageComponentCollector({ time: 15000 });
        collector.on('collect', async i => {
            if (!i.customId) {
                return;
            }

            if (i.customId.startsWith("confirm-embed-bot-roles;")) {
                const action = i.customId.split(";")[1] ?? "";
                if (action == "Confirm") {
                    confirmEvent(i);
                } else {
                    cancelEvent(i)
                }
            }
        });
    }
};