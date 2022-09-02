import fs from 'fs';

export default class Translate {

    private language: string;
    private languageFile: { information: { language: string }, translation: any } | undefined;
    private defaultLanguageFile: { information: { language: string }, translation: any } = require('../../../resources/lang/en.json');
    private static instance: Translate;

    constructor(language: string | undefined = undefined) {

        let tempLanguage: string = Translate.instance?.language ?? process.env.language ?? "en";

        this.language = language ?? tempLanguage;
        this.loadLanguageFile();
    }

    public static getInstance(): Translate {
        if (!this.instance) {
            this.instance = new Translate();
        }
        return this.instance;
    }

    public getLanguage(): string {
        return this.language.toString();
    }

    public setLanguage(language: string) {
        this.language = language;
        this.loadLanguageFile();
    }

    private loadLanguageFile() {
        let data;
        try {
            data = require('../../../resources/lang/' + this.language.toString() + '.json');
        } catch (error) {
            console.log(error);
            data = undefined;
        }
        this.languageFile = data
    }

    /**
     * Translate text with data
     * 
     * @param text - Name or text to replace - Direct lookup in language file 
     * @param data - Data points to replace
     * 
     * @example translate("total of %count% members are present in the guild", [2])
     */
    translate(text: string = "", data: any[] = []): string {
        text = text.toLowerCase();
        let translatedText: string;
        try {
            translatedText = this.languageFile?.translation[text] ?? undefined;
            if (!translatedText) {
                translatedText = this.defaultLanguageFile?.translation[text] ?? undefined;
            }
        } catch (error) {
            console.log(error);
            translatedText = text;
        }
        if (!translatedText) translatedText = text;

        data.forEach(dataPoint => {
            translatedText = translatedText.replace(`%data%`, dataPoint ?? "");
        });

        return translatedText;
    }

    /**
     * Translate text as translate, but with first letter uppercase
     */
    translateUppercase(text: string = "", data: any[] = []): string {
        let translatedText = this.translate(text, data);
        return translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
    }
}