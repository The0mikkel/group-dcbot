import { Guild, User, GatewayIntentBits, ChannelType, REST, Routes, Events } from "discord.js";
import { DBGuild } from "./data/Guild/DBGuild";
import Discord from "discord.js";
import BotSystem from "./data/BotSystem";
import { Config } from "./data/Guild/Config";
import { envType } from "./data/envType";
import { TeamConfig } from "./data/Guild/TeamConfig";
import Commands from "./data/Command/Commands";
import Translate from "./data/Language/Translate";
import help from "./commands/utility/Help";
import { UserLevel } from "./data/Command/UserLevel";
import ButtonHandler from "./data/ButtonHandler";

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
	} else if (interaction.isButton()) {
		(new ButtonHandler(client, interaction)).handleButtonAction();
		return;
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
				if (botSystem.env == envType.dev) console.log("Message not authorized", command.name, command.permissions, UserLevel[command.level]);
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

client.login(process.env.bot_token)