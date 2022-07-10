import { ColorResolvable, Message, MessageActionRow, MessageButton, MessageButtonStyle, MessageComponentInteraction, MessageEmbed } from "discord.js";

export default class BotSystemEmbed {
    /**
     * Create simple embed for bot
     * 
     * @param title 
     * @param text 
     * @returns MessageEmbed 
     */
    public static embedCreator(title: string, text: string, color: ColorResolvable = 0x0099ff) {
        return new MessageEmbed()
            .setColor(color)
            .setTitle(title)
            .setDescription(text)
    }

    /**
     * Create buttons from EmbedButtons interface
     * 
     * @param buttons EmbedButtons 
     * @returns MessageActionRow
     */
    public static buttonCreator(buttons: EmbedButtons[]): MessageActionRow {
        const actionRow = new MessageActionRow();
        for (let index = 0; index < buttons.length; index++) {
            try {
                actionRow.addComponents(
                    new MessageButton()
                        .setCustomId(`${buttons[index].identifier}`)
                        .setLabel(buttons[index].text)
                        .setStyle(buttons[index].style),
                );
            } catch (error) {
                console.error(error);
            }
        }

        return actionRow;
    }

    /**
     * Create collector on button actions from message
     * 
     * @param message Message containing buttons 
     * @param buttons EmbedButtons
     * @param time Time of collector being active
     * @param actionOnEnd Function run when collector is ended
     */
    public static buttonActions(message: Message, buttons: EmbedButtons[], time: number = 150000, actionOnEnd: (message: Message) => void) {
        const collector = message.createMessageComponentCollector({ time: time });
        collector.on('collect', async i => {
            if (!i.customId) {
                return;
            }
            buttons.forEach(button => {
                if (i.customId == button.identifier) {
                    button.action(i);
                }
            });
        });
        collector.on('end', () => actionOnEnd(message));
    }
}

export interface EmbedButtons {
    identifier: string;
    text: string;
    style: MessageButtonStyle;
    action: (i: MessageComponentInteraction) => void;
}