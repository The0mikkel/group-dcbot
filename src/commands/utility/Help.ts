import { Message, MessageActionRow, MessageButton } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command/Command";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";

require("dotenv").config();
const { MessageEmbed } = require('discord.js');

export default class help extends UtilityCommand {
	constructor() {
		super(
			'help',
			'List all of my commands or info about a specific command.',
			false,
			false,
			1,
			'[command name]',
			undefined,
			[],
			['commands'],
		)

		this.typemap = BotSystem.getInstance().commandTypeMap;
		this.pages = [];
		this.pageEmojis = [];
		this.image = BotSystem.client?.user?.avatarURL() ?? "";
	}

	typemap: Map<string, Command[]>;
	pages: string[];
	pageEmojis: string[];
	image: string;

	async execute(message: Message, args: any): Promise<void> {
		if (this.image == "") {
			this.image = BotSystem.client?.user?.avatarURL() ?? "";
		}

		let commands = BotSystem.getInstance().commands;

		if (!args.length) { // General command
			this.pageHelp(message);
			return;
		}

		const name = args[0].toLowerCase();

		if (name == "all") {
			this.commonHelp(message);
			return;
		}

		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			message.reply('that\'s not a valid command!');
			return
		}

		this.commandSpecificHelp(message, command);
	}

	private async pageHelp(message: Message, page: string = this.category) {
		
		const pageContent = this.generateHelpPage(page);
		if (!pageContent) {
			return;
		}

		let helpMessage = await message.channel.send(pageContent);

		const collector = helpMessage.createMessageComponentCollector({ time: 150000 });
		collector.on('collect', async i => {
			if (!i.customId) {
				return;
			}

			if (i.customId.startsWith("help-message;")) {
				const pageContent = this.generateHelpPage(i.customId.split(";")[1]);
				if (!pageContent) {
					return;
				}
				await i.update(pageContent);
			}
		});
		collector.on('end', () => BotSystem.autoDeleteMessageByUser(helpMessage, 0));
	}

	generateHelpPage(page: string = this.category): { embeds: any[], components: any[] } | false  {
		if (!this.typemap.has(page)) {
			return false;
		}

		if (this.pages.length <= 0) {
			let pages: string[];
			let pageEmojis: string[];
			pages = [];
			pageEmojis = [];
			this.typemap.forEach(commandList => {
				if (!commandList[0]) return;
				pages.push(commandList[0].category);
				pageEmojis.push(commandList[0].categoryEmoji);
			});

			this.pages = pages;
			this.pageEmojis = pageEmojis;
		}

		let pageCommands = this.typemap.get(page);
		if (!pageCommands) {
			return false;
		}


		let pageText = `***${pageCommands[0].categoryEmoji} ${page}*** \n`;
		pageCommands.forEach(command => {
			pageText += `**${command.name}**\n${command.description}\n`;
		});

		const pageEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Command list:')
			.setDescription(pageText)
			.addFields({ name: 'Prefix:', value: (BotSystem.getInstance().guild)?.config.prefix })
			.addFields({ name: 'Detailed help:', value: "Write the command name, after the help command, to see more details about the command" })
			.setFooter({ text: 'Grouper', iconURL: this.image });

		const buttons = new MessageActionRow();
		for (let index = 0; index < this.pages.length; index++) {
			try {
				const buttonType = page == this.pages[index] ? 'SUCCESS' : 'SECONDARY';
				buttons.addComponents(
					new MessageButton()
						.setCustomId(`help-message;${this.pages[index]}`)
						.setLabel(`${this.pageEmojis[index]} ${this.pages[index]}`)
						.setStyle(buttonType),
				);
			} catch (error) {
				console.error(error);
			}
		}

		return { embeds: [pageEmbed], components: [buttons] };
	}

	private commonHelp(message: Message) {
		let commands = BotSystem.getInstance().commands;

		const exampleEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Command list:')
			.setDescription(commands.map(command => command.name).join('\n'))
			.addFields({ name: 'Prefix:', value: (BotSystem.getInstance().guild)?.config.prefix })
			.addFields({ name: 'Detailed help:', value: "Write the command name, after the help command, to see more details about the command" })
			.setFooter({ text: 'Grouper', iconURL: this.image });

		message.channel.send({ embeds: [exampleEmbed] });
		return;
	}

	private commandSpecificHelp(message: Message, command: Command) {
		let data = [];
		data.push(`**Name:** ${command.name}`);

		if (command.aliases.length > 0) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${(BotSystem.getInstance().guild)?.config.prefix}${command.name} ${command.usage}`);

		if (command.cooldown > 0) data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

		const specificHelp = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Command usage:')
			.setDescription(data.join('\n'))
			.addFields({ name: 'Prefix:', value: (BotSystem.getInstance().guild)?.config.prefix })
			.setFooter({ text: 'Grouper', iconURL: this.image });
		message.channel.send({ embeds: [specificHelp] });
	}
};