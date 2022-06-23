import { Db, MongoClient } from "mongodb";

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

    static getInstance() {
        if (DBConnection.instance == null) {
            DBConnection.instance = new DBConnection();
        }
        return DBConnection.instance;
    }
}