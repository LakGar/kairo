import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockCommitment } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  item: MockCommitment;
  onPress: () => void;
};

function statusColor(status: MockCommitment["status"]): string {
  switch (status) {
    case "Verified":
    case "Confirmed":
      return HomeColors.success;
    case "Needs proof":
      return HomeColors.danger;
    default:
      return HomeColors.textSecondary;
  }
}

export function CommitmentListItem({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
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
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color={HomeColors.textMuted} />
          <Text style={styles.rowText} numberOfLines={1}>
            {item.timeLabel}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={HomeColors.textMuted} />
          <Text style={styles.rowText} numberOfLines={2}>
            {item.locationLabel}
          </Text>
        </View>
        <Text style={[styles.status, { color: statusColor(item.status) }]} numberOfLines={1}>
          {item.status}
        </Text>
        <Text style={styles.impact} numberOfLines={1}>
          {item.scoreImpact}
        </Text>
      </View>
    </Pressable>
  );
}

const THUMB = 96;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    minHeight: THUMB + 28,
    borderRadius: 16,
    backgroundColor: HomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
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
    backgroundColor: HomeColors.pillBackground,
  },
  rolePillText: {
    color: HomeColors.pillText,
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
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 2,
  },
  rowText: {
    flex: 1,
    color: HomeColors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  status: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  impact: {
    fontSize: 12,
    fontWeight: "600",
    color: HomeColors.textMuted,
    marginTop: 2,
  },
});
