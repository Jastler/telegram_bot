/**
 * Сервіс для тимчасового збереження намірів оплати, що ініціюються через deeplink
 */

interface ClaudiaGiftIntent {
  giftId: string;
  chatId: number;
  createdAt: number;
}

const claudiaGiftIntents = new Map<number, ClaudiaGiftIntent>();

/**
 * Запам'ятовуємо, що користувач розпочав оплату подарунка Claudia
 */
export function rememberClaudiaGiftIntent(options: {
  chatId: number;
  giftId: string;
}): void {
  const { chatId, giftId } = options;
  claudiaGiftIntents.set(chatId, {
    chatId,
    giftId,
    createdAt: Date.now(),
  });
}

/**
 * Забираємо та одночасно видаляємо намір оплати подарунка для користувача
 */
export function consumeClaudiaGiftIntent(chatId: number): ClaudiaGiftIntent | null {
  const intent = claudiaGiftIntents.get(chatId) ?? null;
  if (intent) {
    claudiaGiftIntents.delete(chatId);
  }
  return intent;
}

/**
 * Отримуємо намір без видалення (наприклад, для діагностики)
 */
export function peekClaudiaGiftIntent(
  chatId: number
): ClaudiaGiftIntent | null {
  return claudiaGiftIntents.get(chatId) ?? null;
}

/**
 * Допоміжний метод для очищення прострочених намірів, якщо потрібно.
 * Наразі не використовується, але залишений для розширення.
 */
export function cleanupExpiredClaudiaGiftIntents(ttlMs = 10 * 60 * 1000): void {
  const now = Date.now();
  for (const [chatId, intent] of claudiaGiftIntents.entries()) {
    if (now - intent.createdAt > ttlMs) {
      claudiaGiftIntents.delete(chatId);
    }
  }
}

