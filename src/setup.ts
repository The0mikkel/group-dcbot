import DBConnection from "./data/DBConnection";

// DB setup
const COLLECTIONS = ['guilds', 'groups', 'team-invites', 'guided-setup'];

const mongoClient = DBConnection.getInstance().mongoClient;
const mongoDatabase = DBConnection.getInstance().mongoDatabase;

setupDatabase();

async function setupDatabase() {
    await mongoClient.connect();

    COLLECTIONS.forEach(collection => {
        mongoDatabase.listCollections({ name: collection })
            .next(function (err: any, collinfo: any) {
                if (!collinfo) {
                    setupCollection(collection)
                }
            });
    });
    await mongoClient.close();
}

async function setupCollection(collection: string) {
    await mongoClient.connect();
    mongoDatabase.createCollection(collection, function (err: any, res: any) {
        if (err) {
            // console.log("Collection already exist!")
        } else {
            console.log(`Collection ${collection} created!`);
        }
    });
}

