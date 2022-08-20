import { Message, MessageEmbed, Role } from "discord.js";
import BotSystem from "../../data/BotSystem";
import TeamCommand from "../../data/Command/Types/TeamCommand";
import ASCIIFolder from "../../data/Helper/ascii-folder";
import { DBGroup } from "../../data/Group/DBGroup";

require("dotenv").config();

export default class Team extends TeamCommand {
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

    async execute(message: Message, botSystem: BotSystem, args: any): Promise<void> {
        const translator = botSystem.translator;

        botSystem.guild?.teamConfig.filterRemoved(message);
        await botSystem.guild?.save();

        if (args.length < 1) {
            message.reply(translator.translateUppercase(`You need to specify a group`));
            return;
        }

        let DiscordRole: Role | undefined;
        let groupName: string;
        if (!message.mentions.roles || message.mentions.roles.first() == undefined) {
            var rawGroupName = "";
            for (const word in args) {
                rawGroupName = rawGroupName + args[word] + " ";
            }

            groupName = ASCIIFolder.foldReplacing(rawGroupName.trim());
            console.log(groupName);
            DiscordRole = message.guild?.roles.cache.find(role => role.name === groupName);
        } else {
            args.shift();
            DiscordRole = message.mentions.roles.first() ?? undefined;
            groupName = ASCIIFolder.foldReplacing(message.mentions.roles.first()?.name);
        }
        if (!DiscordRole) {
            message.reply(translator.translateUppercase("the team does not exist"));
            return;
        }

        let role = await DBGroup.load(DiscordRole.id ?? "");
        if (role == undefined) {
            message.reply(translator.translateUppercase("the team does not exist"));
            return;
        }

        const botImage = message.client.user?.avatarURL() ?? "";
        const teamInformation = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(translator.translateUppercase('Team information')+':')
            .setDescription(`
                    **${translator.translateUppercase("name")}:** ${DiscordRole.name} 
                    **${translator.translateUppercase("team leader")}:** ${(await message.guild?.members.fetch(role.teamLeader))?.displayName ?? "*-*"} 
                `)
            .addField(translator.translateUppercase("Members")+":", DiscordRole.members.map(member => member.displayName).join("\n"))
            .setFooter({ text: translator.translateUppercase('Grouper'), iconURL: botImage });
        message.channel.send({ embeds: [teamInformation] });

    }
};