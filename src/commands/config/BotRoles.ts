import { Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ConfigCommand from "../../data/Command/Types/ConfigCommand";
import { UserLevel } from "../../data/Command/UserLevel";

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

    async execute(message: Message, botSystem: BotSystem, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void> {
        await botSystem.guild?.save();

        if (!botSystem.guild) {
            message.reply("Cannot execute the command here");
            return;
        }

        const secondCommandWord = args?.shift()?.trim().toLowerCase() ?? "";

        switch (secondCommandWord) {
            case "admin":
                let roles: any[] = [];

                if (message.mentions.roles.size <= 0) {
                    let roleNames: string[] = []
                    botSystem.guild.adminRoles.forEach(role => {
                        let name = message.guild?.roles.cache.get(role)?.name;
                        if (!name) return;
                        roleNames.push(name);
                    });
                    this.sendBasicEmbed(message, "Current Admin roles", "The following role(s) are categorized as admin roles:\n" + roleNames.join(",\n"))
                    return;
                } 

                message.mentions.roles.forEach(async (role) => {
                    try {
                        if (!botSystem.guild?.addAdminRole(role.id)) {
                            this.sendConfirmEmbed(
                                message,
                                "Confirm deletion",
                                `The role ${role.name} already exist as an admin, would you like to the delete it from the list of admin roles?`,
                                async (i: any) => {
                                    botSystem.guild?.removeAdminRole(role.id);
                                    await botSystem.guild?.save();
                                    await i.update({ embeds: [this.basicEmbedContent("Role removed from bot", "The role is no longer an admin role")], components: [] })
                                },
                                async (i: any) => {
                                    await i.update({ embeds: [this.basicEmbedContent("Action cancelled", "The action has been canceled")], components: [] })
                                }
                            )
                        } else {
                            roles.push(role.name);
                        }
                    } catch (error) {
                        console.log(error)
                    }
                });

                await botSystem.guild?.save();
                if (roles.length > 0) {
                    this.sendBasicEmbed(message, "Admin role added", "The following role(s) has been added:\n" + roles.join(",\n"))
                }
                break;
            case "teamadmin":
                let teamRoles: any[] = [];

                if (message.mentions.roles.size <= 0) {
                    let roleNames: string[] = []
                    botSystem.guild.teamAdminRoles.forEach(role => {
                        let name = message.guild?.roles.cache.get(role)?.name;
                        if (!name) return;
                        roleNames.push(name);
                    });
                    this.sendBasicEmbed(message, "Current Team Admin roles", "The following role(s) are categorized as team admin roles:\n" + roleNames.join(",\n"))
                    return;
                } 

                message.mentions.roles.forEach(async (role) => {
                    try {
                        if (!botSystem.guild?.addTeamAdminRole(role.id)) {
                            this.sendConfirmEmbed(
                                message,
                                "Confirm deletion",
                                `The role ${role.name} already exist as an team admin, would you like to the delete it from the list of team admin roles?`,
                                async (i: any) => {
                                    botSystem.guild?.removeTeamAdminRole(role.id);
                                    await botSystem.guild?.save();
                                    await i.update({ embeds: [this.basicEmbedContent("Role removed from bot", "The role is no longer a team admin role")], components: [] })
                                },
                                async (i: any) => {
                                    await i.update({ embeds: [this.basicEmbedContent("Action cancelled", "The action has been canceled")], components: [] })
                                }
                            )
                        } else {
                            teamRoles.push(role.name);
                        }
                    } catch (error) {
                        console.log(error)
                    }
                });

                await botSystem.guild?.save();
                if (teamRoles.length > 0) {
                    this.sendBasicEmbed(message, "Team Admin role added", "The following role(s) has been added:\n" + teamRoles.join(",\n"))
                }
                break;
            default:
                this.sendBasicEmbed(message, "Possible bot roles to update",
                    `
                        - TeamAdmin (Can administrate teams)
                        - Admin (Can administrate the whole bot)

                        Please use the command as:
                        \`\`\`${botSystem.guild.config.prefix}${this.name} [bot role] [guild role]\`\`\`
                        for example:
                        \`\`\`${botSystem.guild.config.prefix}${this.name} admin @admin\`\`\`
                    `
                );
                return;
        }

        BotSystem.autoDeleteMessageByUser(message, 0);
    }

    private basicEmbedContent(title: string, text: string) {
        return new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text)
            .setFooter({ text: 'Grouper', iconURL: this.botImage });
    }

    async sendBasicEmbed(message: Message, title: string, text: string) {
        if (this.botImage == "") {
            this.botImage = BotSystem.client.user?.avatarURL() ?? "";
        }

        const basicEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text)
            .setFooter({ text: 'Grouper', iconURL: this.botImage });
        return await message.channel.send({ embeds: [basicEmbed] });
    }

    async sendConfirmEmbed(message: Message, title: string, text: string, confirmEvent: any, cancelEvent: any) {
        if (this.botImage == "") {
            this.botImage = BotSystem.client.user?.avatarURL() ?? "";
        }

        const confirmEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(title)
            .setDescription(text)
            .setFooter({ text: 'Grouper', iconURL: this.botImage });

        const buttons = new MessageActionRow();

        let actions = ["Confirm", "Cancel"];
        for (let index = 0; index < actions.length; index++) {
            try {
                const buttonType = actions[index] == actions[0] ? 'SUCCESS' : 'SECONDARY';
                buttons.addComponents(
                    new MessageButton()
                        .setCustomId(`confirm-embed-bot-roles;${actions[index]}`)
                        .setLabel(actions[index])
                        .setStyle(buttonType),
                );
            } catch (error) {
                console.error(error);
            }
        }
        const confirmMessage = await message.channel.send({ embeds: [confirmEmbed], components: [buttons] });

        const collector = confirmMessage.createMessageComponentCollector({ time: 15000 });
        collector.on('collect', async i => {
            if (!i.customId) {
                return;
            }

            if (i.customId.startsWith("confirm-embed-bot-roles;")) {
                const action = i.customId.split(";")[1];
                if (action == "Confirm") {
                    confirmEvent(i);
                } else {
                    cancelEvent(i)
                }
            }
            BotSystem.autoDeleteMessageByUser(confirmMessage)
        });
        collector.on('end', () => BotSystem.autoDeleteMessageByUser(confirmMessage, 0));
    }
};