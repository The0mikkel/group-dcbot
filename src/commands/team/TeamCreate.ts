import { ChatInputCommandInteraction, Message, Role, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";
import Team, { TeamCreationErrors } from "../../data/Group/Team";
import TeamInvite from "./TeamInvite";

require("dotenv").config();

export default class TeamCreate extends TeamCommand {
    shortDescription: string = "Create a team";

    constructor() {
        super(
            'create-team',
            'Create a team',
            true,
            true,
            1,
            '[team name]',
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "create-team",
            "da": "opret-hold"
        });

        command.setDescriptionLocalizations({
            "en-US": "Create a team",
            "da": "Opret et hold"
        });

        command.addStringOption(option =>
            option.setName('team-name')
                .setNameLocalizations({
                    "en-US": "team-name",
                    "da": "hold-navn"
                })
                .setDescription("The name of the team you want to create")
                .setDescriptionLocalizations({
                    "en-US": "The name of the team you want to create",
                    "da": "Navnet på holdet du vil oprette"
                })
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(100)
        );

        command.addUserOption(option =>
            option.setName('team-leader')
                .setNameLocalizations({
                    "en-US": "team-leader",
                    "da": "hold-leder"
                })
                .setDescription("The team leader of the team you want to create. Defaults to the person who created the team")
                .setDescriptionLocalizations({
                    "en-US": "The team leader of the team you want to create. Defaults to the person who created the team",
                    "da": "Holdlederen af holdet du vil oprette. Standard er personen der oprettede holdet"
                })
                .setRequired(false)
        );

        return command;
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {
        const translator = botSystem.translator;

        let returnValue = await this.createTeam(interaction, botSystem);

        if (returnValue instanceof DBGroup) {
            interaction.editReply(`${translator.translateUppercase("team :group: was created", [`<@&${returnValue.id}>`])}.\n${translator.translateUppercase("to add members beside yourself, please use the :invite command name: command", ["`/" + translator.translate(new TeamInvite().name) + "`"])}!`);
        }
    }

    async createTeam(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<false | DBGroup> {
        const translator = botSystem.translator;

        botSystem.guild?.teamConfig.filterRemoved(interaction);
        await botSystem.guild?.save();

        let allowed = await Team.checkIfAllowedToCreate(interaction, botSystem);
        if (allowed !== true) {
            interaction.editReply(translator.translateUppercase("you don't have permission to add new teams"));
            return false;
        }

        var rawGroupName = interaction.options.getString('team-name', true);

        const groupName = ASCIIFolder.foldReplacing(rawGroupName).trim();

        if (groupName == "") {
            interaction.editReply(`${translator.translateUppercase("you need to specify a team name")}!`);
            return false;
        }

        let teamLeader = interaction.user;
        if (
            interaction.options.getUser('team-leader')
            && (await this.authorizedAdmin(interaction, botSystem))
        ) {
            teamLeader = interaction.options.getUser('team-leader', false) ?? teamLeader;
        }

        let dbGroup: DBGroup;
        let teamCreationReturn = await Team.create(botSystem, interaction, groupName, teamLeader.id);

        if (!(teamCreationReturn instanceof DBGroup)) {
            switch (teamCreationReturn) {
                case TeamCreationErrors.roleCreationFailure:
                    interaction.editReply(translator.translateUppercase("could not create team :name:", [groupName]));
                    break;
                case TeamCreationErrors.alreadyExist:
                    interaction.editReply(translator.translateUppercase("the team already exist, please select another name for the team"));
                    break;
                case TeamCreationErrors.nameLength:
                    interaction.editReply(translator.translateUppercase("the team name must not be longer than 100 characters"));
                    break;
                case TeamCreationErrors.channelCreationFailure:
                    interaction.editReply(translator.translateUppercase("team was created, but an error occured while creating channel(s) for the team") + " - " + translator.translateUppercase("please contact an admin to further assist"))
                    break;
                case TeamCreationErrors.max:
                    interaction.editReply(translator.translateUppercase("there cannot be created anymore teams") + " - " + translator.translateUppercase("please contact an admin to further assist"))
                    break;
                case TeamCreationErrors.permission:
                    interaction.editReply(translator.translateUppercase("you don't have permission to add new teams"));
                    return false;
                default:
                    interaction.editReply(translator.translateUppercase("an error occured while processing the creation of the team") + " - " + translator.translateUppercase("please try again or contact an admin"));
                    break;
            }
            return false
        }
        dbGroup = teamCreationReturn;

        let guildMember = interaction.guild?.members.cache.get(teamLeader.id);
        if (guildMember) {
            guildMember.roles.add(dbGroup.id);
        }

        return dbGroup;
    }
};