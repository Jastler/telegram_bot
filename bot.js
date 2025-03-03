require("dotenv").config();
const { Telegraf } = require("telegraf");
const { setupPayments } = require("./payments"); // Підключаємо payments.js

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


// 📌 Запуск бота
bot.launch()
  .then(() => console.log("🤖 Бот успішно запущений"))
  .catch((err) => console.error("❌ Помилка запуску бота:", err));

// 📌 Граційне завершення
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
