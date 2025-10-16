import { Context } from "telegraf";
import axios from "axios";
import { env } from "../config/env";
import {
  createTelegramUid,
  createSubscription,
} from "../services/user.service";

/**
 * Обробник pre-checkout query
 */
export async function handlePreCheckoutQuery(ctx: Context): Promise<void> {
  await ctx.answerPreCheckoutQuery(true);
}

/**
 * Обробник успішних платежів
 */
export async function handleSuccessfulPayment(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const payment = (ctx.message as any)?.successful_payment;

  if (!payment) {
    return next();
  }

  const payload = payment.invoice_payload;
  const telegramUserId = ctx.from?.id;
  const userId = `telegram:${telegramUserId}`;
  const firebaseUserId = createTelegramUid(telegramUserId!);

  try {
    // Обробка підписки (Bot subscriptions)
    if (payload.includes("subscription_")) {
      // Парсимо payload для отримання даних підписки
      const payloadParts = payload.split("_");
      const subscriptionType = payloadParts[1]; // "premium"
      const telegramUserId = payloadParts[2]; // ID користувача

      // Для Bot subscriptions chargeId це invoice_slug з Telegram
      const chargeId =
        payment.invoice_slug ||
        payment.provider_charge_id ||
        `charge_${Date.now()}`;

      // Створюємо підписку в Firestore
      const subscriptionId = `sub_${telegramUserId}_${Date.now()}`;

      await createSubscription({
        userId: firebaseUserId,
        subscriptionId,
        chargeId,
        amount: payment.total_amount, // кількість зірок
        period: 30 * 24 * 60 * 60, // 30 днів в секундах (обов'язково для Bot subscriptions)
      });

      // Відправляємо webhook (якщо потрібно для зовнішніх систем)
      await axios.post(
        env.subscriptionWebhook,
        {
          userId,
          payload,
          subscriptionId,
          chargeId,
          invoiceSlug: payment.invoice_slug,
          totalAmount: payment.total_amount,
          currency: payment.currency,
        },
        { headers: { "x-api-key": env.subscriptionApiKey } }
      );

      console.log("✅ Bot subscription створена в Firestore:", {
        userId: firebaseUserId,
        subscriptionId,
        chargeId,
        invoiceSlug: payment.invoice_slug,
        totalAmount: payment.total_amount,
      });

      // Відправляємо підтвердження користувачу
      await ctx.reply(
        "🎉 **Congratulations!** Your premium subscription is now active!\n\n" +
          "✨ You now have access to:\n" +
          "• Unlimited AI conversations\n" +
          "• AI image generation\n" +
          "• Priority support\n" +
          "• All premium features\n\n" +
          "Your subscription will automatically renew monthly. Enjoy! 🌟\n\n" +
          `📋 **Subscription ID:** \`${subscriptionId}\`\n` +
          `💰 **Amount:** ${payment.total_amount} ${payment.currency}`,
        { parse_mode: "Markdown" }
      );
    }
    // Обробка покупки зірок
    else if (payload.includes("stars_")) {
      const parts = payload.split("_");
      const amount = parts[1] ?? "0";

      await axios.post(
        env.starsWebhook,
        { userId, amount, payload },
        { headers: { "x-api-key": env.subscriptionApiKey } }
      );
      console.log("✅ Покупка зірок оброблена:", userId, amount);
    }
  } catch (error) {
    console.error("❌ Помилка обробки платежу:", error);

    // Логування помилки
    await axios.post(env.logSubscriptionFailureUrl, {
      userId,
      payload,
      date: new Date().toISOString(),
      type: payload.includes("stars_") ? "stars_purchase" : "subscription",
    });

    // Відправляємо повідомлення про помилку користувачу
    await ctx.reply(
      "❌ Sorry, there was an issue processing your payment. " +
        "Please contact support if the problem persists.",
      { parse_mode: "Markdown" }
    );
  }

  return next();
}
