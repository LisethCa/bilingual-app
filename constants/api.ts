// API endpoints configuration
const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "https://billingual-app-back.onrender.com";

export const API_ENDPOINTS = {
  CHECK_LEVEL_ACCESS: (userId: string) =>
    `${API_BASE_URL}/check-level-access/${userId}`,
  CHECK_LEVEL_ACCESS_SPECIFIC: (userId: string, levelId: string) =>
    `${API_BASE_URL}/check-level-access/${userId}/${levelId}`,
  WAKE_UP: `${API_BASE_URL}/wake-up`,
  LEVEL_PRICES: `${API_BASE_URL}/level-prices`,
  CREATE_PREFERENCE: `${API_BASE_URL}/create-preference`,
  SIMULATE_PURCHASE: `${API_BASE_URL}/simulate-purchase`,
  VERIFY_PAYMENT: (paymentId: string) =>
    `${API_BASE_URL}/verify-payment/${paymentId}`,
  TRANSCRIBE: `${API_BASE_URL}/transcribe`,
} as const;
