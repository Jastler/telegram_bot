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
import {
  welcomeMessages,
  SupportedLanguage,
  unknownMessageReply,
  referralMessages,
  referralButtonText,
  defaultButtonText,
} from "./translations";

if (!process.env.FIREBASE_SERVICE_ACCOUNT)
  throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
sa.private_key = sa.private_key.replace(/\\n/g, "\n");
admin.initializeApp({ credential: admin.credential.cert(sa) });
export const db = admin.firestore();

const bot = new Telegraf(process.env.BOT_TOKEN!);
const ADMIN_ID = Number(process.env.ADMIN_ID);

const IMAGES = {
  default:
    "https://firebasestorage.googleapis.com/v0/b/charmify-e7acc.firebasestorage.app/o/bot%2Fphoto_2025-04-14%2012.30.57%20(1).jpeg?alt=media&token=b9438ff2-683f-4ae0-a76d-ba5696354727",
  referral:
    "https://firebasestorage.googleapis.com/v0/b/charmify-e7acc.firebasestorage.app/o/bot%2Fphoto_2025-04-14%2012.30.57%20(1).jpeg?alt=media&token=b9438ff2-683f-4ae0-a76d-ba5696354727",
};

bot.start(async (ctx) => {
  const lang: SupportedLanguage =
    (ctx.from?.language_code?.split("-")[0] as SupportedLanguage) || "en";

  const payload = ctx.payload;
  const isReferral = payload?.startsWith("ref_");
  console.log(payload, "payload");
  console.log(isReferral, "isReferral");
  console.log(ctx);
  const image = isReferral ? IMAGES.referral : IMAGES.default;

  const caption = isReferral
    ? referralMessages[lang] || referralMessages.en
    : welcomeMessages[lang] || welcomeMessages.en;

  const buttonText = isReferral
    ? referralButtonText[lang] || referralButtonText.en
    : defaultButtonText[lang] || defaultButtonText.en;

  const launchUrl = payload ? `${miniAppUrl}?startapp=${payload}` : miniAppUrl;

  await ctx.replyWithPhoto(image, {
    caption,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: buttonText, web_app: { url: launchUrl } }]],
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

bot.on("message", async (ctx) => {
  const text = (ctx.message as any)?.text;
  const payment = (ctx.message as any)?.successful_payment;

  if (!text || text.startsWith("/") || payment) return;

  const userLang = (ctx.from?.language_code?.split("-")[0] ||
    "en") as SupportedLanguage;
  const reply = unknownMessageReply[userLang] || unknownMessageReply.en;

  await ctx.reply(reply.text, {
    reply_markup: {
      inline_keyboard: [[{ text: reply.button, web_app: { url: miniAppUrl } }]],
    },
  });
});

bot.launch().then(() => console.log("🚀 Bot started"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
