import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";

require("dotenv").config();
const { MessageEmbed } = require('discord.js');

export default class help extends Command {
	constructor() {
		super(
			'help',
			'List all of my commands or info about a specific command.',
			false,
			false,
			1,
			'[command name]',
			undefined,
			undefined,
			['commands'],
		)
	}

	async execute(message: Message, args: any): Promise<void> {
		let data = [];
		let commands = BotSystem.getInstance().commands;
		const image = message.client.user?.avatarURL() ?? "";

		if (!args.length) {
			// data.push('Here\'s a list of all my commands:');
			// data.push(commands.map(command => command.name).join(', '));
			// data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);

			// console.log(data)
			// return message.channel.send({embed: {
			// 	color: 3447003,
			// 	title: "Command list:",
			// 	fields: [
			// 	  { value: commands.map(command => command.name).join('\n')+"\nYou can send \`${prefix}help [command name]\` to get info on a specific command!", inline: true},
			// 	]
			//   }
			// });


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

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			message.reply('that\'s not a valid command!');
			return
		}

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${(BotSystem.getInstance().guild)?.config.prefix}${command.name} ${command.usage}`);

		if (command.cooldown) data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

		const specificHelp = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Command usage:')
				.setDescription(data.join('\n'))
				.addFields({ name: 'Prefix:', value: (BotSystem.getInstance().guild)?.config.prefix })
				.setFooter({ text: 'Grouper', iconURL: image });
		message.channel.send({ embeds: [specificHelp] });
	}
};