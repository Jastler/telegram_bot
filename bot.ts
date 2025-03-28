import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Користувач запускає бота
bot.start((ctx) => {
  // Message with inline button to launch the mini app
  ctx.reply("📢 Hello! Tap the button below to launch the mini app:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Launch Mini App",
            web_app: { url: "https://your-mini-app-url.com" }, // Replace with your mini app URL
          },
        ],
      ],
    },
  });
  ctx.reply("Or use the button below to open the mini app directly:", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Launch Mini App",
            web_app: { url: "https://capsula.dev/lovecraft.ai/#/" }, // Replace with your mini app URL
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

// Обробка натискання кнопки
bot.action("buy_product", async (ctx) => {
  try {
    await ctx.replyWithInvoice({
      title: "Premium Character",
      description: "Unlock exclusive character access",
      payload: "premium_character_001",
      provider_token: "telegram",
      currency: "XTR",
      prices: [{ label: "Premium", amount: 1 }],
      start_parameter: "buy_premium_access",
    });
  } catch (err) {
    console.error("Invoice error:", err);
    ctx.reply("Sorry, something went wrong creating the invoice.");
  }
});

bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

// bot.on("successful_payment", async (ctx) => {
//   console.log("💸 Payment successful:", ctx.message.successful_payment);
//   await ctx.reply(
//     "Thank you for your purchase! 🎉 Your premium access is now active."
//   );
// });

bot.launch().then(() => console.log("🚀 Bot started"));
