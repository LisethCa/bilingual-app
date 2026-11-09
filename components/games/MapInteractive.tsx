import React, { useEffect, useState } from "react";
import { showCharacterCorrect, showCharacterWrong } from "@/lib/characters";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MapInteractiveProps {
  config: {
    mapImage: string;
    scenarios: Array<{
      start: string;
      startCoords: { x: number; y: number }; // Agregado
      destination: string;
      destCoords: { x: number; y: number }; // Agregado
      correctPath: string[];
    }>;
  };
  onComplete: () => void;
  isCompleted?: boolean; // Agregado para persistencia
}

const MapInteractive: React.FC<MapInteractiveProps> = ({
  config,
  onComplete,
  isCompleted = false,
}) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [userPath, setUserPath] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isCompleted) {
      setShowSuccess(true);
      setFeedback("¡Lección completada anteriormente!");
      // Opcional: mostrar el camino completo
      const lastScenario = config.scenarios[config.scenarios.length - 1];
      setUserPath(lastScenario.correctPath);
      setCurrentStep(lastScenario.correctPath.length);
    }
  }, [isCompleted]);

  const currentScenario = config.scenarios[currentScenarioIndex];
  const currentCorrectPath = currentScenario.correctPath;

  const getDirectionLabel = (direction: string): string => {
    const labels: { [key: string]: string } = {
      left: "Izquierda ←",
      straight: "Derecho ↑",
      right: "Derecha →",
      back: "Atrás ↓",
    };
    return labels[direction] || direction;
  };

  const handleDirectionPress = (direction: string) => {
    if (isCompleted || showSuccess) return; // Bloquear si ya terminó

    const newPath = [...userPath, direction];
    setUserPath(newPath);

    if (direction === currentCorrectPath[currentStep]) {
      if (currentStep === currentCorrectPath.length - 1) {
        setFeedback("¡Correcto! 🎉 Llegaste al destino.");
        showCharacterCorrect();
        setShowSuccess(true);

        setTimeout(() => {
          if (currentScenarioIndex < config.scenarios.length - 1) {
            setCurrentScenarioIndex((prev) => prev + 1);
            setCurrentStep(0);
            setUserPath([]);
            setFeedback("");
            setShowSuccess(false);
          } else {
            onComplete();
          }
        }, 2000);
      } else {
        setCurrentStep((prev) => prev + 1);
        setFeedback(`¡Bien! Paso ${currentStep + 1} correcto.`);
      }
    } else {
      setFeedback(`✗ Incorrecto. Intenta nuevamente.`);
      showCharacterWrong({
        tip: `El paso ${currentStep + 1} era: ${currentCorrectPath[currentStep]}`,
      });
      setTimeout(() => {
        setUserPath([]);
        setCurrentStep(0);
        setFeedback(`Intenta llegar a: ${currentScenario.destination}`);
      }, 2000);
    }
  };

  const getProgressText = () => {
    return `Escenario ${currentScenarioIndex + 1} de ${
      config.scenarios.length
    }`;
  };

  const getCurrentInstruction = () => {
    if (currentStep === 0) {
      return `¿Cuál es la primera dirección desde ${currentScenario.start}?`;
    }
    return `Paso ${currentStep + 1} de ${
      currentCorrectPath.length
    }. ¿Siguiente dirección?`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Instrucciones de Dirección</Text>
      <Text style={styles.progressText}>{getProgressText()}</Text>

      <View style={styles.scenarioCard}>
        <Text style={styles.scenarioText}>
          <Text style={styles.bold}>Desde:</Text> {currentScenario.start}
        </Text>
        <Text style={styles.scenarioText}>
          <Text style={styles.bold}>Hacia:</Text> {currentScenario.destination}
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        <Image
          source={{ uri: config.mapImage }}
          style={styles.mapImage}
          resizeMode="contain"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setMapDimensions({ width, height });
          }}
        />
        {mapDimensions.width > 0 && (
          <>
            {/* INDICADOR DE INICIO (Donde está el usuario) */}
            <View
              style={[
                styles.marker,
                {
                  left:
                    (currentScenario.startCoords.x / 100) * mapDimensions.width,
                  top:
                    (currentScenario.startCoords.y / 100) *
                    mapDimensions.height,
                  backgroundColor: "blue",
                },
              ]}
            >
              <Text style={styles.markerLabel}>Tú (You)</Text>
            </View>

            {/* INDICADOR DE DESTINO */}
            <View
              style={[
                styles.marker,
                {
                  left:
                    (currentScenario.destCoords.x / 100) * mapDimensions.width,
                  top:
                    (currentScenario.destCoords.y / 100) * mapDimensions.height,
                  backgroundColor: "red",
                },
              ]}
            >
              <Text style={styles.markerLabel}>Meta (Goal)</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.instructionText}>{getCurrentInstruction()}</Text>

      <View style={styles.directionButtons}>
        {["left", "straight", "right"].map((dir) => (
          <TouchableOpacity
            key={dir}
            style={[
              styles.button,
              userPath.length === currentStep && styles.buttonActive,
            ]}
            onPress={() => handleDirectionPress(dir)}
            disabled={showSuccess}
          >
            <Text style={styles.buttonText}>{getDirectionLabel(dir)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {userPath.length > 0 && (
        <View style={styles.pathContainer}>
          <Text style={styles.pathTitle}>Tu camino:</Text>
          <View style={styles.pathSteps}>
            {userPath.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.pathStep,
                  index < currentStep
                    ? styles.pathStepCorrect
                    : styles.pathStepCurrent,
                ]}
              >
                <Text style={styles.pathStepText}>
                  {index + 1}. {getDirectionLabel(step)}
                  {index < currentStep && " ✓"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {feedback ? (
        <View
          style={[
            styles.feedbackContainer,
            feedback.includes("¡Correcto")
              ? styles.feedbackSuccess
              : styles.feedbackError,
          ]}
        >
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      {showSuccess && (
        <View style={styles.successOverlay}>
          <Text style={styles.successText}>¡Destino alcanzado! 🎯</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#2c3e50",
  },
  progressText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 20,
  },
  scenarioCard: {
    backgroundColor: "#ecf0f1",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
  },
  scenarioText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
    color: "#2c3e50",
  },
  mapWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  mapImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#bdc3c7",
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#34495e",
  },
  directionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    opacity: 0.9,
  },
  buttonActive: {
    backgroundColor: "#2980b9",
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  pathContainer: {
    width: "100%",
    marginBottom: 20,
  },
  pathTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2c3e50",
  },
  pathSteps: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
  },
  pathStep: {
    padding: 8,
    marginBottom: 5,
    borderRadius: 5,
  },
  pathStepCorrect: {
    backgroundColor: "#d4edda",
  },
  pathStepCurrent: {
    backgroundColor: "#d1ecf1",
  },
  pathStepText: {
    fontSize: 14,
    color: "#495057",
  },
  feedbackContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
  },
  feedbackSuccess: {
    backgroundColor: "#d4edda",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  feedbackError: {
    backgroundColor: "#FCEAF1",
    borderLeftWidth: 4,
    borderLeftColor: "#D16587",
  },
  feedbackText: {
    fontSize: 16,
    textAlign: "center",
  },
  successOverlay: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(40, 167, 69, 0.9)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  successText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  marker: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: -10 }, { translateY: -10 }], // Centrar el punto
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    position: "absolute",
    top: -15,
    width: 60,
    textAlign: "center",
  },
});

export default MapInteractive;
