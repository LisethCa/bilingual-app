import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface DragItem {
  id: string;
  content: string;
}

interface DropZone {
  id: string;
  content: string;
  correctMatch: string;
}

interface DragDropExerciseProps {
  dragItems?: DragItem[]; // Hacer opcional
  dropZones?: DropZone[];
  instructions?: string;
  question?: string;
  onComplete: () => void;
  isCompleted?: boolean;
}

// Cursor de "agarrar" y sin selección de texto al arrastrar en web
const webGrabStyle = (
  Platform.OS === "web" ? { cursor: "grab", userSelect: "none" } : {}
) as ViewStyle;

interface ZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragItemViewProps {
  itemId: string;
  content: string;
  disabled: boolean;
  isSelected: boolean;
  onDragStart: (id: string) => void;
  onDragMove: (absoluteX: number, absoluteY: number) => void;
  onDragEnd: (id: string, absoluteX: number, absoluteY: number) => void;
  onTap: (id: string) => void;
}

// Cada ítem tiene su propio gesto: se puede arrastrar desde el primer toque,
// o tocar para seleccionarlo y luego tocar la zona destino.
const DragItemView: React.FC<DragItemViewProps> = ({
  itemId,
  content,
  disabled,
  isSelected,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTap,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(4)
    .onStart(() => {
      dragging.value = true;
      runOnJS(onDragStart)(itemId);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(onDragMove)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      runOnJS(onDragEnd)(itemId, event.absoluteX, event.absoluteY);
    })
    .onFinalize(() => {
      dragging.value = false;
      // Si quedó bien ubicado el ítem se desmonta; si no, vuelve a su lugar
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .onEnd(() => {
      runOnJS(onTap)(itemId);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: dragging.value ? 1000 : 1,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(dragging.value ? 1.08 : 1) },
    ],
    shadowOpacity: dragging.value ? 0.3 : 0.2,
    elevation: dragging.value ? 10 : 3,
  }));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <Animated.View
        style={[
          styles.dragItem,
          webGrabStyle,
          isSelected && styles.dragItemSelected,
          animatedStyle,
        ]}
      >
        <Text style={styles.dragText}>{content}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const DragDropExercise: React.FC<DragDropExerciseProps> = ({
  dragItems = [],
  dropZones = [],
  instructions = "Arrastra cada elemento a su posición correcta",
  question = "Relaciona los elementos",
  onComplete,
  isCompleted = false,
}) => {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(isCompleted);
  const [shuffledDropZones, setShuffledDropZones] = useState<DropZone[]>([]);
  const hasInitialized = useRef(false);
  const zoneRefs = useRef<Record<string, View | null>>({});
  // Posición de cada zona en la ventana, medida al empezar cada arrastre
  // (así sigue siendo correcta aunque el usuario haya hecho scroll)
  const zoneRects = useRef<Record<string, ZoneRect>>({});
  const highlightedRef = useRef<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar estado completado
  useEffect(() => {
    setIsExerciseCompleted(isCompleted);
  }, [isCompleted]);

  // Mezclar dropZones para evitar alineación (solo una vez)
  useEffect(() => {
    if (!hasInitialized.current && dropZones.length > 0) {
      const shuffled = [...dropZones].sort(() => Math.random() - 0.5);
      setShuffledDropZones(shuffled);
      hasInitialized.current = true;
    }
  }, [dropZones.length]);

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2000);
  };

  const updateHighlight = (zoneId: string | null) => {
    if (highlightedRef.current === zoneId) return;
    highlightedRef.current = zoneId;
    setHighlightedZone(zoneId);
  };

  const zoneAt = (absoluteX: number, absoluteY: number): string | null => {
    for (const [zoneId, rect] of Object.entries(zoneRects.current)) {
      if (
        absoluteX >= rect.x &&
        absoluteX <= rect.x + rect.width &&
        absoluteY >= rect.y &&
        absoluteY <= rect.y + rect.height
      ) {
        return zoneId;
      }
    }
    return null;
  };

  const tryMatch = (dragItemId: string, dropZoneId: string) => {
    if (isExerciseCompleted) return;
    // Zona ya resuelta: no cuenta como error
    if (Object.values(matches).includes(dropZoneId)) return;

    const isCorrect =
      dropZones.find((zone) => zone.id === dropZoneId)?.correctMatch ===
      dragItemId;

    if (!isCorrect) {
      feedbackWrong();
      showFeedback("Incorrecto, intenta de nuevo");
      return;
    }

    const newMatches = { ...matches, [dragItemId]: dropZoneId };
    setMatches(newMatches);
    setSelectedItem(null);
    feedbackCorrect();
    showFeedback("¡Correcto!");

    const allCorrect = dropZones.every(
      (zone) => newMatches[zone.correctMatch] === zone.id,
    );
    if (allCorrect) {
      setIsExerciseCompleted(true);
      onComplete();
    }
  };

  const handleDragStart = useCallback((dragItemId: string) => {
    setIsDragging(true);
    setSelectedItem(dragItemId);
    zoneRects.current = {};
    Object.entries(zoneRefs.current).forEach(([zoneId, node]) => {
      node?.measureInWindow((x, y, width, height) => {
        zoneRects.current[zoneId] = { x, y, width, height };
      });
    });
  }, []);

  const handleDragMove = (absoluteX: number, absoluteY: number) => {
    updateHighlight(zoneAt(absoluteX, absoluteY));
  };

  const handleDragEnd = (
    dragItemId: string,
    absoluteX: number,
    absoluteY: number,
  ) => {
    setIsDragging(false);
    updateHighlight(null);
    const zoneId = zoneAt(absoluteX, absoluteY);
    if (zoneId) {
      tryMatch(dragItemId, zoneId);
    } else {
      setSelectedItem(null);
    }
  };

  const handleItemTap = (dragItemId: string) => {
    setSelectedItem((current) => (current === dragItemId ? null : dragItemId));
  };

  const handleZonePress = (zoneId: string) => {
    if (selectedItem) tryMatch(selectedItem, zoneId);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.instructions}>{instructions}</Text>
      <Text style={styles.hint}>
        Arrastra cada elemento, o tócalo y luego toca su pareja.
      </Text>

      {feedback && (
        <View
          style={[
            styles.feedbackContainer,
            feedback.includes("Correcto")
              ? styles.feedbackCorrect
              : styles.feedbackIncorrect,
          ]}
        >
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      <View style={styles.columnsContainer}>
        {/* Columna de elementos arrastrables */}
        <View style={[styles.dragColumn, isDragging && styles.columnOnTop]}>
          {dragItems.map(
            (item) =>
              !matches[item.id] && (
                <DragItemView
                  key={`drag-${item.id}`}
                  itemId={item.id}
                  content={item.content}
                  disabled={isExerciseCompleted}
                  isSelected={selectedItem === item.id}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onTap={handleItemTap}
                />
              ),
          )}
        </View>

        {/* Columna de zonas de destino */}
        <View style={styles.dropColumn}>
          {shuffledDropZones.map((zone) => {
            const isMatched = matches[zone.correctMatch] === zone.id;
            return (
              <Pressable
                key={`zone-${zone.id}`}
                ref={(node) => {
                  zoneRefs.current[zone.id] = node;
                }}
                onPress={() => handleZonePress(zone.id)}
                disabled={isMatched || isExerciseCompleted}
                style={[
                  styles.dropZone,
                  isMatched && styles.dropZoneCorrect,
                  !isMatched &&
                    (highlightedZone === zone.id ||
                      (selectedItem && !isDragging)) &&
                    styles.dropZoneHighlighted,
                ]}
              >
                <Text style={styles.dropText}>
                  {isMatched ? `${zone.content} ✓` : zone.content}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Mostrar elementos ya colocados */}
      {Object.keys(matches).length > 0 && (
        <View style={styles.matchesContainer}>
          <Text style={styles.matchesTitle}>Relaciones correctas:</Text>
          {Object.entries(matches).map(([dragId, dropId]) => {
            const dragItem = dragItems.find((item) => item.id === dragId);
            const dropZone = dropZones.find((zone) => zone.id === dropId);
            return (
              <View key={`match-${dragId}-${dropId}`} style={styles.matchItem}>
                <Text style={styles.matchText}>
                  {dragItem?.content} → {dropZone?.content}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  question: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  instructions: {
    fontSize: 16,
    marginBottom: 6,
    textAlign: "center",
    color: "#666",
  },
  hint: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
    color: "#9CA3AF",
  },
  feedbackContainer: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignSelf: "center",
  },
  feedbackCorrect: {
    backgroundColor: "#dff0d8",
    borderColor: "#d6e9c6",
  },
  feedbackIncorrect: {
    backgroundColor: "#f2dede",
    borderColor: "#ebccd1",
  },
  feedbackText: {
    textAlign: "center",
    color: "#3c763d",
    fontWeight: "bold",
  },
  columnsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dragColumn: {
    width: "45%",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    zIndex: 1,
  },
  // El ítem arrastrado debe pintarse por encima de la columna de zonas
  columnOnTop: {
    zIndex: 10,
    elevation: 10,
  },
  dropColumn: {
    width: "45%",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  dragItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9365FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
  dragItemSelected: {
    backgroundColor: "#7E57C2",
    borderWidth: 2,
    borderColor: "#4C1D95",
  },
  dragText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  dropZone: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 10,
    minHeight: 50,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
  },
  dropZoneCorrect: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4CAF50",
  },
  dropZoneHighlighted: {
    borderColor: "#9365FF",
    backgroundColor: "#f3e5ff",
  },
  dropText: {
    textAlign: "center",
    color: "#333",
    fontSize: 16,
  },
  matchesContainer: {
    marginTop: "auto",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  matchesTitle: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  matchItem: {
    padding: 5,
  },
  matchText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
});

export default DragDropExercise;
