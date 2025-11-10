import { Context } from "telegraf";
import { CLAUDIA_INVOICE_PREFIX } from "../../constants/payments.js";
import { rememberClaudiaGiftIntent } from "../../services/payment-intent.service.js";
import {
  formatClaudiaGiftPrice,
  getClaudiaGiftById,
} from "../../constants/claudia-gifts.js";

/**
 * Generates an invoice for a ClaudiaBot gift.
 *
 * Usage: /gift <giftId> <amountStars> [label]
 * where:
 *  - giftId — ClaudiaBot gift identifier (e.g. study_notes)
 *  - amountStars — price in Stars (integer)
 *  - label — optional button label
 */
export async function handleGiftCommand(ctx: Context): Promise<void> {
  const messageText = (ctx.message as any)?.text ?? "";
  const parts = messageText.trim().split(/\s+/).slice(1);

  const giftId = parts[0];
  const amountStr = parts[1];
  const customLabel = parts.slice(2).join(" ");

  if (!giftId) {
    await ctx.reply(
      "❗️ Usage: `/gift <giftId> [amountStars] [label]`\n" +
        "Example: `/gift study_notes 10 Buy gift`\n" +
        "If you omit the amount, the configured catalog value will be used.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const giftConfig = getClaudiaGiftById(giftId);
  const resolvedAmount = amountStr
    ? Number.parseInt(amountStr, 10)
    : giftConfig?.priceStars ?? NaN;

  if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
    await ctx.reply(
      "❗️ amountStars must be a positive number or preconfigured in the ClaudiaBot catalog."
    );
    return;
  }

  if (!giftConfig && !amountStr) {
    await ctx.reply(
      "❗️ This gift is not configured in the catalog yet. Provide a price manually: `/gift <giftId> <amountStars>`.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const chatId = ctx.from?.id ?? ctx.chat?.id;
  if (!chatId) {
    await ctx.reply("❗️ Failed to determine the user chatId.");
    return;
  }

  const payload = `${CLAUDIA_INVOICE_PREFIX}${giftId}`;
  const title = `Claudia Gift: ${giftId}`;
  const description =
    "Gift for ClaudiaBot. Once paid, Claudia will deliver it to the storyline.";
  const amountStars = resolvedAmount;
  const buttonLabel =
    customLabel.trim() ||
    giftConfig?.buttonLabel ||
    `🎁 Buy gift — ${formatClaudiaGiftPrice(amountStars)}`;

  try {
    rememberClaudiaGiftIntent({ chatId, giftId });

    const invoiceLink = await ctx.telegram.createInvoiceLink({
      title,
      description,
      payload,
      currency: "XTR",
      prices: [
        {
          label: `Gift ${giftId}`,
          amount: amountStars,
        },
      ],
    } as any);

    await ctx.reply(
      `🎁 *Gift:* \`${giftConfig?.title ?? giftId}\`\n` +
        `💳 *Price:* ${formatClaudiaGiftPrice(amountStars)}\n\n` +
        "Press the button to finish the payment.\n" +
        "_Afterwards ClaudiaBot will automatically receive the confirmation._",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: buttonLabel, url: invoiceLink }]],
        },
      }
    );
  } catch (error) {
    console.error("❌ Failed to create gift invoice:", error);
    await ctx.reply(
      "❌ Failed to create the gift invoice. Please try again later."
    );
  }
}
