import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN!);

// User starts the bot
bot.start((ctx) => {
  ctx.reply("📢 Hello! Click the button below to launch the app", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Launch Mini App", callback_data: "launch_app" }], // Single Launch button
      ],
    },
  });
});

// Handle button click
bot.action("launch_app", (ctx) => {
  // Telegram now supports opening Web App via deep link
  const webAppLink = "https://capsula.dev/lovecraft.ai/#/"; // Replace with your Web App URL
  ctx.reply(
    `To launch the app, click this link: [Launch Mini App](${webAppLink})`,
    { parse_mode: "Markdown" }
  );
});

// Launch
bot.launch().then(() => console.log("🚀 Bot started"));
