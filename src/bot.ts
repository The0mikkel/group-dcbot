import { Client, Guild, Message, User, GatewayIntentBits, Partials, ChannelType, REST, Routes, Events } from "discord.js";
import { DBGuild } from "./data/Guild/DBGuild";
import Discord from "discord.js";
import BotSystem from "./data/BotSystem";
import { Config } from "./data/Guild/Config";
import { envType } from "./data/envType";
import { TeamConfig } from "./data/Guild/TeamConfig";
import GuidedTeamCreation from "./data/GuidedTeam/GuidedTeamCreation";
import { GuidedTeamCreationState } from "./data/GuidedTeam/GuidedTeamCreationState";
import GuidedTeamCreationPlatform from "./data/GuidedTeam/GuidedTeamCreationPlatform";
import Commands from "./data/Command/Commands";
import Translate from "./data/Language/Translate";
import help from "./commands/utility/Help";

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

// Initialize system
require("dotenv").config();
require('./setup.js');

// Booting bot
const client = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
	],
});

const guidedTeamCreation = GuidedTeamCreationPlatform.getInstance();

const rest = new REST({ version: '10' }).setToken(process.env.bot_token ?? "");

(async () => {
	try {
		await Commands.loadCommands()
		await rest.put(
			Routes.applicationCommands(process.env.app_id ?? ""),
			{ body: Commands.slashCommands },
		);
		// console.log("Successfully registered application commands.", Commands.slashCommands);
	} catch (error) {
		console.error(error);
	}
})();

client.on("ready", () => {
	if (!client.user) {
		return;
	}
	console.log(`Bot is ready to go! - Logged in as ${client.user.tag}!`)

	client.user.setPresence({
		status: 'online',
		activities: [{
			name: (Translate.getInstance().translate('watching activity', [(process.env.bot_prefix ?? "gr!") + ((new help).name)])),
			type: Discord.ActivityType.Watching,
		}],
	})

	BotSystem.client = client;
})

// Slash command
client.on(Events.InteractionCreate, async interaction => {
	let commandName = "";

	console.log("INTERACTION INCOMING!");
	if (interaction.isModalSubmit()) {
		commandName = interaction.customId.toLowerCase();
	} else if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
		commandName = interaction.commandName.toLowerCase();
	} else {
		console.log("Interaction is not a chat input!");
		return
	}
	const botSystem = new BotSystem();

	console.log("Interaction recieved");
	try {
		let guild: DBGuild | undefined | boolean;
		guild = undefined;
		if (interaction.guild) {
			guild = await DBGuild.load(interaction.guild.id);
			if (!guild) {
				guild = new DBGuild(interaction.guild.id, new Config, new TeamConfig);
				await guild.save();
			}
		}
		botSystem.guild = guild;

		//----
		// if (botSystem.guild?.cleanChannels.includes(interaction.channelId)) {
		// 	BotSystem.autoDeleteMessageByUser(interaction, 15000);
		// }

		// if (interaction.author.bot) {
		// 	return; // Do not run system if it was a bot message
		// }

		// if (!message.author.bot) {
		// 	let currentGuidedTeamCreation = guidedTeamCreation.getGuidedTeamCreation(message.channel, message.author);
		// 	if (currentGuidedTeamCreation && currentGuidedTeamCreation.state != GuidedTeamCreationState.teamCreated) {
		// 		currentGuidedTeamCreation.step(message, botSystem);
		// 		return;
		// 	}
		// }

		// let prefix = (process.env.bot_prefix ?? "gr!").trim();
		// if (guild && guild.config) {
		// 	prefix = (guild.config.prefix ?? process.env.bot_prefix).trim();
		// }
		// if (!message.content.startsWith(prefix) || message.author.bot) {
		// 	console.log(message.content, prefix);
		// 	if (botSystem.env == envType.dev) console.log("Message not send to bot");
		// 	return
		// };
		//----

		const command = Commands.commands.get(commandName)
			|| Commands.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			if (botSystem.env == envType.dev) console.log("Message not a command");
			if (interaction.isRepliable()) interaction.reply({ content: botSystem.translator.translateUppercase("i don't know that command"), ephemeral: true });
			return
		};

		// Checking dm compatebility
		if (command.guildOnly && (interaction.channel?.type === ChannelType.DM)) {
			if (botSystem.env == envType.dev) console.log("Message send in a DM, when not available in DMs");
			if (interaction.isRepliable()) interaction.reply({ content: botSystem.translator.translateUppercase("i can't execute that command inside dms"), ephemeral: true });
			return
		}

		// Permissions checking
		if (command.permissions) {
			let authorized = await command.authorized(interaction, botSystem);
			if (!authorized) {
				if (interaction.isRepliable()) interaction.reply({ content: botSystem.translator.translateUppercase('you do not have the right permissions to use this command'), ephemeral: true });
				return
			}
		}

		// Cooldown checking
		if (interaction.isChatInputCommand()) {
			const cooldown = Commands.cooldownCheck(command, interaction.user.id);
			if (cooldown !== true) {
				if (interaction.isRepliable()) interaction.reply({ content: `${botSystem.translator.translateUppercase("please wait :time: more", [cooldown])} ${botSystem.translator.translateUppercase("second(s)")} ${botSystem.translator.translateUppercase("before reusing the :command: command", ["`" + command.name + "`"])}.`, ephemeral: true });
				return;
			}
		}

		// Set if ephemeral
		let ephemeral = false;
		if (command.ephemeral) {
			ephemeral = true;
		}

		// Defer if not of modal type
		if (command.deferReply) {
			if (interaction.isRepliable()) await interaction.deferReply({ ephemeral: ephemeral });
		}

		// Execure command
		try {
			if (interaction.isModalSubmit()) {
				command.executeModal(interaction, botSystem);
				return;
			} else if (interaction.isAutocomplete()) {
				command.executeAutocomplete(interaction, botSystem);
				return;
			}

			await command.execute(interaction, botSystem, false, 0);
		} catch (error) {
			if (botSystem.env == envType.dev) console.log(error);
			console.error("serverside error! | ", error);

			let text = botSystem.translator.translateUppercase('there was an error trying to execute that command');

			if (interaction.isRepliable()) {
				if (interaction.deferred || interaction.replied) await interaction.editReply({ content: text });
				else interaction.reply({ content: text, ephemeral: true });
			}
		}
	} catch (error) {
		console.error("serverside error! | ", error);
		if (interaction.isRepliable()) {
			if (interaction.deferred || interaction.replied) await interaction.editReply({ content: 'There was an error while executing this command!' });
			else await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		return;
	}
});

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
// client.on('messageCreate', (message: Message) => { handleMessageCreateEvent(message) });
// async function handleMessageCreateEvent(message: Message) {
// 	const botSystem = new BotSystem();

// 	console.log("Message recieved", message.content);
// 	try {
// 		let guild: DBGuild | undefined | boolean;
// 		guild = undefined;
// 		if (message.guild) {
// 			guild = await DBGuild.load(message.guild.id);
// 			if (!guild) {
// 				guild = new DBGuild(message.guild.id, new Config, new TeamConfig);
// 				await guild.save();
// 			}
// 		}
// 		botSystem.guild = guild;

// 		if (botSystem.guild?.cleanChannels.includes(message.channelId)) {
// 			BotSystem.autoDeleteMessageByUser(message, 15000);
// 		}

// 		if (message.author.bot) {
// 			return; // Do not run system if it was a bot message
// 		}

// 		if (!message.author.bot) {
// 			let currentGuidedTeamCreation = guidedTeamCreation.getGuidedTeamCreation(message.channel, message.author);
// 			if (currentGuidedTeamCreation && currentGuidedTeamCreation.state != GuidedTeamCreationState.teamCreated) {
// 				currentGuidedTeamCreation.step(message, botSystem);
// 				return;
// 			}
// 		}

// 		let prefix = (process.env.bot_prefix ?? "gr!").trim();
// 		if (guild && guild.config) {
// 			prefix = (guild.config.prefix ?? process.env.bot_prefix).trim();
// 		}
// 		if (!message.content.startsWith(prefix) || message.author.bot) {
// 			console.log(message.content, prefix);
// 			if (botSystem.env == envType.dev) console.log("Message not send to bot");
// 			return
// 		};

// 		// Getting argumnts, command and all commands
// 		let args = message.content.slice(prefix.length).trim().split(/ +/);
// 		const commandName = (args.shift() ?? "").toLowerCase();

// 		const command = Commands.commands.get(commandName)
// 			|| Commands.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName));

// 		if (!command) {
// 			if (botSystem.env == envType.dev) console.log("Message not a command");
// 			message.reply(botSystem.translator.translateUppercase("i don't know that command"));
// 			return
// 		};

// 		// Checking dm compatebility
// 		if (command.guildOnly && (message.channel.type === ChannelType.DM)) {
// 			if (botSystem.env == envType.dev) console.log("Message send in a DM, when not available in DMs");
// 			return message.reply(botSystem.translator.translateUppercase("i can't execute that command inside dms"));
// 		}

// 		// Permissions checking
// 		if (command.permissions) {
// 			let authorized = await command.authorized(message, botSystem);
// 			if (!authorized) {
// 				return message.reply(botSystem.translator.translateUppercase('you do not have the right permissions to use this command'));
// 			}
// 		}

// 		// Argument length validation
// 		if (command.args && (!args.length || args.length < command.args_quantity)) {
// 			let reply = `${botSystem.translator.translateUppercase("You didn't provide enough arguments")}, ${message.author}!`;

// 			if (command.usage) {
// 				reply += `\n${botSystem.translator.translateUppercase("the proper usage would be")}: \`${prefix}${command.name} ${command.usage}\``;
// 			}

// 			if (botSystem.env == envType.dev) console.log("Arguments missing");
// 			return message.channel.send(reply);
// 		}

// 		// Cooldown checking
// 		const cooldown = Commands.cooldownCheck(command, message.author.id);
// 		if (cooldown !== true) {
// 			message.reply(`${botSystem.translator.translateUppercase("the proper usage would be")} ${botSystem.translator.translateUppercase("please wait :time: more", [cooldown])} ${botSystem.translator.translateUppercase("second(s)")} ${botSystem.translator.translateUppercase("before reusing the :command: command", ["`" + command.name + "`"])}.`);
// 			return;
// 		}

// 		// Execure command
// 		try {
// 			command.execute(message, botSystem, args, false, 0);
// 		} catch (error) {
// 			if (botSystem.env == envType.dev) console.log(error);
// 			console.error(error);
// 			message.reply(botSystem.translator.translateUppercase('there was an error trying to execute that command'));
// 		}
// 	} catch (error) {
// 		console.log(error)
// 	}
// }

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

				try {
					if (reaction.message.channel.type === ChannelType.GuildText) {
						const startMessage = await reaction.message.channel.send("<@" + user + ">, " + botSystem.translator.translateUppercase("A thread with your name has been created, that the team creation will continue in"));
						const thread = await startMessage.startThread({
							name: `${user.username} - ${botSystem.translator.translateUppercase("team")}`,
							autoArchiveDuration: 60,
							reason: '',
						});
						thread.members.add(user);
						if (client.user) thread.members.add(client.user);
						let guidedCreation = new GuidedTeamCreation(botSystem.guild, thread, user);
						guidedTeamCreation.addGuidedTeamCreation(guidedCreation);
						BotSystem.autoDeleteMessageByUser(startMessage);

						guidedCreation.step(undefined, botSystem);
					}
				} catch (error) {
					console.log("Failed during guided start", error);
				}

			}
		}
		if (botSystem.env == envType.dev) console.log(`${user.username} reacted with "${reaction.emoji.name}" on someones else message!`);
	}
});

client.login(process.env.bot_token)