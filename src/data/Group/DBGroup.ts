import BotSystem from "../BotSystem";
import DBConnection from "../DBConnection";
import DBElement from "../DBElement";
import ASCIIFolder from "../Helper/ascii-folder";

export class DBGroup implements DBElement {
    _id: undefined | string
    id: any;
    guildId: string;
    name: string;
    author: undefined | string;
    teamLeader: string;
    timestamp: any;
    textChannel: string | undefined;
    voiceChannel: string | undefined;

    constructor(id: any, guildId: string, name: string, author: string, teamLeader: string, timestamp: any, textChannel: string | undefined = undefined, voiceChannel: string | undefined = undefined) {
        this.id = ASCIIFolder.foldReplacing(id);
        this.guildId = ASCIIFolder.foldReplacing(guildId);
        this.name = ASCIIFolder.foldReplacing(name);
        this.author = ASCIIFolder.foldReplacing(author);
        this.teamLeader = ASCIIFolder.foldReplacing(teamLeader);
        this.timestamp = timestamp;
        this.textChannel = textChannel;
        this.voiceChannel = voiceChannel;
    }

    static async load(id: string): Promise<undefined | DBGroup> {
        let result: any;
        await DBConnection.collectionAction("groups", async (groups) => {
            const query = { id: id };
            const options = {
            };
            result = await groups.findOne(query, options);

            if (!result) {
                return undefined;
            }
        });
        if (!result) {
            return undefined;
        }
        return DBGroup.generateClassFromDB(result);
    }

    static async loadFromGuild(guildId: string): Promise<DBGroup[]> {

        let result: DBGroup[] = [];
        await DBConnection.collectionAction("groups", async (groups) => {
            const query = { guildId: guildId };
            const cursor = groups.find(query);

            await cursor.forEach(element => {
                result.push(DBGroup.generateClassFromDB(element));
            });
        });
        return result;
    }

    private static generateClassFromDB(result: any): DBGroup {
        const group = new DBGroup(
            ASCIIFolder.foldReplacing(result.id ?? undefined),
            ASCIIFolder.foldReplacing(result.guildId ?? ""),
            ASCIIFolder.foldReplacing(result.name ?? ""),
            ASCIIFolder.foldReplacing(result.author ?? ""),
            ASCIIFolder.foldReplacing(result.teamLeader ?? ""),
            result.timestamp ?? "",
            ASCIIFolder.foldReplacing(result.textChannel ?? ""),
            ASCIIFolder.foldReplacing(result.voiceChannel ?? ""),
        )
        group._id = result._id;
        return group;
    }

    async save() {
        await DBConnection.collectionAction("groups", async (groups) => {
            const filter = { id: this.id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    id: ASCIIFolder.foldReplacing(this.id),
                    guildId: ASCIIFolder.foldReplacing(this.guildId),
                    name: ASCIIFolder.foldReplacing(this.name),
                    author: ASCIIFolder.foldReplacing(this.author),
                    teamLeader: ASCIIFolder.foldReplacing(this.teamLeader),
                    timestamp: this.timestamp,
                    textChannel: ASCIIFolder.foldReplacing(this.textChannel),
                    voiceChannel: ASCIIFolder.foldReplacing(this.voiceChannel)
                }
            };
            const result = await groups.updateOne(filter, updateDoc, options);
            if (result)
                this._id = result.upsertedId?.toString() ?? this._id;
        });
    }

    async delete() {
        await DBConnection.collectionAction("groups", async (groups) => {
            const query = { _id: this._id };
            const options = {
            };
            await groups.deleteOne(query, options);
        });
    }

    static async deleteAllFromGuild(guildId: string): Promise<void> {
        await DBConnection.collectionAction("groups", async (groups) => {
            const query = { guildId: guildId };
            const options = {
            };
            await groups.deleteMany(query, options);
        });
    }
}