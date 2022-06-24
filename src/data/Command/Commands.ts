import { Collection } from "discord.js";
import Command from "./Command";
import Discord from "discord.js";
import fs from 'fs';

export default class Commands {
    static commands: Collection<string, Command> = new Discord.Collection<string, Command>()
    static commandTypeMap: Map<string, Command[]> = new Map;
    static cooldowns: Collection<string, Collection<string, number>> = new Discord.Collection<string, Collection<string, number>>()

    static async loadCommands() {
        const commandFolders = fs.readdirSync('./dist/commands');
        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./dist/commands/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                await import(`../../commands/${folder}/${file}`).then(command => {
                    try {
                        let obj = new command.default;
                        Commands.commands.set(obj.name, obj);
                        
                        if (!Commands.commandTypeMap.has(obj.category)) {
                            Commands.commandTypeMap.set(obj.category, []);
                        }
                        Commands.commandTypeMap.get(obj.category)?.push(obj);
                    } catch (error) {
                        console.error(error);
                    }
                });
            }
        }
    }

    static cooldownCheck(command: Command, authorId: string): true|string {

        const cooldowns = Commands.cooldowns;

		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 0) * 1000;

		if (timestamps?.has(authorId)) {
			const expirationTime = (timestamps?.get(authorId) ?? now) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return timeLeft.toFixed(1);
			}
		}

		timestamps?.set(authorId, now);
		setTimeout(() => timestamps?.delete(authorId), cooldownAmount);

        return true;
    }
}