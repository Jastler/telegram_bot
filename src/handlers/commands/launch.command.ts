import { Context } from "telegraf";
import { env } from "../../config/env";

/**
 * Обробник команди /launch
 */
export async function handleLaunch(ctx: Context): Promise<void> {
  await ctx.reply("🔄 Launching your Mini App...", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Launch app", web_app: { url: env.miniAppUrl } }],
      ],
    },
  });
}
