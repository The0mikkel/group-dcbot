import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Message, Role, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";
import Team, { TeamCreationErrors } from "../../data/Group/Team";
import { UserLevel } from "../../data/Command/UserLevel";
import ArrayRemover from "../../data/Helper/ArrayRemover";

require("dotenv").config();

export default class TeamDelete extends TeamCommand {
    private teams: DBGroup[] = [];

    constructor() {
        super(
            'delete-team',
            'Delete a team. one or more teams may be mentioned to delete without navigating the team list',
            true,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            UserLevel.teamAdmin
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "delete-team",
            "da": "slet-hold"
        });

        command.setDescriptionLocalizations({
            "en-US": "Delete a team. one or more teams may be mentioned to delete without navigating the team list",
            "da": "Slet et hold eller flere hold. Hvis du nævner et hold, springer du over listen over hold"
        });

        command.addRoleOption(option =>
            option.setName('team')
                .setNameLocalizations({
                    "en-US": "team",
                    "da": "hold"
                })
                .setDescription("The team you want to delete")
                .setDescriptionLocalizations({
                    "en-US": "The team you want to delete",
                    "da": "Holdet du vil slette"
                })
                .setRequired(false)
        );

        return command;
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {

        let team = interaction.options.getRole('team', false);
        if (team) {
            const dbGroup = await DBGroup.load(team.id);
            if (dbGroup) {
                Team.delete(botSystem, interaction, dbGroup);
            }
        } else {
            this.deleteTeamlist(interaction, botSystem);
        }
    }

    async deleteTeamlist(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
        const translator = botSystem.translator;

        this.teams = await DBGroup.loadFromGuild(botSystem.guild?.id);
        let currentPage = "0";

        const pageContent = await this.generatePage(currentPage, interaction, botSystem);
        if (!pageContent) {
            interaction.editReply(translator.translateUppercase("no teams has been created through the bot"))
            return;
        }

        let listMessage = await interaction.editReply(pageContent);
        const collector = listMessage.createMessageComponentCollector({ time: 150000 });
        collector.on('collect', async i => {
            if (!i.customId) {
                return;
            }

            if (i.customId.startsWith("team-delete-new-page;")) {
                currentPage = i.customId.split(";")[1];
                const pageContent = await this.generatePage(currentPage, interaction, botSystem);
                if (!pageContent) {
                    return;
                }
                await i.update(pageContent);
            } else if (i.customId.startsWith("team-delete;")) {
                let teamToDelete = i.customId.split(";")[1];
                const role = await interaction.guild?.roles.fetch(teamToDelete);
                let teamName = "";
                if (role) {
                    teamName = role.name;
                    let dbGroupToDelete = await DBGroup.load(role.id);
                    if (dbGroupToDelete) {
                        await Team.delete(botSystem, interaction, dbGroupToDelete);
                    }
                    this.teams = this.teams.filter(item => item !== dbGroupToDelete)
                }
                if (teamName !== "") interaction.editReply({ content: translator.translateUppercase("team :team name: was deleted", [teamName])});

                let pageContent: any = await this.generatePage(currentPage, interaction, botSystem);
                if (!pageContent) {
                    pageContent = "";
                }
                await i.update(pageContent);
            }
        });
        collector.on('end', () => BotSystem.autoDeleteMessageByUser(listMessage, 0));
    }

    private async generatePage(page: string = "0", interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<{ embeds: any[], components: any[] } | false> {
        if (this.teams.length <= 0) {
            return false;
        }

        let pageNumber = parseInt(page);
        if (isNaN(pageNumber)) {
            pageNumber = 0;
        }

        for (let index = 0; index < this.teams.length; index++) {
            const currentTeam = this.teams[index];
            const role = await interaction.guild?.roles.fetch(currentTeam.id);
            if (!role) {
                Team.delete(botSystem, interaction, currentTeam);
                this.teams = this.teams.filter(item => item !== currentTeam)
            }
        }

        let pages = Math.ceil(this.teams.length / 10);
        let pageButtons = false;
        if (pages > 1) {
            pageButtons = true;
        } else {
            pageNumber = 0;
        }

        let pageText = "";
        const keys = [
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "keycap_ten"
        ];

        let currentTeams = []
        for (let index = 0; index < 10; index++) {
            let currentIndex = (index + ((pageNumber) * 10));

            if (currentIndex > this.teams.length) {
                break;
            }
            const currentTeam = this.teams[currentIndex];
            if (!currentTeam) {
                break;
            }

            pageText += ":" + keys[index] + ": " + currentTeam.name + "\n";
            currentTeams.push(currentTeam);
        }


        const pageEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(botSystem.translator.translateUppercase('Delete team'))
            .setDescription(pageText)
            .setFields({ name: botSystem.translator.translateUppercase('how to'), value: botSystem.translator.translateUppercase("select number to delete or navigate between pages") })
            .setFooter({ text: botSystem.translator.translateUppercase("Page") + " " + (pageNumber + 1) + "/" + pages })


        let componentCount = 0;
        const buttons: ActionRowBuilder<ButtonBuilder>[] = [];

        if (pageButtons && pageNumber != 0) {
            const buttonType = ButtonStyle.Secondary;
            this.addComponent(buttons, componentCount,
                new ButtonBuilder()
                    .setCustomId(`team-delete-new-page;${pageNumber - 1}`)
                    .setLabel(botSystem.translator.translateUppercase(`previus page`))
                    .setStyle(buttonType),
            );
            componentCount++;
        }
        for (let index = 0; index < currentTeams.length; index++) {
            try {
                const buttonType = ButtonStyle.Secondary;
                this.addComponent(buttons, componentCount,
                    new ButtonBuilder()
                        .setCustomId(`team-delete;${currentTeams[index].id}`)
                        .setLabel(`${index + 1}`)
                        .setStyle(buttonType),
                );
            } catch (error) {
                console.error(error);
            }
            componentCount++
        }
        if (pageButtons && pageNumber != (pages - 1)) {
            const buttonType = ButtonStyle.Secondary;
            this.addComponent(buttons, componentCount,
                new ButtonBuilder()
                    .setCustomId(`team-delete-new-page;${pageNumber + 1}`)
                    .setLabel(botSystem.translator.translateUppercase(`next page`))
                    .setStyle(buttonType),
            );
            componentCount++
        }

        return { embeds: [pageEmbed], components: buttons };
    }

    addComponent(buttons: ActionRowBuilder<ButtonBuilder>[] = [], componentCount: number, component: ButtonBuilder) {
        let index = Math.floor(componentCount / 5);
        let element = buttons[index];
        if (!element) {
            buttons[index] = new ActionRowBuilder<ButtonBuilder>();
        }
        buttons[index].addComponents(component)
    }
}