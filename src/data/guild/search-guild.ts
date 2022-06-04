import { Guild } from "discord.js";
import { DBGuild } from "./DBGuild";

import { Config } from "./Config";
import { MongoClient } from "mongodb";
import BotSystem from "../BotSystem";

module.exports = {
    async execute(guild: Guild) {
        
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;
        const mongoDatabase = botSystem.mongoDatabase;

        let guildToReturn = new DBGuild;

        try {
            await mongoClient.connect();
            const mongoClientGuilds = mongoDatabase.collection("guilds");
            
            // Check if guild have been joined before
            const query = { id: guild.id };
            let guildSearch = await mongoClientGuilds.findOne(query);
            if (!guildSearch) {
                const addGuild = require("./add-guild.js")
                guildSearch = addGuild.execute(guild);
            } else {
                guildToReturn.id = guild.id;
                guildToReturn.config = new Config(guildSearch.config.prefix ?? process.env.bot_prefix ?? "gr!"); 
            }
        } finally {
            await mongoClient.close();
        }
        return guildToReturn;
    },
};