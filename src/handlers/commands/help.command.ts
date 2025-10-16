import { Context } from "telegraf";
import { env } from "../../config/env.js";

/**
 * Обробник команди /help
 */
export async function handleHelp(ctx: Context): Promise<void> {
  const helpText = `
🤖 **Available Commands:**

/start - Start bot and registration
/launch - Open Mini App
/subscription - Premium subscription (1 Star/month)
/ping - Check bot status
/help - This help

🔗 **Referral System:**
Use links in format:
\`https://t.me/AIcharmify_bot?start=ref_123456789\`

💰 **Bonuses:**
• New user: ${env.welcomeBonusStars} stars
• For referral: +${env.referralBonusStars} stars

⭐ **Premium Features:**
• Unlimited AI conversations
• AI image generation
• Priority support
• Advanced features

`;

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}
