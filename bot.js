require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// 📌 Кнопка для відкриття WebApp
bot.command("start", (ctx) => {
  return ctx.reply("Вітаю! Оберіть опцію:", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "🌐 Відкрити WebApp",
            web_app: { url: process.env.WEBAPP_URL },
          },
        ],
      ],
      resize_keyboard: true,
    },
  });
});

// 📌 Кнопка WebApp у Inline-режимі
bot.command("inline", (ctx) => {
  return ctx.reply("Натисніть кнопку нижче:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🌐 Відкрити WebApp",
            web_app: { url: process.env.WEBAPP_URL },
          },
        ],
      ],
    },
  });
});

// 📌 Генерація інвойсу для Telegram Stars
bot.command("pay", async (ctx) => {
  try {
    await ctx.replyWithInvoice({
      title: "Придбання зірок",
      description: "Це тестовий опис товару",
      payload: "purchase-stars",
      provider_token: "", // Telegram Stars не потребує provider_token
      currency: "XTR", // Telegram Stars
      prices: [{ amount: 10, label: "10 Stars" }],
    });
  } catch (error) {
    console.error("❌ Помилка створення інвойсу:", error);
    ctx.reply("❌ Виникла помилка при створенні інвойсу.");
  }
});

// 📌 Обробка `pre_checkout_query` (Telegram вимагає відповіді перед оплатою)
bot.on("pre_checkout_query", async (ctx) => {
  try {
    await ctx.answerPreCheckoutQuery(true);
  } catch (error) {
    console.error("❌ Помилка підтвердження оплати:", error);
  }
});

// 📌 Обробка успішного платежу
bot.on("message", async (ctx) => {
  if (ctx.message.successful_payment) {
    console.log("✅ Оплата успішна:", ctx.message.successful_payment);
    ctx.reply("🎉 Дякуємо за покупку! Ваші зірочки будуть зараховані.");
  }
});

// 📌 Запуск бота
bot.launch()
  .then(() => console.log("🤖 Бот успішно запущений"))
  .catch((err) => console.error("❌ Помилка запуску бота:", err));

// 📌 Граційне завершення
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
