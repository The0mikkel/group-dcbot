import { Message } from "discord.js";
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
	}

	async execute(message: Message, args: any): Promise<void> {
		let commands = BotSystem.getInstance().commands;

		if (!args.length) { // General command
			this.commonHelp(message);
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

	private commonHelp(message: Message) {
		let commands = BotSystem.getInstance().commands;
		const image = message.client.user?.avatarURL() ?? "";
		
		const exampleEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('Command list:')
			.setDescription(commands.map(command => command.name).join('\n'))
			.addFields({ name: 'Prefix:', value: (BotSystem.getInstance().guild)?.config.prefix })
			.addFields({ name: 'Detailed help:', value: "Write the command name, after the help command, to see more details about the command" })
			.setFooter({ text: 'Grouper', iconURL: image });

		message.channel.send({ embeds: [exampleEmbed] });
		return;
	}

	private commandSpecificHelp(message: Message, command: Command) {
		let data = [];
		const image = message.client.user?.avatarURL() ?? "";
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
			.setFooter({ text: 'Grouper', iconURL: image });
		message.channel.send({ embeds: [specificHelp] });
	}
};