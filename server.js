const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

// 📌 Фейкова база даних (userId -> кількість зірочок)
const userStars = {};

// 📌 API для отримання кількості зірочок
app.get("/api/stars", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId обов'язковий!" });

  const stars = userStars[userId] || 0;
  res.json({ userId, stars });
});

// 📌 Додавання зірочок після покупки (імітація покупки)
app.post("/api/addStars", (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount)
    return res.status(400).json({ error: "userId та amount обов'язкові!" });

  userStars[userId] = (userStars[userId] || 0) + amount;
  console.log(`✅ Додано ${amount} зірочок користувачу ${userId}.`);
  res.json({ userId, stars: userStars[userId] });
});

// 📌 Витрачання зірочок
app.post("/api/spendStars", (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount)
    return res.status(400).json({ error: "userId та amount обов'язкові!" });

  if ((userStars[userId] || 0) < amount) {
    return res.status(400).json({ error: "Недостатньо зірочок!" });
  }

  userStars[userId] -= amount;
  console.log(`❌ Витрачено ${amount} зірочок користувачем ${userId}.`);
  res.json({ userId, stars: userStars[userId] });
});

// 📌 Запускаємо сервер
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ API запущено на порту ${PORT}`));
