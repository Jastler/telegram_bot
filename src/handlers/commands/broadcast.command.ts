import { Context } from "telegraf";
import { Telegraf } from "telegraf";
import Bottleneck from "bottleneck";
import { getFirestore } from "../../config/firebase.config";
import { extractTelegramId } from "../../constants/firebase";
import { env } from "../../config/env";

const db = getFirestore();
const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 50 });

/**
 * Обробник команди /broadcast (тільки для адміністратора)
 * Формат: /broadcast <img> | <btnText> | <btnUrl> | <caption>
 */
export async function handleBroadcast(
  ctx: Context,
  bot: Telegraf
): Promise<void> {
  // Перевірка прав адміністратора
  if (ctx.from?.id !== env.adminId) {
    await ctx.reply("⛔ You are not admin.");
    return;
  }

  const raw = (ctx.message as any)?.text.replace(/^\/broadcast\s*/, "");
  const p = raw.split("|").map((s: string) => s.trim());

  if (p.length < 4) {
    await ctx.reply(
      "⚠️ Format:\n/broadcast <img> | <btnText> | <btnUrl> | <caption>"
    );
    return;
  }

  const [imgUrl, btnText, btnUrl, ...cap] = p;
  const caption = cap.join("|");

  // Отримання користувачів, які дозволяють відправку повідомлень
  const snap = await db
    .collection("users")
    .where("allows_write_to_pm", "==", true)
    .select()
    .get();

  let ok = 0,
    blocked = 0,
    other = 0;

  for (const doc of snap.docs) {
    const tgId = extractTelegramId(doc.id);

    limiter
      .schedule(() =>
        bot.telegram.sendPhoto(tgId, imgUrl, {
          caption,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[{ text: btnText, url: btnUrl }]] },
        })
      )
      .then(() => ok++)
      .catch(async (err) => {
        if (err.code === 403) {
          blocked++;
          await doc.ref.update({ allows_write_to_pm: false });
        } else {
          other++;
        }
      });
  }

  limiter.on("idle", () =>
    ctx.reply(
      `✅ Broadcast done. Sent: ${ok}  Blocked: ${blocked}  Other: ${other}`
    )
  );
}
