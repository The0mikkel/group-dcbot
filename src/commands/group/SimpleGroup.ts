import { CategoryChannel, DMChannel, GuildChannel, Message, ChannelType, OverwriteType } from "discord.js";
import BotSystem from "../../data/BotSystem";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ASCIIFolder from "../../data/Helper/ascii-folder";

require("dotenv").config();

export default class SimpleGroup extends GroupCommand {
    constructor() {
        super(
            'simple-group',
            'simple group command description',
            true,
            true,
            2,
            '[group name] [group members / roles]',
            undefined,
            [],
            UserLevel.admin
        )
    }

    async execute(message: Message, botSystem: BotSystem, args: any) {
        // Check permissions
        if (
            !message.member
        ) {
            message.channel.send(botSystem.translator.translateUppercase("you do not have the right permissions to use this command"));
            return;
        }

        if (!message.guild) {
            message.reply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            return;
        }

        // Check if there is any args - Channel id
        if (!args.length) {
            message.reply(botSystem.translator.translateUppercase(`you need to specify a channel, to be able to use this command`));
            return;
        }

        const groupName = ASCIIFolder.foldReplacing(args.shift());

        let tempChannel: void | CategoryChannel;
        let channel: CategoryChannel;
        try {
            if (!(message.channel instanceof GuildChannel)) {
                throw new Error("Channel not supported");
            }
            tempChannel = await message.guild.channels.create({
                name: groupName,
                type: ChannelType.GuildCategory,
                parent: message.channel.parent?.id ?? undefined,
            }).catch(console.error);
            
            if (!tempChannel) {
                throw new Error("Channel not created");
            }

            channel = tempChannel;
        } catch (error) {
            console.log(`There was an error creating channel "${groupName}" and this was caused by: ${error}`);
            message.reply(botSystem.translator.translateUppercase("there was an error trying to execute that command"));
            return;
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await channel.permissionOverwrites.set([
                { type: OverwriteType.Member, id: message.author.id, allow: ['ViewChannel'] },
                { type: OverwriteType.Role, id: everyoneRole.id, deny: ['ViewChannel'] },
            ]);

            if (message.client.user) {
                await channel.permissionOverwrites.set([
                    { type: OverwriteType.Member, id: message.client.user.id, allow: ['ViewChannel'] }
                ])
            }
        } catch (error) {
            console.log(`There was an error updating base channel permissions for channel "${groupName}" and this was caused by: ${error}`);
            message.reply(botSystem.translator.translateUppercase("there was an error trying to execute that command"));
            return;
        }

        let users = [];

        message.mentions.users.forEach(async (element) => {
            try {
                await channel.permissionOverwrites.edit(element, {
                    ViewChannel: true
                })
                users.push(element);
            } catch (error) {
                console.log(`There was an error adding user: ${element} to the channel "${groupName}" and this was caused by: ${error}`)
            }
        });

        message.mentions.roles.forEach(async (element) => {
            try {
                await channel.permissionOverwrites.edit(element, {
                    ViewChannel: true
                })
                users.push(element);
            } catch (error) {
                console.log(`There was an error adding role: ${element} to the channel "${groupName}" and this was caused by: ${error}`)
            }
        });

        message.channel.send(botSystem.translator.translateUppercase("group :channel: was created in the category :category:", [channel, channel.parent?.name ?? "-"]));
    }
};