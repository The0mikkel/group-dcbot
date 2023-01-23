import { CategoryChannel, DMChannel, GuildChannel, Message, ChannelType, OverwriteType, CommandInteraction, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import BotSystem from "../../data/BotSystem";
import GroupCommand from "../../data/Command/Types/GroupCommand";
import { UserLevel } from "../../data/Command/UserLevel";
import ASCIIFolder from "../../data/Helper/ascii-folder";

require("dotenv").config();

export default class SimpleGroup extends GroupCommand {
    shortDescription: string = "Create a group (channel only)";

    private userOptions: {name: string, required: boolean}[] = [];
    private userCount: number = 15;

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

        for (let index = 1; index <= this.userCount; index++) {
            let required = index == 1 ? true : false;
            let object = {
                name: 'user' + index,
                required: required,
            };
            this.userOptions.push(object)
        }
    }

    slashCommand(): SlashCommandBuilder {
        let command = super.slashCommand();

        command.setNameLocalizations({
            "en-US": "simple-group",
            "da": "enkel-gruppe"
        });

        command.setDescriptionLocalizations({
            "en-US": "Create a group (channel only)",
            "da": "Opret en gruppe (kun kanal)"
        });

        command.addStringOption(option =>
            option.setName('name')
                .setDescription("name of the group")
                .setDescriptionLocalizations({
                    "en-US": "The name of the group",
                    "da": "Navnet på gruppen"
                })
                .setNameLocalizations({
                    "en-US": "name",
                    "da": "navn"
                })
                .setMaxLength(100)
                .setMinLength(1)
                .setRequired(true)
        );

        let i = 0;
        this.userOptions.forEach(userOption => {
            command.addUserOption(option =>
                option.setName(userOption.name)
                    .setDescription("user to add")
                    .setDescriptionLocalizations({
                        "en-US": "The user to add",
                        "da": "Brugeren der skal tilføjes"
                    })
                    .setNameLocalizations({
                        "en-US": `user-${i++}`,
                        "da": `bruger-${i}`
                    })
                    .setRequired(userOption.required)
            );
        });

        return command;
    }

    async execute(interaction: ChatInputCommandInteraction, botSystem: BotSystem, args: any) {
        // Check permissions
        if (
            !interaction.member
        ) {
            interaction.editReply(botSystem.translator.translateUppercase("you do not have the right permissions to use this command"));
            return;
        }
        if (!interaction.guild) {
            interaction.editReply(botSystem.translator.translateUppercase("i can't execute that command outside guilds"));
            return;
        }

        const groupName = ASCIIFolder.foldReplacing(interaction.options.getString('name', true) ?? "");

        if (groupName.length < 1) {
            interaction.editReply(botSystem.translator.translateUppercase("group name must be at least 1 character long"));
            return;
        }

        let tempChannel: void | TextChannel;
        let channel: TextChannel;
        try {
            if (!(interaction.channel instanceof GuildChannel)) {
                throw new Error("Channel not supported");
            }
            tempChannel = await interaction.guild.channels.create({
                name: groupName,
                type: ChannelType.GuildText,
                parent: interaction.channel.parent?.id ?? undefined,
            }).catch(console.error);
            
            if (!tempChannel) {
                throw new Error("Channel not created");
            }

            channel = tempChannel;
        } catch (error) {
            console.log(`There was an error creating channel "${groupName}" and this was caused by: ${error}`);
            interaction.editReply(botSystem.translator.translateUppercase("there was an error trying to execute that command"));
            return;
        }

        const everyoneRole = interaction.guild.roles.everyone;

        try {
            await channel.permissionOverwrites.set([
                { type: OverwriteType.Member, id: interaction.member.user.id, allow: ['ViewChannel'] },
                { type: OverwriteType.Role, id: everyoneRole.id, deny: ['ViewChannel'] },
            ]);
        } catch (error) {
            console.log(`There was an error updating base channel permissions for channel "${groupName}" and this was caused by: ${error}`);
            interaction.editReply(botSystem.translator.translateUppercase("there was an error trying to execute that command"));
            return;
        }
        
        this.userOptions.forEach(async userOption => {
            let user = interaction.options.getUser(userOption.name, userOption.required);
            if (user) {
                try {
                    await channel.permissionOverwrites.edit(user, {
                        ViewChannel: true
                    })
                } catch (error) {
                    console.log(`There was an error adding user: ${user.username} to the channel "${groupName}" and this was caused by: ${error}`)
                }
            }
        });
        
        interaction.editReply(botSystem.translator.translateUppercase("group :channel: was created in the category :category:", [channel, channel.parent?.name ?? "-"]));
    }
};