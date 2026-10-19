import type { ExamResult, StoredExamResult } from "@/services/examService";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

/** Encabezado del examen: reglas y mejor nota anterior. */
export function ExamIntro({
  total,
  passingScore,
  stored,
}: {
  total: number;
  passingScore: number;
  stored: StoredExamResult | null;
}) {
  return (
    <View style={styles.intro}>
      <Text style={styles.introTitle}>📝 Examen final</Text>
      <Text style={styles.introText}>
        {total} ejercicios · Apruebas con {passingScore}% o más.
      </Text>
      <Text style={styles.introText}>
        Cada error resta puntos: lee con calma antes de responder.
      </Text>
      {stored && (
        <Text style={styles.introBest}>
          {stored.passed ? "✅ Ya aprobaste · " : ""}Tu mejor nota:{" "}
          {stored.bestScore}% ({stored.attempts}{" "}
          {stored.attempts === 1 ? "intento" : "intentos"})
        </Text>
      )}
    </View>
  );
}

/** Resultado al terminar: nota, aprobado/no aprobado y detalle por sección. */
export function ExamResultCard({
  result,
  passingScore,
}: {
  result: ExamResult;
  passingScore: number;
}) {
  return (
    <View
      style={[styles.result, result.passed ? styles.passed : styles.failed]}
    >
      <Text style={styles.resultEmoji}>{result.passed ? "🎉" : "💪"}</Text>
      <Text style={styles.resultTitle}>
        {result.passed ? "¡Aprobaste!" : "Todavía no"}
      </Text>
      <Text style={styles.resultScore}>{result.percent}%</Text>
      <Text style={styles.resultDetail}>
        {result.points} de {result.total} puntos · mínimo para aprobar:{" "}
        {passingScore}%
      </Text>

      <View style={styles.sections}>
        {result.sections.map((s) => {
          const pct = Math.round((s.score / s.total) * 100);
          return (
            <View key={s.name} style={styles.sectionRow}>
              <Text style={styles.sectionName}>{s.name}</Text>
              <View style={styles.sectionBar}>
                <View
                  style={[
                    styles.sectionFill,
                    { width: `${pct}%` },
                    pct < passingScore && styles.sectionFillLow,
                  ]}
                />
              </View>
              <Text style={styles.sectionPct}>{pct}%</Text>
            </View>
          );
        })}
      </View>

      {!result.passed && (
        <Text style={styles.resultHint}>
          Repasa las secciones con menor puntaje y vuelve a intentarlo.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    backgroundColor: "#F3EFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#9365FF",
  },
  introTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 6,
  },
  introText: { color: "#555", marginBottom: 2 },
  introBest: { color: "#4C1D95", fontWeight: "600", marginTop: 8 },
  result: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  passed: { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" },
  failed: { backgroundColor: "#FFF3E0", borderColor: "#FF9800" },
  resultEmoji: { fontSize: 44 },
  resultTitle: { fontSize: 22, fontWeight: "700", color: "#333", marginTop: 4 },
  resultScore: { fontSize: 44, fontWeight: "800", color: "#4C1D95" },
  resultDetail: { color: "#666", marginBottom: 14, textAlign: "center" },
  sections: { alignSelf: "stretch", gap: 8 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionName: { width: 110, fontSize: 13, color: "#444" },
  sectionBar: {
    flex: 1,
    height: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
    overflow: "hidden",
  },
  sectionFill: { height: "100%", backgroundColor: "#4CAF50" },
  sectionFillLow: { backgroundColor: "#FF9800" },
  sectionPct: { width: 40, textAlign: "right", fontSize: 13, color: "#444" },
  resultHint: { marginTop: 14, color: "#8A5A00", textAlign: "center" },
});
