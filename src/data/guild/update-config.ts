import { Guild } from "discord.js";
import { MongoClient } from "mongodb";
import BotSystem from "../BotSystem";
import { Config } from "./Config";

module.exports = {
    async execute(guild: Guild, config: Config) {
    
    const botSystem = BotSystem.getInstance();
    const mongoClient = botSystem.mongoClient;
    const mongoDatabase = botSystem.mongoDatabase;

    let guildSearch = undefined;

    try {
        await mongoClient.connect();
        const mongoClientGuilds = mongoDatabase.collection("guilds");

        // Check if guild have been joined before
        const query = { id: guild.id };

        // create a document that sets the plot of the movie
        const updateDoc = {
            $set: {
                config: config
            }
        };
        const options = { upsert: true };
        await mongoClientGuilds.updateOne(query, updateDoc, options);

    } catch (error) {
        console.log(error)
    } finally {
        await mongoClient.close();
    }
    },
};