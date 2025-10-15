import { validateEnv } from "./config/env.js";
import { createBot, launchBot } from "./bot.js";

// ==================== INITIALIZATION ====================

// Validate environment variables
validateEnv();

// Create and launch bot
const bot = createBot();
launchBot(bot);
