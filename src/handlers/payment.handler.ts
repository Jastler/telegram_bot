import { Context } from "telegraf";
import axios from "axios";
import { env } from "../config/env";
import { getFirestore, Timestamp } from "../config/firebase.config";
import { FIRESTORE_COLLECTIONS } from "../constants/firebase";
import { updateUserClaims } from "../services/user.service";

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
  const db = getFirestore();

  try {
    // Підписка (Telegram Stars, щомісячно)
    if (payload.includes("subscription_")) {

      // try {
      //   await axios.post(
      //     env.subscriptionWebhook,
      //     { userId, payload },
      //     { headers: { "x-api-key": env.subscriptionApiKey } }
      //   );
      // } catch (e) {
      //   console.warn("⚠️ Subscription webhook failed, continuing locally");
      // }

      // Оновлення Firestore: позначити підписку активною
      const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId);
      await userRef.set(
        {
          subscription: {
            status: "active",
            startedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            periodSeconds: 30 * 24 * 60 * 60,
            amountStars: 1,
            currency: "XTR",
            invoicePayload: payload,
          },
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      // Оновити Custom Claims
      await updateUserClaims(userId, { subscription: "active" });

      console.log("✅ Підписка активована та записана у Firestore:", userId);
    }

    // Покупка зірок (одноразова)
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
