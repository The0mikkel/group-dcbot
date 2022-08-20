import { Message, MessageActionRow, MessageButton } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command/Command";
import Commands from "../../data/Command/Commands";
import CommandType from "../../data/Command/Types/CommandType";
import UtilityCommand from "../../data/Command/Types/UtilityCommand";
import { UserLevel } from "../../data/Command/UserLevel";

require("dotenv").config();
import { MessageEmbed } from 'discord.js';
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

	async execute(message: Message, botSystem: BotSystem, args: any): Promise<void> {
		this.translator = botSystem.translator;

		if (this.image == "") {
			this.image = BotSystem.client?.user?.avatarURL() ?? "";
		}

		let commands = Commands.commands;

		if (!args.length) { // General command
			let helpPage = new help();
			helpPage.pageHelp(message, botSystem);
			return;
		}

		const name = args[0].toLowerCase();

		if (name == "all") {
			this.commonHelp(message, botSystem);
			return;
		}

		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			message.reply(this.translator.translate("that's not a valid command!"));
			return
		}

		this.commandSpecificHelp(message, botSystem, command);
	}

	typemap: Map<string, Command[]>;
	pages: CommandType[];
	image: string;

	private async pageHelp(message: Message, botSystem: BotSystem, page: string = this.category) {

		const pageContent = await this.generateHelpPage(page, message, botSystem);
		if (!pageContent) {
			return;
		}

		BotSystem.autoDeleteMessageByUser(message, 0);

		let helpMessage = await message.channel.send(pageContent);

		const collector = helpMessage.createMessageComponentCollector({ time: 150000 });
		collector.on('collect', async i => {
			if (!i.customId) {
				return;
			}

			if (i.customId.startsWith("help-message;")) {
				const pageContent = await this.generateHelpPage(i.customId.split(";")[1], message, botSystem);
				if (!pageContent) {
					return;
				}
				await i.update(pageContent);
			}
		});
		collector.on('end', () => BotSystem.autoDeleteMessageByUser(helpMessage, 0));
	}

	async generateHelpPage(page: string = this.category, message: Message, botSystem: BotSystem): Promise<{ embeds: any[], components: any[] } | false> {
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
					const authorized = (await command.authorized(message, botSystem));
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
			if ((await command.authorized(message, botSystem)) == true) {
				pageText += `**${command.name}**\n${command.description}\n`;
			}
		}

		const pageEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(this.translator.translate("Command list")+':')
			.setDescription(pageText)
			.addFields({ name: this.translator.translate('prefix')+':', value: (botSystem.guild)?.config.prefix ?? "gr!" })
			.addFields({ name: this.translator.translate('detailed help')+':', value: this.translator.translate("write the command name, after the help command, to see more details about the command") })
			.setFooter({ text: this.translator.translate('grouper'), iconURL: this.image });

		const buttons = new MessageActionRow();
		for (let index = 0; index < this.pages.length; index++) {
			try {
				const buttonType = page == this.pages[index].category ? 'SUCCESS' : 'SECONDARY';
				buttons.addComponents(
					new MessageButton()
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

	private commonHelp(message: Message, botSystem: BotSystem) {
		let commands = Commands.commands;

		const exampleEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(this.translator.translate("Command list")+':')
			.setDescription(commands.map(command => command.name).join('\n'))
			.addFields({ name: this.translator.translate('prefix')+':', value: (botSystem.guild)?.config.prefix ?? "gr!" })
			.addFields({ name: this.translator.translate('detailed help')+':', value: this.translator.translate("write the command name, after the help command, to see more details about the command") })
			.setFooter({ text: this.translator.translate('grouper'), iconURL: this.image });

		message.channel.send({ embeds: [exampleEmbed] });
		return;
	}

	private commandSpecificHelp(message: Message, botSystem: BotSystem, command: Command) {
		let data = [];
		data.push(`**${(this.translator.translate("name"))}:** ${command.name}`);

		let translatedAliases: string[] = [];
		if (command.aliases.length > 0) data.push(`**${this.translator.translate("aliases")}:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**${this.translator.translate("description")}:** ${command.description}`);
		if (command.usage) data.push(`**${this.translator.translate("usage")}:** ${(botSystem.guild)?.config.prefix}${command.name} ${command.usage}`);

		if (command.cooldown > 0) data.push(`**${this.translator.translate("Cooldown")}:** ${command.cooldown || 3} ${botSystem.translator.translateUppercase("second(s)")}`);

		const specificHelp = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(this.translator.translate("Command list")+':')
			.setDescription(data.join('\n'))
			.addFields({ name: this.translator.translate('prefix')+':', value: (botSystem.guild)?.config.prefix ?? "gr!" })
			.setFooter({ text: this.translator.translate('grouper'), iconURL: this.image });
		message.channel.send({ embeds: [specificHelp] });
	}
};