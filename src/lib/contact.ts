// Single source for TIKKIT X support contact details.
export const SUPPORT_WHATSAPP_NUMBER = '13074434195'

export function supportWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
