import { Context } from "telegraf";
import { Telegraf } from "telegraf";
import { env } from "../../config/env";

/**
 * Обробник команди /promo (тільки для адміністратора)
 * Формат: /promo <id1,id2> | <img> | <btnText> | <btnUrl> | <caption>
 */
export async function handlePromo(ctx: Context, bot: Telegraf): Promise<void> {
  // Перевірка прав адміністратора
  if (ctx.from?.id !== env.adminId) {
    await ctx.reply("⛔ You are not admin.");
    return;
  }

  const raw = (ctx.message as any)?.text.replace(/^\/promo\s*/, "");
  const p = raw.split("|").map((s: string) => s.trim());

  if (p.length < 5) {
    await ctx.reply(
      "⚠️ Format:\n/promo <id1,id2> | <img> | <btnText> | <btnUrl> | <caption>"
    );
    return;
  }

  const [idsRaw, imgUrl, btnText, btnUrl, ...cap] = p;
  const caption = cap.join("|");
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let ok = 0,
    fail = 0;

  for (const id of ids) {
    try {
      await bot.telegram.sendPhoto(id, imgUrl, {
        caption,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [[{ text: btnText, url: btnUrl }]] },
      });
      ok++;
    } catch (e: any) {
      fail++;
      console.error(`❌ ${id}`, e.description || e.message);
    }
  }

  ctx.reply(`🎯 Promo finished. Sent: ${ok}, Errors: ${fail}`);
}
