
// DB setup

const { MongoClient } = require("mongodb");
const COLLECTIONS = ['guilds', 'guild_settings', 'groups', 'invites'];

const mongoUrl = process.env.database_url;
const mongoClient = new MongoClient(mongoUrl, { useUnifiedTopology: true });
const mongoDatabase = mongoClient.db("grouper");

setupDatabase();

async function setupDatabase() {
    await mongoClient.connect();

    COLLECTIONS.forEach(collection => {
        mongoDatabase.listCollections({ name: collection })
            .next(function (err, collinfo) {
                if (!collinfo) {
                    setupCollection(collection)
                }
            });
    });
    mongoClient.close();
}

async function setupCollection(collection) {
    await mongoClient.connect();
    mongoDatabase.createCollection(collection, function (err, res) {
        if (err)
            console.log("Collection already exist!")
        else
            console.log("Collection created!");
    });
}

