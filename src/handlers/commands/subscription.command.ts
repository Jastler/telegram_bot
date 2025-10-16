import { Context } from "telegraf";
import { env } from "../../config/env.js";

// Додаємо валідацію env при імпорті
try {
  if (!env.botToken) {
    throw new Error("BOT_TOKEN не налаштований");
  }
  console.log(
    "✅ Bot token налаштований:",
    env.botToken.substring(0, 10) + "..."
  );
} catch (error) {
  console.error("❌ Помилка конфігурації:", error);
}

export async function handleSubscription(ctx: Context): Promise<void> {
  try {
    const subscriptionText = `
🌟 **Premium Subscription**

Unlock unlimited possibilities with our premium subscription!

✨ **What you get:**
• 💬 Unlimited conversations with AI
• 🎨 AI image generation without limits
• 🚀 Priority access to new features
• 📱 Advanced customization options
• 🔥 Exclusive premium content
• 💎 VIP support and faster responses

💰 **Price:** 1 Telegram Star per month
⏰ **Billing:** Automatic monthly renewal

Ready to upgrade your experience? Click the button below to subscribe!

*Cancel anytime - no hidden fees or commitments.*
`;

    const subscriptionKeyboard = {
      inline_keyboard: [
        [
          {
            text: "⭐ Subscribe for 1 Star/month",
            callback_data: "subscribe_premium",
          },
        ],
        [
          {
            text: "📋 View Benefits",
            callback_data: "view_benefits",
          },
          {
            text: "❓ Help",
            callback_data: "subscription_help",
          },
        ],
      ],
    };

    await ctx.reply(subscriptionText, {
      parse_mode: "Markdown",
      reply_markup: subscriptionKeyboard,
    });
  } catch (error) {
    console.error("❌ Помилка обробки /subscription:", error);
    await ctx.reply("❌ Виникла помилка. Спробуйте ще раз пізніше.");
  }
}

/**
 * Обробник callback кнопок для підписки
 */
export async function handleSubscriptionCallback(ctx: Context): Promise<void> {
  const callbackData = (ctx.callbackQuery as any)?.data;

  switch (callbackData) {
    case "subscribe_premium":
      await handleSubscribePremium(ctx);
      break;
    case "view_benefits":
      await handleViewBenefits(ctx);
      break;
    case "subscription_help":
      await handleSubscriptionHelp(ctx);
      break;
    default:
      await ctx.answerCbQuery("Unknown action");
  }
}

/**
 * Обробник підписки на преміум
 */
async function handleSubscribePremium(ctx: Context): Promise<void> {
  try {
    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.answerCbQuery("❌ Unable to identify user");
      return;
    }

    console.log("🔄 Створення Bot subscription для користувача:", userId);

    await ctx.answerCbQuery();

    // Створюємо Bot subscription інвойс (правильний формат)
    const invoice = {
      title: "Premium Subscription",
      description:
        "Unlimited AI conversations, image generation, and premium features",
      payload: `subscription_premium_${userId}`,
      provider_token: "", // Для Telegram Stars
      currency: "XTR", // Telegram Stars
      prices: [
        {
          label: "Premium Subscription (1 month)",
          amount: 1, // 1 Telegram Star
        },
      ],
      // Обов'язкові параметри для Bot subscription
      subscription_period: 30 * 24 * 60 * 60, // 30 днів в секундах
      recurring: true,
    };

    console.log("📋 Bot subscription інвойс створено:", invoice);

    // Використовуємо replyWithInvoice - Telegram автоматично обробить як Bot subscription
    // через наявність subscription_period та recurring
    await ctx.replyWithInvoice(invoice);

    console.log("✅ Bot subscription інвойс відправлено успішно");
  } catch (error) {
    console.error("❌ Помилка створення інвойсу:", error);
    console.error("❌ Деталі помилки:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: ctx.from?.id,
    });
    await ctx.answerCbQuery(
      "❌ Error creating subscription. Please try again."
    );
  }
}

/**
 * Обробник перегляду переваг
 */
async function handleViewBenefits(ctx: Context): Promise<void> {
  const benefitsText = `
🎯 **Detailed Benefits:**

💬 **Unlimited Conversations**
• No daily limits on AI chats
• Extended conversation history
• Advanced context understanding

🎨 **AI Image Generation**
• Generate unlimited images
• High-resolution outputs
• Multiple art styles available
• Custom prompts and settings

🚀 **Priority Features**
• Early access to new AI models
• Beta features and testing
• Advanced customization options
• Faster response times

📱 **Premium Interface**
• Custom themes and layouts
• Advanced settings panel
• Export conversations
• Priority support queue

💎 **Exclusive Content**
• Premium AI models
• Specialized tools and utilities
• Educational content and tutorials
• Community access
`;

  await ctx.answerCbQuery();
  await ctx.reply(benefitsText, { parse_mode: "Markdown" });
}

/**
 * Обробник допомоги з підпискою
 */
async function handleSubscriptionHelp(ctx: Context): Promise<void> {
  const helpText = `
❓ **Subscription Help:**

🔹 **How to Subscribe:**
1. Click "Subscribe for 1 Star/month"
2. Complete payment with Telegram Stars
3. Enjoy premium features immediately!

🔹 **Billing:**
• Monthly automatic renewal
• Cancel anytime from Telegram settings
• No hidden fees or charges

🔹 **Payment:**
• Uses Telegram Stars only
• Secure payment processing
• Instant activation

🔹 **Cancellation:**
• Go to Telegram Settings → Payments
• Find your subscription
• Cancel anytime, no penalties

Need more help? Contact our support team!
`;

  await ctx.answerCbQuery();
  await ctx.reply(helpText, { parse_mode: "Markdown" });
}
