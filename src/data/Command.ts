import { Message, PermissionFlags, PermissionResolvable, Permissions } from "discord.js";

export default abstract class Command {
    name: string; // Command
    description: string;
    guildOnly: boolean;
    args: boolean;
    args_quantity: number;
    usage: string;
    cooldown: number;
    permissions: PermissionResolvable[];
    aliases: string[];

    constructor(
        name: string, 
        description: string, 
        guildOnly: boolean = false, 
        args: boolean = false, 
        args_quantity: number = 0, 
        usage: string = "", 
        cooldown: number = 5, 
        permissions: PermissionResolvable[] = [],
        aliases: string[] = []
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
    }

    abstract execute(message: Message, args: any, autoDelete: boolean, autoDeleteTime: number): any;
}