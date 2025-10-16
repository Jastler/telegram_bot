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
  handleHelp,
  handleSubscription,
  handleSubscriptionCallback,
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

  // /start - Main command, user registration/authentication
  bot.start(handleStart);

  // /help - Help
  bot.help(handleHelp);

  // /launch - Launch Mini App
  bot.command("launch", handleLaunch);

  // /ping - Check bot status
  bot.command("ping", handlePing);

  // /broadcast - Broadcast to all users (admin only)
  bot.command("broadcast", (ctx) => handleBroadcast(ctx, bot));

  // /promo - Send to specific users (admin only)
  bot.command("promo", (ctx) => handlePromo(ctx, bot));

  // /subscription - Premium subscription
  bot.command("subscription", handleSubscription);

  // ==================== CALLBACK QUERIES ====================

  // Handle subscription callback queries
  bot.action(
    /^(subscribe_premium|view_benefits|subscription_help)$/,
    handleSubscriptionCallback
  );

  // ==================== PAYMENTS ====================

  // Handle pre-checkout query
  bot.on("pre_checkout_query", handlePreCheckoutQuery);

  // Handle successful payments
  bot.on("message", handleSuccessfulPayment);

  // ==================== UNKNOWN MESSAGES ====================

  // Handle text messages (non-commands)
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
