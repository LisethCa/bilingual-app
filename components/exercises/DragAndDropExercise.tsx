import React, { useEffect, useRef, useState } from "react";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import { Dimensions, StyleSheet, Text, View, ViewStyle } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

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

interface DropZoneLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragItemViewProps {
  itemId: string;
  content: string;
  positions: ReturnType<typeof useSharedValue<Record<string, { x: number; y: number }>>>;
  activeDrag: string | null;
  matches: Record<string, string>;
  gestureHandler: ReturnType<typeof useAnimatedGestureHandler>;
  isExerciseCompleted: boolean;
  setActiveDrag: (id: string) => void;
  onLayout: (id: string, x: number, y: number) => void;
}

const DragItemView: React.FC<DragItemViewProps> = ({
  itemId,
  content,
  positions,
  activeDrag,
  matches,
  gestureHandler,
  isExerciseCompleted,
  setActiveDrag,
  onLayout,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeDrag === itemId;
    const isMatched = matches[itemId];
    return {
      position: "absolute" as const,
      left: 0,
      top: 0,
      zIndex: isActive ? 1000 : isMatched ? 1 : 100,
      opacity: isMatched ? 0.9 : 1,
      transform: [
        { translateX: positions.value[itemId]?.x || 0 },
        { translateY: positions.value[itemId]?.y || 0 },
        { scale: withSpring(isActive ? 1.1 : 1) },
      ],
      backgroundColor: isMatched ? "#4CAF50" : isActive ? "#7E57C2" : "#9365FF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: isActive ? 5 : 2 },
      shadowOpacity: isActive ? 0.3 : 0.2,
      shadowRadius: isActive ? 10 : 5,
      elevation: isActive ? 10 : 3,
    };
  });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      onHandlerStateChange={gestureHandler}
      onBegan={() => {
        if (!isExerciseCompleted) {
          runOnJS(setActiveDrag)(itemId);
        }
      }}
    >
      <Animated.View
        style={[styles.dragItem as ViewStyle, animatedStyle as Animated.AnimateStyle<ViewStyle>]}
        onLayout={(e) => {
          const { x, y } = e.nativeEvent.layout;
          onLayout(itemId, x, y);
        }}
      >
        <Text style={styles.dragText}>{content}</Text>
      </Animated.View>
    </PanGestureHandler>
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
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(isCompleted);
  const [shuffledDropZones, setShuffledDropZones] = useState<DropZone[]>([]);
  const hasInitialized = useRef(false);
  const dropZoneLayouts = useRef<Record<string, DropZoneLayout>>({}).current;
  const dragItemLayouts = useRef<Record<string, { x: number; y: number }>>(
    {}
  ).current;

  const positions = useSharedValue(
    dragItems.reduce((acc, item) => {
      acc[item.id] = { x: 0, y: 0 };
      return acc;
    }, {} as Record<string, { x: number; y: number }>)
  );

  useEffect(() => {
    dragItems.forEach((item, index) => {
      // Solo inicializar posiciones si el item no está ya colocado
      if (!matches[item.id]) {
        positions.value[item.id] = { x: 0, y: index * 70 };
      }
    });
  }, [dragItems, matches]);

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

  const resetPosition = (dragItemId: string) => {
    const originalY =
      dragItems.findIndex((item) => item.id === dragItemId) * 70;
    positions.value = {
      ...positions.value,
      [dragItemId]: { x: 0, y: originalY },
    };
  };

  const handleDrop = (dragItemId: string, dropZoneId: string | null) => {
    setHighlightedZone(null);

    if (!dropZoneId) {
      resetPosition(dragItemId);
      setActiveDrag(null);
      return;
    }

    const isCorrect =
      dropZones.find((zone) => zone.id === dropZoneId)?.correctMatch ===
      dragItemId;

    if (isCorrect) {
      const newMatches = { ...matches, [dragItemId]: dropZoneId };
      setMatches(newMatches);
      setFeedback("¡Correcto!");

      const zone = dropZoneLayouts[dropZoneId];
      positions.value = {
        ...positions.value,
        [dragItemId]: {
          x: zone.x - width * 0.45 + 15,
          y: zone.y + 5,
        },
      };
      const allCorrect = dropZones.every(
        (zone) => newMatches[zone.correctMatch] === zone.id
      );
      console.log("allCorrect", allCorrect);
      feedbackCorrect();
      if (allCorrect) {
        runOnJS(setIsExerciseCompleted)(true);
        runOnJS(onComplete)();
      }
    } else {
      feedbackWrong();
      setFeedback("Incorrecto, intenta de nuevo");
      setTimeout(() => resetPosition(dragItemId), 300);
    }

    setActiveDrag(null);
    setTimeout(() => setFeedback(null), 2000);
  };

  const saveDropZoneLayout = (id: string, layout: DropZoneLayout) => {
    dropZoneLayouts[id] = layout;
  };

  const saveDragItemLayout = (id: string, x: number, y: number) => {
    dragItemLayouts[id] = { x, y };
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startX: number; startY: number }) => {
      if (!activeDrag || isExerciseCompleted) return;
      const currentPosition = positions.value[activeDrag];
      if (!currentPosition) return;
      ctx.startX = currentPosition.x;
      ctx.startY = currentPosition.y;
      runOnJS(setHighlightedZone)(null);
    },
    onActive: (event, ctx) => {
      if (!activeDrag || isExerciseCompleted) return;

      positions.value = {
        ...positions.value,
        [activeDrag]: {
          x: ctx.startX + event.translationX,
          y: ctx.startY + event.translationY,
        },
      };

      const activeItem = positions.value[activeDrag];
      let hoveredZone: string | null = null;

      for (const zoneId in dropZoneLayouts) {
        const zone = dropZoneLayouts[zoneId];
        if (
          activeItem.x + width * 0.45 > zone.x &&
          activeItem.x < zone.x + zone.width &&
          activeItem.y > zone.y - 30 &&
          activeItem.y < zone.y + zone.height + 30
        ) {
          hoveredZone = zoneId;
          break;
        }
      }

      runOnJS(setHighlightedZone)(hoveredZone);
    },
    onEnd: (event) => {
      if (!activeDrag || isExerciseCompleted) return;
      const activeItem = positions.value[activeDrag];

      let matchedZoneId: string | null = null;

      for (const zoneId in dropZoneLayouts) {
        const zone = dropZoneLayouts[zoneId];
        if (
          activeItem.x + width * 0.45 > zone.x &&
          activeItem.x < zone.x + zone.width &&
          activeItem.y > zone.y - 30 &&
          activeItem.y < zone.y + zone.height + 30
        ) {
          matchedZoneId = zoneId;
          break;
        }
      }

      runOnJS(handleDrop)(activeDrag, matchedZoneId);
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <Text style={styles.instructions}>{instructions}</Text>

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
        <View style={styles.dragColumn}>
          {dragItems.map(
            (item) =>
              !matches[item.id] && (
                <DragItemView
                  key={`drag-${item.id}`}
                  itemId={item.id}
                  content={item.content}
                  positions={positions}
                  activeDrag={activeDrag}
                  matches={matches}
                  gestureHandler={gestureHandler}
                  isExerciseCompleted={isExerciseCompleted}
                  setActiveDrag={setActiveDrag}
                  onLayout={saveDragItemLayout}
                />
              )
          )}
        </View>

        {/* Columna de zonas de destino */}
        <View style={styles.dropColumn}>
          {shuffledDropZones.map((zone) => (
            <View
              key={`zone-${zone.id}`}
              style={[
                styles.dropZone,
                matches[zone.correctMatch] === zone.id &&
                  styles.dropZoneCorrect,
                highlightedZone === zone.id && styles.dropZoneHighlighted,
              ]}
              onLayout={(event) => {
                const { x, y, width, height } = event.nativeEvent.layout;
                saveDropZoneLayout(zone.id, {
                  id: zone.id,
                  x,
                  y,
                  width,
                  height,
                });
              }}
            >
              <Text style={styles.dropText}>
                {matches[zone.correctMatch] === zone.id
                  ? `${zone.content} ✓`
                  : zone.content}
              </Text>
              {highlightedZone === zone.id && !matches[zone.correctMatch] && (
                <View style={styles.dropZoneHoverIndicator} />
              )}
            </View>
          ))}
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
    </View>
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
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
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
    minHeight: height * 0.5,
    marginBottom: 20,
  },
  dragColumn: {
    width: "45%",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
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
    position: "relative",
    overflow: "hidden",
  },
  dropZoneCorrect: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4CAF50",
  },
  dropZoneHighlighted: {
    borderColor: "#9365FF",
    backgroundColor: "#f3e5ff",
  },
  dropZoneHoverIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#9365FF",
    borderRadius: 8,
  },
  dropText: {
    textAlign: "center",
    color: "#333",
    fontSize: 16,
    zIndex: 1,
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
