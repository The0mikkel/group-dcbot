import { Client, Message } from "discord.js";
import BotSystem from "../BotSystem";
import DBConnection from "../DBConnection";
import DBElement from "../DBElement";
import ASCIIFolder from "../Helper/ascii-folder";

export class DBInvite implements DBElement {
    _id: undefined | string
    userId: string;
    messageId: string;
    roleId: string;
    guildId: string;

    constructor(userId: any, messageId: string, roleId: string, guildId: string) {
        this.userId = ASCIIFolder.foldReplacing(userId);
        this.messageId = ASCIIFolder.foldReplacing(messageId);
        this.roleId = ASCIIFolder.foldReplacing(roleId);
        this.guildId = ASCIIFolder.foldReplacing(guildId);
    }

    static async load(id: string): Promise<undefined | DBInvite> {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");

            const query = { _id: ASCIIFolder.foldReplacing(id) };
            const options = {
            };
            result = await invites.findOne(query, options);

            if (!result) {
                return undefined;
            }
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBInvite.generateClassFromDB(result);
    }
    static async loadByMessageId(id: string): Promise<undefined | DBInvite> {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");

            const query = { messageId: ASCIIFolder.foldReplacing(id) };
            const options = {};
            result = await invites.findOne(query, options);

            if (!result) {
                return undefined;
            }
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBInvite.generateClassFromDB(result);
    }
    static async loadByguildId(id: string): Promise<undefined | DBInvite> {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");

            const query = { guildId: ASCIIFolder.foldReplacing(id) };
            const options = {};
            result = await invites.findOne(query, options);

            if (!result) {
                return undefined;
            }
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBInvite.generateClassFromDB(result);
    }
    static async loadByRoleId(id: string): Promise<undefined | DBInvite> {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");

            const query = { roleId: ASCIIFolder.foldReplacing(id) };
            const options = {};
            result = await invites.findOne(query, options);

            if (!result) {
                return undefined;
            }
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBInvite.generateClassFromDB(result);
    }

    static async loadFromGuild(guildId: string): Promise<DBInvite[]> {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        let result: DBInvite[] = [];
        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");

            const query = { guildId: ASCIIFolder.foldReplacing(guildId) };
            const cursor = invites.find(query);

            await cursor.forEach(element => {
                result.push(DBInvite.generateClassFromDB(element));
            });
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return result;
    }

    private static generateClassFromDB(result: any): DBInvite {
        const invite = new DBInvite(ASCIIFolder.foldReplacing(result.userId ?? ""), ASCIIFolder.foldReplacing(result.messageId ?? ""), ASCIIFolder.foldReplacing(result.roleId ?? ""), ASCIIFolder.foldReplacing(result.guildId ?? ""));
        invite._id = result._id ?? undefined;
        return invite;
    }

    async save() {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");
            const filter = {
                userId: this.userId,
                messageId: this.messageId,
                roleId: this.roleId,
            };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    userId: ASCIIFolder.foldReplacing(this.userId),
                    messageId: ASCIIFolder.foldReplacing(this.messageId),
                    roleId: ASCIIFolder.foldReplacing(this.roleId),
                    guildId: ASCIIFolder.foldReplacing(this.guildId)
                }
            };
            const result = await invites.updateOne(filter, updateDoc, options);
            this._id = result.upsertedId.toString();
        } finally {
            await mongoClient.close();
        }
    }

    static async remove(id: string) {
        const dbConnection = DBConnection.getInstance();
        const mongoClient = dbConnection.mongoClient;

        try {
            await mongoClient.connect();
            const invites = dbConnection.mongoDatabase.collection("invites");

            // Check if guild have been joined before
            const query = { _id: ASCIIFolder.foldReplacing(id+"") };
            await invites.deleteOne(query);
        } catch (error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }
    }

    async acceptInvite(client: Client) {
        // Get elements
        let guild = client.guilds.cache.get(this.guildId);
        let user = await client.users.fetch(this.userId);
        let guildUser = await guild?.members.fetch(this.userId);

        // Check team still exist
        let role = guild?.roles.cache.get(this.roleId);
        if (!role) {
            try {
                user.send("The team is no longer available.");
            } catch (error) {
                console.log(error)
            }
            return;
        }

        // Add role to user
        try {
            guildUser?.roles.add(role);
            user.send("You have been added to the team " + role.name);
            if (this._id) {
                DBInvite.remove(this._id);
            }
        } catch (error) {
            console.log(error)
        }
    }
}