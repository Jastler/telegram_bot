import axios from "axios";
import { env } from "../config/env.js";

/**
 * Сервіс для роботи з Telegram Payments API
 */
export class TelegramPaymentsService {
  private readonly botToken: string;
  private readonly baseUrl: string;

  constructor() {
    this.botToken = env.botToken;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Експорт інвойсу для Bot subscription
   * Використовує payments.exportInvoice
   */
  async exportInvoice(invoice: any): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/exportInvoice`,
        invoice
      );

      if (response.data.ok) {
        return response.data.result.invoice_link;
      } else {
        throw new Error(`Telegram API error: ${response.data.description}`);
      }
    } catch (error) {
      console.error("❌ Помилка експорту інвойсу:", error);
      throw error;
    }
  }

  /**
   * Створення Bot subscription інвойсу
   */
  async createBotSubscriptionInvoice(
    title: string,
    description: string,
    payload: string,
    amount: number,
    userId: number
  ): Promise<string> {
    const invoice = {
      title,
      description,
      payload,
      currency: "XTR",
      prices: [
        {
          label: "Premium Subscription (1 month)",
          amount: amount,
        },
      ],
      subscription_period: 30 * 24 * 60 * 60, // 30 днів в секундах
      recurring: true,
    };

    console.log("📋 Створення Bot subscription інвойсу:", invoice);

    return await this.exportInvoice(invoice);
  }
}

// Експортуємо інстанс сервісу
export const telegramPayments = new TelegramPaymentsService();
