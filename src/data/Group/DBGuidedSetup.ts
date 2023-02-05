import { ObjectId } from "mongodb";
import DBConnection from "../DBConnection";
import DBElement from "../DBElement";
import ASCIIFolder from "../Helper/ascii-folder";

export class DBGuidedSetup implements DBElement {
    protected static readonly COLLECTION_NAME = "guided-setup";
    _id: undefined | ObjectId | string;
    messageId: string;
    channelId: string;
    guildId: string;
    createdAt: Date;
    createdBy: string;

    constructor(messageId: string, channelId: string, guildId: string, createdAt: Date | null, createdBy: string = "") {
        this.messageId = ASCIIFolder.foldReplacing(messageId);
        this.channelId = ASCIIFolder.foldReplacing(channelId);
        this.guildId = ASCIIFolder.foldReplacing(guildId);
        this.createdAt = createdAt ?? new Date();
        this.createdBy = ASCIIFolder.foldReplacing(createdBy);
    }

    static async load(id: string): Promise<undefined | DBGuidedSetup> {
        let result: any;
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const query = { _id: new ObjectId(id) };
            result = await invites.findOne(query);

            if (!result) {
                return undefined;
            }
        });
        if (!result) {
            return undefined;
        }
        return DBGuidedSetup.generateClassFromDB(result);
    }

    static async loadFromChannel(channelId: string): Promise<undefined | DBGuidedSetup> {
        let result: any;
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const query = { channelId: channelId };
            result = await invites.findOne(query);

            if (!result) {
                return undefined;
            }
        });
        if (!result) {
            return undefined;
        }
        return DBGuidedSetup.generateClassFromDB(result);
    }

    static async loadFromMessage(messageId: string): Promise<undefined | DBGuidedSetup> {
        let result: any;
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const query = { messageId: messageId };
            result = await invites.findOne(query);

            if (!result) {
                return undefined;
            }
        });
        if (!result) {
            return undefined;
        }
        return DBGuidedSetup.generateClassFromDB(result);
    }

    static async loadFromGuild(guildId: string): Promise<DBGuidedSetup[]> {

        let result: DBGuidedSetup[] = [];
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const query = { guildId: guildId };
            const cursor = invites.find(query);

            await cursor.forEach(element => {
                result.push(DBGuidedSetup.generateClassFromDB(element));
            });
        });
        return result;
    }

    private static generateClassFromDB(result: any): DBGuidedSetup {
        const invite = new DBGuidedSetup(
            ASCIIFolder.foldReplacing(result.messageId ?? undefined),
            ASCIIFolder.foldReplacing(result.channelId ?? ""),
            ASCIIFolder.foldReplacing(result.guildId ?? ""),
            ASCIIFolder.foldReplacing(result.createdAt ?? ""),
            ASCIIFolder.foldReplacing(result.createdBy ?? "")
        )
        invite._id = result._id;
        return invite;
    }

    async save() {
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const filter = { channelId: ASCIIFolder.foldReplacing(this.channelId) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    messageId: ASCIIFolder.foldReplacing(this.messageId),
                    channelId: ASCIIFolder.foldReplacing(this.channelId),
                    guildId: ASCIIFolder.foldReplacing(this.guildId),
                    createdAt: this.createdAt,
                    createdBy: ASCIIFolder.foldReplacing(this.createdBy),
                }
            };
            const result = await invites.updateOne(filter, updateDoc, options);
            if (result)
                this._id = result.upsertedId?.toString() ?? this._id;
        });
    }

    async delete() {
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const query = { _id: this._id };
            const options = {
            };
            await invites.deleteOne(query, options);
        });
    }

    static async deleteAllFromGuild(guildId: string): Promise<void> {
        await DBConnection.collectionAction(DBGuidedSetup.COLLECTION_NAME, async (invites) => {
            const query = { guildId: guildId };
            const options = {
            };
            await invites.deleteMany(query, options);
        });
    }
}