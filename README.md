# Discord group bot - Grouper
Discord bot for easy creation of groups with channels and categories. All made with Discord.js<br>
This bot is also known as "GroupDC" and "Grouper"

## How to run
1. Set .env variable
2. `npm start`

### Docker
This project can be runned in docker, with the following docker-compose file:
```
version: "3.6"
services:
    bot:
        image: themikkel/group-dcbot
        restart: always
        environment:
            bot_token: ${bot_token}
            bot_prefix: ${bot_prefix}
```
Image: https://hub.docker.com/repository/docker/themikkel/group-dcbot

The image is automaticly updated, when a feature is merged into the main branch.

Before you run the bot, please specify a bot_token, that is a Discord Bot Token.<br>
The default prefix is "!" and can only be changed by setting the bot_prefix

## Commands
The bot contains a number of default commands:
bot-announce, bot-edit, beep, ping, simple-group, avatar, help, server, user-info

### Announce
Announce to a given channel, with the bot.

Requires administrator privileges.

### simple-group
```
!simple-group Group-name @user1 @user2
```
This will:
1. Create a new channel called [Group-name]
2. Add @user1 and @user2 to this channel, as well as the admin who runs the command

This command can only be runned by administrators or members who has the "manage channels" permissions

## Idea
The idea behind the bot, is to easely create groups, with either channels or entire categories.<br>
This is especially useful when having a list of participants and wanting to throw them into different groups, without having to make the roles and channels manually.