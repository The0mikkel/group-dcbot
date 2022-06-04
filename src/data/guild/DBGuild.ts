import { Config } from "./Config";

export class DBGuild {
    id: any;
    config: Config;

    constructor(id = "", config = new Config) {
        this.id = id;
        this.config = config;
    }
}