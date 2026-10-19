import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { API_ENDPOINTS } from "@/constants/api";

export default function PaymentSuccess() {
  // Mercado Pago agrega payment_id, status, external_reference, etc. a la back_url
  const { payment_id } = useLocalSearchParams<{ payment_id?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verificando pago...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!payment_id || payment_id === "null") {
          throw new Error("Parámetros de pago incompletos");
        }

        // El backend consulta el pago a Mercado Pago y desbloquea el nivel
        const response = await fetch(API_ENDPOINTS.VERIFY_PAYMENT(payment_id));

        if (!response.ok) {
          throw new Error("No se pudo verificar el pago");
        }

        const { status, levelId } = await response.json();

        if (status === "approved") {
          setMessage(`¡Pago exitoso! Nivel ${levelId} desbloqueado.`);
        } else if (status === "pending" || status === "in_process") {
          setMessage(
            "Tu pago está pendiente de acreditación. El nivel se desbloqueará automáticamente cuando se confirme.",
          );
        } else {
          setMessage("El pago no fue aprobado. Contacte soporte si se le cobró.");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setMessage("Error verificando el pago. Contacte soporte.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [payment_id]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Estado del pago
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 20 }}>
          {message}
        </Text>
      )}

      {!loading && (
        <TouchableOpacity
          style={{ backgroundColor: "#007AFF", padding: 15, borderRadius: 8 }}
          onPress={() => router.replace("/dashboard")}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Volver al Dashboard
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#495057",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
