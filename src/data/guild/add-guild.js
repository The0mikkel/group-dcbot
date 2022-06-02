const { MongoClient } = require("mongodb");

module.exports = {
    execute(guild) {
        run(guild).catch(console.dir);
    },
};

async function run(guild) {
    const mongoUrl = process.env.database_url;
    const mongoClient = new MongoClient(mongoUrl, { useUnifiedTopology: true });
    const mongoDatabase = mongoClient.db("grouper");

    try {
        await mongoClient.connect();
        const mongoClientGuilds = mongoDatabase.collection("guilds");

        // Check if guild have been joined before
        const query = { id: guild.id };
        const guildSearch = await mongoClientGuilds.findOne(query);
        if (!guildSearch) {
            // Add new, as guild does not exist
            const doc = {
                id: guild.id,
                config: {
                    prefix: process.env.bot_prefix,
                }
            }
            await mongoClientGuilds.insertOne(doc)
        }
    } finally {
        await mongoClient.close();
    }
}