import { BaseGuildTextChannel, Guild, Interaction, Message } from "discord.js";
import { DBGuild } from "./data/guild/DBGuild";
import fs from 'fs';
import Discord from "discord.js";
import BotSystem from "./data/BotSystem";
import { Config } from "./data/guild/Config";
import { envType } from "./data/envType";
import { TeamConfig } from "./data/guild/TeamConfig";
import { DBInvite } from "./data/roles/DBInvite";

// Initialize system
require("dotenv").config();
require('./setup.js');

const client = new Discord.Client({
	partials: ["MESSAGE", "CHANNEL"],
	intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS]
});

const botSystem = BotSystem.getInstance();
botSystem.commands = new Discord.Collection();
botSystem.cooldowns = new Discord.Collection();

// Get all command files
const commandFolders = fs.readdirSync('./dist/commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./dist/commands/${folder}`).filter(file => file.endsWith('.js'));
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
client.on("guildCreate", (guild: Guild) => {
	console.log("Joined a new guild: " + guild.name);
	const localGuild = new DBGuild(guild.id, new Config, new TeamConfig);
	localGuild.save();
})

//removed from a server
client.on("guildDelete", (guild: Guild) => {
	console.log("Left a guild: " + guild.name);
	DBGuild.remove(guild.id);
})

// React on message
client.on('messageCreate', (message: Message) => { handleMessageCreateEvent(message) });
async function handleMessageCreateEvent(message: Message) {
	// console.log(["Env:",botSystem.env]);
	try {
		let guild: DBGuild | undefined | boolean;
		guild = undefined;
		if (message.guild) {
			guild = await DBGuild.load(message.guild.id);
			if (!guild) {
				guild = new DBGuild(message.guild.id, new Config, new TeamConfig);
				guild.save();
			}
		}
		botSystem.guild = guild;

		let prefix = (process.env.bot_prefix ?? "gr!").trim();
		if (guild && guild.config) {
			prefix = (guild.config.prefix ?? process.env.bot_prefix).trim();
		}
		if (!message.content.startsWith(prefix) || message.author.bot) {
			if (botSystem.env = envType.dev) console.log("Message not send to bot");
			return
		};

		// Getting argumnts, command and all commands
		let args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = (args.shift() ?? "").toLowerCase();

		const command = botSystem.commands.get(commandName)
			|| botSystem.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			if (botSystem.env = envType.dev) console.log("Message not a command");
			message.reply("I don't know that command.");
			return
		};

		// Checking dm compatebility
		if (command.guildOnly && (message.channel.type === 'DM')) {
			if (botSystem.env = envType.dev) console.log("Message send in a DM, when not available in DMs");
			return message.reply('I can\'t execute that command inside DMs!');
		}

		// Permissions checking
		if (command.permissions && message.channel instanceof BaseGuildTextChannel) {
			const authorPerms = message.channel.permissionsFor(message.author);
			if (!authorPerms || !authorPerms.has(command.permissions)) {
				if (botSystem.env = envType.dev) console.log("Permissions missing");
				return message.reply('You can not do this!');
			}
		}

		// Argument length validation
		if (command.args && (!args.length || args.length < command.args_quantity)) {
			let reply = `You didn't provide enough arguments, ${message.author}!`;

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			if (botSystem.env = envType.dev) console.log("Arguments missing");
			return message.channel.send(reply);
		}

		// Cooldown checking
		const cooldowns = botSystem.cooldowns;

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
				if (botSystem.env = envType.dev) console.log("Cooldown reached");
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		// Execure command
		try {
			command.execute(message, args);
		} catch (error) {
			if (botSystem.env = envType.dev) console.log(error);
			console.error(error);
			message.reply('there was an error trying to execute that command!');
		}
	} catch (error) {
		console.log(error)
	}
}

client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.message.partial) {
		try {
			await reaction.message.fetch();
		} catch (error) {
			return
		}
	}

	if (reaction.message.id != "" && reaction.message.author?.id == client.user?.id) { // Execute only on messages created by the bot
		console.log(`${user.username} reacted with "${reaction.emoji.name}".`);
		if (user.id == client.user?.id) { // Execute only when bot reacts

		} else { // Execute only when a user reacts
			// Invite handling
			let invite = await DBInvite.loadByMessageId(reaction.message.id);
			if (
				invite != undefined
				&& invite._id != undefined
				&& invite.guildId != ""
				&& invite.roleId != ""
				&& invite.userId != ""
			) {
				if (reaction.emoji.name == "✅") {
					invite.acceptInvite(client);
				} else {
					DBInvite.remove(invite._id);
					user.send("You have denied the invite.");
				}
			}
		}
	} else {
		console.log(`${user.username} reacted with "${reaction.emoji.name}" on someones else message!`);
	}
});

client.login(process.env.bot_token)