import { Guild, Message } from "discord.js";

export class TeamConfig {
    creatorRole: string[] = [];
    requireInvite: boolean;

    constructor(creatorRole: string[] = [], requireInvite = false) {
        this.creatorRole = creatorRole;
        this.requireInvite = requireInvite;
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