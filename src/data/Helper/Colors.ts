import { ColorResolvable, Util } from "discord.js";

export default class Colors {
    static colors = new Map([
        [0x000000, "Default"],
        [0xffffff, "White"],
        [0x1abc9c, "Aqua"],
        [0x57f287, "Green"],
        [0x3498db, "Blue"],
        [0xfee75c, "Yellow"],
        [0x9b59b6, "Purple"],
        [0xe91e63, "LuminousVividPink"],
        [0xeb459e, "Fuchsia"],
        [0xf1c40f, "Gold"],
        [0xe67e22, "Orange"],
        [0xed4245, "Red"],
        [0x95a5a6, "Grey"],
        [0x34495e, "Navy"],
        [0x11806a, "DarkAqua"],
        [0x1f8b4c, "DarkGreen"],
        [0x206694, "DarkBlue"],
        [0x71368a, "DarkPurple"],
        [0xad1457, "DarkVividPink"],
        [0xc27c0e, "DarkGold"],
        [0xa84300, "DarkOrange"],
        [0x992d22, "DarkRed"],
        [0x979c9f, "DarkGrey"],
        [0x7f8c8d, "DarkerGrey"],
        [0xbcc0c0, "LightGrey"],
        [0x2c3e50, "DarkNavy"],
        [0x5865f2, "Blurple"],
        [0x99aab5, "Greyple"],
        [0x2c2f33, "DarkButNotBlack"],
        [0x23272a, "NotQuiteBlack"],
    ]);

    static getColor(color: ColorResolvable): string|any {
        let resolvedColor: number;
        try {
            resolvedColor = Util.resolveColor(color);
            return Colors.colors.get(resolvedColor) ?? "#"+resolvedColor.toString(16);
        } catch (error) {
            return color;
        }
    }
}