require("dotenv").config();

module.exports = {
    name: 'simple-group',
	description: 'Create a simple group, by naming the goup and mentioning all users in the group. The group will be created in the current category. You need to be an administrator or have the "Manage channels" permission to use this command.',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    usage: '[group name] [group members / roles]',
	execute(message, args) {
        // Check permissions
        if(
            !message.member.hasPermission("MANAGE_CHANNELS")
            || !message.member.hasPermission("ADMINISTRATOR")
        ) {
            return message.channel.send("You don't have permission to add new groups!\nYou need to be an administrator to do that.");
        }

        // Check if there is any args - Channel id
        if (!args.length)
            return message.reply(`You need to specify a channel, to be able to use this command!`);

        const groupName = args.shift();
        
        asyncCreate(message, groupName, args);
	},
};

async function asyncCreate(message, name, args) {
    let channel 
    try {
        channel = await message.guild.channels.create(name, { type: 'GUILD_CATEGORY', reason: 'Needed a new group called '+name }).catch(console.error);
        channel.setParent(message.channel.parent);
    } catch (error) {
        console.log(`There was an error creating channel "${name}" and this was caused by: ${error}`);
        message.reply('there was an error trying to execute that command!');
        return;
    }

    const everyoneRole = message.guild.roles.everyone;

    try {
        await channel.overwritePermissions([
            {type: 'member', id: message.author.id, allow: ['VIEW_CHANNEL']},
            {type: 'member', id: message.client.user.id, allow: ['VIEW_CHANNEL']},
            {type: 'role', id: everyoneRole.id, deny: ['VIEW_CHANNEL']},
        ]);
    } catch (error) {
        console.log(`There was an error updating base channel permissions for channel "${name}" and this was caused by: ${error}`);
        message.reply('there was an error trying to execute that command!');
        return;
    }

    let users = [];

    message.mentions.users.forEach(async (element) => {
        try {
            await channel.updateOverwrite(element, {
                VIEW_CHANNEL: true
            })
            users.push(element);    
        } catch (error) {
            console.log(`There was an error adding user: ${element} to the channel "${name}" and this was caused by: ${error}`)
        }
    });

    message.mentions.roles.forEach(async (element) => {
        try {
            await channel.updateOverwrite(element, {
                VIEW_CHANNEL: true
            })
            users.push(element);    
        } catch (error) {
            console.log(`There was an error adding role: ${element} to the channel "${name}" and this was caused by: ${error}`)
        }
    });

    let usersList = "";
    users.forEach(element => {
        usersList += element.username+", ";
    });
    usersList = usersList.slice(0,-2);
    message.channel.send(`Group ${channel} was created in the category ${message.channel.parent}`);
}