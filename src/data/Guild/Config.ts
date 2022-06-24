import ASCIIFolder from "../Helper/ascii-folder";

export class Config {
    prefix = "gr!";

    constructor(prefix = (process.env.bot_prefix ?? "gr!")) {
        this.prefix = ASCIIFolder.foldReplacing(prefix);
    }
}