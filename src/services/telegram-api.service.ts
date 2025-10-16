import axios from "axios";
import { env } from "../config/env.js";

/**
 * Сервіс для прямого виклику Telegram Bot API
 */
export class TelegramApiService {
  private readonly botToken: string;
  private readonly baseUrl: string;

  constructor() {
    this.botToken = env.botToken;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Відправка інвойсу через sendInvoice API
   */
  async sendInvoice(chatId: number, invoice: any): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/sendInvoice`, {
        chat_id: chatId,
        ...invoice,
      });

      if (response.data.ok) {
        return response.data.result;
      } else {
        throw new Error(`Telegram API error: ${response.data.description}`);
      }
    } catch (error) {
      console.error("❌ Помилка відправки інвойсу:", error);
      throw error;
    }
  }

  /**
   * Створення Bot subscription інвойсу
   */
  async createBotSubscriptionInvoice(
    chatId: number,
    title: string,
    description: string,
    payload: string,
    amount: number
  ): Promise<any> {
    const invoice = {
      title,
      description,
      payload,
      provider_token: "", // Для Telegram Stars
      currency: "XTR",
      prices: [
        {
          label: "Premium Subscription (1 month)",
          amount: amount,
        },
      ],
      // Обов'язкові параметри для Bot subscription
      subscription_period: 30 * 24 * 60 * 60, // 30 днів в секундах
      recurring: true,
    };

    console.log("📋 Створення Bot subscription інвойсу:", invoice);

    return await this.sendInvoice(chatId, invoice);
  }
}

// Експортуємо інстанс сервісу
export const telegramApi = new TelegramApiService();
