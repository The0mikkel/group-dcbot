import { DMChannel, NewsChannel, PartialDMChannel, PublicThreadChannel, TextChannel, ThreadChannel, VoiceChannel } from "discord.js";

export type TextChannels = DMChannel | PartialDMChannel | NewsChannel | TextChannel | ThreadChannel | PublicThreadChannel | VoiceChannel; 