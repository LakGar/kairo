import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockCommitment } from "@/src/features/home/home.mock";
import type { HomePalette } from "@/src/features/home/home-tokens";
import { useHomeColors } from "@/src/features/home/home-theme";

type Props = {
  item: MockCommitment;
  onPress: () => void;
};

type Tone = "success" | "danger" | "muted" | "secondary";

function toneFromCommitmentStatus(status?: string): Tone {
  switch (status) {
    case "FULLY_VERIFIED":
      return "success";
    case "PROOF_REJECTED":
    case "PROOF_MISSING":
    case "PROOF_PENDING":
      return "danger";
    case "NO_SCORE_IMPACT":
    case "UPCOMING":
      return "muted";
    case "WAITING_RESULT":
    case "RESULT_CONFIRMED":
      return "secondary";
    default:
      return "muted";
  }
}

function colorForTone(c: HomePalette, tone: Tone): string {
  switch (tone) {
    case "success":
      return c.success;
    case "danger":
      return c.danger;
    case "secondary":
      return c.textSecondary;
    default:
      return c.textMuted;
  }
}

export function CommitmentListItem({ item, onPress }: Props) {
  const c = useHomeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const tone = toneFromCommitmentStatus(item.commitmentStatus);
  const statusColor = colorForTone(c, tone);
  const impactTone: Tone =
    item.commitmentStatus === "FULLY_VERIFIED"
      ? "success"
      : item.commitmentStatus === "PROOF_REJECTED" ||
          item.commitmentStatus === "PROOF_MISSING" ||
          item.commitmentStatus === "PROOF_PENDING"
        ? "danger"
        : "muted";
  const impactColor = colorForTone(c, impactTone);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.body}>
        {item.organizerLine ? (
          <Text style={styles.orgLine} numberOfLines={1}>
            {item.organizerLine}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={c.textMuted} />
          <Text style={styles.rowText} numberOfLines={1}>
            {item.timeLabel}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={c.textMuted} />
          <Text style={styles.rowText} numberOfLines={2}>
            {item.locationLabel}
          </Text>
        </View>
        <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
        <Text style={[styles.impact, { color: impactColor }]}>{item.scoreImpact}</Text>
      </View>
    </Pressable>
  );
}

const THUMB = 96;

function makeStyles(c: HomePalette) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 2,
      minHeight: THUMB + 8,
      backgroundColor: "transparent",
    },
    pressed: {
      opacity: 0.85,
    },
    thumbWrap: {
      width: THUMB,
      height: THUMB,
      borderRadius: 12,
      overflow: "hidden",
      flexShrink: 0,
    },
    thumb: {
      width: THUMB,
      height: THUMB,
    },
    rolePill: {
      position: "absolute",
      left: 8,
      bottom: 8,
      maxWidth: THUMB - 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: c.pillBackground,
    },
    rolePillText: {
      color: c.pillText,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
      textTransform: "uppercase",
      textAlign: "center",
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 4,
      justifyContent: "center",
    },
    orgLine: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    title: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: -0.3,
      lineHeight: 21,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      marginTop: 2,
    },
    rowText: {
      flex: 1,
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    status: {
      fontSize: 13,
      fontWeight: "700",
      marginTop: 4,
      lineHeight: 18,
    },
    impact: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
      lineHeight: 17,
    },
  });
}
