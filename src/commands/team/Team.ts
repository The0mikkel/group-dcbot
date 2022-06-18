import { Message, MessageEmbed, Role } from "discord.js";
import BotSystem from "../../data/BotSystem";
import Command from "../../data/Command";
import ASCIIFolder from "../../data/helper/ascii-folder";
import { DBGroup } from "../../data/roles/DBGroup";

require("dotenv").config();

export default class Team extends Command {
    constructor() {
        super(
            "team",
            'Get information about a team',
            true,
            true,
            1,
            '[team]'
        )
    }

    async execute(message: Message, args: any): Promise<void> {
        const botSystem = BotSystem.getInstance();
        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

        if (
            !message.member
        ) {
            message.channel.send("You don't have permission to add new team members!");
            return;
        }

        if (args.length < 1) {
            message.reply(`You need to specify a group`);
            return;
        }

        let DiscordRole: Role | undefined;
        let groupName: string;
        if (!message.mentions.roles || message.mentions.roles.first() == undefined) {
            groupName = ASCIIFolder.foldReplacing(args.shift().trim());
            console.log(groupName);
            DiscordRole = message.guild?.roles.cache.find(role => role.name === groupName);
        } else {
            args.shift();
            DiscordRole = message.mentions.roles.first() ?? undefined;
            groupName = ASCIIFolder.foldReplacing(message.mentions.roles.first()?.name);
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

    }
};