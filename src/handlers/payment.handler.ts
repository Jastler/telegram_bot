import { Context } from "telegraf";
import axios from "axios";
import { env } from "../config/env";

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
  const userId = `telegram:${ctx.from?.id}`;

  try {
    if (payload.includes("stars_")) {
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
  }

  return next();
}
