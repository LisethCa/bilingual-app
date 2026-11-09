// Pixel de Meta (Facebook) para medir la publicidad.
//
// El script base se carga en app/+html.tsx solo si existe la variable de
// entorno EXPO_PUBLIC_FB_PIXEL_ID (Netlify > Environment variables). Sin esa
// variable, o si un bloqueador de anuncios frena el script, estas funciones
// no hacen nada: el pixel nunca debe romper la app.
import { Platform } from "react-native";

export const PIXEL_ID = process.env.EXPO_PUBLIC_FB_PIXEL_ID || "";

const getFbq = (): ((...args: any[]) => void) | null => {
  if (Platform.OS !== "web" || !PIXEL_ID || typeof window === "undefined") {
    return null;
  }
  const fbq = (window as any).fbq;
  return typeof fbq === "function" ? fbq : null;
};

export type PixelEvent =
  | "PageView"
  | "ViewContent"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Purchase";

/**
 * Envía un evento estándar. `eventId` evita contar dos veces el mismo evento
 * (p. ej. una compra si el usuario recarga la página de pago exitoso).
 */
export const trackPixel = (
  event: PixelEvent,
  params?: Record<string, unknown>,
  eventId?: string,
) => {
  try {
    const fbq = getFbq();
    if (!fbq) return;
    if (eventId) fbq("track", event, params || {}, { eventID: eventId });
    else fbq("track", event, params || {});
  } catch {
    // silencioso
  }
};

/** Datos comunes de un nivel como producto. */
export const levelContent = (levelId: string, valueCop?: number | null) => ({
  content_name: `Nivel ${levelId}`,
  content_ids: [levelId],
  content_type: "product",
  ...(valueCop ? { value: valueCop, currency: "COP" } : {}),
});

/** true la primera vez para esta clave en este navegador (evita duplicados). */
export const firstTimeOnly = (key: string): boolean => {
  try {
    const k = `fbpx:${key}`;
    if (window.localStorage.getItem(k)) return false;
    window.localStorage.setItem(k, "1");
    return true;
  } catch {
    return true;
  }
};
