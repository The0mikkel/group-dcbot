import { ButtonInteraction, Client } from "discord.js";
import { ObjectId } from "mongodb";
import BotSystem from "../BotSystem";
import DBConnection from "../DBConnection";
import DBElement from "../DBElement";
import { envType } from "../envType";
import ASCIIFolder from "../Helper/ascii-folder";
import Team from "./Team";

export class DBTeamInvite implements DBElement {
    protected static readonly COLLECTION_NAME = "team-invites";
    _id: undefined | ObjectId | string;
    userId: string;
    teamId: string;
    guildId: string;
    createdAt: Date;
    createdBy: string;
    expiresAt: Date;

    constructor(userId: string, teamId: string, guildId: string, hoursValid: number = 24, createdAt: Date | null, createdBy: string = "") {
        this.userId = ASCIIFolder.foldReplacing(userId);
        this.teamId = ASCIIFolder.foldReplacing(teamId);
        this.guildId = ASCIIFolder.foldReplacing(guildId);
        this.createdAt = createdAt ?? new Date();
        this.createdBy = ASCIIFolder.foldReplacing(createdBy);
        this.expiresAt = new Date(this.createdAt.getTime() + (hoursValid * 60 * 60 * 1000));
    }

    static async load(id: string): Promise<undefined | DBTeamInvite> {
        let result: any;
        await DBConnection.collectionAction(DBTeamInvite.COLLECTION_NAME, async (invites) => {
            const query = { _id: new ObjectId(id) };
            result = await invites.findOne(query);

            if (!result) {
                return undefined;
            }
        });
        if (!result) {
            return undefined;
        }
        return DBTeamInvite.generateClassFromDB(result);
    }

    static async loadFromGuild(guildId: string): Promise<DBTeamInvite[]> {

        let result: DBTeamInvite[] = [];
        await DBConnection.collectionAction(DBTeamInvite.COLLECTION_NAME, async (invites) => {
            const query = { guildId: guildId };
            const cursor = invites.find(query);

            await cursor.forEach(element => {
                result.push(DBTeamInvite.generateClassFromDB(element));
            });
        });
        return result;
    }

    private static generateClassFromDB(result: any): DBTeamInvite {
        const invite = new DBTeamInvite(
            ASCIIFolder.foldReplacing(result.userId ?? undefined),
            ASCIIFolder.foldReplacing(result.teamId ?? undefined),
            ASCIIFolder.foldReplacing(result.guildId ?? ""),
            undefined,
            ASCIIFolder.foldReplacing(result.createdAt ?? ""),
            ASCIIFolder.foldReplacing(result.createdBy ?? "")
        )
        invite._id = result._id;
        invite.expiresAt = result.expiresAt;
        return invite;
    }

    async save() {
        await DBConnection.collectionAction(DBTeamInvite.COLLECTION_NAME, async (invites) => {
            const filter = { createdAt: this.createdAt, userId: ASCIIFolder.foldReplacing(this.userId) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    userId: ASCIIFolder.foldReplacing(this.userId),
                    teamId: ASCIIFolder.foldReplacing(this.teamId),
                    guildId: ASCIIFolder.foldReplacing(this.guildId),
                    createdAt: this.createdAt,
                    createdBy: ASCIIFolder.foldReplacing(this.createdBy),
                    expiresAt: this.expiresAt,
                }
            };
            const result = await invites.updateOne(filter, updateDoc, options);
            if (result)
                this._id = result.upsertedId?.toString() ?? this._id;
        });
    }

    async delete() {
        await DBConnection.collectionAction(DBTeamInvite.COLLECTION_NAME, async (invites) => {
            const query = { _id: this._id };
            const options = {
            };
            await invites.deleteOne(query, options);
        });
    }

    static async deleteAllFromGuild(guildId: string): Promise<void> {
        await DBConnection.collectionAction(DBTeamInvite.COLLECTION_NAME, async (invites) => {
            const query = { guildId: guildId };
            const options = {
            };
            await invites.deleteMany(query, options);
        });
    }

    async handleInviteInteraction(client: Client, interaction: ButtonInteraction, state: string, botSystem: BotSystem = new BotSystem()) {
        if (this.expiresAt.valueOf() < new Date().valueOf()) {
            interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the invite is no longer valid"))], components: [] });
            if (botSystem.env == envType.dev) console.log("invite expired", this.expiresAt, new Date());
            this.delete();
            return;
        }

        if (state === "0") {
            await this.acceptInvite(client, interaction, botSystem);
        } else {
            await this.declineInvite(client, interaction, botSystem);
        }
    }

    async acceptInvite(client: Client, interaction: ButtonInteraction, botSystem: BotSystem = new BotSystem()) {
        let guild = await client.guilds.fetch(this.guildId);
        let member = await guild?.members.fetch(this.userId);

        if (!guild || !member) {
            interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the invite is no longer available"))], components: [] });
            if (botSystem.env == envType.dev) console.log("guild or member not found", this.guildId, this.userId, guild, member);
            this.delete();
            return;
        }


        // Check team still exist
        let role = guild.roles.cache.get(this.teamId);
        if (!role) {
            try {
                interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the team is no longer available in the guild :guild:", [guild.name]))], components: [] });
            } catch (error) {
                console.error(error);
            }
            this.delete();
            return;
        }

        // Add role to user
        try {
            await member.roles.add(this.teamId);
            interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("Invite") + " " + botSystem.translator.translateUppercase("accepted"), botSystem.translator.translateUppercase(`You have been added`) + " " + botSystem.translator.translateUppercase("to the team :team: in the guild :guild:", [role.name, guild.name]))], components: [] });
        } catch (error) {
            console.error(error)
        }

        await this.delete();
    }

    async declineInvite(client: Client, interaction: ButtonInteraction, botSystem: BotSystem = new BotSystem()) {
        try {
            let guild = await client.guilds.fetch(this.guildId);
            let role = guild.roles.cache.get(this.teamId);

            interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("Invite") + " " + botSystem.translator.translateUppercase("declined"), botSystem.translator.translateUppercase(`you declined the invite`) + " " + botSystem.translator.translateUppercase("to the team :team: in the guild :guild:", [role?.name ?? "-", guild.name]))], components: [] });
        } catch (error) {
            console.log(error);
            interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the invite is no longer available"))], components: [] });
            this.delete();
            return;
        }

        this.delete();
    }
}