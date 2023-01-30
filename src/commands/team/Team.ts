import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, Message, Role, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";

require("dotenv").config();

export default class Team extends TeamCommand {
    shortDescription: string = "Get information about a team";

    constructor() {
        super(
            "team",
            'Get information about a team',
            true,
            true,
            1,
            '[team]'
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "team",
            "da": "hold"
        });

        command.setDescriptionLocalizations({
            "en-US": "Get information about a team",
            "da": "Få information om et hold"
        });

        command.addStringOption(option =>
            option.setName('team')
                .setDescription("The team you want to get information about")
                .setDescriptionLocalizations({
                    "en-US": "The team you want to get information about",
                    "da": "Holdet du vil have information om"
                })
                .setRequired(true)
                .setMinLength(1)
                .setAutocomplete(true)
        );

        return command;
    }

    async executeAutocomplete(interaction: AutocompleteInteraction<CacheType>, botSystem: BotSystem): Promise<void> {
        const teams = await DBGroup.loadFromGuild(botSystem.guild?.id);
        if (teams == undefined) {
            return;
        }

        const teamNames = teams.map(team => team.name);

        this.autocompleteHelper(interaction, teamNames);
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem, args: any): Promise<void> {
        const translator = botSystem.translator;

        botSystem.guild?.teamConfig.filterRemoved(interaction);
        await botSystem.guild?.save();

        let teamName = interaction.options.getString('team', true) ?? "";
        if (teamName.length < 1) {
            interaction.editReply(translator.translateUppercase(`You need to specify a group`));
            return;
        }

        let DiscordRole: Role | undefined;
        let groupName: string;
        var rawGroupName = teamName;
        for (const word in args) {
            rawGroupName = rawGroupName + args[word] + " ";
        }

        groupName = ASCIIFolder.foldReplacing(rawGroupName.trim());
        DiscordRole = interaction.guild?.roles.cache.find(role => role.name === groupName);

        if (!DiscordRole) {
            interaction.editReply(translator.translateUppercase("the team does not exist"));
            return;
        }

        let role = await DBGroup.load(DiscordRole.id ?? "");
        if (role == undefined) {
            interaction.editReply(translator.translateUppercase("the team does not exist"));
            return;
        }

        const teamInformation = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(translator.translateUppercase('Team information') + ':')
            .setDescription(`
                    **${translator.translateUppercase("name")}:** ${DiscordRole.name} 
                    **${translator.translateUppercase("team leader")}:** ${(await interaction.guild?.members.fetch(role.teamLeader))?.displayName ?? "*-*"} 
                `)
            .addFields({
                name: translator.translateUppercase("Members") + ":",
                value: DiscordRole.members.map(member => member.displayName).join("\n")
            })
        interaction.editReply({ embeds: [teamInformation] });

    }
};