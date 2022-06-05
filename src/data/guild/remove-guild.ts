import { Guild } from "discord.js";
import BotSystem from "../BotSystem";

module.exports = {
    async execute(guild: Guild) {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;
        const mongoDatabase = botSystem.mongoDatabase;

        try {
            await mongoClient.connect();
            const mongoClientGuilds = mongoDatabase.collection("guilds");

            // Check if guild have been joined before
            const query = { id: guild.id };
            await mongoClientGuilds.deleteOne(query);
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }
    },
};