import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";
import axios from "axios";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// 🔗 Посилання на твоє Mini App
const miniAppUrl = `https://capsula.dev/lovecraft.ai/`;

// 🔗 URL до Cloud Function, яка зберігає підписку
const SUBSCRIPTION_WEBHOOK =
  "https://<your-region>-<project-id>.cloudfunctions.net/handleSuccessfulSubscription";

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

// 🔐 Telegram payment flow
bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

// ✅ Обробка успішної оплати (без застарілих методів)
bot.on("message", async (ctx) => {
  const msg = ctx.message as any;

  if (msg?.successful_payment) {
    const { payload } = msg.successful_payment;
    const userId = ctx.from?.id?.toString();

    if (!userId || !payload?.startsWith("subscription_")) return;

    try {
      await axios.post(SUBSCRIPTION_WEBHOOK, {
        userId,
        plan: "monthly",
        days: 30,
      });

      console.log(`✅ Subscription saved for user ${userId}`);
    } catch (err: any) {
      console.error(
        "❌ Failed to notify backend about subscription:",
        err.message
      );
    }
  }
});

bot.launch().then(() => console.log("🚀 Bot started"));
