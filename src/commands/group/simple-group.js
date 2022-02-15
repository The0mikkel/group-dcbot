require("dotenv").config();
const announcer_role = process.env.announcer_role;

module.exports = {
    name: 'simple-group',
	description: 'Create a simple group, by naming the goup and mentioning all users in the group. The group will be created in the current category',
    guildOnly: true,
    args: true,
    args_quantity: 2,
    usage: '[group name] [group members]',
	execute(message, args) {
        // Check if there is any args - Channel id
        if (!args.length)
            return message.reply(`You need to specify a channel, to be able to use this command!`);

        const groupName = args.shift();

        // Checking if announcment message is in args
        if (!args.length)
            return message.channel.send(`You didn't provide any users text, ${message.author}!`);
        
        asyncCreate(message, groupName, args);
	},
};

async function asyncCreate(message, name, args) {
    const channel = await message.guild.channels.create(name, { type: 'GUILD_CATEGORY', reason: 'Needed a new group called '+name }).catch(console.error);
    channel.setParent(message.channel.parent);

    const everyoneRole = message.guild.roles.everyone;

    await channel.overwritePermissions([
        {type: 'member', id: message.author.id, allow: ['VIEW_CHANNEL']},
        {type: 'role', id: everyoneRole.id, deny: ['VIEW_CHANNEL']},
    ]);

    var users = [];
    for (let index = 0; index < args.length; index++) {
        if (args[index].startsWith('<@') && args[index].endsWith('>')) {
            var mention = args[index].slice(2, -1);
    
            if (mention.startsWith('!')) {
                mention = mention.slice(1);
            }
    
            var user = message.client.users.cache.get(mention);
            if (!user) {
                continue;
            }

            await channel.updateOverwrite(user.id, {
                VIEW_CHANNEL: true
            })
            users.push(user); 
        }
    }

    var usersList = "";
    users.forEach(element => {
        usersList += element.username+", ";
    });
    usersList = usersList.slice(0,-2);
    message.channel.send(`Group "${name}" was created with the members: ${usersList} in the category ${message.channel.parent}`);
}