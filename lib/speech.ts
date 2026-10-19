// Pronunciación de palabras y frases en inglés.
// Si el contenido trae un audio grabado (media.audio) se usa ese;
// si no, la voz del dispositivo (expo-speech; en web, Web Speech API).
//
// Safari de iOS solo deja hablar/reproducir si la llamada ocurre durante el
// toque del usuario: por eso Speech.speak se llama sin ningún await antes.
import { Audio } from "expo-av";
import * as Speech from "expo-speech";

let currentSound: Audio.Sound | null = null;

export const stopSpeaking = () => {
  Speech.stop();
  if (currentSound) {
    const sound = currentSound;
    currentSound = null;
    sound.unloadAsync().catch(() => {});
  }
};

const speakWithVoice = (text: string) =>
  new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: "en-US",
      rate: 0.85,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });

const playRecording = async (audioUrl: string) => {
  const { sound } = await Audio.Sound.createAsync(
    { uri: audioUrl },
    { shouldPlay: true },
  );
  currentSound = sound;
  await new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded || status.didJustFinish) resolve();
    });
  });
  if (currentSound === sound) stopSpeaking();
};

/** Reproduce el texto. Resuelve cuando termina (o falla). */
export const speakEnglish = async (text: string, audioUrl?: string) => {
  stopSpeaking();

  if (audioUrl) {
    try {
      await playRecording(audioUrl);
      return;
    } catch {
      // si el audio grabado falla, se usa la voz del dispositivo
    }
  }

  await speakWithVoice(text);
};
