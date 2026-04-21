import { EmbedBuilder } from "@discordjs/builders";
import type { CapiFactAPI, PrefixCommand, PrefixCommandInfo } from "../types";

export const info: PrefixCommandInfo = {
  name: 'tea',
  description: 'Get a random fact!',
  category: 'Other'
};

//export const cooldown = 5 * 60;

export const execute: PrefixCommand['execute'] = async (_client, message, ..._args) => {
  const embed = new EmbedBuilder()
    .setColor(0x48ec76);

  const res = await fetch('https://capi.gg/api/facts/random', {
    headers: {
      'Authorization': `Bearer ${Bun.env.CAPI_KEY}`,
      'Content-Type': 'application/json',
    }
  });

  const { text } = await res.json() as CapiFactAPI;

  if (!res.ok) {
    await message.reply(text);
    return;
  }

  embed.setDescription(`## :tea: ${text}`);

  await message.reply({ embeds: [embed] });
}