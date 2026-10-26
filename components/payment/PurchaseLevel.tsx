import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Platform,
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

  return (
    <View style={{ padding: 20, backgroundColor: "white", borderRadius: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        Comprar Nivel {levelId}
      </Text>

      <Text style={{ marginBottom: price?.cop ? 4 : 15 }}>
        Precio: {priceLabel ?? "cargando..."}
      </Text>

      {price?.cop ? (
        <Text style={{ marginBottom: 15, color: "#666", fontSize: 12 }}>
          Se cobra en pesos colombianos: {formatCop(price.cop)} (TRM del día)
        </Text>
      ) : null}

      <Text style={{ marginBottom: 20, color: "#666" }}>
        Acceso completo a todas las lecciones y ejercicios del nivel {levelId}
      </Text>

      <Button
        title={
          loading
            ? "Procesando..."
            : priceLabel
              ? `Pagar ${priceLabel} con Mercado Pago`
              : "Pagar con Mercado Pago"
        }
        onPress={handleSubmit}
        disabled={loading || !user}
      />

      <Text style={{ marginTop: 20, marginBottom: 6, color: "#666" }}>
        ¿Tienes un cupón?
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={couponCode}
          onChangeText={setCouponCode}
          placeholder="Código del cupón"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleRedeemCoupon}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        />
        <Button
          title="Aplicar"
          onPress={handleRedeemCoupon}
          disabled={loading || !user || !couponCode.trim()}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title="Cancelar" onPress={onClose} color="red" />
      </View>

      <PurchaseResultModal
        result={couponResult}
        onDismiss={handleResultDismiss}
      />
    </View>
  );
}
