import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { InviteType } from "../../data/Guild/InviteType";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";
import { UserLevel } from "../../data/Command/UserLevel";
import Team from "../../data/Group/Team";
import Command from "../../data/Command/Command";
import { envType } from "../../data/envType";

require("dotenv").config();

export default class TeamInvite extends TeamCommand {
    shortDescription: string = "Invite a new member to the team";

    private userOptions: { name: string, required: boolean }[] = [];
    private userCount: number = 15;

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

        for (let index = 2; index <= this.userCount; index++) {
            let required = false;
            let object = {
                name: 'user' + index,
                required: required,
            };
            this.userOptions.push(object)
        }
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

        let i = 1;
        this.userOptions.forEach(userOption => {
            command.addUserOption(option =>
                option.setName(userOption.name)
                    .setDescription("user to add")
                    .setDescriptionLocalizations({
                        "en-US": "The member you want to invite to the team",
                        "da": "Medlemmet du vil invitere til holdet"
                    })
                    .setNameLocalizations({
                        "en-US": `team-member-${i++}`,
                        "da": `hold-medlem-${i}`
                    })
                    .setRequired(userOption.required)
            );
        });

        return command;
    }

    async executeAutocomplete(interaction: AutocompleteInteraction<CacheType>, botSystem: BotSystem): Promise<void> {
        this.autocompleteHelper(
            interaction,
            await Team.getAllTeamNames(interaction, botSystem, await this.authorizedAdmin(interaction, botSystem))
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
            && !(await this.authorizedAdmin(interaction, botSystem))
        ) {
            if (botSystem.env == envType.dev) console.log("team invite: not authorized admin", botSystem.guild?.teamConfig.teamInviteType, (await this.authorizedAdmin(interaction, botSystem)));
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

        let administrator = await BotSystem.checkIfAdministrator(interaction, interaction.user);
        let admin = await this.authorizedAdmin(interaction, botSystem);
        let teamAdmin = await this.authorizedTeamAdmin(interaction, botSystem);

        if (!administrator && !admin && !teamAdmin) {
            let currentUser;
            switch (botSystem.guild?.teamConfig.teamInviteType) {
                case InviteType.leader:
                    currentUser = await interaction.guild?.members.fetch(interaction.user.id);
                    if (!(currentUser?.roles.cache.has(role.id) && role?.teamLeader == interaction.user.id)) {
                        interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("the team leader")]));
                        return;
                    }
                    break;
                case InviteType.team:
                    currentUser = await interaction.guild?.members.fetch(interaction.user.id);
                    if (!currentUser?.roles.cache.has(role.id)) {
                        interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("a member of the team")]));
                        return;
                    }
                    break;
                case InviteType.admin:
                default:
                    interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("an administrator")]));
                    return;
            }
        }

        let member = await interaction.guild.members.fetch(interaction.options.getUser("team-member", true)?.id ?? "");
        if (member) Team.invite(botSystem, role, member, interaction);

        this.userOptions.forEach(async (userOption) => {
            if (!interaction.guild) return;
            let mentionedUser = interaction.options.getUser(userOption.name, false);
            if (!mentionedUser) return;

            let member = await interaction.guild.members.fetch(mentionedUser.id ?? "");
            if (member) Team.invite(botSystem, role, member, interaction);
        });

        interaction.editReply(translator.translateUppercase(`Invites to team has been send to all mentioned users`));
    }
};