import { Collection } from "discord.js";
import { Db, MongoClient } from "mongodb";
import { DBGuild } from "./guild/DBGuild";
import Discord from "discord.js";
import { envType } from "./envType";

export default class BotSystem {
    commands: Collection<string, any>
    cooldowns: any
    guild: DBGuild | undefined
    mongoUrl: string;
    mongoClient: MongoClient;
    mongoDatabase: Db;
    env: envType;

    private static instance: BotSystem;

    private constructor() {
        this.commands = new Discord.Collection()
        this.cooldowns = new Discord.Collection()
        this.guild = undefined;
        this.mongoUrl = process.env.database_url ?? "";
        this.mongoClient = new MongoClient(this.mongoUrl);
        this.mongoDatabase = this.mongoClient.db("grouper")
        this.env = envType[(process.env.env ?? "prod") as keyof typeof envType] ?? envType.prod;
    }

    static getInstance() {
        if (BotSystem.instance == null) {
            BotSystem.instance = new BotSystem();
        }
        return BotSystem.instance;
    }
}