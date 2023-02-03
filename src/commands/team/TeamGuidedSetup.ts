import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, Message, ModalActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, Role, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import { DBGuidedSetup } from "../../data/Group/DBGuidedSetup";
import TeamCreate from "./TeamCreate";

require("dotenv").config();

export default class TeamGuidedSetup extends TeamCommand {
    shortDescription: string = "Create a guided setup for a team";
    isModal: boolean = true;
    deferReply: boolean = false;

    constructor() {
        super(
            'guided-setup',
            'create a guided setup for a team',
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            [
                "Administrator"
            ],
            UserLevel.admin
        )
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "guided-setup",
            "da": "guide-oprettelse"
        });

        command.setDescriptionLocalizations({
            "en-US": "Create a guided setup for a team",
            "da": "Opret en guide til oprettelse af et hold"
        });

        command.addSubcommand(subcommand =>
            subcommand.setName('create')
                .setNameLocalizations({
                    "en-US": "create",
                    "da": "opret"
                })
                .setDescription("Create a guided setup for a team")
                .setDescriptionLocalizations({
                    "en-US": "Create a guided setup for a team",
                    "da": "Opret en guide til oprettelse af et hold"
                })
        );

        command.addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setNameLocalizations({
                    "en-US": "delete",
                    "da": "slet"
                })
                .setDescription("Delete a guided setup for a team")
                .setDescriptionLocalizations({
                    "en-US": "Delete a guided setup for a team",
                    "da": "Slet en guide til oprettelse af et hold"
                })
        );

        command.addSubcommand(subcommand =>
            subcommand.setName('edit')
                .setNameLocalizations({
                    "en-US": "edit",
                    "da": "rediger"
                })
                .setDescription("Edit a guided setup for a team")
                .setDescriptionLocalizations({
                    "en-US": "Edit a guided setup for a team",
                    "da": "Rediger en guide til oprettelse af et hold"
                })
        );

        return command;
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {
        if (!interaction.guild) return;

        let subcommand = interaction.options.getSubcommand();

        // Check if a guided setup already exists
        let guidedSetup = await DBGuidedSetup.loadFromChannel(interaction.channelId);
        if (!guidedSetup) {
            // If not, create a new one
            guidedSetup = new DBGuidedSetup("", interaction.channelId, interaction.guild.id, null, interaction.user.id);
            await guidedSetup.save();
        } else if (subcommand === "create") {
            // If a guided setup already exists, edit it instead of creating a new one
            subcommand = "edit";
        }

        // get channel
        let channel = await interaction.guild.channels.fetch(guidedSetup.channelId);

        if (!channel || !channel.isTextBased()) {
            await interaction.reply({ content: botSystem.translator.translateUppercase('channel does not exist'), ephemeral: true });
            guidedSetup.delete();
            return;
        }

        // Get message
        let message: Message | undefined = await channel.messages.fetch(guidedSetup.messageId);
        if (!message && subcommand === "edit") {
            // If the message is not found, create a new one
            subcommand = "create";
        }

        // Create the modal
        let modal: ModalBuilder = new ModalBuilder();
        let textInput: TextInputBuilder = new TextInputBuilder();
        switch (subcommand) {
            default:
            case 'create':
                // Create a new guided setup
                modal.setCustomId(`guided-setup;${guidedSetup._id?.toString()};create`)
                    .setTitle(botSystem.translator.translateUppercase('create guided setup message'))

                textInput.setCustomId(`text`)
                    .setPlaceholder(botSystem.translator.translateUppercase("guided-setup modal text placeholder"))
                    .setMinLength(1)
                    .setMaxLength(2000)
                    .setLabel(botSystem.translator.translateUppercase("guided-setup modal text label"))
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph);

                break;
            case 'edit':
                // Edit an existing guided setup
                modal.setCustomId(`guided-setup;${guidedSetup._id?.toString()};edit`)
                    .setTitle('Edit a guided setup for creating a team')

                textInput.setCustomId(`text`)
                    .setPlaceholder(botSystem.translator.translateUppercase("guided-setup modal text placeholder"))
                    .setMinLength(1)
                    .setMaxLength(2000)
                    .setLabel(botSystem.translator.translateUppercase("guided-setup modal text label"))
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(message?.content ?? "---");
                break;
            case 'delete':
                // Delete an existing guided setup
                guidedSetup.delete();
                message?.delete();
                await interaction.reply({ content: botSystem.translator.translateUppercase('the guided setup has been deleted'), ephemeral: true });
                return;
        }

        const textRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(textInput);

        modal.addComponents(textRow);

        await interaction.showModal(modal);

        return;
    }

    async executeModal(interaction: ModalSubmitInteraction<CacheType> | ButtonInteraction<CacheType>, botSystem: BotSystem): Promise<void> {
        let customId: string = interaction.customId;
        const guidedSetup = await DBGuidedSetup.load(customId.split(";")[1] ?? "");

        if (!guidedSetup) {
            if (botSystem.env === "dev") console.log("Guided setup not found");
            await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup not found'), ephemeral: true });
            return;
        }

        let subcommand = customId.split(";")[2] ?? "";

        if (!subcommand || subcommand == "") {
            if (botSystem.env === "dev") console.log("Subcommand not found");
            await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup subcommand not found'), ephemeral: true });
            return;
        }

        if (!interaction.isModalSubmit()) {
            this.executeButton(interaction, botSystem, guidedSetup);
            return;
        }

        switch (subcommand) {
            case 'create':
                await this.handleCreate(interaction, botSystem, guidedSetup);
                return;
            case 'edit':
                await this.handleEdit(interaction, botSystem, guidedSetup);
                return;
        }

        if (botSystem.env === "dev") console.log("Subcommand not found");
        await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup subcommand not found'), ephemeral: true });
        return;
    }

    private async handleCreate(interaction: ModalSubmitInteraction<CacheType>, botSystem: BotSystem, guidedSetup: DBGuidedSetup): Promise<void> {
        // Get the text that the user entered
        let text = interaction.fields.getTextInputValue('text') ?? "";

        // Validate text
        if (text.length < 1 || text.length > 2000) {
            if (botSystem.env === "dev") console.log("Text not valid - length");
            await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup text validation restrictions'), ephemeral: true });
            return;
        }

        // Get channel
        let channel = await interaction.guild?.channels.fetch(guidedSetup.channelId);

        if (!channel) {
            if (botSystem.env === "dev") console.log("Channel not found");
            await interaction.reply({ content: botSystem.translator.translateUppercase('channel does not exist'), ephemeral: true });
            return;
        }

        // Prepare message
        let message: Message | undefined = undefined;
        if (!channel.isTextBased()) {
            if (botSystem.env === "dev") console.log("Channel not text based");
            interaction.reply({ content: botSystem.translator.translateUppercase('channel does not exist'), ephemeral: true });
            return;
        }

        // Setup team create button
        let button = new ButtonBuilder();
        button.setCustomId(`guided-setup;${guidedSetup._id?.toString()};create-team`)
            .setLabel(botSystem.translator.translateUppercase('create a team'))
            .setStyle(ButtonStyle.Success);

        let row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        // Create message
        message = await channel.send({ content: text, components: [row] });
        guidedSetup.messageId = message.id;
        guidedSetup.save();

        // Send success message to the user creating the guided setup
        await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup message has been created'), ephemeral: true });
    }

    private async handleEdit(interaction: ModalSubmitInteraction<CacheType>, botSystem: BotSystem, guidedSetup: DBGuidedSetup): Promise<void> {
        // Get the text that the user entered
        let text = interaction.fields.getTextInputValue('text') ?? "";

        // Validate text
        if (text.length < 1 || text.length > 2000) {
            if (botSystem.env === "dev") console.log("Text not valid - length");
            await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup text validation restrictions'), ephemeral: true });
            return;
        }

        // Get channel
        let channel = await interaction.guild?.channels.fetch(guidedSetup.channelId);

        if (!channel) {
            if (botSystem.env === "dev") console.log("Channel not found");
            await interaction.reply({ content: botSystem.translator.translateUppercase('channel does not exist'), ephemeral: true });
            return;
        }

        // Prepare message
        let message: Message | undefined = undefined;
        if (!channel.isTextBased()) {
            if (botSystem.env === "dev") console.log("Channel not text based");
            interaction.reply({ content: botSystem.translator.translateUppercase('channel does not exist'), ephemeral: true });
            return;
        }

        // Get message
        message = await channel.messages.fetch(guidedSetup.messageId);
        message.edit({ content: text });

        // Send success message to the user creating the guided setup
        await interaction.reply({ content: botSystem.translator.translateUppercase('guided setup message has been updated'), ephemeral: true });
    }


    private async executeButton(interaction: ButtonInteraction<CacheType>, botSystem: BotSystem, guidedSetup: DBGuidedSetup): Promise<void> {
        let modal: ModalBuilder = new ModalBuilder();
        let textInput: TextInputBuilder = new TextInputBuilder();

        modal.setCustomId((new TeamCreate).name)
            .setTitle(botSystem.translator.translateUppercase('create a team'))

        textInput.setCustomId(`name`)
            .setPlaceholder(botSystem.translator.translateUppercase('team name placeholder'))
            .setMinLength(1)
            .setMaxLength(100)
            .setLabel(botSystem.translator.translateUppercase('team name'))
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const textRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(textInput);

        modal.addComponents(textRow);

        await interaction.showModal(modal);
    }
};