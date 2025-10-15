import { Context } from "telegraf";
import { env } from "../config/env.js";
import { unknownMessageReply, SupportedLanguage } from "../translations.js";

/**
 * Обробник невідомих текстових повідомлень
 */
export async function handleText(ctx: Context): Promise<void> {
  // Визначення мови користувача
  const userLang =
    (ctx.from?.language_code?.split("-")[0] as SupportedLanguage) || "en";
  const reply = unknownMessageReply[userLang] || unknownMessageReply.en;

  // Відправка відповіді з кнопкою Mini App
  await ctx.reply(reply.text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: reply.button, web_app: { url: env.miniAppUrl } }],
      ],
    },
  });
}
