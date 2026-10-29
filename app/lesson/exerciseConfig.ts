/**
 * Tipos de ejercicio
 */
interface BaseExercise {
  id: string;
  type: string;
  config: any;
}

export interface Exercise extends BaseExercise {
  title?: string;
  [key: string]: any;
}

/**
 * Transforma la configuración de ejercicio según su tipo
 * Centraliza la lógica de normalización para cada tipo de ejercicio
 */
export const normalizeExerciseConfig = (
  exercise: Exercise,
  lessonContent: any,
): Exercise => {
  const baseConfig = {
    id: exercise.id,
    type: exercise.type,
  };

  switch (exercise.type) {
    case "audio_matching":
      return {
        ...baseConfig,
        config: exercise.config || {
          mode: "audio_to_image",
        },
      };

    case "pronunciation":
      return {
        ...baseConfig,
        config: {
          phrase: exercise.phrase || exercise.config?.phrase,
          translation: exercise.translation || exercise.config?.translation,
          audioUrl: exercise.audioUrl || exercise.config?.audioUrl,
        },
      };

    case "conjugation":
      const rawConfig = exercise.config || {};
      const tenses = rawConfig.tenses || ["Present"];
      let normalizedCorrect = rawConfig.correct || {};
      const firstTense = tenses[0];
      const isFlatStructure =
        rawConfig.correct && !rawConfig.correct[firstTense];

      if (isFlatStructure) {
        normalizedCorrect = {
          [firstTense]: rawConfig.correct,
        };
      }

      return {
        ...baseConfig,
        config: {
          ...rawConfig,
          correct: normalizedCorrect,
          pronouns: rawConfig.pronouns || [],
          exerciseType: rawConfig.verb ? "verb" : "reflexive",
          tenses: tenses,
        },
      };

    case "sentence_formation":
      return {
        ...baseConfig,
        config: exercise.config
          ? { ...exercise.config, title: exercise.title }
          : {
              wordBank: exercise.words || [],
              correctAnswers: [exercise.correct],
              requiredWords: exercise.required,
              timeLimit: exercise.timeLimit || 0,
              title: exercise.title,
            },
      };

    case "numbers_game":
      return {
        ...baseConfig,
        config: {
          vocabulary: lessonContent.vocabulary || [],
          range: exercise.options?.range || [1, 20],
          imageBaseUrl: exercise.options?.imageBaseUrl || "",
        },
      };

    case "drag_drop":
      return {
        ...baseConfig,
        config: {
          dragItems:
            exercise.config?.pairs?.map((pair: any) => ({
              id: pair.id || `drag-${Math.random().toString(36).substr(2, 9)}`,
              content: pair.from,
            })) || [],
          dropZones:
            exercise.config?.pairs?.map((pair: any) => ({
              id: pair.id || `zone-${Math.random().toString(36).substr(2, 9)}`,
              content: pair.to,
              correctMatch:
                pair.id || `drag-${Math.random().toString(36).substr(2, 9)}`,
            })) || [],
          instructions:
            exercise.instructions ||
            exercise.config?.question ||
            exercise.question ||
            "Arrastra cada elemento a su posición correcta",
          question: exercise.title || "Completa las oraciones",
        },
      };

    case "memory_game":
      return {
        ...baseConfig,
        config: {
          pairs: exercise.pairs,
          ...exercise.config,
        },
      };

    case "matching":
      return {
        ...baseConfig,
        config: {
          pairs: exercise.config?.pairs || exercise.pairs,
          vocabulary: lessonContent.vocabulary,
          title: exercise.title,
        },
      };

    case "image_selection":
      return {
        ...baseConfig,
        config: {
          question: exercise.question,
          options: (exercise.options || []).map((opt: any) => ({
            image: opt.image,
            correct: opt.correct || opt.isCorrect || false,
            feedback: opt.feedback,
          })),
          multipleSelection: exercise.multipleSelection || false,
          ...exercise.config,
        },
      };

    case "listening_transcription":
      return {
        ...baseConfig,
        config: exercise.config || {},
      };

    case "vocabulary":
      return {
        ...baseConfig,
        config: {
          categories: exercise.categories || exercise.config?.categories || [],
          items: exercise.items || exercise.config?.items || [],
          title: exercise.title,
        },
      };

    case "map_interactive":
      return {
        ...baseConfig,
        config: exercise.config || {},
      };

    case "calendar_planner":
      return {
        ...baseConfig,
        config: exercise.config || {},
      };

    case "dialogue_simulation":
      return {
        ...baseConfig,
        config: exercise.config || {},
      };

    default:
      return {
        ...baseConfig,
        config: exercise.config || {},
      };
  }
};

/**
 * Validar si un ejercicio tiene la configuración necesaria
 */
export const isExerciseConfigValid = (exercise: Exercise): boolean => {
  const requiresConfig = [
    "audio_matching",
    "drag_drop",
    "image_selection",
    "listening_transcription",
  ];
  if (requiresConfig.includes(exercise.type)) {
    return !!exercise.config;
  }
  return true;
};
