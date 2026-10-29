import { useEffect, useState } from "react";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MatchingPair = {
  id: string;
  left: string;
  right: string;
  leftType: "image" | "text";
  rightType: "image" | "text";
};

type ExercisePair =
  | { from: string; to: string }
  | {
      left: string;
      right: string;
      leftType?: "image" | "text";
      rightType?: "image" | "text";
      id?: string;
    }
  | { image: string; word: string }
  | { person: string; relation: string; image?: string };

interface MatchingExerciseProps {
  pairs: ExercisePair[];
  onComplete: () => void;
  vocabulary?: any[];
  title?: string;
  isCompleted?: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const MatchingExercise: React.FC<MatchingExerciseProps> = ({
  pairs = [],
  onComplete,
  vocabulary = [],
  title = "Empareja los elementos correspondientes",
  isCompleted = false,
}) => {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const [selected, setSelected] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [leftItems, setLeftItems] = useState<MatchingPair[]>([]);
  const [rightItems, setRightItems] = useState<MatchingPair[]>([]);
  const [normalizedPairs, setNormalizedPairs] = useState<MatchingPair[]>([]);

  // 1. Normalización y Separación de Columnas
  useEffect(() => {
    if (!pairs || pairs.length === 0) return;

    const normalized: MatchingPair[] = pairs.map((pair, index) => {
      // Mantenemos tu lógica de normalización intacta para compatibilidad
      if ("from" in pair && "to" in pair) {
        return {
          id: `p${index}`,
          left: pair.from,
          right: pair.to,
          leftType: "text",
          rightType: "text",
        };
      }
      if ("image" in pair && "word" in pair) {
        return {
          id: `p${index}`,
          left: pair.image,
          right: pair.word,
          leftType: "image",
          rightType: "text",
        };
      }
      if ("left" in pair && "right" in pair) {
        return {
          id: pair.id || `p${index}`,
          left: pair.left,
          right: pair.right,
          leftType:
            pair.leftType || (pair.left.startsWith("http") ? "image" : "text"),
          rightType: pair.rightType || "text",
        };
      }
      // Caso person/relation
      const translation =
        vocabulary?.find(
          (v) => v.word.toLowerCase() === (pair as any).person?.toLowerCase()
        )?.translation || (pair as any).person;
      return {
        id: `p${index}`,
        left: (pair as any).image || translation,
        right: (pair as any).relation,
        leftType: (pair as any).image ? "image" : "text",
        rightType: "text",
      };
    });

    setNormalizedPairs(normalized);

    // IMPORTANTE: Aquí poblamos y barajamos las columnas
    // Añadimos prefijos 'left-' y 'right-' para que handleSelect funcione correctamente
    const leftColumn = normalized.map((p) => ({ ...p, id: `left-${p.id}` }));
    const rightColumn = normalized.map((p) => ({ ...p, id: `right-${p.id}` }));

    setLeftItems(shuffleArray(leftColumn));
    setRightItems(shuffleArray(rightColumn));
  }, [pairs, vocabulary]);

  // 2. Persistencia: Si ya está completado, marcar todo como matched
  useEffect(() => {
    if (isCompleted && leftItems.length > 0) {
      const allIds = [
        ...leftItems.map((i) => i.id),
        ...rightItems.map((i) => i.id),
      ];
      setMatchedPairs(allIds);
    }
  }, [isCompleted, leftItems, rightItems]);

  const handleSelect = (id: string, type: "left" | "right") => {
    if (isCompleted) return;

    if (!selected) {
      setSelected(id);
    } else {
      // "left-<id>" / "right-<id>" (el id del par puede tener guiones)
      const split = (s: string) => [s.slice(0, s.indexOf("-")), s.slice(s.indexOf("-") + 1)];
      const [selectedType, selectedBaseId] = split(selected);
      const [currentType, currentBaseId] = split(id);

      // Evitar seleccionar dos del mismo lado
      if (selectedType === currentType) {
        setSelected(id); // Cambiamos la selección al nuevo elemento del mismo lado
        return;
      }

      // Se compara el contenido de la derecha y no solo el ID base (p0, p1, etc):
      // varios de la izquierda pueden ir con el mismo (He / She / It -> "is")
      const rightOf = (baseId: string) =>
        normalizedPairs.find((p) => p.id === baseId)?.right;
      if (
        selectedBaseId !== currentBaseId &&
        rightOf(selectedBaseId) !== rightOf(currentBaseId)
      ) {
        feedbackWrong();
      } else {
        feedbackCorrect();
        setMatchedPairs((prev) => [...prev, id, selected]);

        // Verificar victoria (multiplicamos por 2 porque hay dos IDs por par)
        if (matchedPairs.length + 2 === normalizedPairs.length * 2) {
          onComplete();
        }
      }
      setSelected(null);
    }
  };

  if (normalizedPairs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se encontraron elementos para emparejar
        </Text>
        <Text style={styles.debugText}>
          Formato recibido: {JSON.stringify(pairs, null, 2)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.columnsContainer}>
        {/* Columna izquierda */}
        <View style={styles.column}>
          {leftItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                !matchedPairs.includes(item.id) && handleSelect(item.id, "left")
              }
              style={[
                styles.itemButton,
                selected === item.id && styles.selectedItem,
                matchedPairs.includes(item.id) && styles.matchedItem,
              ]}
            >
              {item.leftType === "image" ? (
                <Image source={{ uri: item.left }} style={styles.imageItem} />
              ) : (
                <Text style={styles.textItem}>{item.left}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Columna derecha */}
        <View style={styles.column}>
          {rightItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                !matchedPairs.includes(item.id) &&
                handleSelect(item.id, "right")
              }
              style={[
                styles.itemButton,
                selected === item.id && styles.selectedItem,
                matchedPairs.includes(item.id) && styles.matchedItem,
              ]}
            >
              <Text style={styles.textItem}>{item.right}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  columnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
  itemButton: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  selectedItem: {
    backgroundColor: "#d4e6ff",
  },
  matchedItem: {
    backgroundColor: "#c8e6c9",
    opacity: 0.6,
  },
  imageItem: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  textItem: {
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  debugText: {
    color: "#666",
    fontSize: 12,
    marginTop: 10,
  },
});

export default MatchingExercise;
