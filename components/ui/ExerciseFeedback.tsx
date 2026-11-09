// components/ExerciseFeedback.tsx
import React from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

type ExerciseFeedbackProps = {
  visible: boolean;
  message: string;
  type: "success" | "error";
};

const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({
  visible,
  message,
  type,
}) => {
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      animation.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        type === "success" ? styles.success : styles.error,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={[styles.text, type === "error" && styles.errorText]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    backgroundColor: "#4CAF50",
  },
  // error: fucsia suave de la marca (sin rojo); texto oscuro para contraste
  error: {
    backgroundColor: "#FCEAF1",
    borderWidth: 2,
    borderColor: "#D16587",
  },
  errorText: {
    color: "#9C2F5B",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ExerciseFeedback;
