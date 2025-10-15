import { Context } from "telegraf";
import {
  createTelegramUid,
  generateCustomToken,
} from "../../services/user.service.js";
import { env } from "../../config/env.js";

/**
 * Обробник команди /auth - отримання Custom Token
 */
export async function handleAuth(ctx: Context): Promise<void> {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply("❌ Немає даних користувача");
      return;
    }

    const uid = createTelegramUid(telegramUser.id);
    const customToken = await generateCustomToken(uid);

    await ctx.reply(
      `🔑 Ваш Custom Token готовий!\n\n` +
        `Token: \`${customToken}\`\n\n` +
        `⚠️ Токен дійсний 1 годину. Не діліться ним з іншими.`,
      { parse_mode: "Markdown" }
    );

    console.log(`✅ Custom Token видано користувачу: ${uid}`);
  } catch (error) {
    console.error("❌ Помилка генерації токена:", error);
    await ctx.reply("❌ Помилка генерації токена. Спробуйте ще раз пізніше.");
  }
}
