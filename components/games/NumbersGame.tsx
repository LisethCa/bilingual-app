import { Audio } from "expo-av";
import { showCharacterCorrect, showCharacterWrong } from "@/lib/characters";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface VocabularyItem {
  word: string;
  translation: string;
  image: string;
  examples: string[];
}

interface NumbersGameProps {
  vocabulary: VocabularyItem[];
  range?: [number, number];
  imageBaseUrl?: string;
  onComplete: () => void;
}

const NUMBER_WORDS: Record<string, string> = {
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
  "11": "eleven",
  "12": "twelve",
  "13": "thirteen",
  "14": "fourteen",
  "15": "fifteen",
  "16": "sixteen",
  "17": "seventeen",
  "18": "eighteen",
  "19": "nineteen",
  "20": "twenty",
};

const NumbersGame: React.FC<NumbersGameProps> = ({
  vocabulary,
  range = [1, 20],
  imageBaseUrl = "",
  onComplete,
}) => {
  // Estados
  const [currentMode, setCurrentMode] = useState<
    "listen_match" | "write_number" | "count_objects"
  >("listen_match");
  const [currentNumber, setCurrentNumber] = useState<VocabularyItem | null>(
    null
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mapeo de números a audios
  const NUMBER_AUDIO_MAP = useMemo(() => {
    const map: Record<string, string> = {};
    for (let i = range[0]; i <= range[1]; i++) {
      const numWord = NUMBER_WORDS[i.toString()];
      if (numWord) {
        map[
          numWord
        ] = `https://res.cloudinary.com/dltwwat1r/video/upload/v1754923099/one_kiffw0.mp3`;
      }
    }
    return map;
  }, [range]);

  // Filtrar y ordenar números en el rango especificado
  const numbersInRange = useMemo(() => {
    return vocabulary
      .filter((item) => {
        const numStr = Object.keys(NUMBER_WORDS).find(
          (key) => NUMBER_WORDS[key] === item.word.toLowerCase()
        );
        if (!numStr) return false;
        const num = parseInt(numStr);
        return num >= range[0] && num <= range[1];
      })
      .sort((a, b) => {
        const numA = parseInt(
          Object.keys(NUMBER_WORDS).find(
            (key) => NUMBER_WORDS[key] === a.word.toLowerCase()
          ) || "0"
        );
        const numB = parseInt(
          Object.keys(NUMBER_WORDS).find(
            (key) => NUMBER_WORDS[key] === b.word.toLowerCase()
          ) || "0"
        );
        return numA - numB;
      });
  }, [vocabulary, range]);

  // Iniciar nuevo problema
  const newProblem = useCallback(() => {
    if (numbersInRange.length === 0) {
      console.error("No hay números disponibles en el rango especificado");
      return null;
    }

    const randomNum =
      numbersInRange[Math.floor(Math.random() * numbersInRange.length)];
    setCurrentNumber(randomNum);
    setUserAnswer("");
    setFeedback("");
    console.log("Nuevo problema:", randomNum.word);
    return randomNum;
  }, [numbersInRange]);

  // Reproducir audio del número
  const playNumberAudio = useCallback(
    async (numWord: string) => {
      try {
        console.log(`Intentando reproducir: ${numWord.toLowerCase()}`);

        // 1. Detener y limpiar sonido anterior
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }

        // 2. Configurar modo de audio
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // 3. Obtener URL del audio
        const audioUrl = NUMBER_AUDIO_MAP[numWord.toLowerCase()];
        if (!audioUrl) {
          Alert.alert("Error", `No hay audio disponible para: ${numWord}`);
          return;
        }

        console.log(`Reproduciendo desde: ${audioUrl}`);

        // 4. Cargar y reproducir (sin el callback)
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );

        setSound(newSound);

        // 5. Manejar eventos
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return; // aquí TS ya sabe que es AVPlaybackStatusSuccess

          if (status.didJustFinish) {
            newSound.unloadAsync();
          }
        });
      } catch (error) {
        console.error("Error en playNumberAudio:", error);
        Alert.alert("Error", "No se pudo reproducir el audio");
      }
    },
    [sound, NUMBER_AUDIO_MAP]
  );

  // Efecto inicial
  useEffect(() => {
    const initialize = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      newProblem();
      setIsLoading(false);
    };

    initialize();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Verificar respuesta
  const checkAnswer = useCallback(
    (answer: string) => {
      if (!currentNumber) return;

      let isCorrect = false;

      switch (currentMode) {
        case "listen_match":
          isCorrect = answer === currentNumber.word;
          break;
        case "write_number":
          isCorrect = answer.toLowerCase() === currentNumber.word.toLowerCase();
          break;
        case "count_objects":
          const numKey = Object.keys(NUMBER_WORDS).find(
            (key) => NUMBER_WORDS[key] === currentNumber.word.toLowerCase()
          );
          isCorrect = numKey ? parseInt(answer) === parseInt(numKey) : false;
          break;
      }

      if (isCorrect) {
        showCharacterCorrect();
        setScore((prev) => prev + 1);
        setFeedback("¡Correcto!");
        setTimeout(() => {
          if (score + 1 >= 5) {
            onComplete();
          } else {
            newProblem();
          }
        }, 1000);
      } else {
        showCharacterWrong({ answer: currentNumber.word });
        setFeedback("Intenta de nuevo");
      }
    },
    [currentNumber, currentMode, score, newProblem, onComplete]
  );

  // Renderizar según el modo actual
  const renderExercise = () => {
    if (!currentNumber) {
      return (
        <View style={styles.errorContainer}>
          <Text>No se pudo cargar el ejercicio actual</Text>
        </View>
      );
    }

    switch (currentMode) {
      case "listen_match":
        return (
          <View style={styles.modeContainer}>
            <Text style={styles.instructions}>
              Escucha y selecciona el número correcto
            </Text>
            <TouchableOpacity
              style={styles.listenButton}
              onPress={() => playNumberAudio(currentNumber.word)}
            >
              <Text>🔊 Reproducir</Text>
            </TouchableOpacity>

            <View style={styles.optionsGrid}>
              {numbersInRange.slice(0, 6).map((num, index) => (
                <TouchableOpacity
                  key={`${num.word}-${index}`}
                  style={styles.numberOption}
                  onPress={() => checkAnswer(num.word)}
                >
                  <Text>{num.word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case "write_number":
        return (
          <View style={styles.modeContainer}>
            <Text style={styles.instructions}>
              Escribe este número en inglés:
            </Text>
            <Image
              source={{ uri: currentNumber.image }}
              style={styles.numberImage}
            />
            <TextInput
              style={styles.input}
              value={userAnswer}
              onChangeText={setUserAnswer}
              onSubmitEditing={() => checkAnswer(userAnswer)}
              placeholder="Escribe el número"
              autoCapitalize="none"
            />
          </View>
        );

      case "count_objects":
        const numKey = Object.keys(NUMBER_WORDS).find(
          (key) => NUMBER_WORDS[key] === currentNumber.word.toLowerCase()
        );
        const objectCount = numKey ? parseInt(numKey) : 0;

        return (
          <View style={styles.modeContainer}>
            <Text style={styles.instructions}>Cuenta los objetos:</Text>
            <View style={styles.objectsContainer}>
              {[...Array(objectCount)].map((_, i) => (
                <Image
                  key={i}
                  source={{ uri: imageBaseUrl || currentNumber.image }}
                  style={styles.objectImage}
                />
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={userAnswer}
              onChangeText={setUserAnswer}
              onSubmitEditing={() => checkAnswer(userAnswer)}
              placeholder="¿Cuántos hay?"
              keyboardType="numeric"
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  if (numbersInRange.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text>
          No hay números disponibles entre {range[0]} y {range[1]}
        </Text>
        <Text>
          Vocabulario recibido: {JSON.stringify(vocabulary.map((v) => v.word))}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Práctica de Números {range[0]}-{range[1]}
      </Text>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            currentMode === "listen_match" && styles.activeMode,
          ]}
          onPress={() => setCurrentMode("listen_match")}
        >
          <Text>Escuchar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            currentMode === "write_number" && styles.activeMode,
          ]}
          onPress={() => setCurrentMode("write_number")}
        >
          <Text>Escribir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            currentMode === "count_objects" && styles.activeMode,
          ]}
          onPress={() => setCurrentMode("count_objects")}
        >
          <Text>Contar</Text>
        </TouchableOpacity>
      </View>

      {renderExercise()}

      {feedback ? (
        <Text
          style={[
            styles.feedback,
            feedback === "¡Correcto!"
              ? styles.correctFeedback
              : styles.incorrectFeedback,
          ]}
        >
          {feedback}
        </Text>
      ) : null}

      <Text style={styles.score}>Puntuación: {score}/5</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  loader: {
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  modeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  modeButton: {
    padding: 10,
    borderRadius: 5,
  },
  activeMode: {
    backgroundColor: "#bbdefb",
  },
  modeContainer: {
    marginBottom: 20,
  },
  instructions: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#444",
  },
  listenButton: {
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  numberOption: {
    width: "30%",
    margin: 5,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    alignItems: "center",
  },
  numberImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginVertical: 15,
  },
  objectsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 15,
  },
  objectImage: {
    width: 50,
    height: 50,
    margin: 5,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginTop: 10,
  },
  feedback: {
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  correctFeedback: {
    color: "green",
  },
  incorrectFeedback: {
    color: "#9C2F5B",
  },
  score: {
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default NumbersGame;
