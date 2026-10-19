import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { feedbackCorrect, feedbackWrong } from "@/lib/answerFeedback";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CardType = {
  id: string;
  content: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: string;
  type: "text" | "image"; // Nuevo campo para saber qué tipo de contenido mostrar
};

type PairType =
  | { front: string; back: string; id?: string }
  | { image: string; word: string; id?: string; matchId?: string }
  | { back: string; front: string; id?: string };

type MemoryGameProps = {
  pairs?: PairType[];
  config?: {
    pairs?: PairType[];
    timeLimit?: number;
    maxAttempts?: number;
  };
  onComplete: () => void;
  isCompleted?: boolean;
};

const getPairType = (pair: any): string => {
  if (
    ("front" in pair && "back" in pair) ||
    ("back" in pair && "front" in pair)
  ) {
    // Si el back es una URL, es un par de imagen-texto
    if (
      pair.back &&
      typeof pair.back === "string" &&
      pair.back.startsWith("http")
    ) {
      return "imageText";
    }
    return "textText";
  }
  if ("image" in pair && "word" in pair) {
    return "imageWord";
  }
  return "unknown";
};

export default function MemoryGame({
  pairs: oldFormatPairs,
  config,
  onComplete,
  isCompleted = false,
}: MemoryGameProps) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const effectivePairs = config?.pairs || oldFormatPairs || [];

  useEffect(() => {
    if (effectivePairs.length === 0) return;

    const initialCards: CardType[] = [];

    effectivePairs.forEach((pair, index) => {
      const pairType = getPairType(pair);
      const pairId = (pair as any).id || `pair-${index}`;

      // Función auxiliar para crear la base de la carta
      // Aquí usamos isCompleted para definir el estado inicial
      const createCardBase = (
        id: string,
        content: string,
        type: "text" | "image",
        image?: string
      ): CardType => ({
        id,
        content,
        image,
        type,
        pairId,
        isFlipped: isCompleted, // Si ya está completado, se muestra
        isMatched: isCompleted, // Si ya está completado, no se puede clickear
      });

      switch (pairType) {
        case "imageText":
          const it = pair as { front: string; back: string };
          initialCards.push(createCardBase(`text-${pairId}`, it.front, "text"));
          initialCards.push(
            createCardBase(`image-${pairId}`, it.front, "image", it.back)
          );
          break;

        case "textText":
          const tt = pair as { front: string; back: string };
          initialCards.push(
            createCardBase(`front-${pairId}`, tt.front, "text")
          );
          initialCards.push(createCardBase(`back-${pairId}`, tt.back, "text"));
          break;

        case "imageWord":
          const iw = pair as {
            image: string;
            word: string;
            matchId?: string;
            id?: string;
          };
          const mId = iw.matchId || pairId;
          initialCards.push(
            createCardBase(iw.id || `img-${index}`, iw.word, "image", iw.image)
          );

          const matchingPair = effectivePairs.find(
            (p) => (p as any).id === iw.matchId
          ) as any;
          if (matchingPair) {
            initialCards.push(
              createCardBase(
                matchingPair.id || `word-${index}`,
                matchingPair.word,
                "text",
                matchingPair.image
              )
            );
          }
          break;
      }
    });

    const uniqueCards = initialCards.filter(
      (card, index, array) => index === array.findIndex((c) => c.id === card.id)
    );

    // Solo barajamos si NO está completado
    setCards(isCompleted ? uniqueCards : shuffleArray(uniqueCards));
    setFlippedCards([]);
    setGameCompleted(isCompleted);
  }, [effectivePairs, isCompleted]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleCardPress = (index: number) => {
    if (
      isCompleted || // Bloqueo por prop
      gameCompleted || // Bloqueo por estado local
      cards[index].isFlipped ||
      cards[index].isMatched ||
      flippedCards.length >= 2
    ) {
      return;
    }

    // Segunda carta: avisar acierto/error durante el toque (Safari iOS
    // bloquea el sonido si se reproduce después, desde un efecto)
    if (flippedCards.length === 1) {
      if (cards[flippedCards[0]].pairId === cards[index].pairId) feedbackCorrect();
      else feedbackWrong();
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedCards([...flippedCards, index]);
    setMoves(moves + 1);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstIndex, secondIndex] = flippedCards;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      const isMatch = firstCard.pairId === secondCard.pairId;

      if (isMatch) {
        const newCards = [...cards];
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        setCards(newCards);
        setFlippedCards([]);

        if (newCards.every((card) => card.isMatched)) {
          setGameCompleted(true);
          setShowCompletion(true);
          setTimeout(() => onComplete(), 1500);
        }
      } else {
        // Si no coinciden, esperar antes de voltear hacia atrás
        const timeoutId = setTimeout(() => {
          setCards((prevCards) => {
            const newCards = [...prevCards];
            newCards[firstIndex].isFlipped = false;
            newCards[secondIndex].isFlipped = false;
            return newCards;
          });
          setFlippedCards([]);
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [flippedCards, cards, onComplete]);

  const renderCardContent = (card: CardType) => {
    if (card.type === "image" && card.image) {
      return (
        <Image
          source={{ uri: card.image }}
          style={styles.image}
          resizeMode="cover"
          onError={(e) =>
            console.log("Image loading error:", e.nativeEvent.error)
          }
        />
      );
    } else {
      return <Text style={styles.cardText}>{card.content}</Text>;
    }
  };

  if (effectivePairs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No hay elementos para el juego de memoria
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juego de Memoria</Text>
      {!isCompleted && <Text style={styles.moves}>Movimientos: {moves}</Text>}

      <View style={styles.board}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            onPress={() => handleCardPress(index)}
            style={[
              styles.card,
              card.isFlipped || card.isMatched
                ? styles.cardFlipped
                : styles.cardBack,
              card.isMatched && styles.cardMatched,
              // Opcional: Estilo visual para cartas ya completadas
              isCompleted && { borderColor: "#4CAF50", borderWidth: 2 },
            ]}
            disabled={card.isMatched || isCompleted}
          >
            {card.isFlipped || card.isMatched ? (
              renderCardContent(card)
            ) : (
              <Text style={styles.cardBackText}>?</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <CompletionMessage
        visible={showCompletion}
        type="success"
        duration={1200}
        onHide={() => setShowCompletion(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  moves: {
    fontSize: 16,
    marginBottom: 20,
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  card: {
    width: 100,
    height: 120,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  cardBack: {
    backgroundColor: "#3498db",
  },
  cardFlipped: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  cardMatched: {
    backgroundColor: "#2ecc71",
    borderColor: "#27ae60",
  },
  cardText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  cardBackText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  completionMessage: {
    marginTop: 20,
    alignItems: "center",
  },
  completionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2ecc71",
  },
  movesText: {
    fontSize: 16,
    marginTop: 5,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});
