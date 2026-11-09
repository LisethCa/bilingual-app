import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../lib/firebaseConfig";
import { registerDailyConnection } from "../services/streakService";
import { trackPixel } from "../lib/pixel";

export default function Login() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showLinkingOptions, setShowLinkingOptions] = useState(false);
  const [linkedGoogleCredential, setLinkedGoogleCredential] =
    useState<any>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "bilingualapp",
    path: "auth/google",
  });

  const [gRequest, gResponse, gPrompt] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    redirectUri: redirectUri,
    responseType: "id_token",
  });

  const handleAuthSuccess = async (userCredential: any) => {
    const userId = userCredential.user.uid;
    const additionalInfo = getAdditionalUserInfo(userCredential);

    if (additionalInfo?.isNewUser) {
      trackPixel("CompleteRegistration", { content_name: "registro" });
      await createNewUserProgress(userId);
    } else {
      await updateStreak(userId);
    }
    setTimeout(() => {
      router.replace("/");
    }, 500);
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setErrorMessage("Por favor, completa todos los campos");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      if (isRegistering) {
        // Si está registrando, verificar si el email ya existe
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);

        if (signInMethods.length > 0) {
          // El email ya existe en otra forma de autenticación
          setErrorMessage(
            `Este correo ya está registrado. Utiliza el método: ${signInMethods.join(
              ", ",
            )}`,
          );
          setLoading(false);
          return;
        }

        // Si no existe, crear nueva cuenta
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await handleAuthSuccess(userCredential);
      } else {
        // Si está ingresando, intentar login normal
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          await handleAuthSuccess(userCredential);
        } catch (error: any) {
          // Si falla, verificar si el email existe en otra forma de autenticación
          if (
            error.code === "auth/user-not-found" ||
            error.code === "auth/invalid-credential"
          ) {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);

            if (signInMethods.length > 0) {
              // El email existe pero con otro método de autenticación
              setErrorMessage(
                `Este correo está registrado con: ${signInMethods.join(
                  ", ",
                )}. Por favor, usa ese método para iniciar sesión.`,
              );
            } else {
              setErrorMessage(
                "Credenciales incorrectas. Verifica tu email y contraseña.",
              );
            }
          } else {
            throw error;
          }
          setLoading(false);
          return;
        }
      }
    } catch (error: any) {
      // Traducir errores comunes de Firebase
      switch (error.code) {
        case "auth/invalid-email":
          setErrorMessage("El formato del correo no es válido.");
          break;
        case "auth/email-already-in-use":
          setErrorMessage("Este correo ya está registrado.");
          break;
        case "auth/weak-password":
          setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setErrorMessage("Credenciales incorrectas. Inténtalo de nuevo.");
          break;
        default:
          setErrorMessage("Credenciales incorrectas. Inténtalo de nuevo.");
      }
      console.error("Error auth:", error.code);
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (gResponse?.type === "success") {
      const { id_token } = gResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          // Verificar si el usuario existe (nuevo o existente)
          const additionalInfo = getAdditionalUserInfo(userCredential);

          if (additionalInfo?.isNewUser) {
            trackPixel("CompleteRegistration", { content_name: "registro" });
            await createNewUserProgress(userCredential.user.uid);
          } else {
            await updateStreak(userCredential.user.uid);
          }

          timeoutId = setTimeout(() => {
            router.replace("/");
          }, 500);
        })
        .catch((error) => {
          console.error("Error Google Auth:", error);
          setErrorMessage("Error en autenticación con Google");
        });
    }
    return () => clearTimeout(timeoutId);
  }, [gResponse]);

  const createNewUserProgress = async (userId: string) => {
    const userRef = doc(db, "userProgress", userId);
    await setDoc(userRef, {
      xp: 0,
      currentLevel: "A1",
      stats: { daysStreak: 1, lastLogin: new Date(), longestStreak: 1 },
      rewards: {
        gems: 10,
        badges: ["welcome_badge"],
        stickers: ["bily_hello"],
      },
    });
  };

  const updateStreak = async (userId: string) => {
    try {
      await registerDailyConnection(userId);
    } catch (error) {
      // la racha nunca debe impedir el login
      console.error("Error updating streak:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {isRegistering ? "Crear Cuenta" : "Bienvenido"}
        </Text>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* OPCIÓN PRINCIPAL: GOOGLE */}
        <TouchableOpacity
          style={[styles.mainGoogleButton]}
          onPress={() => gPrompt()}
          disabled={!gRequest}
        >
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.mainGoogleIcon}
          />
          <Text style={styles.mainGoogleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.line} />
        </View>

        {/* BOTÓN PARA MOSTRAR FORMULARIO DE EMAIL */}
        {!showEmailForm ? (
          <TouchableOpacity
            style={styles.emailToggleButton}
            onPress={() => setShowEmailForm(true)}
          >
            <Text style={styles.emailToggleText}>Usar email en su lugar</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* FORMULARIO DE EMAIL (colapsable) */}
            <TextInput
              placeholder="Email"
              style={[styles.input, errorMessage && styles.inputError]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Contraseña"
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegistering ? "Registrarse" : "Entrar"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
              <Text style={styles.switchText}>
                {isRegistering
                  ? "¿Ya tienes cuenta? Loguéate"
                  : "¿No tienes cuenta? Regístrate"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToGoogleButton}
              onPress={() => {
                setShowEmailForm(false);
                setEmail("");
                setPassword("");
                setErrorMessage(null);
              }}
            >
              <Text style={styles.backToGoogleText}>Volver a Google</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: "#FFF" },
  container: {
    flex: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 100, height: 100, marginBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#1a1a1a",
  },

  // BOTÓN PRINCIPAL DE GOOGLE
  mainGoogleButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#dadada",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 20,
    shadowColor: "#c9c9c9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainGoogleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: "contain",
  },
  mainGoogleButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // TOGGLE PARA EMAIL
  emailToggleButton: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
  },
  emailToggleText: {
    fontSize: 15,
    color: "#4285F4",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    marginBottom: 15,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  mainButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  switchText: { marginTop: 20, color: "#666", textAlign: "center" },
  backToGoogleButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  backToGoogleText: {
    fontSize: 14,
    color: "#4285F4",
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    width: "100%",
  },
  line: { flex: 1, height: 1, backgroundColor: "#DDD" },
  dividerText: { marginHorizontal: 10, color: "#999", fontSize: 14 },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  facebookButton: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: "contain",
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#EF5350",
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#EF5350",
  },
});
