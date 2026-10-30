import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ExerciseFeedback from "@/components/ui/ExerciseFeedback";

type AudioMatchingGameProps = {
  config: {
    items?: Array<{
      audio: string;
      correctMatch: string;
    }>;
    pairs?: Array<{
      audio: string;
      text: string;
      image?: string;
    }>;
    mode?: "audio_to_image" | "audio_to_text";
    options?: {
      imageSource: "vocabulary" | "custom";
      attemptsBeforeHint?: number;
    };
  };
  vocabulary: Array<{
    id: string;
    word: string;
    translation?: string;
    media?: {
      image?: string;
      audio?: string;
    };
  }>;
  onComplete: () => void;
  isCompleted?: boolean;
};

const AudioMatchingGame: React.FC<AudioMatchingGameProps> = ({
  config,
  vocabulary,
  onComplete,
  isCompleted = false,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentItem, setCurrentItem] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hasPlayedFirstAudio, setHasPlayedFirstAudio] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(isCompleted);
  const [completedAnswers, setCompletedAnswers] = useState<{
    [key: number]: string;
  }>({});

  useEffect(() => {
    // Configurar el modo de audio apenas cargue el juego
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }, []);

  // Sincronizar cuando isCompleted cambia desde props
  React.useEffect(() => {
    if (isCompleted) {
      setIsExerciseCompleted(true);
      setShowCompletion(true);
    }
  }, [isCompleted]);

  const usePairsStructure = !!config.pairs;
  const currentItems = usePairsStructure ? config.pairs : config.items;

  const options = React.useMemo(() => {
    if (!currentItems || currentItem >= currentItems.length) return [];

    // Con pares (audio + texto) las opciones son los textos de todos los pares
    if (usePairsStructure) {
      return (currentItems as Array<{ text: string }>)
        .map((pair) => pair.text)
        .sort(() => Math.random() - 0.5);
    }

    // 1. Obtener la respuesta correcta actual
    const currentItemData = currentItems[currentItem] as {
      audio: string;
      correctMatch: string;
    };
    const currentItemId = currentItemData.correctMatch;
    const correctVocabularyItem = vocabulary.find(
      (item) => item.id === currentItemId,
    );

    if (!correctVocabularyItem) {
      console.error(`No se encontró el ítem con id: ${currentItemId}`);
      return [];
    }

    // 2. Obtener TODAS las posibles opciones del vocabulario que tengan imagen o palabra
    // Excluimos la correcta para manejarla por separado
    const allPotentialDistractors = vocabulary.filter(
      (item) => item.id !== currentItemId && (item.media?.image || item.word),
    );

    // 3. Mezclar distractores y tomar 3
    const selectedDistractors = [...allPotentialDistractors]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // 4. Combinar la correcta con los distractores y volver a mezclar
    return [correctVocabularyItem, ...selectedDistractors].sort(
      () => Math.random() - 0.5,
    );
  }, [vocabulary, currentItems, currentItem, usePairsStructure]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!currentItems || currentItems.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Configuración de audio no válida</Text>
        <TouchableOpacity style={styles.continueButton} onPress={onComplete}>
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const playSound = async (audioUri: string) => {
    if (!audioUri) return;
    try {
      // Si ya hay un sonido cargado, lo liberamos antes de poner el nuevo
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        // Eliminamos 'onPlaybackStatusUpdate' porque no está definido
      );

      setSound(newSound);
      setHasPlayedFirstAudio(true);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const handleSelect = (selectedId: string) => {
    // Bloquear si ya está completado o si hay una animación de éxito/error activa
    if (isExerciseCompleted || selectedOption !== null) return;

    setSelectedOption(selectedId);
    setAttempts((prev) => prev + 1);

    let isCorrect = false;

    if (usePairsStructure) {
      const currentPair = currentItems[currentItem] as {
        audio: string;
        text: string;
        image?: string;
      };
      isCorrect = selectedId === currentPair.text;
    } else {
      const currentItemData = currentItems[currentItem] as {
        audio: string;
        correctMatch: string;
      };
      isCorrect = selectedId === currentItemData.correctMatch;
    }

    if (isCorrect) {
      setShowSuccess(true);
      setShowError(false);

      setCompletedAnswers((prev) => ({
        ...prev,
        [currentItem]: selectedId,
      }));

      if (currentItem < currentItems.length - 1) {
        setTimeout(() => {
          setCurrentItem((prev) => prev + 1);
          setSelectedOption(null);
          setAttempts(0);
          setShowHint(false);
          setShowSuccess(false);
        }, 1000);
      } else {
        setIsExerciseCompleted(true);
        setShowCompletion(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } else {
      setShowError(true);
      setShowSuccess(false);

      // --- CAMBIO CLAVE AQUÍ ---
      // Después de 1 segundo, limpiamos la selección incorrecta para dejar al usuario intentar de nuevo
      setTimeout(() => {
        setSelectedOption(null);
        setShowError(false);

        if (
          config.options?.attemptsBeforeHint &&
          attempts >= config.options.attemptsBeforeHint - 1
        ) {
          setShowHint(true);
        }
      }, 1000);
    }
  };

  const getCurrentAudio = (): string => {
    if (usePairsStructure) {
      const currentPair = currentItems[currentItem] as {
        audio: string;
        text: string;
        image?: string;
      };
      return currentPair.audio;
    } else {
      const currentItemData = currentItems[currentItem] as {
        audio: string;
        correctMatch: string;
      };
      return currentItemData.audio;
    }
  };

  const getHintText = (): string => {
    if (usePairsStructure) {
      const currentPair = currentItems[currentItem] as {
        audio: string;
        text: string;
        image?: string;
      };
      return currentPair.text;
    } else {
      const currentItemData = currentItems[currentItem] as {
        audio: string;
        correctMatch: string;
      };
      const currentItemId = currentItemData.correctMatch;
      return vocabulary.find((v) => v.id === currentItemId)?.word || "";
    }
  };

  const isOptionCorrect = (option: string | any): boolean => {
    if (usePairsStructure) {
      const currentPair = currentItems[currentItem] as {
        audio: string;
        text: string;
        image?: string;
      };
      return option === currentPair.text;
    } else {
      const currentItemData = currentItems[currentItem] as {
        audio: string;
        correctMatch: string;
      };
      const optionId = (option as any).id;
      return optionId === currentItemData.correctMatch;
    }
  };

  const getOptionId = (option: string | any): string => {
    return usePairsStructure ? (option as string) : (option as any).id;
  };

  const getOptionText = (option: string | any): string => {
    return usePairsStructure ? (option as string) : (option as any).word;
  };

  const getOptionImage = (option: string | any): string | undefined => {
    return usePairsStructure ? undefined : (option as any).media?.image;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escucha y selecciona</Text>

      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playSound(getCurrentAudio())}
      >
        <Text style={styles.playButtonText}>🔊 Reproducir Audio</Text>
      </TouchableOpacity>

      {showHint && <Text style={styles.hint}>Pista: {getHintText()}</Text>}

      <View style={styles.optionsGrid}>
        {options.map((option, index) => {
          const optionId = getOptionId(option);
          const optionText = getOptionText(option);
          const optionImage = getOptionImage(option);
          const isCorrectOption = isOptionCorrect(option);

          return (
            <TouchableOpacity
              key={usePairsStructure ? `${option}-${index}` : optionId}
              style={[
                styles.optionCard,
                selectedOption === optionId && styles.selectedOption,
                selectedOption === optionId &&
                  isCorrectOption &&
                  styles.correctOption,
                selectedOption === optionId &&
                  selectedOption !== null &&
                  !isCorrectOption &&
                  styles.incorrectOption,
              ]}
              onPress={() => handleSelect(optionId)}
              disabled={selectedOption !== null}
            >
              {optionImage ? (
                <Image
                  source={{ uri: optionImage }}
                  style={styles.optionImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.textOption}>
                  <Text style={styles.optionText}>{optionText}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.progress}>
        {currentItem + 1}/{currentItems.length}
      </Text>

      {/* Usar ExerciseFeedback para los mensajes */}
      <ExerciseFeedback
        visible={showSuccess}
        message="¡Correcto! 🎉"
        type="success"
      />

      <ExerciseFeedback
        visible={showError}
        message="Inténtalo de nuevo"
        type="error"
      />

      {currentItem === currentItems.length - 1 && showSuccess && (
        <ExerciseFeedback
          visible={showSuccess}
          message="¡Ejercicio completado con éxito!"
          type="success"
        />
      )}

      <CompletionMessage
        visible={showCompletion}
        type="perfect"
        duration={1200}
        onHide={() => setShowCompletion(false)}
      />
    </View>
  );
};

// Estilos (los mismos que antes)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
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
  playButton: {
    backgroundColor: "#F0F0F0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  hint: {
    backgroundColor: "#FFF3CD",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    textAlign: "center",
    color: "#856404",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    width: 150,
    height: 100,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E9ECEF",
  },
  selectedOption: {
    borderColor: "#007AFF",
  },
  correctOption: {
    borderColor: "#28A745",
    backgroundColor: "#D4EDDA",
  },
  incorrectOption: {
    borderColor: "#DC3545",
    backgroundColor: "#F8D7DA",
  },
  optionImage: {
    width: 80,
    height: 80,
  },
  textOption: {
    padding: 10,
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
  },
  progress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
});

export default AudioMatchingGame;
