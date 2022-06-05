import BotSystem from "../BotSystem";
import { Config } from "./Config";

export class DBGuild {
    _id: undefined | string
    id: any;
    config: Config;

    constructor(id = "", config = new Config) {
        this.id = id;
        this.config = config;
    }

    static async load(id: string): Promise<undefined | DBGuild> {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const guilds = botSystem.mongoDatabase.collection("guilds");

            const query = { id: id };
            result = await guilds.findOne(query);

            if (!result) {
                return undefined;
            }
        } catch(error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBGuild.generateClassFromDB(result);
    }

    private static generateClassFromDB(result: any): DBGuild {
        const config = new Config(result.config.prefix ?? process.env.bot_prefix ?? "gr!");
        const guild = new DBGuild(result.id ?? undefined, config);
        guild._id = result._id;
        return guild;
    }

    async save() {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;

        try {
            await mongoClient.connect();
            const guilds = botSystem.mongoDatabase.collection("guilds");
            const filter = { id: this.id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    id: this.id,
                    config: this.config
                }
            };
            const result = await guilds.updateOne(filter, updateDoc, options);
            this._id = result.upsertedId.toString();
        } finally {
            await mongoClient.close();
        }
    }

    static async remove(id: string) {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;

        try {
            await mongoClient.connect();
            const mongoClientGuilds = botSystem.mongoDatabase.collection("guilds");

            // Check if guild have been joined before
            const query = { id: id };
            await mongoClientGuilds.deleteOne(query);
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }
    }
}