import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";
import axios from "axios";
import {
  SUBSCRIPTION_WEBHOOK,
  LOG_SUBSCRIPTION_FAILURE_URL,
  SUBSCRIPTION_API_KEY,
  miniAppUrl,
} from "./const";

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start(async (ctx) => {
  const welcomeMessage = `
🌟 *Charmify – Create Your Perfect AI Companion!*

✨ Create unique AI characters with personalities you’ll love. Chat, connect, and explore exciting stories together.

🎭 *Choose your AI companion:*
- 👩 AI Girlfriends
- 👨 AI Boyfriends
- 🎌 Anime Characters

💖 *Your ideal character awaits!*
Tap below to start your journey.
  `;

  const imageUrl =
    "https://firebasestorage.googleapis.com/v0/b/charmify-e7acc.firebasestorage.app/o/bot%2Fphoto_2025-04-14%2012.30.57%20(1).jpeg?alt=media&token=b9438ff2-683f-4ae0-a76d-ba5696354727";

  await ctx.replyWithPhoto(imageUrl, {
    caption: welcomeMessage,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Launch app", web_app: { url: miniAppUrl } }],
      ],
    },
  });
});

bot.command("launch", (ctx) => {
  ctx.reply("🔄 Launching your Mini App...", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Launch app", web_app: { url: miniAppUrl } }],
      ],
    },
  });
});

// ✅ Обробка pre-checkout
bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

// ✅ Обробка успішного платежу
bot.on("message", async (ctx) => {
  const msg = ctx.message as any;
  const payment = msg?.successful_payment;

  if (!payment) return;

  console.log("🧾 PAYMENT PAYLOAD:", {
    rawUserId: ctx.from?.id,
    finalUserId: `telegram:${ctx.from?.id}`,
    payload: payment.payload,
  });

  const userId = `telegram:${ctx.from?.id}`;
  const payload = payment.payload || "unknown";
  const plan = payload.includes("subscription") ? "monthly" : "unknown";
  const days = 30;

  const fallbackLog = {
    userId,
    payload,
    date: new Date().toISOString(),
  };

  console.log("✅ Successful payment:", fallbackLog);

  try {
    const response = await axios.post(
      SUBSCRIPTION_WEBHOOK,
      {
        userId,
        plan,
        days,
      },
      {
        headers: {
          "x-api-key": SUBSCRIPTION_API_KEY,
        },
      }
    );

    console.log("✅ Subscription saved:", response.data);
  } catch (err: any) {
    console.error("❌ Failed to notify backend:", err.message);

    try {
      await axios.post(LOG_SUBSCRIPTION_FAILURE_URL, fallbackLog);
      console.log("📦 Logged fallback data");
    } catch (logErr: any) {
      console.error("🚨 Failed to log fallback:", logErr.message);
    }
  }
});

bot.launch().then(() => console.log("🚀 Bot started"));
