import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.start((ctx) => {
  const miniAppUrl = `https://capsula.dev/lovecraft.ai/`; // передача initData через URL

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

bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

bot.launch().then(() => console.log("🚀 Bot started"));
