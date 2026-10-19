import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { Alert, Button, Platform, Text, View } from "react-native";

type LevelId = "A1" | "A2" | "B1";

interface PurchaseLevelProps {
  levelId: LevelId;
  onClose: () => void;
  onPurchased?: (levelId: LevelId) => void;
}

const formatUsd = (amount: number) => `USD ${amount}`;

const formatCop = (amount: number) =>
  `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(amount)} COP`;

// Alert.alert no hace nada en react-native-web
const notify = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

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
  // El backend decide si se muestra el pago simulado (ENABLE_SIMULATED_PAYMENTS)
  const [canSimulate, setCanSimulate] = useState(false);
  const { user } = useAuth();

  // Trae el precio desde el backend (también lo despierta si está dormido en Render)
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.LEVEL_PRICES);
        if (!response.ok) return;
        // prices en USD (lo que se muestra), chargePrices en COP (lo que cobra MP)
        const { prices, chargePrices, simulatedPaymentsEnabled } =
          await response.json();
        if (prices?.[levelId]) {
          setPrice({ usd: prices[levelId], cop: chargePrices?.[levelId] ?? null });
        }
        setCanSimulate(simulatedPaymentsEnabled === true);
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

  const handleSimulate = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch(API_ENDPOINTS.SIMULATE_PURCHASE, {
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
        throw new Error(errorData.error || "No se pudo simular el pago");
      }

      notify("Pago simulado", `Nivel ${levelId} desbloqueado.`);
      onPurchased?.(levelId);
      onClose();
    } catch (error: any) {
      notify("Error", error.message || "No se pudo simular el pago.");
      console.error("Simulated payment error:", error);
    } finally {
      setLoading(false);
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

      {canSimulate ? (
        <View style={{ marginTop: 10 }}>
          <Button
            title="Simular pago (testeo)"
            onPress={handleSimulate}
            disabled={loading || !user}
            color="#6b7280"
          />
        </View>
      ) : null}

      <View style={{ marginTop: 10 }}>
        <Button title="Cancelar" onPress={onClose} color="red" />
      </View>
    </View>
  );
}
