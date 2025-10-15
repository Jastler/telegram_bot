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
      await ctx.reply("❌ No user data available");
      return;
    }

    const uid = createTelegramUid(telegramUser.id);
    const customToken = await generateCustomToken(uid);

    await ctx.reply(
      `🔑 Your Custom Token is ready!\n\n` +
        `Token: \`${customToken}\`\n\n` +
        `⚠️ Token is valid for 1 hour. Do not share it with others.`,
      { parse_mode: "Markdown" }
    );

    console.log(`✅ Custom Token issued to user: ${uid}`);
  } catch (error) {
    console.error("❌ Token generation error:", error);
    await ctx.reply("❌ Token generation error. Please try again later.");
  }
}
