import { Message, MessageEmbed } from "discord.js";
import BotSystem from "../../data/BotSystem";
import { TeamConfig } from "../../data/guild/TeamConfig";
import { DBGroup } from "../../data/roles/DBGroup";

require("dotenv").config();

module.exports = {
    name: 'team-config',
    description: 'See available team configuration commands',
    guildOnly: true,
    args: false,
    args_quantity: 0,
    usage: '[command]',
    async execute(message: Message, args: any) {
        if (
            !message.member
            || !message.member.permissions.has("ADMINISTRATOR")
        ) {
            return message.channel.send("You don't have permission to add new teams!");
        }

        const botSystem = BotSystem.getInstance();
        botSystem.guild?.teamConfig.filterRemoved(message);
        botSystem.guild?.save();

        if (!botSystem.guild) {
            message.reply("Cannot execute the command here");   
            return;
        }

        const botImage = message.client.user?.avatarURL() ?? "";

        const secondCommandWord = args?.shift()?.trim().toLowerCase() ?? "";
        switch (secondCommandWord) {
            case "roles":
                console.log("Roles reached!")
                writeRolesCreateTeamList(message);
                break;
            case "add-role":
                message.mentions.roles.forEach(async (role) => {
                    try {
                        botSystem.guild?.teamConfig.addCreatorRole(role.id);
                    } catch (error) {
                        console.log(error)
                    }
                });

                botSystem.guild?.save();

                message.reply("Roles added!");
                writeRolesCreateTeamList(message);
                break;
            case "rem-role":
                message.mentions.roles.forEach(async (role) => {
                    try {
                        botSystem.guild?.teamConfig.removeCreatorRole(role.id);
                    } catch (error) {
                        console.log(error)
                    }
                });

                botSystem.guild?.save();

                message.reply("Roles removed!");
                writeRolesCreateTeamList(message);
                break;
            case "invite": 
                message.reply("Invite to join team is currently " + (botSystem.guild?.teamConfig.requireInvite ? "active" : "inactive"));
                break;
            case "set-invite":
                const setInviteBooleanText =  (args?.shift()?.trim().toLowerCase() ?? "false");
                if (setInviteBooleanText === "true" || setInviteBooleanText === "yes" || setInviteBooleanText === "1") {
                    botSystem.guild.teamConfig.requireInvite = true;
                } else {
                    botSystem.guild.teamConfig.requireInvite = false;
                }
                botSystem.guild.save();
                message.reply("Invite to join team is now " + (botSystem.guild?.teamConfig.requireInvite ? "active" : "inactive"));
                break;
            default:
                const teamConfigCommandEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Command list:')
                    .setDescription(
                        `
                            - roles - See list of roles, that can create teams 
                            - add-role [role] - Add role, that can create team 
                            - rem-role [role] - Remove role, that can create team 
                            - invite - Check if invite is currently required before a member is added to a team
                            - set-invite [true/false] - Set, if a member can only be added through an invite
                        `
                    )
                    .setFooter({ text: 'Grouper', iconURL: botImage });
                message.reply("Currently, there are the following")
                message.channel.send({ embeds: [teamConfigCommandEmbed] });
                return;
        }
    },
};

function writeRolesCreateTeamList(message: Message) {
    const botImage = message.client.user?.avatarURL() ?? "";
    const teamRoles = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Roles, that can create teams:')
        .setDescription((BotSystem.getInstance().guild?.teamConfig.creatorRole ?? []).map(role => TeamConfig.getRoleName(role, message)).join('\n'))
        .setFooter({ text: 'Grouper', iconURL: botImage });
    message.channel.send({ embeds: [teamRoles] });
}