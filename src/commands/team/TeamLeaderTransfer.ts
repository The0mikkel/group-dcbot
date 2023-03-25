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
    shortDescription: string = "Transfer team leader role for team, to another user";

    constructor() {
        super(
            "transfer-team-leader",
            'Transfer team leader role for team, to another user',
            true,
            true,
            2,
            '[team] [new team leader]',
            undefined,
            undefined,
            UserLevel.teamLeader,
            undefined
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "transfer-team-leader",
            "da": "overfør-hold-leader"
        });

        command.setDescriptionLocalizations({
            "en-US": "transfer team leader role for team, to another user",
            "da": "overfør holdleder rolle til et andet hold-medlem"
        });

        command.addStringOption(option =>
            option.setName('team')
                .setNameLocalizations({
                    "en-US": "team",
                    "da": "hold"
                })
                .setDescription("The team you want to transfer the team leader role to another user for")
                .setDescriptionLocalizations({
                    "en-US": "The team you want to transfer the team leader role to another user for",
                    "da": "Holdet du vil overføre holdleder rolle til et andet hold-medlem for"
                })
                .setRequired(true)
                .setMinLength(1)
                .setAutocomplete(true)
        );

        command.addUserOption(option =>
            option.setName('new-team-leader')
                .setNameLocalizations({
                    "en-US": "new-team-leader",
                    "da": "ny-hold-leader"
                })
                .setDescription("The member you want to transfer the team leader role to")
                .setDescriptionLocalizations({
                    "en-US": "The member you want to transfer the team leader role to",
                    "da": "Medlemmet du vil overføre holdleder rolle til"
                })
                .setRequired(true)
        );

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
            interaction.editReply(translator.translateUppercase("you don't have permission to transfer team leader roles"));
            return;
        }

        if (
            botSystem.guild?.teamConfig.teamTransferType == UserLevel.admin
            && !(await this.authorizedAdmin(interaction, botSystem))
        ) {
            if (botSystem.env == envType.dev) console.log("team transfer: not authorized admin", botSystem.guild?.teamConfig.teamInviteType, (await this.authorizedAdmin(interaction, botSystem)));
            interaction.editReply(translator.translateUppercase("you don't have permission to transfer team leader roles") + " - " + translator.translateUppercase("only admins can do that"));
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

        let admin = await this.authorizedAdmin(interaction, botSystem);
        let teamAdmin = await this.authorizedTeamAdmin(interaction, botSystem);
        let teamLeader = await this.authorizedTeamLeader(interaction, botSystem);

        let memberToTransferTo = await interaction.guild.members.fetch(interaction.options.getUser("new-team-leader", true)?.id ?? "");
        if (!memberToTransferTo) {
            interaction.editReply(translator.translateUppercase("the new team leader does not exist"));
            return;
        }

        if (!admin) {
            let currentUser;
            switch (botSystem.guild?.teamConfig.teamTransferType) {
                case UserLevel.teamLeader:
                    currentUser = await interaction.guild?.members.fetch(interaction.user.id);
                    if (!(teamLeader && currentUser.roles.cache.has(role.id) && role.teamLeader == interaction.user.id)) {
                        interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("the team leader")]));
                        return;
                    }

                    if (!(memberToTransferTo.roles.cache.has(role.id))) {
                        interaction.editReply(translator.translateUppercase("the new team leader needs to be a part of the team"));
                        return;
                    }
                    break;
                case UserLevel.teamAdmin:
                    if (!teamAdmin) {
                        interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("a team admin")]));
                        return;
                    }
                default:
                    if (!admin) {
                        interaction.editReply(translator.translateUppercase("this action can only be performed by :role:", [translator.translate("an administrator")]));
                        return;
                    }
                    break;
            }
        }
        
        Team.transferTeamLeader(interaction, botSystem, role, memberToTransferTo);

        interaction.editReply(translator.translateUppercase(`The team leader has been transfered to :member:`, [memberToTransferTo?.user.username ?? ""]));
    }
};