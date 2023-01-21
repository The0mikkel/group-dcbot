import { ColorResolvable, Guild, Message, resolveColor } from "discord.js";
import { UserLevel } from "../Command/UserLevel";
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
    /**
     * Default setting of hoist for a team - If it should be shown seperatly in the right menu in a guild
     */
    defaultHoist: boolean = false;
    /**
     * Default color of a team
     */
    defaultColor: ColorResolvable = "Default";
    /**
     * If this is true, the color can be changed for the group, outside of the standard role editor
     */
    enableColorChange: boolean = false;
    /**
     * Who can change the color
     */
    colorChangeBy: UserLevel = 0;
    /**
     * Default setting of role being mentionable
     */
    defaultMentionable: boolean = false;
    /**
     * Category(ies) that text channel will be created in
     */
    defaultCategoryText: string[] = [];
    /**
     * Category(ies) that text channel will be created in
     */
    defaultCategoryVoice: string[] = [];
    /**
     * Enable/disable creation of text channel when a new team is created for the team
     */
    createTextOnTeamCreation: boolean = false;
    /**
     * Enable/disable creation of void channel when a new team is created for the team
     */
    createVoiceOnTeamCreation: boolean = false;


    constructor(
        creatorRole: string[] = [],
        allowEveryone = false,
        requireInvite = false,
        teamInviteType = InviteType.admin,
        defaultHoist: boolean = false,
        defaultColor: ColorResolvable = "Default",
        enableColorChange: boolean = false,
        colorChangeBy: UserLevel = 0,
        defaultMentionable: boolean = false,
        defaultCategoryText: string[] = [],
        defaultCategoryVoice: string[] = [],
        createTextOnTeamCreation: boolean = false,
        createVoiceOnTeamCreation: boolean = false
    ) {
        this.creatorRole = creatorRole;
        this.allowEveryone = allowEveryone;
        this.requireInvite = requireInvite;
        this.teamInviteType = teamInviteType;
        this.defaultHoist = defaultHoist;
        try {
            this.defaultColor = resolveColor(defaultColor ?? "Default")
        } catch (error) {
            defaultColor = "Default"
        }
        this.defaultColor = defaultColor;
        this.enableColorChange = enableColorChange;
        this.colorChangeBy = colorChangeBy;
        this.defaultMentionable = defaultMentionable;
        if (!Array.isArray(defaultCategoryText)) defaultCategoryText = [defaultCategoryText];
        this.defaultCategoryText = defaultCategoryText;
        if (!Array.isArray(defaultCategoryVoice)) defaultCategoryVoice = [defaultCategoryVoice];
        this.defaultCategoryVoice = defaultCategoryVoice;
        this.createTextOnTeamCreation = createTextOnTeamCreation;
        this.createVoiceOnTeamCreation = createVoiceOnTeamCreation;
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

    static generateClassFromDB(result: any): TeamConfig {
        try {
            return new TeamConfig(
                result.teamConfig?.creatorRole ?? undefined,
                result.teamConfig?.allowEveryone ?? undefined,
                result.teamConfig?.requireInvite ?? undefined,
                (InviteType[(result.teamConfig?.teamInviteType ?? "admin") as keyof typeof InviteType]) ?? undefined,
                result.teamConfig?.defaultHoist ?? undefined,
                result.teamConfig?.defaultColor ?? undefined,
                result.teamConfig?.enableColorChange ?? undefined,
                result.teamConfig?.colorChangeBy ?? undefined,
                result.teamConfig?.defaultMentionable ?? undefined,
                result.teamConfig?.defaultCategoryText ?? undefined,
                result.teamConfig?.defaultCategoryVoice ?? undefined,
                result.teamConfig?.createTextOnTeamCreation ?? undefined,
                result.teamConfig?.createVoiceOnTeamCreation ?? undefined
            );
        } catch (error) {
            console.error(error);
            return new TeamConfig();
        }
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