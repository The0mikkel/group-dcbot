import { Guild, Message } from "discord.js";
import { InviteType } from "./InviteType";

export class TeamConfig {
    creatorRole: string[] = [];
    allowEveryone: boolean;
    requireInvite: boolean;
    teamInviteType: InviteType;

    constructor(creatorRole: string[] = [], allowEveryone = false, requireInvite = false, teamInviteType = InviteType.admin) {
        this.creatorRole = creatorRole;
        this.allowEveryone = allowEveryone;
        this.requireInvite = requireInvite;
        this.teamInviteType = teamInviteType;
    }

    addCreatorRole(roleId: string) {
        this.creatorRole.push(roleId);
    }
    removeCreatorRole(roleId: string) {
        this.creatorRole = this.arrayRemove(this.creatorRole, roleId);
    }

    filterRemoved(message: Message): void {
        this.creatorRole = this.creatorRole.filter(function (role) {
            return TeamConfig.getRoleName(role, message);
        });
    }

    static getRoleName(roleId: string, message: Message) {
        return message.guild?.roles.cache.get(roleId)?.name
    }

    private arrayRemove(arr: string[], value: string) {

        return arr.filter(function (ele) {
            return ele != value;
        });
    }
}