import { config } from "dotenv";
config();

/**
 * Централізована конфігурація з валідацією змінних оточення
 */
export const env = {
  // Telegram
  botToken: process.env.BOT_TOKEN || "",
  adminId: Number(process.env.ADMIN_ID) || 0,

  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || "",

  // Webhooks
  subscriptionWebhook:
    process.env.SUBSCRIPTION_WEBHOOK ||
    "https://us-central1-charmify-e7acc.cloudfunctions.net/handleSuccessfulSubscription",
  starsWebhook:
    process.env.STARS_WEBHOOK ||
    "https://us-central1-charmify-e7acc.cloudfunctions.net/handleSuccessfulStarsPurchase",
  logSubscriptionFailureUrl:
    process.env.LOG_SUBSCRIPTION_FAILURE_URL ||
    "https://us-central1-charmify-e7acc.cloudfunctions.net/logSubscriptionFailure",
  subscriptionApiKey: process.env.SUBSCRIPTION_API_KEY || "",

  // Mini App
  miniAppUrl: process.env.MINI_APP_URL || "https://charmify-e7acc.web.app/",

  // Бонуси
  welcomeBonusStars: parseInt(process.env.WELCOME_BONUS_STARS || "100"),
  referralBonusStars: parseInt(process.env.REFERRAL_BONUS_STARS || "50"),
} as const;

/**
 * Валідація критичних змінних оточення
 */
export function validateEnv(): void {
  const required = [
    "BOT_TOKEN",
    "FIREBASE_SERVICE_ACCOUNT",
    "ADMIN_ID",
    "SUBSCRIPTION_API_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Відсутні обов'язкові змінні оточення: ${missing.join(", ")}`
    );
  }
}
