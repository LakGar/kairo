import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockCommitment } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  item: MockCommitment;
  width: number;
  onPress: () => void;
};

function statusColor(status: MockCommitment["status"]): string {
  switch (status) {
    case "Verified":
      return HomeColors.success;
    case "Needs proof":
      return HomeColors.warning;
    case "Waiting approval":
      return HomeColors.accent;
    default:
      return HomeColors.textSecondary;
  }
}

export function CommitmentCard({ item, width, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageBox}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(11,15,20,0.92)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badgeRole}>
          <Text style={styles.badgeRoleText}>{item.role}</Text>
        </View>
        <View style={styles.bottom}>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <Text style={styles.date}>{item.dateTimeLabel}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
        <Text numberOfLines={1} style={styles.status}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.impact}>{item.scoreImpact}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: HomeColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.surfaceStrong,
    marginRight: 12,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageBox: {
    height: 132,
    width: "100%",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeRole: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(11,15,20,0.65)",
  },
  badgeRoleText: {
    color: HomeColors.textPrimary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  bottom: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    gap: 4,
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  date: {
    color: HomeColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  status: {
    flex: 1,
    color: HomeColors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  impact: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    color: HomeColors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
});
