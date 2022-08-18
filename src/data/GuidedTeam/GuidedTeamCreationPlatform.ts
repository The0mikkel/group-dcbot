import { DMChannel, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, User } from "discord.js";
import BotSystem from "../BotSystem";
import Translate from "../Language/Translate";
import GuidedTeamCreation from "./GuidedTeamCreation";

export default class GuidedTeamCreationPlatform {
    openGuidedTeamCreations: Map<number, GuidedTeamCreation>;
    openGuidedTeamCreationsKey: number

    private static instance: GuidedTeamCreationPlatform;

    private constructor() {
        this.openGuidedTeamCreations = new Map;
        this.openGuidedTeamCreationsKey = 0;
        setInterval(() => { this.filterOpenGuidedTeamCreations() }, 60000);
    }

    static getInstance() {
        if (GuidedTeamCreationPlatform.instance == null) {
            GuidedTeamCreationPlatform.instance = new GuidedTeamCreationPlatform();
        }
        return GuidedTeamCreationPlatform.instance;
    }

    addGuidedTeamCreation(guidedTeamCreation: GuidedTeamCreation): boolean {
        let searchedGuidedTeamCreation = this.getGuidedTeamCreation(guidedTeamCreation.channel, guidedTeamCreation.user);
        if (!searchedGuidedTeamCreation) {
            guidedTeamCreation.key = this.openGuidedTeamCreationsKey;
            this.openGuidedTeamCreations.set(this.openGuidedTeamCreationsKey++, guidedTeamCreation);
            return true;
        } else {
            BotSystem.sendAutoDeleteMessage(guidedTeamCreation.channel, Translate.getInstance().translateUppercase("please finish current team setup, before starting creation of a new team"))
            return false;
        }
    }

    getGuidedTeamCreation(channel: DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel, user: User): GuidedTeamCreation | false {
        let returnValue: GuidedTeamCreation | false;
        returnValue = false;
        this.openGuidedTeamCreations.forEach((element) => {
            if (element.channel.id == channel.id && element.user.id == user.id) {
                returnValue = element;
            }
        })
        return returnValue;
    }

    removeGuidedTeamCreation(guidedTeamCreation: GuidedTeamCreation) {
        try {
            guidedTeamCreation.removeMessages();
            this.openGuidedTeamCreations.delete(guidedTeamCreation.key ?? -1);
        } catch (error) {

        }
    }

    filterOpenGuidedTeamCreations() {
        let filteredTime = new Date();
        filteredTime.setMinutes(filteredTime.getMinutes() - 5);

        this.openGuidedTeamCreations.forEach((element, key) => {
            if (element.timestamp.getTime() < filteredTime.getTime()) {
                element.removeMessages();
                this.openGuidedTeamCreations.delete(key);
            }
        })
    }
}