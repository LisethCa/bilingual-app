import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { auth, checkAuthState, db } from "@/lib/firebaseConfig";
import {
  computeStreak,
  registerDailyConnection,
} from "@/services/streakService";
import { getAllReadings } from "@/services/readingService";
import {
  currentLevel,
  NEXT_LEVEL_HINT_AT,
  summarizeXp,
  XP,
} from "@/services/xpService";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import "../../assets/css/globalStyles.css";
import GuestSection from "../auth/GuestSection";
import PurchaseLevel from "../payment/PurchaseLevel";
import { FacebookIcon, FlameIcon, InstagramIcon } from "../ui/SvgIcons";
import { toastConfig } from "../ui/ToastConfig";

interface Level {
  id: string;
  name: string;
  missions: any[];
}

// comingSoon: nivel sin contenido todavía. Se muestra con candado y no se puede comprar.
const availableLevels: { id: LevelId; name: string; comingSoon?: boolean }[] = [
  { id: "A1", name: "A1 - Principiante" },
  { id: "A2", name: "A2 - Básico" },
  { id: "B1", name: "B1 - Intermedio", comingSoon: true },
];

interface ProgressData {
  xp?: number;
  level?: string;
  unlockedLevels?: string[];
  purchasedLevels: { [key: string]: boolean };
  completedMissions?: Record<string, string[]>;
  completedLessons?: Record<string, boolean>;
  completedReadings?: Record<string, unknown>;
  levels?: Record<string, { completed: number; total: number }>;
  earnedBadges?: Record<
    string,
    {
      unitId: string;
      unitTitle: string;
      insigniaUrl: string;
      earnedAt: Timestamp;
    }
  >;
  stats: {
    daysStreak: number;
    lastLogin: Timestamp | Date;
    longestStreak: number;
  };
}

type LevelId = "A1" | "A2" | "B1";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<LevelId | null>(null);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const [progress, setProgress] = useState<ProgressData>({
    xp: 0,
    level: "A1",
    unlockedLevels: ["A1"],
    purchasedLevels: {},
    completedLessons: {},
    levels: {
      A1: { completed: 0, total: 0 },
      A2: { completed: 0, total: 0 },
      B1: { completed: 0, total: 0 },
    },
    stats: {
      daysStreak: 1,
      lastLogin: new Date(),
      longestStreak: 1,
    },
  });

  const [modulesData, setModulesData] = useState<any[]>([]);
  const [readings, setReadings] = useState<{ id: string; unitId: string }[]>(
    [],
  );
  const xp = useMemo(
    () =>
      summarizeXp(
        modulesData,
        readings,
        progress.completedLessons,
        progress.completedReadings,
      ),
    [
      modulesData,
      readings,
      progress.completedLessons,
      progress.completedReadings,
    ],
  );
  const studying = currentLevel(xp, progress.purchasedLevels);

  const syncUnlockedLevels = async () => {
    if (!user) return;

    try {
      const response = await fetch(API_ENDPOINTS.CHECK_LEVEL_ACCESS(user.uid));

      if (response.ok) {
        const data = await response.json();
        if (
          data.unlockedLevels &&
          JSON.stringify(data.unlockedLevels) !==
            JSON.stringify(progress.unlockedLevels)
        ) {
          setProgress((prev) => ({
            ...prev,
            unlockedLevels: data.unlockedLevels,
            purchasedLevels: data.purchasedLevels || {},
          }));

          console.log("Niveles sincronizados:", data.unlockedLevels);
        }
      } else if (response.status === 404) {
        console.log("El usuario no tiene registros de niveles comprados aún.");
      }
    } catch (error) {
      console.warn("Backend dormido o inaccesible, usando datos locales.");
    }
  };

  useEffect(() => {
    if (user) {
      syncUnlockedLevels();

      const interval = setInterval(syncUnlockedLevels, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const capitalizeName = (name: any) => {
    if (!name) return "";

    return name
      .toLowerCase()
      .split(" ")
      .map((word: any) => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  const updateStreak = async (userProgress: any) => {
    if (!user) {
      console.error("No hay usuario autenticado");
      return {
        daysStreak: 1,
        lastLogin: new Date(),
        longestStreak: 1,
      };
    }

    try {
      const updated = await registerDailyConnection(
        user.uid,
        userProgress.stats,
      );
      if (updated) return updated;
    } catch (error) {
      console.error("Error updating streak:", error);
    }
    return computeStreak(userProgress.stats);
  };

  const loadProgress = async () => {
    if (!user) return;

    try {
      const progressRef = doc(db, "userProgress", user.uid);
      let progressSnap = await getDoc(progressRef);

      if (!progressSnap.exists()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        progressSnap = await getDoc(progressRef);
      }

      if (progressSnap.exists()) {
        const userProgress = progressSnap.data();
        await loadHeavyData(userProgress);
      } else {
        const newUserProgress = await createNewUserProgress(user.uid);
        await loadHeavyData(newUserProgress);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
      setLoading(false);
    }
  };

  const loadHeavyData = async (userProgress: any) => {
    try {
      const [modulesSnapshot, streak, allReadings] = await Promise.all([
        getDocs(collection(db, "modules")),
        updateStreak(userProgress),
        getAllReadings().catch(() => []),
      ]);
      setReadings(allReadings);

      setModulesData(modulesSnapshot.docs.map((doc) => doc.data()));

      setProgress((prev) => ({
        ...prev,
        xp: userProgress.xp || 0,
        completedLessons: userProgress.completedLessons || {},
        completedReadings: userProgress.completedReadings || {},
        purchasedLevels: userProgress.purchasedLevels || {},
        earnedBadges: userProgress.earnedBadges || {},
        // antes no se copiaba: la pantalla mostraba siempre "1 días de racha"
        stats: streak,
      }));
    } catch (error) {
      console.error("Error loading heavy data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const isValidSession = await checkAuthState();
        if (!isValidSession) {
          router.replace("/login");
          return;
        }

        await loadProgress();
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user]);

  const createNewUserProgress = async (userId: string) => {
    try {
      const modulesSnapshot = await getDocs(collection(db, "modules"));

      let totalLessons = { A1: 0, A2: 0, B1: 0 };
      modulesSnapshot.forEach((doc) => {
        Object.entries(doc.data().units || {}).forEach(
          ([unitId, unit]: [string, any]) => {
            // Usamos startsWith para detectar el nivel en el ID de la unidad
            if (unitId.includes("A1_"))
              totalLessons.A1 += unit.lessons?.length || 0;
            else if (unitId.includes("A2_"))
              totalLessons.A2 += unit.lessons?.length || 0;
            else if (unitId.includes("B1_"))
              totalLessons.B1 += unit.lessons?.length || 0;
          },
        );
      });
      const newProgressData = {
        xp: 0,
        level: "A1",
        unlockedLevels: ["A1"],
        purchasedLevels: {},
        completedLessons: {},
        levels: {
          A1: { completed: 0, total: totalLessons.A1 },
          A2: { completed: 0, total: totalLessons.A2 },
          B1: { completed: 0, total: totalLessons.B1 },
        },
        stats: {
          daysStreak: 1,
          lastLogin: new Date(),
          longestStreak: 1,
        },
      };
      await setDoc(doc(db, "userProgress", userId), newProgressData);
      return newProgressData;
    } catch (error) {
      console.error("Error creating user progress:", error);
      throw error;
    }
  };

  const handleBuyLevel = (levelId: LevelId) => {
    if (!user) {
      Toast.show({
        type: "error",
        text1: "Inicia sesión requerido",
        text2: "Por favor inicia sesión para comprar niveles",
        topOffset: 60,
        visibilityTime: 4000,
      });
      return;
    }

    setSelectedLevel(levelId);
    setPaymentModalVisible(true);

    wakeUpBackend();
  };

  // Función para despertar el backend
  const wakeUpBackend = async () => {
    try {
      console.log("⏰ Waking up backend...");
      const response = await fetch(API_ENDPOINTS.WAKE_UP, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log("✅ Backend is awake and ready");
      }
    } catch (error) {
      console.log(
        "⚠️ Backend wake-up call failed (expected for cold starts):",
        error,
      );
    }
  };

  useEffect(() => {
    const keepBackendAlive = async () => {
      try {
        await fetch(API_ENDPOINTS.WAKE_UP, {
          signal: AbortSignal.timeout(3000),
        });
      } catch (error) {}
    };

    const interval = setInterval(keepBackendAlive, 5 * 60 * 1000);
    keepBackendAlive();

    return () => clearInterval(interval);
  }, []);

  const navigateToLevel = async (levelId: LevelId) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const hasPurchased = progress.purchasedLevels?.[levelId];

      if (hasPurchased) {
        router.push({
          pathname: "/level-modules/[level]",
          params: { level: levelId },
        });
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.CHECK_LEVEL_ACCESS_SPECIFIC(user.uid, levelId),
      );

      if (response.ok) {
        const { hasAccess: backendAccess } = await response.json();

        if (backendAccess) {
          // Actualizar estado local
          setProgress((prev) => ({
            ...prev,
            purchasedLevels: {
              ...prev.purchasedLevels,
              [levelId]: true,
            },
          }));

          router.push({
            pathname: "/level-modules/[level]",
            params: { level: levelId },
          });
          return;
        }
      }

      setSelectedLevel(levelId);
      setPaymentModalVisible(true);
    } catch (error) {
      console.error("Error checking level access:", error);
      setSelectedLevel(levelId);
      setPaymentModalVisible(true);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando tus datos...</Text>
        {user && (
          <View style={styles.userPreview}>
            <Text>Hola, {user.displayName || "Usuario"}!</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          style={[
            styles.abstractPattern,
            { top: -50, left: -20, transform: [{ rotate: "-15deg" }] },
          ]}
        >
          A
        </Text>
        <Text
          style={[
            styles.abstractPattern,
            { bottom: 100, right: -40, transform: [{ rotate: "25deg" }] },
          ]}
        >
          B
        </Text>
        <Text
          style={[
            styles.abstractPattern,
            { top: 200, right: 10, transform: [{ rotate: "5deg" }] },
          ]}
        >
          C
        </Text>
        {/* Sección del usuario */}
        <View style={styles.userSection}>
          {user ? (
            <>
              <View style={styles.avatarContainer}>
                {user.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={styles.userAvatar}
                  />
                ) : (
                  <View style={[styles.userAvatar, styles.placeholderAvatar]}>
                    <Text style={styles.avatarText}>
                      {user.displayName?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {capitalizeName(user.displayName) || "Usuario"}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>

                <TouchableOpacity
                  style={styles.instagramButton}
                  onPress={() =>
                    Linking.openURL(
                      "https://www.instagram.com/bilingualsite01/",
                    )
                  }
                >
                  {/* <Ionicons name="logo-instagram" size={24} color="#E1306C" /> */}
                  <InstagramIcon />
                  <Text style={styles.instagramText}>
                    Síguenos en Instagram
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.facebookButton}
                  onPress={() =>
                    Linking.openURL(
                      "https://web.facebook.com/siteBilingualsite",
                    )
                  }
                >
                  <FacebookIcon />
                  <Text style={styles.facebookText}>Síguenos en Facebook</Text>
                </TouchableOpacity>

                <View style={styles.streakContainer}>
                  <FlameIcon size={20} color="#FF9500" />
                  <Text style={styles.streakText}>
                    {progress.stats?.daysStreak ?? 1}{" "}
                    {(progress.stats?.daysStreak ?? 1) === 1 ? "día" : "días"}{" "}
                    de racha
                  </Text>
                </View>

                <Text style={styles.userLevel}>Cursando: {studying}</Text>
                <Text style={styles.userXP}>
                  ⭐ {xp.total.toLocaleString("es")} XP
                </Text>
              </View>
            </>
          ) : (
            <GuestSection />
          )}
        </View>

        {/* Sección de insignias */}
        {user &&
          progress.earnedBadges &&
          Object.keys(progress.earnedBadges).length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Tus Insignias</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.badgesContainer}>
                  {Object.entries(progress.earnedBadges).map(
                    ([unitId, badge]) => (
                      <View key={unitId} style={styles.badgeCard}>
                        <Image
                          source={{ uri: badge.insigniaUrl }}
                          style={styles.badgeImage}
                        />
                        <Text style={styles.badgeTitle}>{badge.unitTitle}</Text>
                      </View>
                    ),
                  )}
                </View>
              </ScrollView>
            </View>
          )}

        <Text style={styles.sectionTitle}>Tu Progreso</Text>

        {/* Barra de progreso global */}
        <View style={styles.globalXpBar}>
          <Text style={styles.xpText}>
            ⭐ {xp.total.toLocaleString("es")} XP
          </Text>
          <Text style={styles.levelText}>
            Lección +{XP.lesson} · Lectura +{XP.reading} · Unidad completa +
            {XP.unitBonus} · Examen final +{XP.finalExam}
          </Text>
        </View>
        {availableLevels.map((level, i) => {
          if (level.comingSoon) {
            return (
              <View
                key={level.id}
                style={[styles.levelCard, styles.comingSoonCard]}
              >
                <View style={styles.levelHeader}>
                  <Text style={styles.levelTitle}>Nivel {level.name}</Text>
                  <Text style={styles.comingSoonBadge}>🔒 Próximamente</Text>
                </View>
                <Text style={styles.comingSoonText}>
                  Estamos preparando este nivel. ¡Muy pronto disponible!
                </Text>
                <View style={[styles.levelButton, styles.comingSoonButton]}>
                  <Text style={styles.comingSoonButtonText}>Próximamente</Text>
                </View>
              </View>
            );
          }

          const stats = xp.byLevel[level.id];
          const completedCount = stats.lessonsDone + stats.readingsDone;

          const hasAccess = progress.purchasedLevels?.[level.id];

          const progressPercentage = stats.progress * 100;

          // sugerir este nivel cuando el anterior (comprado) está casi terminado
          const previous = availableLevels[i - 1];
          const suggestNext =
            !hasAccess &&
            !!previous &&
            !!progress.purchasedLevels?.[previous.id] &&
            xp.byLevel[previous.id].progress >= NEXT_LEVEL_HINT_AT;

          return (
            <View key={level.id} style={styles.levelCard}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelTitle}>Nivel {level.name}</Text>
                {hasAccess ? (
                  <Text style={styles.purchasedBadge}>✅ Comprado</Text>
                ) : (
                  <Text style={styles.locked}>🔒 Compra para desbloquear</Text>
                )}
              </View>

              {/* MANTENER las barras de progreso */}
              <View style={styles.progressContainer}>
                <Text>
                  Completadas: {stats.lessonsDone}/{stats.lessonsTotal}{" "}
                  lecciones
                  {stats.readingsTotal > 0 &&
                    ` · ${stats.readingsDone}/${stats.readingsTotal} lecturas`}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
                <Text>{Math.round(progressPercentage)}% completado</Text>

                {/* Mostrar XP ganado en este nivel */}
                {stats.xp > 0 && (
                  <Text style={styles.xpEarned}>
                    ⭐ {stats.xp.toLocaleString("es")} XP ganados
                  </Text>
                )}
              </View>

              {hasAccess ? (
                <TouchableOpacity
                  onPress={() => navigateToLevel(level.id)}
                  style={styles.levelButton}
                >
                  <Text style={styles.buttonText}>
                    {completedCount > 0 ? "Continuar" : "Comenzar"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {suggestNext && (
                    <Text style={styles.nextLevelHint}>
                      🎉 ¡Ya casi terminás {previous.id}! Seguí con {level.id}.
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => handleBuyLevel(level.id)}
                    style={[styles.levelButton, styles.buyButton]}
                  >
                    <Text style={styles.buttonText}>Comprar Nivel</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Modal de pago */}
              {selectedLevel === level.id && (
                <PurchaseLevel
                  levelId={selectedLevel}
                  onClose={() => setSelectedLevel(null)}
                  onPurchased={(purchasedId) =>
                    setProgress((prev) => ({
                      ...prev,
                      purchasedLevels: {
                        ...prev.purchasedLevels,
                        [purchasedId]: true,
                      },
                    }))
                  }
                />
              )}
            </View>
          );
        })}

        {user && (
          <View style={styles.levelCard}>
            <Text style={styles.levelTitle}>💬 ¿Qué te parece la app?</Text>
            <Text style={styles.feedbackText}>
              Tu opinión nos ayuda a decidir qué mejorar y qué contenido
              agregar.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/feedback")}
              style={styles.levelButton}
            >
              <Text style={styles.buttonText}>Dejar mi opinión</Text>
            </TouchableOpacity>
          </View>
        )}

        {user && (
          <Button
            title="Cerrar sesión"
            onPress={handleLogout}
            color="#FF5A5F"
          />
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Síguenos en redes sociales</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://www.instagram.com/bilingualsite01/")
              }
              style={styles.socialButton}
            >
              <InstagramIcon />
              <Text style={styles.instagramSocialText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://web.facebook.com/siteBilingualsite")
              }
              style={styles.facebookSocialButton}
            >
              <FacebookIcon />
              <Text style={styles.facebookSocialText}>Facebook</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Bilingual Site
          </Text>
        </View>
      </ScrollView>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#9365FF",
    padding: 20,
    paddingBottom: 60,
    position: "relative",
    overflow: "hidden",
  },
  abstractPattern: {
    position: "absolute",
    fontSize: 250,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.08)",
    zIndex: -1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 20,
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#EDE9FE",
  },
  placeholderAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D82989",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Poppins", // Tipografía destacada
  },
  userInfo: {
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
    fontFamily: "Poppins",
  },
  userEmail: {
    fontSize: 14,
    color: "#E0E0E0",
    marginBottom: 5,
    fontFamily: "Poppins",
  },
  userLevel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 3,
    fontFamily: "Poppins",
  },
  userXP: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "bold",
    fontFamily: "Poppins",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakText: {
    marginLeft: 5,
    fontWeight: "bold",
    color: "#E65100",
    fontFamily: "Poppins",
  },
  longestStreak: {
    marginLeft: 5,
    color: "#666",
    fontSize: 12,
    fontFamily: "Poppins",
  },
  badgesSection: {
    marginBottom: 20,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
  },
  badgeCard: {
    width: 80,
    alignItems: "center",
    margin: 8,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    // Sombra sutil para "flotar" ligeramente sobre el fondo
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3, // Para Android
  },
  badgeImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 5,
  },
  badgeTitle: {
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Poppins",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4C1D95", // Magenta vibrante
    marginBottom: 10,
    fontFamily: "Poppins",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4C1D95",
    fontFamily: "Poppins",
  },
  email: {
    fontSize: 14,
    color: "#ffffff",
    fontFamily: "Poppins",
  },

  globalXpBar: {
    alignItems: "center",
    marginBottom: 30,
    // Fondo más limpio
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    // Sombra sutil para que flote
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  xpText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1E1B4B",
    fontFamily: "Poppins",
  },
  levelText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Poppins",
  },

  /* MEJORA EN TARJETAS DE NIVELES */
  levelCard: {
    backgroundColor: "#FFFFFF", // Fondo blanco más limpio
    borderRadius: 16, // Bordes más redondeados
    padding: 18, // Ligeramente más padding
    marginBottom: 20,
    // Sombra más pronunciada y profesional
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 }, // Desplazamiento vertical para efecto "elevado"
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  levelTitle: {
    fontSize: 18, // Ligeramente más grande
    fontWeight: "700",
    color: "#4C1D95",
    fontFamily: "Poppins",
  },
  locked: {
    color: "#FF9500",
    fontSize: 13,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    /*  backgroundColor: "#DDD6FE", */
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 6,

    backgroundColor: "#E0E0E0",
  },
  progressFill: {
    height: 10,
    backgroundColor: "#4CAF50",
  },
  levelButton: {
    backgroundColor: "#D82989",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  instagramButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E1306C",
    marginHorizontal: 0,
    shadowColor: "#E1306C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  instagramText: {
    marginLeft: 10,
    color: "#E1306C",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Poppins",
  },
  facebookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1877F2",
    marginHorizontal: 0,
    shadowColor: "#1877F2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  facebookText: {
    marginLeft: 10,
    color: "#1877F2",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Poppins",
  },
  footer: {
    marginTop: 10,
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#eeeeeeff",
  },
  socialIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#E1306C",
    minWidth: 140,
  },
  facebookSocialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#1877F2",
    minWidth: 140,
  },
  socialText: {
    marginLeft: 10,
    color: "#D82989",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Poppins",
  },
  instagramSocialText: {
    marginLeft: 10,
    color: "#E1306C",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Poppins",
  },
  facebookSocialText: {
    marginLeft: 10,
    color: "#1877F2",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "Poppins",
  },
  copyright: {
    fontSize: 12,
    color: "#eeeeeeff",
  },
  subscribeButton: {
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  subscribeButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#e0e0e0",
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
  },
  payButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    flex: 1,
    alignItems: "center",
  },
  payButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  lockedButton: {
    backgroundColor: "#6c757d",
  },
  purchasedBadge: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 12,
    backgroundColor: "#E8F5E9",
    padding: 4,
    borderRadius: 4,
  },
  buyButton: {
    backgroundColor: "#FF9500", // Color naranja para comprar
  },
  feedbackText: {
    color: "#666",
    marginTop: 6,
  },
  comingSoonCard: {
    opacity: 0.85,
  },
  comingSoonBadge: {
    color: "#777",
    fontWeight: "bold",
    fontSize: 12,
    backgroundColor: "#EEEEEE",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  comingSoonText: {
    color: "#666",
  },
  comingSoonButton: {
    backgroundColor: "#BDBDBD",
    shadowOpacity: 0,
    elevation: 0,
  },
  comingSoonButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  nextLevelHint: {
    color: "#D82989",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  xpEarned: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 20,
    fontFamily: "System", // o la fuente que uses en tu app
    textAlign: "center",
  },
  userPreview: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  userPreviewText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#495057",
    fontFamily: "System",
  },
  loaderAnimation: {
    marginBottom: 20,
  },
});
