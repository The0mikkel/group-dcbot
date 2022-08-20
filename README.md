# Discord group bot - Grouper
Discord bot for easy creation of groups with channels and categories. All made with Discord.js<br>
This bot is also known as "GroupDC" and "Grouper"

## How to run

### Docker
This project can be run in docker, with the following docker-compose file:
```
version: "3.6"
services:
    bot:
        image: themikkel/group-dcbot
        restart: always
        environment:
            bot_token: ${bot_token}
            bot_prefix: ${bot_prefix}
            database_url: mongodb://${db_username}:${db_password}@mongodb:27017/
            language: en
    mongodb:
        image: mongo
        restart: always
        environment:
            MONGO_INITDB_ROOT_USERNAME: ${db_username}
            MONGO_INITDB_ROOT_PASSWORD: ${db_password}
        volumes:
            - ./db:/data/db
```
Image: [https://hub.docker.com/repository/docker/themikkel/group-dcbot](https://hub.docker.com/r/themikkel/group-dcbot)

The image is automaticly updated, when a feature is merged into the main branch.

Before you run the bot, please specify a bot_token, that is a Discord Bot Token.<br>
The default prefix is "gr!" and can only be changed by setting the bot_prefix

## Configuration
The bot is made to use MongoDB, to enable configuration of the bot on a per-guild basis, and allows for multiple functions of the bot to work. 

## Commands
The bot contains a number of default commands:
beep, ping, simple-group, group, avatar, help, server, user-info  
Run the help command, to see a list of all commands.

### simple-group
```
gr!simple-group Group-name @user1 @user2
```
This will:
1. Create a new channel called [Group-name]
2. Add @user1 and @user2 to this channel, as well as the admin who runs the command

This command can only be runned by administrators or members who has the "manage channels" permissions


### group
```
gr!group Group-name @user1 @user2
```
This will:
1. Create a new role called [Group-name]
2. Add @user1 and @user2 to this role

This command can only be runned by an administrators

### Team
A team command is available, that works like the group command, but enables users to create teams, and add other users to their group, either directly or through invites.

The team system allows for a lot of customization.  
Some of these elements are:  
- Setting multiple roles, that can create teams
- Enabeling invite to be accepted (through DM), to join team

The team system, can be configurated through the command `team-config [command] [arguments]`  

Teams can be created with the command `create-team [team name] [members]`


## Idea
The idea behind the bot, is to easely create groups, with either channels or entire categories.<br>
This is especially useful when having a list of participants and wanting to throw them into different groups, without having to make the roles and channels manually.

## Development
Compile with watch: `npm run build`  
Or compile once: `npm run watch`

### Translation
Do you want to translate the bot into another language, or put your spin on it?  
Add a language file in the `resources/lang` folder named as the language code (such as en or da), and follow the same patterne as the default `en.json` language file.  
When the language file is ready, remember to add the language code to the `Languages` enum and update your .env to match the new language!