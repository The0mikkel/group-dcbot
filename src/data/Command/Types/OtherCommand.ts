import Command from "../Command";
import Type from "./Type";

export default abstract class OtherCommand extends Command implements Type {
    declare category: "other";
    declare categoryEmoji: ":partying_face:";
}