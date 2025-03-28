import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

const miniAppUrl = `https://capsula.dev/lovecraft.ai/`;

bot.start((ctx) => {
  // передача initData через URL

  ctx.reply("📢 Welcome! Tap the button below to launch the Mini App:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Launch app", // Текст кнопки
            web_app: { url: miniAppUrl }, // Відкриває ваш Mini App за URL
          },
        ],
      ],
    },
  });
});

bot.command("launch", (ctx) => {
  ctx.reply("🔄 Launching your Mini App...", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Launch app",
            web_app: { url: miniAppUrl },
          },
        ],
      ],
    },
  });
});

bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

bot.launch().then(() => console.log("🚀 Bot started"));
