# Telegram Bot з Firebase Автентифікацією

Модульний Telegram бот з інтеграцією Firebase Authentication (Custom Tokens), Firestore та реферальною системою.

## 📁 Структура проекту

```
telegram-bot/
├── src/
│   ├── config/                    # Конфігурація
│   │   ├── env.ts                # Змінні оточення
│   │   └── firebase.config.ts    # Firebase ініціалізація
│   │
│   ├── constants/                 # Константи
│   │   └── firebase.ts           # Firebase константи
│   │
│   ├── handlers/                  # Обробники
│   │   ├── commands/             # Команди бота
│   │   │   ├── start.command.ts  # /start
│   │   │   ├── launch.command.ts # /launch
│   │   │   ├── ping.command.ts   # /ping
│   │   │   ├── broadcast.command.ts # /broadcast
│   │   │   ├── promo.command.ts  # /promo
│   │   │   └── index.ts          # Експорт
│   │   ├── payment.handler.ts    # Обробка платежів
│   │   └── message.handler.ts    # Обробка повідомлень
│   │
│   ├── services/                  # Бізнес-логіка
│   │   └── user.service.ts       # Сервіс користувачів
│   │
│   ├── types/                     # TypeScript типи
│   │   └── user.types.ts         # Типи користувачів
│   │
│   └── index.ts                   # Точка входу
│
├── translations.ts                # Переклади
├── const.ts                       # Старі константи (deprecated)
├── bot.ts                         # Старий код (deprecated)
├── package.json
├── tsconfig.json
└── .env                          # Змінні оточення
```

## 🚀 Функціонал

### Автентифікація та користувачі

- ✅ **Firebase Custom Tokens** - безпечна автентифікація користувачів
- ✅ **Dual Storage** - Firebase Auth + Firestore
- ✅ **Custom Claims** - метадані в токенах (stars, subscription)
- ✅ **Реферальна система** - бонуси за запрошення
- ✅ **Ad Tracking** - відстеження рекламних джерел

### Команди бота

- `/start` - Реєстрація/автентифікація користувача
- `/launch` - Запуск Mini App
- `/ping` - Перевірка роботи бота
- `/broadcast` - Розсилка всім користувачам (адмін)
- `/promo` - Розсилка конкретним користувачам (адмін)

### Платежі

- ✅ Обробка підписок (subscription\_\*)
- ✅ Обробка покупки зірок (stars\_\*)
- ✅ Логування помилок платежів

### Повідомлення

- ✅ Автовідповіді на невідомі повідомлення
- ✅ Мультимовність (en, uk, ru, etc.)

## 🔧 Налаштування

### 1. Встановлення залежностей

```bash
npm install
# або
yarn install
```

### 2. Налаштування змінних оточення

Створіть файл `.env` на основі `env.example`:

```env
# Telegram Bot
BOT_TOKEN=your_bot_token_here
ADMIN_ID=your_telegram_id_here

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Webhooks & API
SUBSCRIPTION_API_KEY=your_api_key_here
SUBSCRIPTION_WEBHOOK=https://your-domain.com/handleSuccessfulSubscription
STARS_WEBHOOK=https://your-domain.com/handleSuccessfulStarsPurchase
LOG_SUBSCRIPTION_FAILURE_URL=https://your-domain.com/logSubscriptionFailure

# Mini App
MINI_APP_URL=https://your-app.web.app/

# Бонуси (Stars)
WELCOME_BONUS_STARS=10
REFERRAL_BONUS_STARS=5

# Зображення
DEFAULT_IMAGE=https://your-storage.com/default_image.png
REFERRAL_IMAGE=https://your-storage.com/referral_image.png
```

### 3. Запуск

```bash
# Розробка (з hot-reload)
npm run dev

# Або з nodemon
npm run dev:watch

# Білд
npm run build

# Продакшн
npm start
```

## 🔐 АвтентифікаціяFlow

### 1. Користувач запускає бота

```
/start [ref_123 | ad_campaign]
```

### 2. Обробка команди /start

```typescript
handleStart() → createUser() → {
  - Парсинг параметрів (ref/ad)
  - Валідація реферала
  - Розрахунок бонусів
  - Створення в Firestore (транзакція)
  - Створення в Firebase Auth
  - Встановлення Custom Claims
  - Генерація Custom Token
}
```

### 3. Структура користувача в Firestore

```typescript
{
  id: 123456789,
  first_name: "John",
  username: "john_doe",
  language_code: "en",
  is_premium: false,
  allows_write_to_pm: true,

  // Реферальна система
  referrerId: "987654321",
  referrals: {
    count: 5,
    totalStarsEarned: 25
  },

  // Рекламні джерела
  adSource: {
    code: "google_campaign",
    joinedAt: Timestamp
  },

  // Система зірок
  stars: {
    total: 15,
    incoming: [10, 5],
    outgoing: []
  },

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4. Custom Token для фронтенду

```typescript
// Бот генерує токен
const customToken = await generateCustomToken(uid);

// Фронтенд використовує токен
import { signInWithCustomToken } from "firebase/auth";
await signInWithCustomToken(auth, customToken);
```

## 🎁 Реферальна система

### URL формат

```
https://t.me/YourBot?start=ref_123456789
```

### Валідація

1. ✅ Формат (має бути число)
2. ✅ Самореферал (заборонено)
3. ✅ Існування реферера

### Бонуси

- **Новий користувач**: 10 (welcome) + 5 (referral) = **15 stars**
- **Реферер**: +5 stars
- **Статистика**: count +1, totalStarsEarned +5

## 📊 Ad Tracking

### URL формат

```
https://t.me/YourBot?start=ad_google_campaign_1
```

### Збереження

```typescript
{
  adSource: {
    code: "google_campaign_1",
    joinedAt: Timestamp.now()
  }
}
```

## 🔄 Платежі

### Підписки

```
payload: "subscription_monthly_premium"
→ POST to SUBSCRIPTION_WEBHOOK
```

### Зірки

```
payload: "stars_100_pack"
→ POST to STARS_WEBHOOK with amount: 100
```

### Помилки

Всі помилки логуються в `LOG_SUBSCRIPTION_FAILURE_URL` з деталями.

## 🛡️ Безпека

### Service Account

- ❌ Ніколи не комітьте в git
- ✅ Зберігайте як змінну оточення
- ✅ Використовуйте JSON.stringify()

### Custom Tokens

- ✅ Валідні 1 годину
- ✅ Створюються тільки на сервері
- ❌ Не можуть бути підроблені клієнтом

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Користувачі можуть читати тільки свої дані
      allow read: if request.auth != null && request.auth.uid == userId;

      // Тільки сервер може писати (через Admin SDK)
      allow write: if false;
    }
  }
}
```

## 📝 Важливі файли

### `src/services/user.service.ts`

- `createUser()` - створення/оновлення користувача
- `generateCustomToken()` - генерація токена
- `updateUserClaims()` - оновлення claims
- `parseStartParam()` - парсинг ref/ad параметрів

### `src/handlers/commands/start.command.ts`

- Обробка команди /start
- Інтеграція з user.service
- Відправка welcome повідомлення

### `src/config/firebase.config.ts`

- Ініціалізація Firebase Admin SDK
- Singleton pattern
- Експорт Firestore, Auth, FieldValue, Timestamp

## 🧪 Тестування

### Чек-лист

- [ ] Новий користувач без реферала
- [ ] Новий користувач з валідним рефералом
- [ ] Новий користувач з невалідним рефералом
- [ ] Самореферал (має відхилитися)
- [ ] Існуючий користувач повторно /start
- [ ] Ad tracking
- [ ] Генерація Custom Token
- [ ] Custom Claims
- [ ] Платежі (підписки та зірки)
- [ ] Broadcast
- [ ] Promo

## 🔗 Інтеграція з Frontend

### React Hook приклад

```typescript
import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Отримати токен з Telegram Web App init data
    const token = getTelegramWebAppToken();

    if (token) {
      signInWithCustomToken(auth, token)
        .then((credential) => setUser(credential.user))
        .catch(console.error);
    }
  }, []);

  return { user };
}
```

## 📚 Корисні команди

```bash
# Розробка
npm run dev

# Білд
npm run build

# Продакшн
npm start

# Перевірка типів
npx tsc --noEmit
```

## 🆘 Troubleshooting

### Помилка: "FIREBASE_SERVICE_ACCOUNT missing"

→ Додайте змінну в `.env`

### Помилка: "auth/uid-already-exists"

→ Нормально, користувач вже існує в Auth

### Реферальний бонус не нараховується

→ Перевірте валідацію реферала (формат, існування, самореферал)

### Custom Token не працює на фронтенді

→ Перевірте, що токен не застарів (1 година)

## 📄 Ліцензія

MIT

---

**Автор**: Ваше ім'я
**Версія**: 1.0.0
