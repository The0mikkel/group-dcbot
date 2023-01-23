import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, Message, SlashCommandBuilder } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command/Command";
import Commands from "../../data/Command/Commands";
import CommandType from "../../data/Command/Interfaces/CommandType";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import Translate from "../../data/Language/Translate";

export default class help extends UtilityCommand {
	private translator = Translate.getInstance();

	constructor() {
		super(
			'help',
			'help command description',
			false,
			false,
			1,
			'[command name]',
			undefined,
			[],
			UserLevel.user,
			['commands', 'help'],
		)

		this.typemap = Commands.commandTypeMap;
		this.pages = [];
		this.image = BotSystem.client?.user?.avatarURL() ?? "";
	}

	slashCommand(): SlashCommandBuilder 
	{
		let command = super.slashCommand();

		command.setNameLocalizations({
			"en-US": "help",
			"da": "hjælp"
		});

		command.setDescriptionLocalizations({
			"en-US": "Get help on how to use the bot",
			"da": "Få hjælp til hvordan du bruger boten"
		});

		command.addStringOption(option =>
			option.setName('command')
				.setNameLocalizations({
					"en-US": "command",
					"da": "kommando"
				})
				.setDescription("The command you want help with")
				.setDescriptionLocalizations({
					"en-US": "The command you want help with",
					"da": "Kommandoen du vil have hjælp med"
				})
				.setRequired(false)
				.setMinLength(1)
				.setAutocomplete(true)
		);
		
		return command;
	}

	async executeAutocomplete(interaction: AutocompleteInteraction<CacheType>, botSystem: BotSystem): Promise<void> {
		const allCommands = Commands.commands;

		let commandNames: string[] = allCommands.map(command => command.name);
		let commandAliases: string[] = [] // allCommands.map(command => command.aliases).flat();
		let commandNamesAndAliases = commandNames.concat(commandAliases);

		this.autocompleteHelper(interaction, commandNamesAndAliases);
	}

	async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<void> {
		this.translator = botSystem.translator;

		if (this.image == "") {
			this.image = BotSystem.client?.user?.avatarURL() ?? "";
		}

		let commands = Commands.commands;

		const commandSearched = interaction.options.getString('command');

		if (!commandSearched) { // General command
			let helpPage = new help();
			helpPage.pageHelp(interaction, botSystem);
			return;
		}

		const name = commandSearched.toLowerCase();

		if (name == "all") {
			this.commonHelp(interaction, botSystem);
			return;
		}

		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			interaction.editReply(this.translator.translate("that's not a valid command!"));
			return
		}

		this.commandSpecificHelp(interaction, botSystem, command);
	}

	typemap: Map<string, Command[]>;
	pages: CommandType[];
	image: string;

	private async pageHelp(interaction: ChatInputCommandInteraction, botSystem: BotSystem, page: string = this.category) {

		const pageContent = await this.generateHelpPage(page, interaction, botSystem);
		if (!pageContent) {
			return;
		}

		let helpMessage = await interaction.editReply(pageContent);

		const collector = helpMessage.createMessageComponentCollector({ time: 150000 });
		collector.on('collect', async i => {
			if (!i.customId) {
				return;
			}

			if (i.customId.startsWith("help-message;")) {
				const pageContent = await this.generateHelpPage(i.customId.split(";")[1], interaction, botSystem);
				if (!pageContent) {
					return;
				}
				await i.update(pageContent);
			}
		});
	}

	async generateHelpPage(page: string = this.category, interaction: ChatInputCommandInteraction, botSystem: BotSystem): Promise<{ embeds: any[], components: any[] } | false> {
		if (!this.typemap.has(page)) {
			return false;
		}

		if (this.pages.length <= 0) {
			let pages: CommandType[];
			pages = [];

			for (const commandListArray of this.typemap) {
				const commandList = commandListArray[1];
				if (!commandList[0]) continue;

				let hasOne = false;
				for (let index = 0; index < commandList.length; index++) {
					let command = commandList[index];
					const authorized = (await command.authorized(interaction, botSystem));
					if (authorized === true) {
						hasOne = true;
					}
				}
				if (!hasOne) {
					continue;
				}

				pages.push(commandList[0]);
			};

			this.pages = pages;
		}

		let pageCommands = this.typemap.get(page);
		if (!pageCommands) {
			return false;
		}


		let pageText = `***${pageCommands[0].categoryEmoji} ${page}*** \n`;

		for (let index = 0; index < pageCommands.length; index++) {
			let command = pageCommands[index];
			if ((await command.authorized(interaction, botSystem)) == true) {
				pageText += `**${command.name}**\n${command.description}\n`;
			}
		}

		const pageEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(this.translator.translate("Command list") + ':')
			.setDescription(pageText)
			.addFields({ name: this.translator.translate('detailed help') + ':', value: this.translator.translate("write the command name, after the help command, to see more details about the command") });

		const buttons = new ActionRowBuilder<ButtonBuilder>();
		for (let index = 0; index < this.pages.length; index++) {
			try {
				const buttonType = page == this.pages[index].category ? ButtonStyle.Success : ButtonStyle.Secondary;
				buttons.addComponents(
					new ButtonBuilder()
						.setCustomId(`help-message;${this.pages[index].category}`)
						.setLabel(`${this.pages[index].categoryEmoji} ${this.pages[index].category}`)
						.setStyle(buttonType),
				);
			} catch (error) {
				console.error(error);
			}
		}

		return { embeds: [pageEmbed], components: [buttons] };
	}

	private commonHelp(interaction: ChatInputCommandInteraction, botSystem: BotSystem) {
		let commands = Commands.commands;

		const exampleEmbed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(this.translator.translate("Command list") + ':')
			.setDescription(commands.map(command => command.name).join('\n'))
			.addFields({ name: this.translator.translate('detailed help') + ':', value: this.translator.translate("write the command name, after the help command, to see more details about the command") });

		interaction.editReply({ embeds: [exampleEmbed] });
		return;
	}

	private commandSpecificHelp(interaction: ChatInputCommandInteraction, botSystem: BotSystem, command: Command) {
		let data = [];
		data.push(`**${(this.translator.translate("name"))}:** ${command.name}`);

		let translatedAliases: string[] = [];
		// if (command.aliases.length > 0) data.push(`**${this.translator.translate("aliases")}:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**${this.translator.translate("description")}:** ${command.description}`);
		// if (command.usage) data.push(`**${this.translator.translate("usage")}:** /${command.name} ${command.usage}`);

		if (command.cooldown > 0) data.push(`**${this.translator.translate("Cooldown")}:** ${command.cooldown || 3} ${botSystem.translator.translateUppercase("second(s)")}`);

		const specificHelp = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(this.translator.translate("Command list") + ':')
			.setDescription(data.join('\n'))

		interaction.editReply({ embeds: [specificHelp] });
	}
};