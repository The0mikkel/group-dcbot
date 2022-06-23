import { PermissionResolvable } from "discord.js";
import Command from "../Command";
import { UserLevel } from "../UserLevel";

export default abstract class GroupCommand extends Command {
    constructor(
        name: string,
        description: string,
        guildOnly: boolean = false,
        args: boolean = false,
        args_quantity: number = 0,
        usage: string = "",
        cooldown: number = 5,
        permissions: PermissionResolvable[] = [],
        level: UserLevel = UserLevel.user,
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
            level,
            aliases,
            "group",
            "👪"
        );
    }
}