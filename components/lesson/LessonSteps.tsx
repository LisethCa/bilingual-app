// Piezas de la lección por pasos: armado de los pasos, barra de progreso,
// tarjetas de vocabulario y de gramática.
import Emoji3D from "@/components/ui/Emoji3D";
import SpeakButton from "@/components/ui/SpeakButton";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const RULES_PER_STEP = 3;

export type LessonStep =
  | { kind: "intro" }
  | { kind: "video" }
  | { kind: "vocabulary"; items: any[] }
  | {
      kind: "grammar";
      rules: any[];
      showExplanation: boolean;
      part: number;
      parts: number;
    }
  | { kind: "exercise"; index: number }
  | { kind: "finish" };

const chunk = <T,>(list: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

/** Intro → video (si hay) → vocabulario (flashcards) → gramática → un ejercicio por paso → final. */
export const buildLessonSteps = (
  lesson: any,
  exerciseCount: number,
): LessonStep[] => {
  const steps: LessonStep[] = [{ kind: "intro" }];

  if (lesson?.content?.video?.url) steps.push({ kind: "video" });

  // todo el vocabulario en un paso: se recorre como mazo de flashcards
  const vocabulary = lesson?.content?.vocabulary || [];
  if (vocabulary.length) steps.push({ kind: "vocabulary", items: vocabulary });

  const grammar = lesson?.content?.grammar;
  if (grammar) {
    const ruleParts = chunk(grammar.rules || [], RULES_PER_STEP);
    if (!ruleParts.length) ruleParts.push([]);
    ruleParts.forEach((rules, i) =>
      steps.push({
        kind: "grammar",
        rules,
        showExplanation: i === 0,
        part: i + 1,
        parts: ruleParts.length,
      }),
    );
  }

  for (let index = 0; index < exerciseCount; index++) {
    steps.push({ kind: "exercise", index });
  }
  steps.push({ kind: "finish" });
  return steps;
};

/** Barra superior: progreso y nombre del paso. */
export function StepProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  );
}

export function VocabularyCards({ items }: { items: any[] }) {
  return (
    <View>
      {items.map((item: any, index: number) => {
        const imageUrl = item.image || item.media?.image;
        const audioUrl = item.audio || item.media?.audio;
        // La imagen propia (Cloudinary) tiene prioridad sobre el emoji
        const emoji = !imageUrl && item.emoji;

        return (
          <View key={item.id || index} style={styles.vocabularyItem}>
            <View style={styles.wordRow}>
              {emoji && <Emoji3D emoji={emoji} size={52} />}
              <View style={styles.wordTexts}>
                <Text style={styles.word}>{item.word}</Text>
                <Text style={styles.translation}>{item.translation}</Text>
              </View>
              <SpeakButton text={item.word} audioUrl={audioUrl} />
            </View>

            {imageUrl && (
              <Image
                source={{ uri: imageUrl, cache: "force-cache" }}
                style={styles.vocabularyImage}
                resizeMode="contain"
              />
            )}

            {item.examples?.length > 0 && (
              <View style={styles.examplesContainer}>
                {item.examples.map((ex: string, i: number) => (
                  <View key={i} style={styles.exampleRow}>
                    <SpeakButton text={ex} size="small" />
                    <Text style={styles.example}>{`"${ex}"`}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function GrammarCard({
  grammar,
  rules,
  showExplanation,
}: {
  grammar: any;
  rules: any[];
  showExplanation: boolean;
}) {
  return (
    <View style={styles.grammarCard}>
      <Text style={styles.grammarTitle}>{grammar.title}</Text>
      {showExplanation && !!grammar.explanation && (
        <Text style={styles.grammarExplanation}>{grammar.explanation}</Text>
      )}
      {rules.map((item: any, i: number) => (
        <View key={i} style={styles.grammarRule}>
          <Text style={styles.grammarRuleText}>{item.rule}</Text>
          {item.examples?.map((ex: string, j: number) => (
            <View key={j} style={styles.exampleRow}>
              <SpeakButton text={ex} size="small" />
              <Text style={styles.example}>{ex}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EDE7FF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#9365FF",
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#4C1D95",
  },
  vocabularyItem: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE8FF",
  },
  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordTexts: { flex: 1 },
  word: { fontWeight: "bold", fontSize: 18, color: "#333" },
  translation: { color: "#666", fontSize: 15 },
  vocabularyImage: { width: "100%", height: 150, marginTop: 10 },
  examplesContainer: { marginTop: 10, paddingLeft: 4 },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  example: { flex: 1, fontStyle: "italic", color: "#666" },
  grammarCard: {
    padding: 16,
    backgroundColor: "#F3EFFF",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#9365FF",
  },
  grammarTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#333",
    marginBottom: 8,
  },
  grammarExplanation: { color: "#555", fontSize: 15, marginBottom: 8 },
  grammarRule: { marginTop: 12 },
  grammarRuleText: { fontWeight: "600", color: "#444", marginBottom: 6 },
});
