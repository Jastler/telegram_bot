import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Користувач запускає бота
bot.start((ctx) => {
  ctx.reply(
    "📢 Welcome! Tap the button below to buy the premium character using Telegram Stars ⭐",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Buy with Stars ⭐", callback_data: "buy_product" }],
        ],
      },
    }
  );
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

// Підтвердження payment-ready запиту
bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

// Успішна оплата
// bot.on("successful_payment", async (ctx) => {
//   console.log("💸 Payment successful:", ctx.message.successful_payment);
//   await ctx.reply(
//     "Thank you for your purchase! 🎉 Your premium access is now active."
//   );
// });

bot.launch().then(() => console.log("🚀 Bot started"));
