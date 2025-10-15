import { validateEnv } from "./config/env.js";
import { createBot, launchBot } from "./bot.js";

// ==================== ІНІЦІАЛІЗАЦІЯ ====================

// Валідація змінних оточення
validateEnv();

// Створення та запуск бота
const bot = createBot();
launchBot(bot);
