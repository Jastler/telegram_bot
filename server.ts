require("dotenv").config();
const express = require("express");
const { Telegraf } = require("telegraf");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(express.json());

// 📌 API для створення інвойсу
app.post("/generate-invoice", async (req, res) => {
  try {
    const title = "Придбання зірок";
    const description = "Це тестовий опис товару";
    const payload = "{}";
    const currency = "XTR"; // Telegram Stars
    const prices = [{ amount: 10, label: "10 Stars" }];

    const invoiceLink = await bot.telegram.createInvoiceLink(
      title,
      description,
      payload,
      "", // Telegram Stars не потребує provider_token
      currency,
      prices
    );

    res.json({ invoiceLink });
  } catch (error) {
    console.error("❌ Помилка створення інвойсу:", error);
    res.status(500).json({ error: "Не вдалося створити інвойс" });
  }
});

// 📌 Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущено на порту ${PORT}`));
