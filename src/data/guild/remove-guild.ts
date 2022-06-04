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
            const result = await mongoClientGuilds.deleteOne(query);
            if (result.deletedCount === 1) {
            } else {
            }
        } finally {
            await mongoClient.close();
        }
    },
};