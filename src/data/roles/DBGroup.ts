import BotSystem from "../BotSystem";

export class DBGroup {
    _id: undefined | string
    id: any;
    guildId: string;
    name: string;
    author: undefined | string;
    timestamp: any;

    constructor(id: any, guildId: string, name: string, author: string, timestamp: any) {
        this.id = id;
        this.guildId = guildId;
        this.name = name;
        this.author = author;
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
        const group = new DBGroup(result.id ?? undefined, result.guildId ?? "", result.name ?? "", result.author ?? "", result.timestamp ?? "")
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
                    id: this.id,
                    guildId: this.guildId,
                    name: this.name,
                    author: this.author,
                    timestamp: this.timestamp
                }
            };
            const result = await groups.updateOne(filter, updateDoc, options);
            this._id = result.upsertedId.toString();
        } finally {
            await mongoClient.close();
        }
    }
}