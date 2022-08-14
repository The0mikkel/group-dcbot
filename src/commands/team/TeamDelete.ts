import { Message, MessageActionRow, MessageButton, MessageEmbed, Role } from "discord.js";
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
            'Delete a team. one or more teams may be mentioned to delete without navigating the team list.',
            true,
            false,
            undefined,
            undefined,
            undefined,
            undefined,
            UserLevel.teamAdmin
        )
    }

    async execute(message: Message, botSystem: BotSystem, args: any, autoDelete = false): Promise<void> {
        if (message.mentions.roles.size > 0) {
            message.mentions.roles.forEach(async role => {
                const dbGroup = await DBGroup.load(role.id);
                if (dbGroup) {
                    Team.delete(botSystem, message, dbGroup);
                }
            })
        } else {
            this.deleteTeamlist(message, botSystem);
        }
    }

    async deleteTeamlist(message: Message, botSystem: BotSystem) {
        this.teams = await DBGroup.loadFromGuild(botSystem.guild?.id);
        let currentPage = "0";

        const pageContent = await this.generatePage(currentPage, message, botSystem);
        if (!pageContent) {
            console.log(pageContent);
            message.channel.send("No teams has been created through the bot.")
            return;
        }

        BotSystem.autoDeleteMessageByUser(message, 0);

        let listMessage = await message.channel.send(pageContent);
        const collector = listMessage.createMessageComponentCollector({ time: 150000 });
        collector.on('collect', async i => {
            if (!i.customId) {
                return;
            }

            if (i.customId.startsWith("team-delete-new-page;")) {
                currentPage = i.customId.split(";")[1];
                const pageContent = await this.generatePage(currentPage, message, botSystem);
                if (!pageContent) {
                    return;
                }
                await i.update(pageContent);
            } else if (i.customId.startsWith("team-delete;")) {
                let teamToDelete = i.customId.split(";")[1];
                console.log(teamToDelete);
                const role = await message.guild?.roles.fetch(teamToDelete);
                let teamName = "";
                if (role) {
                    teamName = role.name;
                    let dbGroupToDelete = await DBGroup.load(role.id);
                    if (dbGroupToDelete) {
                        console.log(await Team.delete(botSystem, message, dbGroupToDelete));
                    }
                    this.teams = this.teams.filter(item => item !== dbGroupToDelete)
                }
                if (teamName !== "") BotSystem.sendAutoDeleteMessage(message.channel, "Team " + teamName + " was deleted");

                let pageContent: any = await this.generatePage(currentPage, message, botSystem);
                if (!pageContent) {
                    pageContent = "";
                }
                await i.update(pageContent);
            }
        });
        collector.on('end', () => BotSystem.autoDeleteMessageByUser(listMessage, 0));
    }

    private async generatePage(page: string = "0", message: Message, botSystem: BotSystem): Promise<{ embeds: any[], components: any[] } | false> {
        if (this.teams.length <= 0) {
            return false;
        }

        let pageNumber = parseInt(page);
        if (isNaN(pageNumber)) {
            pageNumber = 0;
        }

        for (let index = 0; index < this.teams.length; index++) {
            const currentTeam = this.teams[index];
            const role = await message.guild?.roles.fetch(currentTeam.id);
            if (!role) {
                Team.delete(botSystem, message, currentTeam);
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


        const pageEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Delete team')
            .setDescription(pageText)
            .setFields({ name: 'How to', value: "Select number to delete or navigate between pages" })
            .setFooter({ text: "Page " + (pageNumber + 1) + "/" + pages })


        let componentCount = 0;
        const buttons: MessageActionRow[] = [];

        if (pageButtons && pageNumber != 0) {
            const buttonType = 'SECONDARY';
            this.addComponent(buttons, componentCount,
                new MessageButton()
                    .setCustomId(`team-delete-new-page;${pageNumber - 1}`)
                    .setLabel(`Previus page`)
                    .setStyle(buttonType),
            );
            componentCount++;
        }
        for (let index = 0; index < currentTeams.length; index++) {
            try {
                const buttonType = 'SECONDARY';
                this.addComponent(buttons, componentCount,
                    new MessageButton()
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
            const buttonType = 'SECONDARY';
            this.addComponent(buttons, componentCount,
                new MessageButton()
                    .setCustomId(`team-delete-new-page;${pageNumber + 1}`)
                    .setLabel(`Next page`)
                    .setStyle(buttonType),
            );
            componentCount++
        }

        return { embeds: [pageEmbed], components: buttons };
    }

    addComponent(buttons: MessageActionRow[] = [], componentCount: number, component: MessageButton) {
        let index = Math.floor(componentCount / 5);
        let element = buttons[index];
        if (!element) {
            buttons[index] = new MessageActionRow();
        }
        buttons[index].addComponents(component)
    }
}