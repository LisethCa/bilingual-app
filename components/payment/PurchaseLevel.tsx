import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PurchaseResultModal, { PurchaseResult } from "./PurchaseResultModal";

type LevelId = "A1" | "A2" | "B1";

interface PurchaseLevelProps {
  levelId: LevelId;
  onClose: () => void;
  onPurchased?: (levelId: LevelId) => void;
  lessonsTotal?: number;
  readingsTotal?: number;
}

const formatUsd = (amount: number) => `USD ${amount}`;

const formatCop = (amount: number) =>
  `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount)} COP`;

interface LevelPrice {
  usd: number;
  cop: number | null;
}

export default function PurchaseLevel({
  levelId,
  onClose,
  onPurchased,
  lessonsTotal,
  readingsTotal,
}: PurchaseLevelProps) {
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<LevelPrice | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<PurchaseResult | null>(
    null,
  );
  const { user } = useAuth();

  // Trae el precio desde el backend (también lo despierta si está dormido en Render)
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LEVEL_PRICES);
        if (!response.ok) return;
        // prices en USD (lo que se muestra), chargePrices en COP (lo que cobra MP)
        const { prices, chargePrices } = await response.json();
        if (prices?.[levelId]) {
          setPrice({ usd: prices[levelId], cop: chargePrices?.[levelId] ?? null });
        }
      } catch (error) {
        console.log("⚠️ No se pudo cargar el precio:", error);
      }
    };

    loadPrice();
  }, [levelId]);

  const checkAccessAfterCheckout = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        API_ENDPOINTS.CHECK_LEVEL_ACCESS_SPECIFIC(user.uid, levelId),
      );
      if (!response.ok) return;
      const { hasAccess } = await response.json();
      if (hasAccess) {
        Alert.alert("¡Pago exitoso!", `Nivel ${levelId} desbloqueado.`);
        onPurchased?.(levelId);
        onClose();
      }
    } catch (error) {
      console.log("⚠️ No se pudo verificar el acceso:", error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(API_ENDPOINTS.CREATE_PREFERENCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ levelId }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo iniciar el pago");
      }

      const { init_point } = await response.json();

      if (Platform.OS === "web") {
        // Mercado Pago redirige de vuelta a /payment-success o /payment-cancel
        window.location.href = init_point;
        return;
      }

      await WebBrowser.openBrowserAsync(init_point);
      await checkAccessAfterCheckout();
    } catch (error: any) {
      Alert.alert(
        "Error en el pago",
        error.message ||
          "No se pudo procesar el pago. Por favor intenta nuevamente.",
      );
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!user || !couponCode.trim()) return;

    setLoading(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(API_ENDPOINTS.REDEEM_COUPON, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code: couponCode.trim(), levelId }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo aplicar el cupón");
      }

      setCouponResult({ type: "success", levelId });
    } catch (error: any) {
      setCouponResult({
        type: "error",
        message: error.message || "No se pudo aplicar el cupón.",
      });
      console.error("Coupon error:", error);
    } finally {
      setLoading(false);
    }
  };

  // El nivel se marca comprado al cerrar el modal, para que se vea la animación
  const handleResultDismiss = () => {
    const succeeded = couponResult?.type === "success";
    setCouponResult(null);
    if (succeeded) {
      onPurchased?.(levelId);
      onClose();
    }
  };

  const priceLabel = price ? formatUsd(price.usd) : null;
  const canPay = !loading && !!user;
  const canRedeem = canPay && !!couponCode.trim();

  const benefits = [
    lessonsTotal ? `${lessonsTotal} lecciones con ejercicios` : "Todas las lecciones y ejercicios",
    readingsTotal ? `${readingsTotal} lecturas cortas` : null,
    "Avanza a tu ritmo y suma XP",
  ].filter(Boolean) as string[];

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Desbloquear nivel {levelId}</Text>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          accessibilityLabel="Cerrar"
          style={({ hovered }: any) => [styles.closeButton, hovered && styles.closeButtonHover]}
        >
          <Ionicons name="close" size={18} color="#6B5B95" />
        </Pressable>
      </View>

      <View style={styles.priceBox}>
        {priceLabel ? (
          <Text style={styles.price}>{priceLabel}</Text>
        ) : (
          <ActivityIndicator color="#9365FF" style={styles.priceLoader} />
        )}
        {price?.cop ? (
          <Text style={styles.priceNote}>
            Se cobra en pesos colombianos: {formatCop(price.cop)} (TRM del día)
          </Text>
        ) : null}
      </View>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={!canPay}
        style={({ pressed, hovered }: any) => [
          styles.payButton,
          hovered && canPay && styles.payButtonHover,
          pressed && styles.pressed,
          !canPay && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payText}>
            {priceLabel ? `Pagar ${priceLabel} con Mercado Pago` : "Pagar con Mercado Pago"}
          </Text>
        )}
      </Pressable>
      <View style={styles.secureRow}>
        <Ionicons name="lock-closed" size={12} color="#8B8B9E" />
        <Text style={styles.secureText}>Pago seguro con Mercado Pago</Text>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>¿Tienes un cupón?</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.couponRow}>
        <TextInput
          value={couponCode}
          onChangeText={setCouponCode}
          placeholder="Código del cupón"
          placeholderTextColor="#A39DB8"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleRedeemCoupon}
          style={styles.couponInput}
        />
        <Pressable
          onPress={handleRedeemCoupon}
          disabled={!canRedeem}
          style={({ pressed }) => [
            styles.couponButton,
            pressed && styles.pressed,
            !canRedeem && styles.couponButtonDisabled,
          ]}
        >
          <Text style={[styles.couponButtonText, !canRedeem && styles.couponButtonTextDisabled]}>
            Aplicar
          </Text>
        </Pressable>
      </View>

      <PurchaseResultModal
        result={couponResult}
        onDismiss={handleResultDismiss}
      />
    </View>
  );
}

const FONT = "Poppins";

const styles = StyleSheet.create({
  panel: {
    marginTop: 14,
    padding: 18,
    backgroundColor: "#FAF7FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9E0FF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: "700",
    color: "#4C1D95",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE8FF",
  },
  closeButtonHover: {
    backgroundColor: "#E2D6FF",
  },
  priceBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  price: {
    fontFamily: FONT,
    fontSize: 30,
    fontWeight: "800",
    color: "#D82989",
  },
  priceLoader: {
    marginVertical: 8,
  },
  priceNote: {
    fontFamily: FONT,
    fontSize: 12,
    color: "#7A7490",
    textAlign: "center",
    marginTop: 2,
  },
  benefits: {
    gap: 8,
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitText: {
    fontFamily: FONT,
    fontSize: 14,
    color: "#444",
  },
  payButton: {
    backgroundColor: "#009EE3",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    shadowColor: "#009EE3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonHover: {
    backgroundColor: "#0089C7",
  },
  payText: {
    fontFamily: FONT,
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
  },
  secureText: {
    fontFamily: FONT,
    fontSize: 12,
    color: "#8B8B9E",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E4DCF7",
  },
  dividerText: {
    fontFamily: FONT,
    fontSize: 13,
    color: "#7A7490",
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: FONT,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD3F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  couponButton: {
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: "#9365FF",
  },
  couponButtonDisabled: {
    backgroundColor: "#ECE6FA",
  },
  couponButtonText: {
    fontFamily: FONT,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  couponButtonTextDisabled: {
    color: "#A39DB8",
  },
});
