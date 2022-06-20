import { PermissionResolvable } from "discord.js";
import Command from "../Command";
import Type from "./Type";

export default abstract class TeamCommand extends Command {
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
        super(
            name,
            description,
            guildOnly,
            args,
            args_quantity,
            usage,
            cooldown,
            permissions,
            aliases,
            "team",
            "🤼"
        );
    }
}