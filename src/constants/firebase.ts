/**
 * Константи для роботи з Firebase
 */

export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
} as const;

export const UID_PREFIX = "telegram:";
export const REFERRAL_PREFIX = "ref_";
export const AD_PREFIX = "ad_";

/**
 * Генерація UID для Telegram користувача
 */
export function createTelegramUid(telegramId: number): string {
  return `${UID_PREFIX}${telegramId}`;
}

/**
 * Вилучення Telegram ID з UID
 */
export function extractTelegramId(uid: string): string {
  return uid.startsWith(UID_PREFIX) ? uid.slice(UID_PREFIX.length) : uid;
}
