import { Context } from "telegraf";
import { env } from "../../config/env.js";

/**
 * Обробник команди /help
 */
export async function handleHelp(ctx: Context): Promise<void> {
  const helpText = `
🤖 **Доступні команди:**

/start - Запуск бота та реєстрація
/launch - Відкрити Mini App
/auth - Отримати Custom Token для автентифікації
/ping - Перевірка роботи бота
/help - Ця довідка

🔗 **Реферальна система:**
Використовуйте посилання формату:
\`https://t.me/YourBot?start=ref_123456789\`

💰 **Бонуси:**
• Новий користувач: ${env.welcomeBonusStars} зірок
• За реферала: +${env.referralBonusStars} зірок

📱 **Mini App:** ${env.miniAppUrl}
`;

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}
