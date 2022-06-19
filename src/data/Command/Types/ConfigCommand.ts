import Command from "../Command";
import Type from "./Type";

export default abstract class ConfigCommand extends Command implements Type {
    declare category: "config";
    declare categoryEmoji: ":gear:";
}