require("dotenv").config();

module.exports = {
    name: 'group',
	description: 'Create a group, by naming the goup and mentioning all users in the group. The group will be created in the current category, with a role of the same name as the group. You need to be an administrator or have the "Manage channels" permission to use this command.',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    usage: '[group name] [group members]',
	execute(message, args) {
        // Check permissions
        if(
            !message.member.permissions.has("MANAGE_CHANNELS")
            || !message.member.permissions.has("ADMINISTRATOR")
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

    let role = await message.guild.roles.create({
        data: {
          name: name
        },
        reason: 'Group was created by grouper, as per request by '+message.author.tag,
    })

    let channel 
    try {
        channel = await message.guild.channels.create(name, { type: 'GUILD_CATEGORY', reason: 'Needed a new group called '+name+' as per request by '+message.author.tag }).catch(console.error);
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
            {type: 'role', id: role.id, allow: ['VIEW_CHANNEL']},
        ]);
    } catch (error) {
        console.log(`There was an error updating base channel permissions for channel "${name}" and this was caused by: ${error}`);
        message.reply('there was an error trying to execute that command!');
        return;
    }

    let users = [];

    message.mentions.members.forEach(async (member) => {
        try {
            member.roles.add(role.id);
            users.push(member);    
        } catch (error) {
            console.log(`There was an error adding user: ${member} to the channel "${name}" and this was caused by: ${error}`)
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
    message.channel.send(`Group ${role} was created in the category ${message.channel.parent}`);
}