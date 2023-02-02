import Discord from "discord.js";
import { ButtonInteraction } from "discord.js";
import BotSystem from "./BotSystem";
import DBConnection from "./DBConnection";
import { envType } from "./envType";
import { DBTeamInvite } from "./Group/DBTeamInvite";

export default class ButtonHandler {
    private client: Discord.Client<boolean>;
    private interaction: ButtonInteraction;

    constructor(client: Discord.Client<boolean>, interaction: ButtonInteraction) {
        this.client = client;
        this.interaction = interaction;
    }

    async handleButtonAction() {
        const botSystem = new BotSystem();

        if (this.interaction.customId.startsWith("confirm-team-invite;")) {
            try {
                let interactionData = this.interaction.customId.split(";");
                let inviteAction = interactionData[1] ?? "0";
                let inviteId = interactionData[2] ?? "";

                if (inviteId === "") {
                    this.interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the invite is no longer available"))], components: [] });
                    if (botSystem.env == envType.dev) console.log("Invite ID is empty", this.interaction.customId, interactionData, inviteAction, inviteId);
                    return;
                }

                let invite = await DBTeamInvite.load(inviteId);
                if (invite === undefined) {
                    this.interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the invite is no longer available"))], components: [] });
                    if (botSystem.env == envType.dev) console.log("Invite not found", this.interaction.customId, interactionData, inviteAction, inviteId);
                    return;
                }

                invite.handleInviteInteraction(this.client, this.interaction, inviteAction, botSystem);
            } catch (error) {
                this.interaction.update({ embeds: [BotSystem.createSimpleEmbed(botSystem.translator.translateUppercase("An error occured"), botSystem.translator.translateUppercase("the invite is no longer available"))], components: [] });
                console.error("Error while handling invite button interaction", error);
            }
        }
    }
}