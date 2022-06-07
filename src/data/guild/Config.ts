import ASCIIFolder from "../helper/ascii-folder";

export class Config {
    prefix = "gr!";

    constructor(prefix = (process.env.bot_prefix ?? "gr!")) {
        this.prefix = ASCIIFolder.foldReplacing(prefix);
    }
}