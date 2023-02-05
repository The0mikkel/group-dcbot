import { ActionRowBuilder, CommandInteraction, Interaction, Message, ModalActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import BotSystem from "../../data/BotSystem";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";

require("dotenv").config();

export default class Group extends GroupCommand {
    shortDescription: string = "Create a group (role only)";
    deferReply: boolean = false;

    private userOptions: {name: string, required: boolean}[] = [];
    private userCount: number = 5;

    constructor() {
        super(
            'group',
            'group command description',
            true,
            true,
            2,
            '[group name] [group members]',
            undefined,
            [
                "ManageRoles"
            ],
            UserLevel.admin
        )

        for (let index = 1; index <= this.userCount; index++) {
            let required = index == 1 ? true : false;
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
            "en-US": "group",
            "da": "gruppe"
        });

        command.setDescriptionLocalizations({
            "en-US": "Create a group (role only)",
            "da": "Opret en gruppe (kun rolle)"
        });

        command.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

        command.addStringOption(option =>
            option.setName('name')
                .setDescription("name of the group")
                .setDescriptionLocalizations({
                    "en-US": "The name of the group",
                    "da": "Navnet på gruppen"
                })
                .setNameLocalizations({
                    "en-US": "name",
                    "da": "navn"
                })
                .setMaxLength(100)
                .setMinLength(1)
                .setRequired(true)
        );

        let i = 0;
        this.userOptions.forEach(userOption => {
            command.addUserOption(option =>
                option.setName(userOption.name)
                    .setDescription("user to add")
                    .setDescriptionLocalizations({
                        "en-US": "The user to add",
                        "da": "Brugeren der skal tilføjes"
                    })
                    .setNameLocalizations({
                        "en-US": `user-${i++}`,
                        "da": `bruger-${i}`
                    })
                    .setRequired(userOption.required)
            );
        });


        return command;
    }

    async execute(interaction: CommandInteraction, botSystem: BotSystem) {
        // Check permissions
        if (!this.authorize(interaction, botSystem) || !interaction.isChatInputCommand() || !interaction.guild) {
            return;
        }

        const groupName = ASCIIFolder.foldReplacing(interaction.options.getString('name', true) ?? "");

        if (groupName.length < 1) {
            interaction.reply({ content: botSystem.translator.translateUppercase("group name must be at least 1 character long"), ephemeral: this.ephemeral });
            return;
        }

        let role = await interaction.guild.roles.create({
            name: groupName,
            color: undefined,
            mentionable: true,
            reason: 'Group was created by grouper, as per request by ' + interaction.member?.user.username,
        })

        try {
            await (new DBGroup(role.id, interaction.guild.id, role.name, interaction.member?.user.id ?? "", "", Date.now())).save()
        } catch (error) {
            console.log(`Error creating group in command "${this.name}"`, error);
        }

        let users = [];

        this.userOptions.forEach(userOption => {
            let user = interaction.options.getUser(userOption.name, userOption.required);
            if (user) {
                try {
                    if (interaction.guild) interaction.guild.members.cache.get(user.id)?.roles.add(role.id);
                    users.push(user.username);
                } catch (error) {
                    console.log(`There was an error adding user: ${user.username} for the role "${groupName}" and this was caused by: ${error}`)
                }
            }
        });

        interaction.reply({ content: botSystem.translator.translateUppercase("group :group name: was created", [role]), ephemeral: this.ephemeral });
        return;
    }

    private authorize(interaction: CommandInteraction | ModalSubmitInteraction, botSystem: BotSystem): boolean {
        if (
            !interaction.member
        ) {
            if (interaction instanceof CommandInteraction) interaction.editReply(botSystem.translator.translateUppercase("you do not have the right permissions to use this command"));
            else if (interaction instanceof ModalSubmitInteraction) interaction.reply({ content: botSystem.translator.translateUppercase("you do not have the right permissions to use this command"), ephemeral: true });
            return false;
        }

        if (!interaction.guild) {
            if (interaction instanceof CommandInteraction) interaction.editReply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            else if (interaction instanceof ModalSubmitInteraction) interaction.reply({ content: botSystem.translator.translateUppercase("i can't execute that command outside guilds"), ephemeral: true });
            return false;
        }

        return true;
    }
};