import { Message } from "discord.js";

module.exports = {
	name: 'server',
	description: 'Display info about this server.',
	guildOnly: true,
	execute(message: Message) {
		if (message.guild != undefined) {
			message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}`);
		}
	},
};