import BotSystem from "../BotSystem";
import ASCIIFolder from "../helper/ascii-folder";
import { Config } from "./Config";
import { InviteType } from "./InviteType";
import { TeamConfig } from "./TeamConfig";

export class DBGuild {
    _id: undefined | string
    id: any;
    config: Config;
    teamConfig: TeamConfig
    guidedTeamStart: string[] // Message ids for guided team creations

    constructor(id = "", config = new Config, teamConfig = new TeamConfig, guidedTeamStart: string[] = []) {
        this.id = ASCIIFolder.foldReplacing(id);
        this.config = config;
        this.teamConfig = teamConfig;
        this.guidedTeamStart = guidedTeamStart;
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
        } catch (error) {
            console.log("Error with loading guild!")
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBGuild.generateClassFromDB(result);
    }

    private static generateClassFromDB(result: any): DBGuild {
        const config = new Config(ASCIIFolder.foldReplacing(result.config.prefix) ?? ASCIIFolder.foldReplacing(process.env.bot_prefix) ?? "gr!");
        const teamConfig = new TeamConfig(
            result.teamConfig?.creatorRole ?? [], 
            result.teamConfig?.allowEveryone ?? false, 
            result.teamConfig?.requireInvite ?? false, 
            InviteType[(result.teamConfig?.teamInviteType ?? "admin") as keyof typeof InviteType]) ?? InviteType.admin;
        const guild = new DBGuild(result.id ?? undefined, config, teamConfig, result.guidedTeamStart ?? []);
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
                    teamConfig: this.teamConfig,
                    guidedTeamStart: this.guidedTeamStart
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