import { Collection, Db, Document, MongoClient } from "mongodb";

export default class DBConnection {
    mongoUrl: string;
    mongoClient: MongoClient;
    mongoDatabase: Db;

    private static instance: DBConnection;

    private constructor() {
        this.mongoUrl = process.env.database_url ?? "";
        this.mongoClient = new MongoClient(this.mongoUrl);
        this.mongoDatabase = this.mongoClient.db("grouper");
    }

    static getInstance(): DBConnection {
        if (!DBConnection.instance) {
            DBConnection.instance = new DBConnection();
        }
        return DBConnection.instance;
    }

    static async collectionAction(collection: "guilds" | "groups" | "team-invites" | "guided-setup", action: (guild: Collection<Document>) => Promise<any>) {
        const dbConnection = new DBConnection();
        const mongoClient = dbConnection.mongoClient;

        try {
            await mongoClient.connect();
            const dbCollection = dbConnection.mongoDatabase.collection(collection);
            await action(dbCollection);
        } catch (error) {
            console.log("Error executing guild collection action!")
            console.log(error);
        } finally {
            try {
                await mongoClient.close();
            } catch (error) {
                console.error(error);
            }
        }
    }
}