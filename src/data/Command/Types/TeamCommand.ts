import Command from "../Command";
import Type from "./Type";

export default abstract class TeamCommand extends Command implements Type {
    declare category: "team";
    declare categoryEmoji: ":people_wrestling:";
}