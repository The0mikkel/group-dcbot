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
        const result = await mongoClientGuilds.deleteOne(query);
        if (result.deletedCount === 1) {
        } else {
        }
    } finally {
        await mongoClient.close();
    }
}