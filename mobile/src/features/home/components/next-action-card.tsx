import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockNextAction } from "@/src/features/home/home.mock";
import type { HomePalette } from "@/src/features/home/home-tokens";
import { useHomeColors } from "@/src/features/home/home-theme";

type Props = {
  action: MockNextAction;
  onSubmitProof: () => void;
  onViewEvent: () => void;
};

export function NextActionCard({ action, onSubmitProof, onViewEvent }: Props) {
  const c = useHomeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const isReview = action.apiActionType === "REVIEW_PROOF";
  const primaryLabel = isReview ? "Review proof" : "Submit proof";
  const primaryIcon = (isReview ? "clipboard-outline" : "camera-outline") as keyof typeof Ionicons.glyphMap;
  const primaryDisabled = !action.eventIdPlaceholder?.trim();
  const overlayColors = useMemo(
    () =>
      c.bg === "#000000"
        ? (["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.88)"] as const)
        : (["rgba(0,0,0,0.05)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.72)"] as const),
    [c.bg],
  );
  const onImage = "#FFFFFF";

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: action.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={[overlayColors[0], overlayColors[1], overlayColors[2]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.imageText}>
          <Text style={[styles.kicker, { color: "rgba(255,255,255,0.82)" }]}>
            {action.eventTitle}
          </Text>
          <Text style={[styles.headline, { color: onImage }]}>{action.headline}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={[styles.meta, { color: "rgba(255,255,255,0.9)" }]}>
              {action.dateTimeLabel}
            </Text>
          </View>
          <Text style={[styles.detail, { color: "rgba(255,255,255,0.75)" }]}>
            {action.actionDetail}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onSubmitProof}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && !primaryDisabled && styles.pressed,
            primaryDisabled && styles.btnPrimaryDisabled,
          ]}
        >
          <Ionicons name={primaryIcon} size={18} color={primaryDisabled ? c.textMuted : c.black} />
          <Text
            style={[
              styles.btnPrimaryLabel,
              primaryDisabled && { color: c.textMuted },
            ]}
          >
            {primaryLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onViewEvent}
          style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
        >
          <Text style={styles.btnGhostLabel}>View Event</Text>
          <Ionicons name="chevron-forward" size={18} color={c.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: HomePalette) {
  return StyleSheet.create({
    card: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: c.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
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
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    headline: {
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
      fontSize: 14,
      fontWeight: "600",
    },
    detail: {
      fontSize: 13,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      padding: 14,
      backgroundColor: c.cardLight,
    },
    btnPrimary: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.white,
      paddingVertical: 13,
      borderRadius: 12,
    },
    btnPrimaryDisabled: {
      opacity: 0.45,
    },
    btnPrimaryLabel: {
      color: c.black,
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
      borderColor: c.border,
      backgroundColor: "transparent",
    },
    btnGhostLabel: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
  });
}
