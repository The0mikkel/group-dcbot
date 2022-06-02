require("dotenv").config();

module.exports = {
    name: 'set-prefix',
	description: 'Sets the prefix of the bot',
    guildOnly: true,
    args: true,
    args_quantity: 1,
    usage: '[prefix]',
	execute(message, args) {
        if(
            !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You need to be an administrator to do that.");
        }

        // Check if there is any args - message id
        if (!args.length)
            return message.reply(`You need to specify a prefix, to be able to use this command!`);
        
        updatePrefix(message, args);
	},
};

async function updatePrefix(message, args) {
    const searchGuild = require("./../../data/guild/search-guild.js");
    let guild = await searchGuild.execute(message.guild);
    if (!guild) {
        const addGuild = require("./data/guild/add-guild.js")
        await addGuild.execute(message.guild);
        guild = await searchGuild.execute(message.guild);
    }

    let prefix = args[0];

    var ASCIIFolder = require("./../../data/helper/ascii-folder");
    guild.config.prefix = ASCIIFolder.foldReplacing(prefix).trim();

    const updateGuildConfig = require("./../../data/guild/update-config");
    updateGuildConfig.execute(message.guild, guild.config);

    message.reply(`The prefix of the bot is now: ${guild.config.prefix}`);
}