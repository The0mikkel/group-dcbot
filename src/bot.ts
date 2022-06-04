import { BaseGuildTextChannel, Guild, Message } from "discord.js";
import { DBGuild } from "./data/guild/DBGuild";
import fs from 'fs';
import Discord from "discord.js";
import BotSystem from "./data/BotSystem";

// Initialize system
require("dotenv").config();
require('./setup.js');

const client = new Discord.Client({
	partials: ["MESSAGE", "CHANNEL"],
	intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGES]
});

const botSystem = BotSystem.getInstance();
botSystem.commands = new Discord.Collection();
botSystem.cooldowns = new Discord.Collection();

// Get all command files
const commandFolders = fs.readdirSync('./src/commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		botSystem.commands.set(command.name, command);
	}
}

// Booting bot
client.on("ready", () => {
	if (!client.user) {
		return;
	}
	console.log(`Bot is ready to go! - Logged in as ${client.user.tag}!`)

	client.user.setPresence({
		status: 'online',
		activities: [{
			name: 'this wonderful community',
			type: 'WATCHING'
		}],

	})
})

//joined a server
const addGuild = require("./data/guild/add-guild.js")
client.on("guildCreate", (guild: Guild) => {
	console.log("Joined a new guild: " + guild.name);
	addGuild.execute(guild);
})

//removed from a server
const removeGuild = require("./data/guild/remove-guild.js")
client.on("guildDelete", (guild: Guild) => {
	console.log("Left a guild: " + guild.name);
	removeGuild.execute(guild);
})

// React on message
client.on('messageCreate', (message: Message) => { handleMessageCreateEvent(message) });
async function handleMessageCreateEvent(message: Message) {
	const searchGuild = require("./data/guild/search-guild.js");
	let guild: DBGuild|undefined;
	guild = undefined;
	if (message.guild) {
		guild = await searchGuild.execute(message.guild);
		if (!guild) {
			await addGuild.execute(message.guild);
		}
		guild = await searchGuild.execute(message.guild);
	}
	botSystem.guild = guild;

	let prefix = (process.env.bot_prefix ?? "gg!").trim();
	if (guild && guild.config) {
		prefix = (guild.config.prefix ?? process.env.bot_prefix).trim();
	}
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	// Getting argumnts, command and all commands
	let args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = (args.shift() ?? "").toLowerCase();

	const command = botSystem.commands.get(commandName)
		|| botSystem.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	// Checking dm compatebility
	if (command.guildOnly && (message.channel.type === 'DM')) {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	// Permissions checking
	if (command.permissions && message.channel instanceof BaseGuildTextChannel) {
		const authorPerms = message.channel.permissionsFor(message.author);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			return message.reply('You can not do this!');
		}
	}

	// Argument length validation
	if (command.args && (!args.length || args.length < command.args_quantity)) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	// Cooldown checking
	const { cooldowns } = botSystem.cooldowns;

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 0) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	// Execure command
	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
}

client.login(process.env.bot_token)