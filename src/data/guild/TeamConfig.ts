import { Guild, Message } from "discord.js";
import { InviteType } from "./InviteType";

export class TeamConfig {
    /**
     * Roles that are allowed to create a team
     */
    creatorRole: string[] = [];
    /**
     * If this is true, creator role will be ignored, and everyone can create a team
     */
    allowEveryone: boolean;
    /**
     * Teams require an invite to be send, before a member is added to the team (member confirmation before added to team)
     */
    requireInvite: boolean;
    /**
     * Who can invite new members to the team - This can always be overwritten by users that can add or remove roles from members
     */
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