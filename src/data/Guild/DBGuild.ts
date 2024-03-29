import { ChannelType, Guild, GuildBasedChannel, Message } from "discord.js";
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
        let result: any;
        await DBConnection.collectionAction("guilds", async (guilds) => {

            const query = { id: id };
            result = await guilds.findOne(query);

            if (!result) {
                return undefined;
            }
        });

        return DBGuild.generateClassFromDB(result);
    }

    private static generateClassFromDB(result: any): DBGuild {
        const config = new Config(ASCIIFolder.foldReplacing(result.config.prefix) ?? ASCIIFolder.foldReplacing(process.env.bot_prefix) ?? "gr!");
        const teamConfig = TeamConfig.generateClassFromDB(result);
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
        await DBConnection.collectionAction("guilds", async (guilds) => {

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
        });
    }

    static async remove(id: string) {
        await DBConnection.collectionAction("guilds", async (guilds) => {

            // Check if guild have been joined before
            const query = { id: id };
            await guilds.deleteOne(query);
        });
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

    public static getCategoryFromId(id: string, guild: Guild): GuildBasedChannel | undefined {
        return guild.channels.cache.find(channel => channel.type == ChannelType.GuildCategory && channel.id == id);
    }
    
}