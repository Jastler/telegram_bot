import { Context } from "telegraf";
import { env } from "../config/env";
import { unknownMessageReply, SupportedLanguage } from "../../translations";

/**
 * Обробник невідомих текстових повідомлень
 */
export async function handleUnknownMessage(ctx: Context): Promise<void> {
  const text = (ctx.message as any)?.text;
  const payment = (ctx.message as any)?.successful_payment;

  // Ігноруємо команди та платежі
  if (!text || text.startsWith("/") || payment) {
    return;
  }

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
