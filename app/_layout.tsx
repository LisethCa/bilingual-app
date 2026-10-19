import { AuthProvider } from "@/contexts/AuthContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Platform, StyleSheet, useColorScheme, useWindowDimensions, View } from "react-native";
import "react-native-reanimated";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <View style={[styles.globalContainer, isDesktop && styles.desktopContainer]}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="unit/[id]" options={{ title: "Unidad" }} />
          <Stack.Screen name="lesson/[id]" options={{ title: "Lección" }} />
          <Stack.Screen name="readings/[level]" options={{ title: "Lecturas" }} />
          <Stack.Screen name="reading/[id]" options={{ title: "Lectura" }} />
          <Stack.Screen name="feedback" options={{ title: "Tu opinión" }} />
          <Stack.Screen
            name="payment-success"
            options={{
              title: "Pago Exitoso",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="payment-cancel"
            options={{
              title: "Pago Cancelado",
              headerShown: false,
            }}
          />
        </Stack>
      </View>
    </AuthProvider>
  );
}
const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#9365FF",
  },
  desktopContainer: {
    maxWidth: 800,
    marginHorizontal: "auto",
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    alignSelf: "center",
    ...(Platform.OS === "web" && {
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    } as any),
  },
  header: {
    backgroundColor: "#f5f5f5",
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: "bold",
    color: "#333",
  },
});
