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
        <Image
          source={{ uri: action.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(11,15,20,0.15)", "rgba(11,15,20,0.55)", "rgba(11,15,20,0.88)"]}
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
          <Ionicons name="camera-outline" size={18} color={HomeColors.black} />
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
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: HomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  imageWrap: {
    height: 188,
    width: "100%",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageText: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    gap: 6,
  },
  kicker: {
    color: HomeColors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headline: {
    color: HomeColors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 26,
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
    backgroundColor: HomeColors.cardLight,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: HomeColors.white,
    paddingVertical: 13,
    borderRadius: 12,
  },
  btnPrimaryLabel: {
    color: HomeColors.black,
    fontSize: 15,
    fontWeight: "800",
  },
  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    backgroundColor: "transparent",
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
