import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockNextAction } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  action: MockNextAction;
  onSubmitProof: () => void;
  onViewEvent: () => void;
};

export function NextActionCard({ action, onSubmitProof, onViewEvent }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {/* TODO: replace with event cover from API */}
        <Image
          source={{ uri: action.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(11,15,20,0.5)", HomeColors.bg]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.imageText}>
          <Text style={styles.kicker}>{action.eventTitle}</Text>
          <Text style={styles.headline}>{action.headline}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={HomeColors.textSecondary} />
            <Text style={styles.meta}>{action.dateTimeLabel}</Text>
          </View>
          <Text style={styles.detail}>{action.actionDetail}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onSubmitProof}
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
        >
          <Ionicons name="camera-outline" size={18} color={HomeColors.bg} />
          <Text style={styles.btnPrimaryLabel}>Submit Proof</Text>
        </Pressable>
        <Pressable
          onPress={onViewEvent}
          style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
        >
          <Text style={styles.btnGhostLabel}>View Event</Text>
          <Ionicons name="chevron-forward" size={18} color={HomeColors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
  },
  imageWrap: {
    height: 200,
    width: "100%",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageText: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    gap: 6,
  },
  kicker: {
    color: HomeColors.warning,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  headline: {
    color: HomeColors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  meta: {
    color: HomeColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  detail: {
    color: HomeColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: HomeColors.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnPrimaryLabel: {
    color: HomeColors.bg,
    fontSize: 15,
    fontWeight: "800",
  },
  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
  },
  btnGhostLabel: {
    color: HomeColors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
