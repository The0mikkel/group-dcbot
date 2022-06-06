import { Message, MessageEmbed, Role } from "discord.js";
import BotSystem from "../../data/BotSystem";
import ASCIIFolder from "../../data/helper/ascii-folder";
import { DBGroup } from "../../data/roles/DBGroup";
import { DBInvite } from "../../data/roles/DBInvite";

require("dotenv").config();

module.exports = {
    name: 'team',
    description: 'Get information about a team',
    guildOnly: true,
    args: true,
    args_quantity: 1,
    usage: '[team]',
    async execute(message: Message, args: any) {
        const botSystem = BotSystem.getInstance();
        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

        if (
            !message.member
        ) {
            return message.channel.send("You don't have permission to add new team members!");
        }

        if (args.length < 1) {
            return message.reply(`You need to specify a group`);
        }

        let DiscordRole: Role | undefined;
        let groupName: string;
        if (!message.mentions.roles || message.mentions.roles.first() == undefined) {
            groupName = ASCIIFolder.foldMaintaining(args.shift().trim());
            console.log(groupName);
            DiscordRole = message.guild?.roles.cache.find(role => role.name === groupName);
        } else {
            args.shift();
            DiscordRole = message.mentions.roles.first() ?? undefined;
            groupName = ASCIIFolder.foldMaintaining(message.mentions.roles.first()?.name);
        }
        if (!DiscordRole) {
            message.reply("The team does not exist!");
            return;
        }

        let role = await DBGroup.load(DiscordRole.id ?? "");
        if (role == undefined) {
            message.reply("The team does not exist!");
            return;
        }
        
        const botImage = message.client.user?.avatarURL() ?? "";
        const teamInformation = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Team information:')
				.setDescription(`
                    **Name:** ${DiscordRole.name} 
                    **Team leader:** ${(await message.guild?.members.fetch(role.teamLeader))?.displayName ?? "*Ingen*"} 
                `)
                .addField("Members:", DiscordRole.members.map(member => member.displayName).join("\n"))
				.setFooter({ text: 'Grouper', iconURL: botImage });
		message.channel.send({ embeds: [teamInformation] });

    },
};