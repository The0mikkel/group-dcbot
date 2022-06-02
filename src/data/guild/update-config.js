const { MongoClient } = require("mongodb");

module.exports = {
    execute(guild, config) {
        run(guild, config).catch(console.dir);
    },
};

async function run(guild, config) {
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

        // create a document that sets the plot of the movie
        const updateDoc = {
            $set: {
                config: config
            }
        };
        const options = { upsert: true };
        console.log(await mongoClientGuilds.updateOne(query, updateDoc, options));

    } finally {
        await mongoClient.close();
    }
}