import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebaseConfig";
import {
  isLevelComplete,
  recordLevelCompletions,
  toDate,
} from "@/services/levelHistoryService";
import { getAllReadings } from "@/services/readingService";
import { LEVELS, LevelId, summarizeXp, XpSummary } from "@/services/xpService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const NAME_MAX_LENGTH = 40;

const LEVEL_NAMES: Record<LevelId, string> = {
  A1: "A1 · Principiante",
  A2: "A2 · Básico",
  B1: "B1 · Intermedio",
};

type LevelRow = {
  level: LevelId;
  purchasedAt: Date | null;
  completedAt: Date | null;
  complete: boolean;
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
};

async function loadLevelRows(userId: string): Promise<LevelRow[]> {
  const [progressSnap, modulesSnap, readings] = await Promise.all([
    getDoc(doc(db, "userProgress", userId)),
    getDocs(collection(db, "modules")),
    getAllReadings().catch(() => []),
  ]);
  const data = progressSnap.data() || {};
  const purchased: Record<string, boolean> = data.purchasedLevels || {};
  const completedAt: Record<string, unknown> = data.levelCompletedAt || {};

  const xp: XpSummary = summarizeXp(
    modulesSnap.docs.map((d) => d.data()),
    readings,
    data.completedLessons,
    data.completedReadings,
  );

  // por si el nivel se completó y todavía no pasó por la home
  const marked = await recordLevelCompletions(userId, xp, purchased, completedAt);

  return LEVELS.filter((level) => purchased[level]).map((level) => {
    const s = xp.byLevel[level];
    return {
      level,
      purchasedAt: toDate(data.purchasedAt?.[level]),
      completedAt: marked.includes(level)
        ? new Date()
        : toDate(completedAt[level]),
      complete: isLevelComplete(xp, level),
      progress: s.progress,
      lessonsDone: s.lessonsDone,
      lessonsTotal: s.lessonsTotal,
    };
  });
}

type Status = { type: "ok" | "error"; text: string } | null;

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysSince(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

export default function AccountScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<Status>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [sendingReset, setSendingReset] = useState(false);

  const [levelRows, setLevelRows] = useState<LevelRow[] | null>(null);
  const [levelsError, setLevelsError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    loadLevelRows(user.uid)
      .then((rows) => active && setLevelRows(rows))
      .catch((e) => {
        console.error("Error cargando niveles:", e);
        if (active) setLevelsError(true);
      });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Mi cuenta</Text>
          <Text style={styles.subtitle}>
            Inicia sesión para ver y editar tu cuenta.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const providers = user.providerData.map((p) => p.providerId);
  const hasPassword = providers.includes("password");
  const hasGoogle = providers.includes("google.com");
  const methodLabel =
    hasGoogle && hasPassword
      ? "Google y email/contraseña"
      : hasGoogle
        ? "Google"
        : "Email y contraseña";

  const memberDays = daysSince(user.metadata.creationTime);
  const trimmedName = name.trim();
  const nameChanged = trimmedName !== (user.displayName ?? "");

  const handleSaveName = async () => {
    if (trimmedName.length < 2) {
      setNameStatus({
        type: "error",
        text: "El nombre debe tener al menos 2 letras.",
      });
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    try {
      await updateProfile(user, { displayName: trimmedName });
      await refreshUser();
      setNameStatus({ type: "ok", text: "¡Nombre actualizado!" });
    } catch (e) {
      console.error("Error actualizando nombre:", e);
      setNameStatus({
        type: "error",
        text: "No se pudo guardar el nombre. Intenta nuevamente.",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordStatus(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: "error", text: "Completa los tres campos." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        text: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        text: "Las contraseñas nuevas no coinciden.",
      });
      return;
    }
    if (!user.email) return;

    setSavingPassword(true);
    try {
      // Firebase exige un login reciente para cambiar la contraseña
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus({ type: "ok", text: "¡Contraseña actualizada!" });
    } catch (e: any) {
      console.error("Error cambiando contraseña:", e?.code);
      const text =
        e?.code === "auth/wrong-password" ||
        e?.code === "auth/invalid-credential"
          ? "La contraseña actual no es correcta."
          : e?.code === "auth/weak-password"
            ? "La nueva contraseña es muy débil."
            : e?.code === "auth/too-many-requests"
              ? "Demasiados intentos. Espera unos minutos e intenta de nuevo."
              : "No se pudo cambiar la contraseña. Intenta nuevamente.";
      setPasswordStatus({ type: "error", text });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendReset = async () => {
    if (!user.email) return;
    setSendingReset(true);
    setPasswordStatus(null);
    try {
      auth.languageCode = "es";
      await sendPasswordResetEmail(auth, user.email);
      setPasswordStatus({
        type: "ok",
        text: `Te enviamos un enlace a ${user.email}. Revisa también la carpeta de spam o correo no deseado.`,
      });
    } catch (e) {
      console.error("Error enviando reset:", e);
      setPasswordStatus({
        type: "error",
        text: "No se pudo enviar el email. Intenta más tarde.",
      });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* RESUMEN */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.title}>{user.displayName || "Sin nombre"}</Text>
        <Text style={styles.subtitle}>{user.email}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#6D28D9" />
          <Text style={styles.infoLabel}>Miembro desde</Text>
          <Text style={styles.infoValue}>
            {formatDate(user.metadata.creationTime)}
          </Text>
        </View>
        {memberDays !== null && (
          <Text style={styles.infoHint}>
            {memberDays === 0
              ? "¡Te uniste hoy! Bienvenido 🎉"
              : `Llevas ${memberDays} ${memberDays === 1 ? "día" : "días"} aprendiendo con nosotros`}
          </Text>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="key-outline" size={18} color="#6D28D9" />
          <Text style={styles.infoLabel}>Acceso con</Text>
          <Text style={styles.infoValue}>{methodLabel}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color="#6D28D9" />
          <Text style={styles.infoLabel}>Último ingreso</Text>
          <Text style={styles.infoValue}>
            {formatDate(user.metadata.lastSignInTime)}
          </Text>
        </View>
      </View>

      {/* NIVELES */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mis niveles</Text>
        {levelsError ? (
          <Text style={styles.errorText}>
            No se pudieron cargar tus niveles. Intenta más tarde.
          </Text>
        ) : levelRows === null ? (
          <ActivityIndicator color="#6D28D9" style={{ marginVertical: 12 }} />
        ) : levelRows.length === 0 ? (
          <>
            <Text style={styles.sectionHint}>
              Todavía no tienes niveles comprados.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.buttonText}>Ver niveles</Text>
            </TouchableOpacity>
          </>
        ) : (
          levelRows.map((row) => {
            const pct = Math.round(Math.min(1, row.progress) * 100);
            return (
              <View key={row.level} style={styles.levelRow}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelName}>{LEVEL_NAMES[row.level]}</Text>
                  {row.complete ? (
                    <Text style={styles.levelBadgeDone}>✅ Completado</Text>
                  ) : (
                    <Text style={styles.levelBadge}>{pct}%</Text>
                  )}
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${pct}%` },
                      row.complete && styles.progressFillDone,
                    ]}
                  />
                </View>
                <Text style={styles.levelDetail}>
                  🛒 Comprado:{" "}
                  {row.purchasedAt ? formatDate(row.purchasedAt) : "—"}
                </Text>
                <Text style={styles.levelDetail}>
                  {row.complete
                    ? `🏆 Completado al 100%: ${
                        row.completedAt ? formatDate(row.completedAt) : "—"
                      }`
                    : `📚 ${row.lessonsDone} de ${row.lessonsTotal} lecciones`}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* NOMBRE */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tu nombre</Text>
        <Text style={styles.sectionHint}>
          Así te saludamos en la app.
        </Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => {
            setName(t);
            setNameStatus(null);
          }}
          placeholder="Ej: Laura"
          placeholderTextColor="#999"
          maxLength={NAME_MAX_LENGTH}
          autoCapitalize="words"
        />
        {nameStatus && (
          <Text
            style={nameStatus.type === "ok" ? styles.okText : styles.errorText}
          >
            {nameStatus.text}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            (!nameChanged || savingName) && styles.buttonDisabled,
          ]}
          onPress={handleSaveName}
          disabled={!nameChanged || savingName}
        >
          {savingName ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Guardar nombre</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CONTRASEÑA */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contraseña</Text>
        {hasPassword ? (
          <>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Contraseña actual"
              placeholderTextColor="#999"
              secureTextEntry={!showPasswords}
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña (mínimo 6 caracteres)"
              placeholderTextColor="#999"
              secureTextEntry={!showPasswords}
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor="#999"
              secureTextEntry={!showPasswords}
            />
            <TouchableOpacity
              style={styles.showRow}
              onPress={() => setShowPasswords(!showPasswords)}
            >
              <Ionicons
                name={showPasswords ? "eye" : "eye-off"}
                size={18}
                color="#666"
              />
              <Text style={styles.showText}>
                {showPasswords ? "Ocultar contraseñas" : "Mostrar contraseñas"}
              </Text>
            </TouchableOpacity>

            {passwordStatus && (
              <Text
                style={
                  passwordStatus.type === "ok"
                    ? styles.okText
                    : styles.errorText
                }
              >
                {passwordStatus.text}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.button, savingPassword && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Cambiar contraseña</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSendReset}
              disabled={sendingReset}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                {sendingReset
                  ? "Enviando..."
                  : "¿No recuerdas tu contraseña actual? Te enviamos un enlace"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.sectionHint}>
            Entras con tu cuenta de Google, así que tu contraseña se maneja
            desde Google. No necesitas una contraseña aparte para esta app.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#9365FF",
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#D82989",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  avatarText: { color: "#FFF", fontSize: 30, fontWeight: "bold" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0EAFF",
  },
  infoLabel: { color: "#666", fontSize: 14, flex: 1 },
  infoValue: { color: "#4C1D95", fontSize: 14, fontWeight: "600" },
  infoHint: {
    color: "#6D28D9",
    fontSize: 13,
    textAlign: "right",
    marginTop: -4,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 4,
  },
  sectionHint: { fontSize: 13, color: "#666", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#D8C8FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#FAFAFF",
    marginBottom: 10,
  },
  showRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  showText: { color: "#666", fontSize: 13 },
  button: {
    backgroundColor: "#D82989",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  linkButton: { marginTop: 14, alignItems: "center" },
  linkText: {
    color: "#6D28D9",
    fontSize: 13,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  levelRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EAFF",
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  levelName: { fontSize: 16, fontWeight: "700", color: "#4C1D95" },
  levelBadge: { fontSize: 14, fontWeight: "700", color: "#6D28D9" },
  levelBadgeDone: { fontSize: 14, fontWeight: "700", color: "#2E7D32" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EDE7FF",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: "#9365FF" },
  progressFillDone: { backgroundColor: "#4CAF50" },
  levelDetail: { fontSize: 13, color: "#555", marginTop: 2 },
  okText: { color: "#2E7D32", fontSize: 14, marginTop: 4 },
  errorText: { color: "#C62828", fontSize: 14, marginTop: 4 },
});
