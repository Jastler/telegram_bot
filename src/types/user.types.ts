import { Timestamp } from "firebase-admin/firestore";

/**
 * Дані користувача з Telegram
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
}

/**
 * Структура документа користувача в Firestore
 */
export interface FirestoreUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Реферальна система
  referrerId?: string | null;
  referrals: {
    count: number;
    totalStarsEarned: number;
  };

  // Рекламні джерела
  adSource?: {
    code: string;
    joinedAt: Timestamp;
  };

  // Система зірок
  stars: {
    total: number;
    incoming: number[];
    outgoing: number[];
  };

  // Підписка (Telegram Stars)
  subscription?: {
    status: "active" | "canceled" | "expired";
    startedAt: Timestamp;
    updatedAt: Timestamp;
    periodSeconds: number;
    amountStars: number;
    currency?: "XTR";
    invoicePayload?: string;
  };
}

/**
 * Результат створення користувача
 */
export interface CreateUserResult {
  uid: string;
  isNewUser: boolean;
  customToken: string;
}

/**
 * Розпарсені параметри start
 */
export interface StartParam {
  referrerId: string | null;
  adCode: string | null;
}
