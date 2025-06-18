import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";
import axios from "axios";
import Bottleneck from "bottleneck";
import admin from "firebase-admin";
import {
  SUBSCRIPTION_WEBHOOK,
  LOG_SUBSCRIPTION_FAILURE_URL,
  SUBSCRIPTION_API_KEY,
  miniAppUrl,
  STARS_WEBHOOK,
} from "./const";

if (!process.env.FIREBASE_SERVICE_ACCOUNT)
  throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
sa.private_key = sa.private_key.replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert(sa) });
export const db = admin.firestore();

const bot = new Telegraf(process.env.BOT_TOKEN!);
const ADMIN_ID = Number(process.env.ADMIN_ID);

bot.start(async (ctx) => {
  const welcome = `
🌟 *Charmify – Create Your Perfect AI Companion!*

✨ Create unique AI characters with personalities you’ll love. Chat, connect, and explore exciting stories together.

🎭 *Choose your AI companion:*
- 👩 AI Girlfriends
- 👨 AI Boyfriends
- 🎌 Anime Characters

💖 *Your ideal character awaits!*
Tap below to start your journey.
`;

  const img =
    "https://firebasestorage.googleapis.com/v0/b/charmify-e7acc.firebasestorage.app/o/bot%2Fphoto_2025-04-14%2012.30.57%20(1).jpeg?alt=media&token=b9438ff2-683f-4ae0-a76d-ba5696354727";

  await ctx.replyWithPhoto(img, {
    caption: welcome,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Launch app", web_app: { url: miniAppUrl } }],
      ],
    },
  });
});

bot.command("launch", (ctx) =>
  ctx.reply("🔄 Launching your Mini App...", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Launch app", web_app: { url: miniAppUrl } }],
      ],
    },
  })
);

bot.command("ping", (ctx) => ctx.reply("pong"));

const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 50 });

bot.command("broadcast", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("⛔ You are not admin.");

  const raw = ctx.message.text.replace(/^\/broadcast\s*/, "");
  const p = raw.split("|").map((s) => s.trim());
  if (p.length < 4)
    return ctx.reply(
      "⚠️ Format:\n/broadcast <img> | <btnText> | <btnUrl> | <caption>"
    );

  const [imgUrl, btnText, btnUrl, ...cap] = p;
  const caption = cap.join("|");

  const snap = await db
    .collection("users")
    .where("allows_write_to_pm", "==", true)
    .select()
    .get();

  let ok = 0,
    blocked = 0,
    other = 0;

  for (const doc of snap.docs) {
    const tgId = doc.id.startsWith("telegram:") ? doc.id.slice(9) : doc.id;
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
        } else other++;
      });
  }

  limiter.on("idle", () =>
    ctx.reply(
      `✅ Broadcast done. Sent: ${ok}  Blocked: ${blocked}  Other: ${other}`
    )
  );
});

bot.command("promo", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("⛔ You are not admin.");

  const raw = ctx.message.text.replace(/^\/promo\s*/, "");
  const p = raw.split("|").map((s) => s.trim());
  if (p.length < 5)
    return ctx.reply(
      "⚠️ Format:\n/promo <id1,id2> | <img> | <btnText> | <btnUrl> | <caption>"
    );

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
});

bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

bot.on("message", async (ctx, next) => {
  const payment = (ctx.message as any)?.successful_payment;
  if (!payment) return next();

  const payload = payment.invoice_payload;
  const userId = `telegram:${ctx.from.id}`;

  try {
    if (payload.includes("subscription_")) {
      // Передаємо payload в cloud функцію, яка сама парситиме planId та встановлюватиме правильну кількість днів
      await axios.post(
        SUBSCRIPTION_WEBHOOK,
        { userId, payload },
        { headers: { "x-api-key": SUBSCRIPTION_API_KEY } }
      );
    } else if (payload.includes("stars_")) {
      const parts = payload.split("_");
      const amount = parts[1] ?? "0";

      await axios.post(
        STARS_WEBHOOK,
        {
          userId,
          amount,
          payload,
        },
        { headers: { "x-api-key": SUBSCRIPTION_API_KEY } }
      );
    }
  } catch (error) {
    console.error("Purchase processing error:", error);

    await axios.post(LOG_SUBSCRIPTION_FAILURE_URL, {
      userId,
      payload,
      date: new Date().toISOString(),
      type: payload.includes("stars_") ? "stars_purchase" : "subscription",
    });
  }

  return next();
});

bot.launch().then(() => console.log("🚀 Bot started"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
