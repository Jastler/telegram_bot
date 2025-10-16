import { Context } from "telegraf";
import { getFirestore, Timestamp } from "../../config/firebase.config";
import { FIRESTORE_COLLECTIONS } from "../../constants/firebase";

export async function handleSubscription(ctx: Context): Promise<void> {
  const title = "Premium Subscription";
  const description =
    "Unlimited chat, AI photo generation, priority access and more.";

  const text =
    "**Premium Subscription**\n\n" +
    "Unlock everything for just **1 ⭐ per month**:\n\n" +
    "- **Unlimited conversations**\n" +
    "- **AI photo generation**\n" +
    "- **Priority processing**\n" +
    "- **Exclusive features & updates**\n\n" +
    "Click the button below to subscribe. You can cancel anytime.";

  try {
    const invoiceLink = await ctx.telegram.createInvoiceLink({
      title,
      description,
      payload: `subscription_${ctx.from?.id || "unknown"}`,
      currency: "XTR",
      prices: [{ label: "Monthly subscription", amount: 1 }], // 1⭐ monthly
      recurring: true,
      subscription_period: 30 * 24 * 60 * 60, // 30 days
    } as any);

    const sent = await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Subscribe — 1 ⭐/month", url: invoiceLink }],
        ],
      },
    });

    // Збережемо повідомлення для подальшого редагування після успішної оплати
    try {
      const db = getFirestore();
      const userId = `telegram:${ctx.from?.id}`;
      const messageId = (sent as any)?.message_id;
      const chatId = (sent as any)?.chat?.id ?? ctx.chat?.id;

      if (messageId && chatId && userId) {
        await db
          .collection(FIRESTORE_COLLECTIONS.USERS)
          .doc(userId)
          .set(
            {
              lastSubscriptionMessage: {
                chatId,
                messageId,
                savedAt: Timestamp.now(),
              },
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );
      }
    } catch (e) {
      // ігноруємо помилки збереження
    }
  } catch (err) {
    await ctx.reply(
      text +
        "\n\n_The subscription link is temporarily unavailable. Please try again later._",
      { parse_mode: "Markdown" }
    );
  }
}
