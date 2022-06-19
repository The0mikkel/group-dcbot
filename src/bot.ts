import { BaseGuildTextChannel, Guild, Interaction, Message, User } from "discord.js";
import { DBGuild } from "./data/guild/DBGuild";
import fs from 'fs';
import Discord from "discord.js";
import BotSystem from "./data/BotSystem";
import { Config } from "./data/guild/Config";
import { envType } from "./data/envType";
import { TeamConfig } from "./data/guild/TeamConfig";
import { DBInvite } from "./data/roles/DBInvite";
import GuidedTeamCreation from "./data/GuidedTeamCreation/GuidedTeamCreation";
import { GuidedTeamCreationState } from "./data/GuidedTeamCreation/GuidedTeamCreationState";

// Initialize system
require("dotenv").config();
require('./setup.js');

const client = new Discord.Client({
	partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
	]
});

const botSystem = BotSystem.getInstance();

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

	BotSystem.client = client;
})

//joined a server
client.on("guildCreate", async (guild: Guild) => {
	console.log("Joined a new guild: " + guild.name);
	const localGuild = new DBGuild(guild.id, new Config, new TeamConfig);
	await localGuild.save();
})

//removed from a server
client.on("guildDelete", async (guild: Guild) => {
	console.log("Left a guild: " + guild.name);
	await DBGuild.remove(guild.id);
})

// React on message
client.on('messageCreate', (message: Message) => { handleMessageCreateEvent(message) });
async function handleMessageCreateEvent(message: Message) {
	if (message.author.bot) {
		return; // Do not run system if it was a bot message
	}
	// console.log(["Env:",botSystem.env]);
	try {
		let guild: DBGuild | undefined | boolean;
		guild = undefined;
		if (message.guild) {
			guild = await DBGuild.load(message.guild.id);
			if (!guild) {
				guild = new DBGuild(message.guild.id, new Config, new TeamConfig);
				await guild.save();
			}
		}
		botSystem.guild = guild;

		if (botSystem.guild?.cleanChannels.includes(message.channelId)) {
			BotSystem.autoDeleteMessageByUser(message, 15000);
		}

		if (!message.author.bot) {
			let guidedTeamCreation = botSystem.getGuidedTeamCreation(message.channel, message.author);
			if (guidedTeamCreation && guidedTeamCreation.state != GuidedTeamCreationState.teamCreated) {
				guidedTeamCreation.step(message);
				return;
			}
		}

		let prefix = (process.env.bot_prefix ?? "gr!").trim();
		if (guild && guild.config) {
			prefix = (guild.config.prefix ?? process.env.bot_prefix).trim();
		}
		if (!message.content.startsWith(prefix) || message.author.bot) {
			if (botSystem.env == envType.dev) console.log("Message not send to bot");
			return
		};

		// Getting argumnts, command and all commands
		let args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = (args.shift() ?? "").toLowerCase();

		const command = botSystem.commands.get(commandName)
			|| botSystem.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			if (botSystem.env == envType.dev) console.log("Message not a command");
			message.reply("I don't know that command.");
			return
		};

		// Checking dm compatebility
		if (command.guildOnly && (message.channel.type === 'DM')) {
			if (botSystem.env == envType.dev) console.log("Message send in a DM, when not available in DMs");
			return message.reply('I can\'t execute that command inside DMs!');
		}

		// Permissions checking
		if (command.permissions) {
			if (!(message.channel instanceof BaseGuildTextChannel)) {
				message.reply('I can\'t execute that command outside guilds!')
				return;
			}
			const authorPerms = message.channel.permissionsFor(message.author);
			if (!authorPerms) {
				if (botSystem.env == envType.dev) console.log("Permissions missing");
				return message.reply('You can not do this!');
			}
			// || !authorPerms.has(command.permissions)
			for (let index = 0; index < command.permissions.length; index++) {
				if (!authorPerms.has(command.permissions[index])) {
					if (botSystem.env == envType.dev) console.log("Permissions missing");
					return message.reply('You do not have the right permissions to use this command!');
				}
			};
		}

		// Argument length validation
		if (command.args && (!args.length || args.length < command.args_quantity)) {
			let reply = `You didn't provide enough arguments, ${message.author}!`;

			if (command.usage) {
				reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
			}

			if (botSystem.env == envType.dev) console.log("Arguments missing");
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

		if (timestamps?.has(message.author.id)) {
			const expirationTime = (timestamps?.get(message.author.id) ?? now) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				if (botSystem.env == envType.dev) console.log("Cooldown reached");
				return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}

		timestamps?.set(message.author.id, now);
		setTimeout(() => timestamps?.delete(message.author.id), cooldownAmount);

		// Execure command
		try {
			command.execute(message, args, false, 0);
		} catch (error) {
			if (botSystem.env == envType.dev) console.log(error);
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
			console.log(error)
			return
		}
	}

	// Detect guild
	let guild: DBGuild | undefined;
	guild = undefined;
	if (reaction.message.guild) {
		guild = await DBGuild.load(reaction.message.guild.id);
		if (!guild) {
			guild = new DBGuild(reaction.message.guild.id, new Config, new TeamConfig);
			await guild.save();
		}
	}
	botSystem.guild = guild;
	if (botSystem.env == envType.dev) console.log(`${user.username} reacted with "${reaction.emoji.name}" on ${reaction.message.id}`);

	if (reaction.message.id != "" && reaction.message.author?.id == client.user?.id) { // Execute only on messages created by the bot
		console.log(`${user.username} reacted with "${reaction.emoji.name}".`);
		if (user.id == client.user?.id) { // Execute only when bot reacts

		} else { // Execute only when a user reacts
			// Team invite handling
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
		if (botSystem.guild && (user instanceof User) && !user.bot) {
			// Guided team creation handling
			if (botSystem.guild.guidedTeamStart.includes(reaction.message.id)) {
				try {
					reaction.users.remove(user.id)
				} catch (error) {
					console.log("Failed to remove reaction for user");
				}

				let guidedCreation = new GuidedTeamCreation(botSystem.guild, reaction.message.channel, user);
				botSystem.addGuidedTeamCreation(guidedCreation);

				guidedCreation.step(undefined);
			}
		}
		if (botSystem.env == envType.dev) console.log(`${user.username} reacted with "${reaction.emoji.name}" on someones else message!`);
	}
});

client.login(process.env.bot_token)