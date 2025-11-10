/**
 * ClaudiaBot gift catalog with prices in Telegram Stars.
 * IMPORTANT: Keep these values in sync with ClaudiaBot (story.data.ts / GIFTS)
 * and the actual prices you want to charge in the main bot.
 *
 * Update the sample configuration below to match your production setup.
 */

export interface ClaudiaGiftConfig {
  id: string;
  title: string;
  priceStars: number;
  description?: string;
  buttonLabel?: string;
}

const CATALOG: ClaudiaGiftConfig[] = [
  {
    id: "study_notes",
    title: "Study notes bundle",
    priceStars: 10,
    description:
      "A bundle of lecture notes to help Claudia feel confident during classes.",
    buttonLabel: "🎁 Buy Study Notes",
  },
  {
    id: "warm_tea",
    title: "Thermos of warm tea",
    priceStars: 8,
    description: "A warm thermos of tea to show you care.",
  },
  {
    id: "hair_ribbon",
    title: "Neat hair ribbon",
    priceStars: 7,
  },
  {
    id: "cute_charm",
    title: "Cute phone charm",
    priceStars: 9,
  },
  {
    id: "music_playlist",
    title: "Curated music playlist",
    priceStars: 6,
  },
  {
    id: "coffee_coupon",
    title: "Coffee break coupon",
    priceStars: 5,
  },
  {
    id: "soft_scarf",
    title: "Soft scarf",
    priceStars: 12,
  },
  {
    id: "umbrella",
    title: "Compact umbrella",
    priceStars: 11,
  },
  {
    id: "study_flashcards",
    title: "Study flashcards",
    priceStars: 10,
  },
  {
    id: "hand_cream",
    title: "Gentle hand cream",
    priceStars: 4,
  },
  {
    id: "photo_booth_ticket",
    title: "Photo booth ticket",
    priceStars: 9,
  },
  {
    id: "silk_scarf",
    title: "Silk scarf",
    priceStars: 15,
  },
  {
    id: "perfume_sample",
    title: "Soft perfume sample",
    priceStars: 13,
  },
  {
    id: "scented_candle",
    title: "Scented candle",
    priceStars: 12,
  },
  {
    id: "cozy_blanket",
    title: "Cozy blanket",
    priceStars: 14,
  },
  {
    id: "handwritten_letter",
    title: "Handwritten letter",
    priceStars: 6,
  },
  {
    id: "evening_tickets",
    title: "Evening event tickets",
    priceStars: 16,
  },
];

const CATALOG_MAP = new Map(CATALOG.map((gift) => [gift.id, gift]));

export function getClaudiaGiftById(
  giftId: string
): ClaudiaGiftConfig | undefined {
  return CATALOG_MAP.get(giftId);
}

export function formatClaudiaGiftPrice(amountStars: number): string {
  return `${amountStars} ⭐`;
}
