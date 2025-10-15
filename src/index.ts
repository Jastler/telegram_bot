import { Telegraf } from "telegraf";
import { validateEnv, env } from "./config/env";
import { initializeFirebase } from "./config/firebase.config";
import {
  handleStart,
  handleLaunch,
  handlePing,
  handleBroadcast,
  handlePromo,
} from "./handlers/commands";
import {
  handlePreCheckoutQuery,
  handleSuccessfulPayment,
} from "./handlers/payment.handler";
import { handleUnknownMessage } from "./handlers/message.handler";

// ==================== ІНІЦІАЛІЗАЦІЯ ====================

// Валідація змінних оточення
validateEnv();

// Ініціалізація Firebase Admin SDK
initializeFirebase();

// Ініціалізація бота
const bot = new Telegraf(env.botToken);

// ==================== КОМАНДИ ====================

// /start - Головна команда, реєстрація/автентифікація користувача
bot.start(handleStart);

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
bot.on("message", handleUnknownMessage);

// ==================== ЗАПУСК БОТА ====================

bot.launch().then(() => {
  console.log("🚀 Bot started successfully!");
  console.log("📱 Mini App URL:", env.miniAppUrl);
  console.log("👤 Admin ID:", env.adminId);
  console.log("💰 Welcome Bonus:", env.welcomeBonusStars, "stars");
  console.log("🎁 Referral Bonus:", env.referralBonusStars, "stars");
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
