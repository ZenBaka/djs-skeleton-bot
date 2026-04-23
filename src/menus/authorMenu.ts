import type { ComponentInfo, SelectMenu } from "../types";
import { resolveUserId } from "../utilities/Validators";

export const info: ComponentInfo<SelectMenu> = {
  customId: 'authorMenu',
  cooldown: 2,
  isAuthorOnly: true,
  resolveOwner: resolveUserId
}

export const execute: SelectMenu['execute'] = (client, interaction) => {
  //
}