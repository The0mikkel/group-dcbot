import Command from "../Command";
import Type from "./Type";

export default abstract class UtilityCommand extends Command implements Type {
    declare category: "utility";
    declare categoryEmoji: ":information_source:";
}