import { Context } from "telegraf";

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

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Subscribe — 1 ⭐/month", url: invoiceLink }],
        ],
      },
    });
  } catch (err) {
    await ctx.reply(
      text +
        "\n\n_The subscription link is temporarily unavailable. Please try again later._",
      { parse_mode: "Markdown" }
    );
  }
}
