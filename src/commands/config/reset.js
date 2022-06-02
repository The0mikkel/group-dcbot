require("dotenv").config();

module.exports = {
    name: 'reset',
	description: 'Reset bot for guild',
    guildOnly: true,
    args: false,
    args_quantity: 0,
    usage: '',
	execute(message, args) {
        if(
            !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You need to be an administrator to do that.");
        }
        
        resetGuild(message, args);
	},
};

async function resetGuild(message, args) {
    const searchGuild = require("./../../data/guild/search-guild.js");
    let guild = await searchGuild.execute(message.guild);
    
    const removeGuild = require("./../../data/guild/remove-guild.js")
    await removeGuild.execute(guild);

    const addGuild = require("./../../data/guild/add-guild.js")
    await addGuild.execute(guild);

    message.channel.send("Bot has been reset!");
}