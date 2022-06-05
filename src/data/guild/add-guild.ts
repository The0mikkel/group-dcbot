import { Guild } from "discord.js";
import BotSystem from "../BotSystem";
import { DBGuild } from "./DBGuild";

module.exports = {
    async execute(guild: Guild): Promise<DBGuild | undefined> {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;
        const mongoDatabase = botSystem.mongoDatabase;

        let guildSearch: DBGuild | undefined;
        guildSearch = undefined;

        // Check if guild have been joined before
        try {
            await mongoClient.connect();
            const mongoClientGuilds = mongoDatabase.collection("guilds");

            // Check if guild have been joined before
            const query = { id: guild.id };
            let guildLookup = await mongoClientGuilds.findOne(query);
            if (!guildLookup) {
                // Add new, as guild does not exist
                guildSearch = new DBGuild;
                guildSearch.id = guild.id;
                const doc = guildSearch;

                await mongoClientGuilds.insertOne(doc)
            }
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return guildSearch;
    },
};