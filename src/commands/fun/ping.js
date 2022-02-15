module.exports = {
	name: 'ping',
	description: 'Ping!',
	cooldown: 5,
    guildOnly: false,
    args: false,
    aliases: ['pinging'],
    usage: '',
	execute(message) {
		message.channel.send('Pong');
	},
};