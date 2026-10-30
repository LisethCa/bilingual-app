import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ExerciseFeedback from "../ui/ExerciseFeedback";

interface AudioToImageMatchingProps {
  config?: {
    pairs?: Array<{
      id: string;
      text?: string;
      matchId?: string;
      audio?: string;
      image?: string;
    }>;
    mode?: string;
  };
  onComplete: () => void;
}

const AudioToImageMatching: React.FC<AudioToImageMatchingProps> = ({
  config,
  onComplete,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Limpiar el sonido al desmontar
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Validación completa para evitar errores
  if (!config || !config.pairs || !Array.isArray(config.pairs)) {
    console.warn("Configuración inválida para AudioToImageMatching:", config);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Configuración del ejercicio no válida
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Separar los pares en audios e imágenes con validación.
  // Un par puede traer audio e imagen juntos, sin id ni matchId: el id sale de su posición.
  const validPairs = config.pairs
    .filter((pair) => pair && typeof pair === "object")
    .map((pair, i) => ({ ...pair, id: pair.id || `pair-${i}` }));

  if (validPairs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se encontraron elementos válidos para el ejercicio
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const audioItems = validPairs.filter((item) => item.audio);
  const imageItems = validPairs.filter((item) => item.image);

  // Si no hay elementos válidos, mostrar error
  if (audioItems.length === 0 || imageItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se encontraron elementos de audio o imagen válidos
        </Text>
        <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Validar que el índice actual sea válido
  const safeCurrentIndex = Math.min(currentIndex, audioItems.length - 1);
  const currentAudio = audioItems[safeCurrentIndex];

  // Reproducir el audio actual
  const playSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (!currentAudio?.audio) {
        console.error("Audio no válido en el índice:", safeCurrentIndex);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: currentAudio.audio },
        { shouldPlay: true },
      );
      setSound(newSound);
      setHasPlayed(true);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const handleImageSelect = (imageId: string) => {
    if (!hasPlayed) return;

    const isCorrect = (currentAudio.matchId || currentAudio.id) === imageId;

    setSelectedImage(imageId);

    if (isCorrect) {
      setShowSuccess(true);
      setTimeout(() => {
        if (safeCurrentIndex < audioItems.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedImage(null);
          setHasPlayed(false);
          setShowSuccess(false);
        } else {
          onComplete();
        }
      }, 1000);
    } else {
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
        setSelectedImage(null);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {config.mode === "audio_to_image"
          ? "Escucha y selecciona la imagen correcta"
          : "Selecciona la imagen que corresponde"}
      </Text>

      <View style={styles.audioSection}>
        <Text style={styles.audioPrompt}>
          Audio {safeCurrentIndex + 1} de {audioItems.length}
        </Text>
        <TouchableOpacity style={styles.playButton} onPress={playSound}>
          <Text style={styles.playButtonText}>▶ Reproducir Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imagesContainer}>
        {imageItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.imageButton,
              selectedImage === item.id && styles.selectedImage,
              selectedImage === item.id && showSuccess && styles.correctImage,
              selectedImage === item.id && showError && styles.incorrectImage,
            ]}
            onPress={() => handleImageSelect(item.id)}
            disabled={!hasPlayed || selectedImage !== null}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                resizeMode="contain"
                onError={(e) =>
                  console.log("Error loading image:", e.nativeEvent.error)
                }
              />
            ) : (
              <View style={styles.placeholder}>
                <Text>Imagen no disponible</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ExerciseFeedback
        visible={showSuccess}
        message="¡Correcto!"
        type="success"
      />
      <ExerciseFeedback
        visible={showError}
        message="Inténtalo de nuevo"
        type="error"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  audioSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  audioPrompt: {
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
  },
  playButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  playButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
  },
  imageButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  selectedImage: {
    borderColor: "#007AFF",
  },
  correctImage: {
    borderColor: "#28a745",
    backgroundColor: "#d4edda",
  },
  incorrectImage: {
    borderColor: "#dc3545",
    backgroundColor: "#f8d7da",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  placeholder: {
    width: 120,
    height: 120,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
});

export default AudioToImageMatching;
