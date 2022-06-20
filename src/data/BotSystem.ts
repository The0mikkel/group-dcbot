import { Client, Collection, DMChannel, Message, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User } from "discord.js";
import { Db, MongoClient, Timestamp } from "mongodb";
import { DBGuild } from "./guild/DBGuild";
import Discord from "discord.js";
import { envType } from "./envType";
import GuidedTeamCreation from "./GuidedTeamCreation/GuidedTeamCreation";
import Command from "./Command/Command";
import fs from 'fs';

export default class BotSystem {
    commands: Collection<string, Command>
    commandTypeMap: Map<string, Command[]>
    cooldowns: Collection<string, Collection<string, number>>
    guild: DBGuild | undefined
    mongoUrl: string;
    mongoClient: MongoClient;
    mongoDatabase: Db;
    env: envType;
    openGuidedTeamCreations: Map<number, GuidedTeamCreation>;
    openGuidedTeamCreationsKey: number

    private static instance: BotSystem;
    public static client: Client;

    private constructor() {
        this.commands = new Discord.Collection<string, Command>() 
        this.loadCommands();
        this.cooldowns = new Discord.Collection<string, Collection<string, number>>()
        
        this.guild = undefined;
        this.mongoUrl = process.env.database_url ?? "";
        this.mongoClient = new MongoClient(this.mongoUrl);
        this.mongoDatabase = this.mongoClient.db("grouper")

        this.env = envType[((process.env.env ?? "prod") as keyof typeof envType)] ?? envType.prod;

        this.openGuidedTeamCreations = new Map;
        this.openGuidedTeamCreationsKey = 0;
        setInterval(() => { this.filterOpenGuidedTeamCreations() }, 60000);

        this.commandTypeMap = new Map;
    }

    static getInstance() {
        if (BotSystem.instance == null) {
            BotSystem.instance = new BotSystem();
        }
        return BotSystem.instance;
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

    addGuidedTeamCreation(guidedTeamCreation: GuidedTeamCreation): boolean {
        let searchedGuidedTeamCreation = this.getGuidedTeamCreation(guidedTeamCreation.channel, guidedTeamCreation.user);
        if (!searchedGuidedTeamCreation) {
            guidedTeamCreation.key = this.openGuidedTeamCreationsKey;
            this.openGuidedTeamCreations.set(this.openGuidedTeamCreationsKey++, guidedTeamCreation);
            return true;
        } else {
            BotSystem.sendAutoDeleteMessage(guidedTeamCreation.channel, "Please finish current team setup, before starting creation of a new team")
            return false;
        }
    }

    getGuidedTeamCreation(channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel, user: User): GuidedTeamCreation | false {
        let returnValue: GuidedTeamCreation | false;
        returnValue = false;
        this.openGuidedTeamCreations.forEach((element) => {
            if (element.channel.id == channel.id && element.user.id == user.id) {
                returnValue = element;
            }
        })
        return returnValue;
    }

    removeGuidedTeamCreation(guidedTeamCreation: GuidedTeamCreation) {
        try {
            guidedTeamCreation.removeMessages();
            this.openGuidedTeamCreations.delete(guidedTeamCreation.key ?? -1);
        } catch (error) {
            
        }
    }

    filterOpenGuidedTeamCreations() {
        let filteredTime = new Date();
        filteredTime.setMinutes(filteredTime.getMinutes() - 5);

        this.openGuidedTeamCreations.forEach((element, key) => {
            if (element.timestamp.getTime() < filteredTime.getTime()) {
                element.removeMessages();
                this.openGuidedTeamCreations.delete(key);
            }
        })
    }

    async loadCommands() {
        const commandFolders = fs.readdirSync('./dist/commands');
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./dist/commands/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                await import(`../commands/${folder}/${file}`).then(command => {
                    try {
                        let obj = new command.default;
                        this.commands.set(obj.name, obj);
                        
                        if (!this.commandTypeMap.has(obj.category)) {
                            this.commandTypeMap.set(obj.category, []);
                        }
                        this.commandTypeMap.get(obj.category)?.push(obj);
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
        }
    }
}