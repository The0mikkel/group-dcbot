import { Message, PermissionResolvable } from "discord.js";
import Type from "./Types/Type";

export default abstract class Command implements Type {
    name: string; // Command
    description: string;
    guildOnly: boolean;
    args: boolean;
    args_quantity: number;
    usage: string;
    cooldown: number;
    permissions: PermissionResolvable[];
    aliases: string[];
    category: string;
    categoryEmoji: string;
    
    constructor(
        name: string, 
        description: string, 
        guildOnly: boolean = false, 
        args: boolean = false, 
        args_quantity: number = 0, 
        usage: string = "", 
        cooldown: number = 5, 
        permissions: PermissionResolvable[] = [],
        aliases: string[] = [],
        category: string,
        categoryEmoji: string
    ) {
        this.name = name;
        this.description = description;
        this.guildOnly = guildOnly;
        this.args = args;
        this.args_quantity = args_quantity;
        this.usage = usage;
        this.cooldown = cooldown;
        this.permissions = permissions;
        this.aliases = aliases;
        this.category = category;
        this.categoryEmoji = categoryEmoji;
    }

    abstract execute(message: Message, args: any, autoDelete: boolean, autoDeleteTime: number): Promise<void>;
}