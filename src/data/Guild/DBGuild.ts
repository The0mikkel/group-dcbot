import { Message } from "discord.js";
import BotSystem from "../BotSystem";
import DBConnection from "../DBConnection";
import DBElement from "../DBElement";
import ASCIIFolder from "../Helper/ascii-folder";
import { Config } from "./Config";
import { InviteType } from "./InviteType";
import { TeamConfig } from "./TeamConfig";

export class DBGuild implements DBElement {
    _id: undefined | string
    id: any;
    config: Config;
    teamConfig: TeamConfig
    /**
     * Roles that are represented as "admin" by the bot
     */
    adminRoles: string[];
    /**
     * Roles that are represented as "teamAdmin" by the bot - They are admins for teams and cannot access admin features that are beyond teams
     */
    teamAdminRoles: string[];
    /**
     * Message ids for guided team creations
     */
    guidedTeamStart: string[]
    /**
     * Channel ids for clean channels
     */
    cleanChannels: string[]

    constructor(id = "", config = new Config, teamConfig = new TeamConfig, guidedTeamStart: string[] = [], cleanChannels: string[] = [], adminRoles: string[] = [], teamAdminRoles: string[] = []) {
        this.id = ASCIIFolder.foldReplacing(id);
        this.config = config;
        this.teamConfig = teamConfig;
        this.guidedTeamStart = guidedTeamStart;
        this.cleanChannels = cleanChannels;
        this.adminRoles = adminRoles;
        this.teamAdminRoles = teamAdminRoles;
    }

    static async load(id: string): Promise<undefined | DBGuild> {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const guilds = dbConnection.mongoDatabase.collection("guilds");

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
        const guild = new DBGuild(
            result.id ?? undefined, 
            config, 
            teamConfig, 
            result.guidedTeamStart ?? [],
            result.cleanChannels ?? [],
            result.adminRoles ?? [],
            result.teamAdminRoles ?? [],
        );
        guild._id = result._id;
        return guild;
    }

    async save() {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        try {
            await mongoClient.connect();
            const guilds = dbConnection.mongoDatabase.collection("guilds");
            const filter = { id: this.id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    id: this.id,
                    config: this.config,
                    teamConfig: this.teamConfig,
                    guidedTeamStart: this.guidedTeamStart,
                    cleanChannels: this.cleanChannels,
                    adminRoles: this.adminRoles,
                    teamAdminRoles: this.teamAdminRoles,
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
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        try {
            await mongoClient.connect();
            const mongoClientGuilds = dbConnection.mongoDatabase.collection("guilds");

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

    addAdminRole(roleId: string): boolean {
        if (this.adminRoles.includes(roleId)) {
            return false;
        }
        this.adminRoles.push(roleId);
        return true;
    }
    removeAdminRole(roleId: string): boolean {
        if (!this.adminRoles.includes(roleId)) {
            return false;
        }
        this.adminRoles = this.arrayRemove(this.adminRoles, roleId);
        return true;
    }
    addTeamAdminRole(roleId: string): boolean {
        if (this.teamAdminRoles.includes(roleId)) {
            return false;
        }
        this.teamAdminRoles.push(roleId);
        return true;
    }
    removeTeamAdminRole(roleId: string): boolean {
        if (!this.teamAdminRoles.includes(roleId)) {
            return false;
        }
        this.teamAdminRoles = this.arrayRemove(this.teamAdminRoles, roleId);
        return true;
    }

    filterRemoved(message: Message): void {
        this.adminRoles = this.adminRoles.filter(function (role) {
            return message.guild?.roles.cache.get(role)?.name
        });
        this.teamAdminRoles = this.teamAdminRoles.filter(function (role) {
            return message.guild?.roles.cache.get(role)?.name
        });
    }

    private arrayRemove(arr: string[], value: string) {
        return arr.filter(function (ele) {
            return ele != value;
        });
    }
}