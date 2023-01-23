import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { InviteType } from "../../data/Guild/InviteType";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";
import { UserLevel } from "../../data/Command/UserLevel";
import Team from "../../data/Group/Team";
import Command from "../../data/Command/Command";

require("dotenv").config();

export default class TeamInvite extends TeamCommand {
    shortDescription: string = "Invite a new member to the team";

    constructor() {
        super(
            "team-invite",
            'Invite a new member to the team',
            true,
            true,
            2,
            '[team] [team member]',
            undefined,
            undefined,
            UserLevel.team,
            ["invite", "invite-to-team"]
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "team-invite",
            "da": "hold-invite"
        });

        command.setDescriptionLocalizations({
            "en-US": "Invite a new member to the team",
            "da": "Inviter en ny medlem til holdet"
        });

        command.addStringOption(option =>
            option.setName('team')
                .setNameLocalizations({
                    "en-US": "team",
                    "da": "hold"
                })
                .setDescription("The team you want to invite a new member to")
                .setDescriptionLocalizations({
                    "en-US": "The team you want to invite a new member to",
                    "da": "Holdet du vil invitere en ny medlem til"
                })
                .setRequired(true)
                .setMinLength(1)
                .setAutocomplete(true)
        );

        command.addUserOption(option =>
            option.setName('team-member')
                .setNameLocalizations({
                    "en-US": "team-member",
                    "da": "hold-medlem"
                })
                .setDescription("The member you want to invite to the team")
                .setDescriptionLocalizations({
                    "en-US": "The member you want to invite to the team",
                    "da": "Medlemmet du vil invitere til holdet"
                })
                .setRequired(true)
        );

        return command;
    }

    async executeAutocomplete(interaction: AutocompleteInteraction<CacheType>, botSystem: BotSystem): Promise<void> {
        const teams = await DBGroup.loadFromGuild(botSystem.guild?.id);
        if (teams == undefined) {
            return;
        }

        let filteretTeams: DBGroup[] = [];
        for (let team of teams) {
            if (await BotSystem.checkUserHasRole(interaction, interaction.user, team.id)) {
                filteretTeams.push(team);
            }
        }
        let teamNames = filteretTeams.map(team => team.name).sort();

        this.autocompleteHelper(
            interaction,
            teamNames
        );
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {
        const translator = botSystem.translator;

        botSystem.guild?.teamConfig.filterRemoved(interaction);
        await botSystem.guild?.save();

        if (!interaction.guild) {
            interaction.editReply({ content: translator.translateUppercase("i can't execute that command outside guilds") });
            return;
        }

        if (
            !interaction.member
        ) {
            interaction.editReply(translator.translateUppercase("you don't have permission to add new team members"));
            return;
        }

        if (
            botSystem.guild?.teamConfig.teamInviteType == InviteType.admin
            && (this.level = UserLevel.admin)
            && !this.authorized(interaction, botSystem)
        ) {
            interaction.editReply(translator.translateUppercase("you don't have permission to add new team members") + " - " + translator.translateUppercase("only admins can do that"));
            return;
        }

        let roleId: string | undefined;
        let groupName: string;
        groupName = ASCIIFolder.foldReplacing(interaction.options.getString("team", true).trim());
        roleId = interaction.guild?.roles.cache.find(role => role.name === groupName)?.id;

        if (!roleId) {
            interaction.editReply(translator.translateUppercase("the team does not exist"));
            return;
        }

        let role: DBGroup;
        let loadReturn = await DBGroup.load(roleId ?? "") ?? undefined;
        if (loadReturn == undefined) {
            interaction.editReply(translator.translateUppercase("the team does not exist"));
            return;
        } else {
            role = loadReturn
        }

        if (!(await this.authorizedAdmin(interaction, botSystem) && await this.authorizedTeamAdmin)) {
            if (botSystem.guild?.teamConfig.teamInviteType == InviteType.leader && !(await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
                let currentUser = await interaction.guild?.members.fetch(interaction.user.id);
                if (!(currentUser?.roles.cache.has(role.id) && role?.teamLeader == interaction.user.id)) {
                    interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("the team leader")]));
                    return;
                }
            } else if (botSystem.guild?.teamConfig.teamInviteType == InviteType.team && !(await BotSystem.checkIfAdministrator(interaction, interaction.user))) {
                let currentUser = await interaction.guild?.members.fetch(interaction.user.id);
                if (!currentUser?.roles.cache.has(role.id)) {
                    interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("a member of the team")]));
                    return;
                }
            }
        }

        let member = await interaction.guild.members.fetch(interaction.options.getUser("team-member", true).id);
        if (member) Team.invite(botSystem, role, member, interaction);

        interaction.editReply(translator.translateUppercase(`Invites to team has been send to all mentioned users`));
    }
};