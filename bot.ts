import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Користувач запускає бота
bot.start((ctx) => {
  ctx.reply("📢 Привіт! Натисни кнопку нижче, щоб запустити додаток", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Launch Mini App", callback_data: "launch_app" }], // Одна кнопка Launch
      ],
    },
  });
});

// Обробка натискання кнопки
bot.action("launch_app", (ctx) => {
  // Тепер Telegram має підтримку відкриття Web App через deep link
  const webAppLink = "https://your-mini-app-link"; // Замініть на ваш URL Web App
  ctx.reply(
    `Для запуску додатка натисніть на це посилання: [Launch Mini App](${webAppLink})`,
    { parse_mode: "Markdown" }
  );
});

// Запуск
bot.launch().then(() => console.log("🚀 Бот запущено"));
