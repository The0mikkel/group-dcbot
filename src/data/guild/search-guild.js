const { MongoClient } = require("mongodb");

module.exports = {
    async execute(guild) {
        return await run(guild).catch(console.dir);
    },
};

async function run(guild) {
    const mongoUrl = process.env.database_url;
    const mongoClient = new MongoClient(mongoUrl, { useUnifiedTopology: true });
    const mongoDatabase = mongoClient.db("grouper");
    let guildSearch = undefined;

    try {
        await mongoClient.connect();
        const mongoClientGuilds = mongoDatabase.collection("guilds");

        // Check if guild have been joined before
        const query = { id: guild.id };
        guildSearch = await mongoClientGuilds.findOne(query);

    } finally {
        await mongoClient.close();
    }
    return guildSearch;

}