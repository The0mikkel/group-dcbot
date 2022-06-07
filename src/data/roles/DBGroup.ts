import BotSystem from "../BotSystem";
import ASCIIFolder from "../helper/ascii-folder";

export class DBGroup {
    _id: undefined | string
    id: any;
    guildId: string;
    name: string;
    author: undefined | string;
    teamLeader: string;
    timestamp: any;

    constructor(id: any, guildId: string, name: string, author: string, teamLeader: string, timestamp: any) {
        this.id = ASCIIFolder.foldReplacing(id);
        this.guildId = ASCIIFolder.foldReplacing(guildId);
        this.name = ASCIIFolder.foldReplacing(name);
        this.author = ASCIIFolder.foldReplacing(author);
        this.teamLeader = ASCIIFolder.foldReplacing(teamLeader);
        this.timestamp = timestamp;
    }

    static async load(id: string): Promise<undefined | DBGroup> {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;

        let result: any;
        try {
            await mongoClient.connect();
            const groups = botSystem.mongoDatabase.collection("groups");

            const query = { id: id };
            const options = {
            };
            result = await groups.findOne(query, options);

            if (!result) {
                return undefined;
            }
        } catch(error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return DBGroup.generateClassFromDB(result);
    }

    static async loadFromGuild(guildId: string): Promise<DBGroup[]> {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;

        let result: DBGroup[] = [];
        try {
            await mongoClient.connect();
            const groups = botSystem.mongoDatabase.collection("groups");

            const query = { guildId: guildId };
            const cursor = groups.find(query);

            await cursor.forEach(element => {
                result.push(DBGroup.generateClassFromDB(element));
            });
        } catch(error) {
            console.log(error)
        } finally {
            await mongoClient.close();
        }

        return result;
    }

    private static generateClassFromDB(result: any): DBGroup {
        const group = new DBGroup(
            ASCIIFolder.foldReplacing(result.id ?? undefined), 
            ASCIIFolder.foldReplacing(result.guildId ?? ""), 
            ASCIIFolder.foldReplacing(result.name ?? ""), 
            ASCIIFolder.foldReplacing(result.author ?? ""), 
            ASCIIFolder.foldReplacing(result.teamLeader ?? ""), 
            result.timestamp ?? ""
        )
        group._id = result._id;
        return group;
    }

    async save() {
        const botSystem = BotSystem.getInstance();
        const mongoClient = botSystem.mongoClient;

        try {
            await mongoClient.connect();
            const groups = botSystem.mongoDatabase.collection("groups");
            const filter = { id: this.id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    id: ASCIIFolder.foldReplacing(this.id),
                    guildId: ASCIIFolder.foldReplacing(this.guildId),
                    name: ASCIIFolder.foldReplacing(this.name),
                    author: ASCIIFolder.foldReplacing(this.author),
                    teamLeader: ASCIIFolder.foldReplacing(this.teamLeader),
                    timestamp: this.timestamp
                }
            };
            const result = await groups.updateOne(filter, updateDoc, options);
            if (result)
                this._id = result.upsertedId?.toString() ?? this._id;
        } finally {
            await mongoClient.close();
        }
    }
}