import { Context } from "telegraf";
import { createUser } from "../../services/user.service";
import { TelegramUser } from "../../types/user.types";
import {
  welcomeMessages,
  referralMessages,
  referralButtonText,
  defaultButtonText,
  SupportedLanguage,
} from "../../translations.js";
import { env } from "../../config/env";
import { handleSubscription } from "./subscription.command.js";
import { extractClaudiaGiftId } from "../../constants/payments.js";
import { rememberClaudiaGiftIntent } from "../../services/payment-intent.service.js";

const IMAGES = {
  default:
    "https://firebasestorage.googleapis.com/v0/b/charmify-e7acc.firebasestorage.app/o/bot%2Fnew_cover.png?alt=media&token=4845e9ed-ec29-4bb1-9e23-54d39241b097",
  referral:
    "https://firebasestorage.googleapis.com/v0/b/charmify-e7acc.firebasestorage.app/o/bot%2Fcover_for_refferal.png?alt=media&token=abc3b4d9-94a6-4b8c-b37a-44c4da11a41d",
};

/**
 * Вилучення параметра start з повідомлення
 */
function extractStartParam(messageText: string | undefined): string | null {
  if (!messageText) return null;
  const match = messageText.match(/^\/start\s+(.+)$/);
  return match ? match[1] : null;
}

/**
 * Обробник команди /start
 */
export async function handleStart(ctx: Context): Promise<void> {
  try {
    // Отримання даних користувача з Telegram
    const telegramUser = ctx.from;
    if (!telegramUser) {
      console.error("❌ Немає даних користувача");
      return;
    }

    // Визначення мови
    const lang: SupportedLanguage =
      (telegramUser.language_code?.split("-")[0] as SupportedLanguage) || "en";

    // Вилучення start параметра
    const startPayload = extractStartParam((ctx.message as any)?.text);
    const claudiaGiftId = startPayload
      ? extractClaudiaGiftId(startPayload)
      : null;
    const isReferral = startPayload?.startsWith("ref_");

    console.log("📥 Start payload:", startPayload);
    console.log("🔗 Is referral:", isReferral);
    if (claudiaGiftId) {
      const chatId = telegramUser.id;
      rememberClaudiaGiftIntent({ chatId, giftId: claudiaGiftId });
      console.log(
        `🎁 Claudia gift purchase initiated: giftId=${claudiaGiftId}, chatId=${chatId}`
      );
    }

    // Підготовка даних користувача
    const userData: TelegramUser = {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      language_code: telegramUser.language_code,
      is_premium: (telegramUser as any).is_premium,
      is_bot: telegramUser.is_bot,
    };

    // Створення/оновлення користувача + генерація Custom Token
    const { isNewUser, customToken } = await createUser(userData, startPayload);

    console.log("✅ Користувач оброблено:", {
      id: telegramUser.id,
      isNewUser,
      hasToken: !!customToken,
    });

    // Якщо start-параметр вказує на інвойс підписки — показати одразу підписку
    if (startPayload === "invoice-Claudia-subscription") {
      await handleSubscription(ctx);
      return; // не надсилаємо стандартний welcome
    }

    if (claudiaGiftId) {
      await ctx.reply(
        "🎁 Підготовка оплати подарунка завершена. Завершіть покупку через надісланий інвойс або ClaudiaBot."
      );
    }

    // Вибір зображення
    const image = isReferral ? IMAGES.referral : IMAGES.default;

    // Вибір тексту
    const caption = isReferral
      ? referralMessages[lang] || referralMessages.en
      : welcomeMessages[lang] || welcomeMessages.en;

    // Вибір тексту кнопки
    const buttonText = isReferral
      ? referralButtonText[lang] || referralButtonText.en
      : defaultButtonText[lang] || defaultButtonText.en;

    // Формування URL для Mini App з параметром startapp
    const launchUrl = startPayload
      ? `${env.miniAppUrl}?startapp=${startPayload}`
      : env.miniAppUrl;

    // Відправка відповіді
    await ctx.replyWithPhoto(image, {
      caption,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: buttonText, web_app: { url: launchUrl } }]],
      },
    });

    // Опціонально: відправка Custom Token (якщо потрібно)
    // Можна зберегти токен в Firestore або відправити через web_app init_data
    console.log("🔑 Custom Token готовий до використання");
  } catch (error) {
    console.error("❌ Помилка обробки /start:", error);
    await ctx.reply("❌ Виникла помилка. Спробуйте ще раз пізніше.");
  }
}
