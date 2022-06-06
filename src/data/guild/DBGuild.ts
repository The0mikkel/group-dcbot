import BotSystem from "../BotSystem";
import { Config } from "./Config";
import { TeamConfig } from "./TeamConfig";

export class DBGuild {
    _id: undefined | string
    id: any;
    config: Config;
    teamConfig: TeamConfig

    constructor(id = "", config = new Config, teamConfig = new TeamConfig) {
        this.id = id;
        this.config = config;
        this.teamConfig = teamConfig;
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
            console.log("Error with loading guild!")
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBGuild.generateClassFromDB(result);
    }

    private static generateClassFromDB(result: any): DBGuild {
        const config = new Config(result.config.prefix ?? process.env.bot_prefix ?? "gr!");
        const teamConfig = new TeamConfig(result.teamConfig?.creatorRole ?? [], result.teamConfig?.requireInvite ?? false);
        const guild = new DBGuild(result.id ?? undefined, config, teamConfig);
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
                    config: this.config,
                    teamConfig: this.teamConfig
                }
            };
            const result = await guilds.updateOne(filter, updateDoc, options);
            this._id = result.upsertedId?.toString();
        } catch (error) {
            console.log("Error with saving guild!")
            console.log(error);
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
            console.log("Error with removing guild!")
            console.log(error)
        } finally {
            await mongoClient.close();
        }
    }
}