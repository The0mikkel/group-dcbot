import { Client, Collection, DMChannel, Message, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User } from "discord.js";
import { DBGuild } from "./Guild/DBGuild";
import { envType } from "./envType";
import Translate from "./Language/Translate";

export default class BotSystem {
    public static client: Client;

    guild: DBGuild | undefined
    env: envType;
    translator: Translate;

    constructor() {
        this.guild = undefined;
        this.env = envType[((process.env.env ?? "prod") as keyof typeof envType)] ?? envType.prod;
        this.translator = new Translate();
    }

    static async sendAutoDeleteMessage(channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel, message: any, time: number = 30000) {
        try {
            let autoDeleteMessage = await channel.send(message);
            setTimeout(async () => {
                try {
                    await autoDeleteMessage.delete();
                } catch (error) {
                    console.log("Error deleting auto delete message");
                }
            }, time);
        } catch (error) {
            console.log(error)
        }
    }

    static async autoDeleteMessageByUser(message: Message, time: number = 30000) {
        try {
            setTimeout(async () => {
                try {
                    message = await message.fetch();
                    await message.delete();
                } catch (error) {
                    console.log("Error deleting auto delete message");
                }
            }, time);
        } catch (error) {
            console.log(error)
        }
    }

}