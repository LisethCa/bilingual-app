// Video de la lección (content.video = { url, poster }).
// En web usa <video> nativo con preload="none": no descarga nada hasta que el alumno
// toca play, así no se gasta ancho de banda de Cloudinary en quien no lo mira.
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export type LessonVideoData = { url: string; poster?: string };

export default function LessonVideo({ video }: { video: LessonVideoData }) {
  return (
    <View style={styles.frame}>
      {Platform.OS === "web" ? (
        <video
          src={video.url}
          poster={video.poster}
          controls
          playsInline
          preload="none"
          controlsList="nodownload"
          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
        />
      ) : (
        <Video
          source={{ uri: video.url }}
          posterSource={video.poster ? { uri: video.poster } : undefined}
          usePoster={!!video.poster}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // los videos son verticales (9:16); en pantallas anchas no pasan de 380px
  frame: {
    width: "100%",
    maxWidth: 380,
    aspectRatio: 9 / 16,
    alignSelf: "center",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
});
