import { Guild, Message, User } from "discord.js";
import { DBGuild } from "./data/Guild/DBGuild";
import Discord from "discord.js";
import BotSystem from "./data/BotSystem";
import { Config } from "./data/Guild/Config";
import { envType } from "./data/envType";
import { TeamConfig } from "./data/Guild/TeamConfig";
import GuidedTeamCreation from "./data/GuidedTeam/GuidedTeamCreation";
import { GuidedTeamCreationState } from "./data/GuidedTeam/GuidedTeamCreationState";
import DBConnection from "./data/DBConnection";
import GuidedTeamCreationPlatform from "./data/GuidedTeam/GuidedTeamCreationPlatform";
import Commands from "./data/Command/Commands";

// process.on('unhandledRejection', error => {
// 	console.error('Unhandled promise rejection:', error);
// });

// Initialize system
require("dotenv").config();
require('./setup.js');

const database = DBConnection.getInstance();
const guidedTeamCreation = GuidedTeamCreationPlatform.getInstance();
Commands.loadCommands();

// Booting bot
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
	const botSystem = new BotSystem();
	if (message.author.bot) {
		return; // Do not run system if it was a bot message
	}
	console.log("Message recieved", message.content);
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
			let currentGuidedTeamCreation = guidedTeamCreation.getGuidedTeamCreation(message.channel, message.author);
			if (currentGuidedTeamCreation && currentGuidedTeamCreation.state != GuidedTeamCreationState.teamCreated) {
				currentGuidedTeamCreation.step(message, botSystem);
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

		const command = Commands.commands.get(commandName)
			|| Commands.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			if (botSystem.env == envType.dev) console.log("Message not a command");
			message.reply(botSystem.translator.translateUppercase("i don't know that command"));
			return
		};

		// Checking dm compatebility
		if (command.guildOnly && (message.channel.type === 'DM')) {
			if (botSystem.env == envType.dev) console.log("Message send in a DM, when not available in DMs");
			return message.reply(botSystem.translator.translateUppercase("i can't execute that command inside dms"));
		}

		// Permissions checking
		if (command.permissions) {
			let authorized = await command.authorized(message, botSystem);
			if (!authorized) {
				return message.reply(botSystem.translator.translateUppercase('you do not have the right permissions to use this command'));
			}
		}

		// Argument length validation
		if (command.args && (!args.length || args.length < command.args_quantity)) {
			let reply = `${botSystem.translator.translateUppercase("You didn't provide enough arguments")}, ${message.author}!`;

			if (command.usage) {
				reply += `\n${botSystem.translator.translateUppercase("the proper usage would be")}: \`${prefix}${command.name} ${command.usage}\``;
			}

			if (botSystem.env == envType.dev) console.log("Arguments missing");
			return message.channel.send(reply);
		}

		// Cooldown checking
		const cooldown = Commands.cooldownCheck(command, message.author.id);
		if (cooldown !== true) {
			message.reply(`${botSystem.translator.translateUppercase("the proper usage would be")} ${botSystem.translator.translateUppercase("please wait :time: more", [cooldown])} ${botSystem.translator.translateUppercase("second(s)")} ${botSystem.translator.translateUppercase("before reusing the :command: command", ["`"+command.name+"`"])}.`);
			return;
		}

		// Execure command
		try {
			command.execute(message, botSystem, args, false, 0);
		} catch (error) {
			if (botSystem.env == envType.dev) console.log(error);
			console.error(error);
			message.reply(botSystem.translator.translateUppercase('there was an error trying to execute that command'));
		}
	} catch (error) {
		console.log(error)
	}
}

// React on message reaction
client.on('messageReactionAdd', async (reaction, user) => {
	const botSystem = new BotSystem;

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
		if (botSystem.env == envType.dev) console.log(`${user.username} reacted with "${reaction.emoji.name}".`);
		if (user.id == client.user?.id) { // Execute only when bot reacts

		} else { // Execute only when a user reacts
			
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
				guidedTeamCreation.addGuidedTeamCreation(guidedCreation);

				guidedCreation.step(undefined, botSystem);
			}
		}
		if (botSystem.env == envType.dev) console.log(`${user.username} reacted with "${reaction.emoji.name}" on someones else message!`);
	}
});

client.login(process.env.bot_token)