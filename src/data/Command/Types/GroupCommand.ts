import Command from "../Command";
import Type from "./Type";

export default abstract class GroupCommand extends Command implements Type {
    declare category: "group";
    declare categoryEmoji: ":family:";
}