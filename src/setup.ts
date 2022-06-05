
// DB setup

import { MongoClient } from "mongodb";
import BotSystem from "./data/BotSystem";
const COLLECTIONS = ['guilds', 'guild_settings', 'groups', 'invites'];

const botSystem = BotSystem.getInstance();
const mongoClient = botSystem.mongoClient;
const mongoDatabase = botSystem.mongoDatabase;

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
        if (err)
            console.log("Collection already exist!")
        else
            console.log("Collection created!");
    });
}

