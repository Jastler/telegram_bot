import {
  getFirestore,
  getAuth,
  FieldValue,
  Timestamp,
} from "../config/firebase.config";
import { env } from "../config/env";
import {
  FIRESTORE_COLLECTIONS,
  REFERRAL_PREFIX,
  AD_PREFIX,
  UID_PREFIX,
} from "../constants/firebase";
import {
  TelegramUser,
  FirestoreUser,
  CreateUserResult,
  StartParam,
  CreateSubscriptionData,
  UpdateSubscriptionData,
} from "../types/user.types";

const db = getFirestore();
const auth = getAuth();

/**
 * Генерація UID для Telegram користувача
 */
export function createTelegramUid(telegramId: number): string {
  return `${UID_PREFIX}${telegramId}`;
}

/**
 * Парсинг параметра start
 * Формат: "ref_123456789" або "ad_google_campaign"
 */
export function parseStartParam(startParam: string | null): StartParam {
  if (!startParam) {
    return { referrerId: null, adCode: null };
  }

  // Реферальне посилання: ref_123456789
  if (startParam.startsWith(REFERRAL_PREFIX)) {
    const referrerId = startParam.slice(REFERRAL_PREFIX.length);
    return { referrerId, adCode: null };
  }

  // Рекламний код: ad_google_campaign
  if (startParam.startsWith(AD_PREFIX)) {
    const adCode = startParam.slice(AD_PREFIX.length);
    return { referrerId: null, adCode };
  }

  return { referrerId: null, adCode: null };
}

/**
 * Перевірка чи існує користувач
 */
export async function userExists(uid: string): Promise<boolean> {
  try {
    const userDoc = await db
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(uid)
      .get();
    return userDoc.exists;
  } catch (error) {
    console.error("❌ Помилка перевірки користувача:", error);
    return false;
  }
}

/**
 * Отримання користувача з Firestore
 */
export async function getUser(uid: string): Promise<FirestoreUser | null> {
  try {
    const userDoc = await db
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data() as FirestoreUser;
  } catch (error) {
    console.error("❌ Помилка отримання користувача:", error);
    return null;
  }
}

/**
 * Валідація реферала
 */
async function validateReferral(
  referrerId: string,
  telegramUser: TelegramUser
): Promise<boolean> {
  // Перевірка формату (має бути числом)
  if (!/^\d+$/.test(referrerId)) {
    console.log("❌ Невалідний формат referrerId:", referrerId);
    return false;
  }

  // Перевірка на самореферал
  if (telegramUser.id.toString() === referrerId) {
    console.log("❌ Спроба самореферала");
    return false;
  }

  // Перевірка існування реферера
  const referrerUid = createTelegramUid(parseInt(referrerId));
  const referrerExists = await userExists(referrerUid);

  if (!referrerExists) {
    console.log("❌ Реферер не існує:", referrerUid);
    return false;
  }

  return true;
}

/**
 * Генерація Custom Token для автентифікації
 */
export async function generateCustomToken(uid: string): Promise<string> {
  try {
    const customToken = await auth.createCustomToken(uid);
    console.log("✅ Custom Token згенеровано для:", uid);
    return customToken;
  } catch (error) {
    console.error("❌ Помилка генерації Custom Token:", error);
    throw error;
  }
}

/**
 * Оновлення Custom Claims користувача
 */
export async function updateUserClaims(
  uid: string,
  claims: { stars?: number; subscription?: string | null }
): Promise<void> {
  try {
    await auth.setCustomUserClaims(uid, claims);
    console.log("✅ Custom Claims оновлено для:", uid, claims);
  } catch (error) {
    console.error("❌ Помилка оновлення Custom Claims:", error);
    throw error;
  }
}

/**
 * Обробка існуючого користувача
 */
async function handleExistingUser(
  uid: string,
  telegramUser: TelegramUser
): Promise<CreateUserResult> {
  console.log("👤 Існуючий користувач:", uid);

  // Оновлення базової інформації
  await db
    .collection(FIRESTORE_COLLECTIONS.USERS)
    .doc(uid)
    .update({
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name || null,
      username: telegramUser.username || null,
      language_code: telegramUser.language_code || null,
      is_premium: telegramUser.is_premium || false,
      updatedAt: Timestamp.now(),
    });

  // Отримання даних для claims
  const userData = await getUser(uid);
  const stars = userData?.stars?.total || 0;

  // Оновлення claims
  await updateUserClaims(uid, { stars, subscription: null });

  // Генерація токена
  const customToken = await generateCustomToken(uid);

  return { uid, isNewUser: false, customToken };
}

/**
 * Обробка нового користувача
 */
async function handleNewUser(
  uid: string,
  telegramUser: TelegramUser,
  startParam: string | null
): Promise<CreateUserResult> {
  console.log("🆕 Новий користувач:", uid);

  const { referrerId, adCode } = parseStartParam(startParam);

  // Валідація реферала
  const isValidReferral = referrerId
    ? await validateReferral(referrerId, telegramUser)
    : false;

  // Розрахунок бонусів
  let welcomeBonus = env.welcomeBonusStars;
  let referralBonus = 0;

  if (isValidReferral) {
    referralBonus = env.referralBonusStars;
    welcomeBonus += referralBonus;
  }

  // Підготовка даних користувача
  const userData: FirestoreUser = {
    id: telegramUser.id,
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name,
    username: telegramUser.username,
    language_code: telegramUser.language_code,
    is_premium: telegramUser.is_premium || false,
    allows_write_to_pm: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    referrerId: isValidReferral ? referrerId : null,
    referrals: {
      count: 0,
      totalStarsEarned: 0,
    },
    stars: {
      total: welcomeBonus,
      incoming: [welcomeBonus],
      outgoing: [],
    },
  };

  // Додавання рекламного джерела
  if (adCode) {
    userData.adSource = {
      code: adCode,
      joinedAt: Timestamp.now(),
    };
  }

  const userRef = db.collection(FIRESTORE_COLLECTIONS.USERS).doc(uid);

  // Транзакція для атомарного створення
  await db.runTransaction(async (transaction) => {
    // Створення користувача
    transaction.set(userRef, userData);

    // Оновлення реферера (якщо валідний)
    if (isValidReferral && referrerId) {
      const referrerUid = createTelegramUid(parseInt(referrerId));
      const referrerRef = db
        .collection(FIRESTORE_COLLECTIONS.USERS)
        .doc(referrerUid);

      transaction.update(referrerRef, {
        "stars.total": FieldValue.increment(referralBonus),
        "stars.incoming": FieldValue.arrayUnion(referralBonus),
        "referrals.count": FieldValue.increment(1),
        "referrals.totalStarsEarned": FieldValue.increment(referralBonus),
        updatedAt: Timestamp.now(),
      });

      console.log(
        `✅ Реферальний бонус ${referralBonus} додано для:`,
        referrerUid
      );
    }
  });

  console.log("✅ Користувач створено в Firestore:", uid);

  // Створення користувача в Firebase Auth
  try {
    await auth.createUser({
      uid,
      displayName: `${telegramUser.first_name} ${
        telegramUser.last_name || ""
      }`.trim(),
      email: `${telegramUser.id}@telegram.local`, // Фейковий email для сумісності
    });
    console.log("✅ Користувач створено в Firebase Auth:", uid);
  } catch (error: any) {
    if (error.code === "auth/uid-already-exists") {
      console.log("⚠️ Користувач вже існує в Auth:", uid);
    } else {
      console.error("❌ Помилка створення користувача в Auth:", error);
      throw error;
    }
  }

  // Встановлення Custom Claims
  await updateUserClaims(uid, { stars: welcomeBonus, subscription: null });

  // Генерація Custom Token
  const customToken = await generateCustomToken(uid);

  return { uid, isNewUser: true, customToken };
}

/**
 * Головна функція створення/отримання користувача
 */
export async function createUser(
  telegramUser: TelegramUser,
  startParam: string | null = null
): Promise<CreateUserResult> {
  const uid = createTelegramUid(telegramUser.id);

  // Перевірка існування
  const exists = await userExists(uid);

  if (exists) {
    return handleExistingUser(uid, telegramUser);
  } else {
    return handleNewUser(uid, telegramUser, startParam);
  }
}

/**
 * Оновлення користувача
 */
export async function updateUser(
  uid: string,
  updates: Partial<FirestoreUser>
): Promise<void> {
  try {
    await db
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(uid)
      .update({
        ...updates,
        updatedAt: Timestamp.now(),
      });
    console.log("✅ Користувач оновлено:", uid);
  } catch (error) {
    console.error("❌ Помилка оновлення користувача:", error);
    throw error;
  }
}

/**
 * Створення підписки для користувача
 */
export async function createSubscription(
  data: CreateSubscriptionData
): Promise<void> {
  try {
    const now = Timestamp.now();
    const endDate = new Date(now.toDate().getTime() + data.period * 1000);
    const nextBillingDate = new Date(endDate.getTime());

    const subscriptionData = {
      id: data.subscriptionId,
      type: "premium" as const,
      status: "active" as const,
      startDate: now,
      endDate: Timestamp.fromDate(endDate),
      nextBillingDate: Timestamp.fromDate(nextBillingDate),
      amount: data.amount,
      period: data.period,
      chargeId: data.chargeId,
    };

    await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(data.userId).update({
      subscription: subscriptionData,
      updatedAt: Timestamp.now(),
    });

    // Оновлення Custom Claims
    await updateUserClaims(data.userId, {
      subscription: "premium",
      stars: (await getUser(data.userId))?.stars?.total || 0,
    });

    console.log("✅ Підписку створено:", {
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      endDate: endDate.toISOString(),
    });
  } catch (error) {
    console.error("❌ Помилка створення підписки:", error);
    throw error;
  }
}

/**
 * Оновлення підписки
 */
export async function updateSubscription(
  userId: string,
  data: UpdateSubscriptionData
): Promise<void> {
  try {
    const userDoc = await db
      .collection(FIRESTORE_COLLECTIONS.USERS)
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      throw new Error("Користувач не знайдений");
    }

    const userData = userDoc.data() as FirestoreUser;
    const currentSubscription = userData.subscription;

    if (!currentSubscription) {
      throw new Error("Підписка не знайдена");
    }

    const updatedSubscription = {
      ...currentSubscription,
      ...data,
      id: currentSubscription.id, // Зберігаємо оригінальний ID
    };

    await db.collection(FIRESTORE_COLLECTIONS.USERS).doc(userId).update({
      subscription: updatedSubscription,
      updatedAt: Timestamp.now(),
    });

    // Оновлення Custom Claims
    const claimsSubscription = data.status === "active" ? "premium" : null;
    await updateUserClaims(userId, {
      subscription: claimsSubscription,
      stars: userData.stars?.total || 0,
    });

    console.log("✅ Підписку оновлено:", {
      userId,
      subscriptionId: data.subscriptionId,
      status: data.status,
    });
  } catch (error) {
    console.error("❌ Помилка оновлення підписки:", error);
    throw error;
  }
}

/**
 * Отримання активної підписки користувача
 */
export async function getActiveSubscription(
  userId: string
): Promise<FirestoreUser["subscription"] | null> {
  try {
    const userData = await getUser(userId);

    if (!userData?.subscription) {
      return null;
    }

    const now = new Date();
    const endDate = userData.subscription.endDate.toDate();

    // Перевіряємо чи підписка активна
    if (userData.subscription.status === "active" && endDate > now) {
      return userData.subscription;
    }

    return null;
  } catch (error) {
    console.error("❌ Помилка отримання підписки:", error);
    return null;
  }
}

/**
 * Продовження підписки (автоматичне оновлення)
 */
export async function renewSubscription(userId: string): Promise<void> {
  try {
    const userData = await getUser(userId);

    if (!userData?.subscription) {
      throw new Error("Підписка не знайдена");
    }

    const currentSubscription = userData.subscription;
    const newEndDate = new Date(
      currentSubscription.endDate.toDate().getTime() +
        currentSubscription.period * 1000
    );
    const newNextBillingDate = new Date(newEndDate.getTime());

    await updateSubscription(userId, {
      subscriptionId: currentSubscription.id,
      status: "active",
      endDate: Timestamp.fromDate(newEndDate),
      nextBillingDate: Timestamp.fromDate(newNextBillingDate),
    });

    console.log("✅ Підписку продовжено:", {
      userId,
      newEndDate: newEndDate.toISOString(),
    });
  } catch (error) {
    console.error("❌ Помилка продовження підписки:", error);
    throw error;
  }
}
