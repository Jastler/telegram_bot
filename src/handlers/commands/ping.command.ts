import { Context } from "telegraf";

/**
 * Обробник команди /ping
 */
export async function handlePing(ctx: Context): Promise<void> {
  await ctx.reply("pong");
}
