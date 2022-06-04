import { Guild } from "discord.js";
import { MongoClient } from "mongodb";
import BotSystem from "../BotSystem";
import { DBGuild } from "./DBGuild";

module.exports = {
    async execute(guild: Guild): Promise<DBGuild|undefined> {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;
        const mongoDatabase = botSystem.mongoDatabase;

        const searchGuild = require("./data/guild/search-guild.js");

        let guildSearch: DBGuild|undefined;
        guildSearch = undefined;

        try {
            await mongoClient.connect();
            const mongoClientGuilds = mongoDatabase.collection("guilds");

            // Check if guild have been joined before
            let guildSearch = await searchGuild.execute(guild.id);
            if (!guildSearch) {
                // Add new, as guild does not exist
                guildSearch = new DBGuild;
                const doc = guildSearch;
                await mongoClientGuilds.insertOne(doc)
            }
        } finally {
            await mongoClient.close();
        }
        return guildSearch;
    },
};