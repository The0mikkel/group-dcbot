import { Message } from "discord.js";
import BotSystem from "../../data/BotSystem";

require("dotenv").config();
const { MessageEmbed } = require('discord.js');
const addGuild = require("./../../data/guild/add-guild")

module.exports = {
	name: 'help',
	description: 'List all of my commands or info about a specific command.',
	aliases: ['commands'],
	usage: '[command name]',
	cooldown: 5,
	execute(message: Message, args: any) {
		let data = [];
		let commands = BotSystem.getInstance().commands;

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

            const image = message.client.user?.avatarURL() ?? "";

			const exampleEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Command list:')
				.setDescription(commands.map(command => command.name).join('\n'))
				.addFields({ name: 'Prefix:', value: (BotSystem.getInstance().guild ?? addGuild.execute(message.guild)).config.prefix })
				.setFooter({ text: 'Grouper', iconURL: image });

			message.channel.send({ embeds: [exampleEmbed] });
			return;
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			return message.reply('that\'s not a valid command!');
		}

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${(BotSystem.getInstance().guild ?? addGuild.execute(message.guild)).config.prefix}${command.name} ${command.usage}`);

		if (command.cooldown) data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

		console.log(data)
		// message.channel.send(data, { split: true });
	},
};