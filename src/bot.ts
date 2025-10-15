import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { env } from "./config/env.js";
import { initializeFirebase } from "./config/firebase.config.js";
import {
  handleStart,
  handleLaunch,
  handlePing,
  handleBroadcast,
  handlePromo,
  handleAuth,
  handleHelp,
} from "./handlers/commands/index.js";
import {
  handlePreCheckoutQuery,
  handleSuccessfulPayment,
} from "./handlers/payment.handler.js";
import { handleText } from "./handlers/message.handler.js";

export function createBot(): Telegraf {
  initializeFirebase();

  const bot = new Telegraf(env.botToken);

  // ==================== КОМАНДИ ====================

  // /start - Головна команда, реєстрація/автентифікація користувача
  bot.start(handleStart);

  // /auth - Отримання Custom Token
  bot.command("auth", handleAuth);

  // /help - Довідка
  bot.help(handleHelp);

  // /launch - Запуск Mini App
  bot.command("launch", handleLaunch);

  // /ping - Перевірка роботи бота
  bot.command("ping", handlePing);

  // /broadcast - Розсилка всім користувачам (тільки адмін)
  bot.command("broadcast", (ctx) => handleBroadcast(ctx, bot));

  // /promo - Розсилка конкретним користувачам (тільки адмін)
  bot.command("promo", (ctx) => handlePromo(ctx, bot));

  // ==================== ПЛАТЕЖІ ====================

  // Обробка pre-checkout query
  bot.on("pre_checkout_query", handlePreCheckoutQuery);

  // Обробка успішних платежів
  bot.on("message", handleSuccessfulPayment);

  // ==================== НЕВІДОМІ ПОВІДОМЛЕННЯ ====================

  // Обробка текстових повідомлень (не команд)
  bot.on(message("text"), handleText);

  return bot;
}

export async function launchBot(bot: Telegraf): Promise<void> {
  await bot.launch();
  console.log("🚀 Bot started successfully!");

  process.once("SIGINT", () => stopBot(bot, "SIGINT"));
  process.once("SIGTERM", () => stopBot(bot, "SIGTERM"));
}

function stopBot(bot: Telegraf, signal: string): void {
  console.log(`\n⏹️ Stopping bot (${signal})`);
  bot.stop(signal);
}
