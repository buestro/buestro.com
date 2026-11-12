// Site contact details and prices. Change them here: they are used across the whole site.

// Buestro's WhatsApp number with country code, digits only. Example: "523312345678".
// While empty, the buttons and the form send an email to EMAIL instead.
export const WHATSAPP = "523328298412";
export const EMAIL = "hello@buestro.com";

// Data controller identity, required by the privacy notice (LFPDPPP art. 15).
export const LEGAL_NAME = "Jesús Joel Buenrostro Jiménez";
export const ADDRESS = "Gardenia 14, San Sebastián, Tlajomulco de Zúñiga, Jalisco, C.P. 45650, México";

// "Citas" package prices (MXN, VAT not included).
export const INSTALL_PRICE = "$5,500";
export const MONTHLY_PRICE = "$750";

export function contactLink(message: string): string {
  const text = encodeURIComponent(message);
  return WHATSAPP
    ? `https://wa.me/${WHATSAPP}?text=${text}`
    : `mailto:${EMAIL}?subject=${encodeURIComponent("Diagnóstico gratuito")}&body=${text}`;
}
