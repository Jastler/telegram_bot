/**
 * Константи для платіжних сценаріїв
 */

/**
 * Префікс інвойсів ClaudiaBot у основному боті.
 * Формат параметра: invoice-Claudia-gift-<giftId>
 */
export const CLAUDIA_INVOICE_PREFIX = "invoice-Claudia-gift-";

export function extractClaudiaGiftId(payload: string): string | null {
  if (!payload.startsWith(CLAUDIA_INVOICE_PREFIX)) {
    return null;
  }

  const giftId = payload.slice(CLAUDIA_INVOICE_PREFIX.length).trim();
  return giftId.length > 0 ? giftId : null;
}
