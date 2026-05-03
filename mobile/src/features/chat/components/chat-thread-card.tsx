import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ChatThread } from "@/src/features/chat/chat.types";
import { HomeColors } from "@/src/features/home/home-tokens";

const CATEGORY_LABEL: Record<ChatThread["category"], string> = {
  events: "Event",
  teams: "Team",
  proof: "Proof",
  dms: "DM",
  announcements: "Announce",
};

type Props = {
  thread: ChatThread;
  onPress: () => void;
};

export function ChatThreadCard({ thread, onPress }: Props) {
  const isEvent = thread.category === "events";
  const showBadge = thread.unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${thread.title}, ${CATEGORY_LABEL[thread.category]}`}
    >
      <View style={styles.avatarSlot}>
        <View
          style={[
            styles.avatarWrap,
            isEvent ? styles.avatarRoundedSquare : styles.avatarCircle,
          ]}
        >
          {thread.avatarUrl ? (
            <Image
              source={{ uri: thread.avatarUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <View style={[styles.avatarFallback, isEvent && styles.avatarFallbackSq]}>
              <Text style={styles.avatarInitial}>{thread.title.charAt(0)}</Text>
            </View>
          )}
        </View>
        {thread.isOnline ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {thread.title}
          </Text>
          <Text style={styles.time}>{thread.time}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{CATEGORY_LABEL[thread.category]}</Text>
          </View>
          {thread.eventLabel ? (
            <Text style={styles.eventLabel} numberOfLines={1}>
              {thread.eventLabel}
            </Text>
          ) : null}
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.preview} numberOfLines={2}>
            {thread.lastMessage}
          </Text>
          {showBadge ? (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadText}>
                {thread.unreadCount > 99 ? "99+" : String(thread.unreadCount)}
              </Text>
            </View>
          ) : (
            <View style={styles.unreadPlaceholder} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const AVATAR = 52;

const styles = StyleSheet.create({
  avatarSlot: {
    position: "relative",
    flexShrink: 0,
  },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: HomeColors.success,
    borderWidth: 2,
    borderColor: HomeColors.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: HomeColors.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    padding: 14,
    marginBottom: 10,
    gap: 14,
  },
  rowPressed: {
    backgroundColor: HomeColors.cardLight,
  },
  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    overflow: "hidden",
  },
  avatarCircle: {
    borderRadius: AVATAR / 2,
  },
  avatarRoundedSquare: {
    borderRadius: 14,
  },
  avatarFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HomeColors.cardLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackSq: {
    borderRadius: 14,
  },
  avatarInitial: {
    color: HomeColors.textMuted,
    fontSize: 20,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    color: HomeColors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  time: {
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  badgeText: {
    color: HomeColors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  eventLabel: {
    flexShrink: 1,
    color: HomeColors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  preview: {
    flex: 1,
    color: HomeColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  unreadPill: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: HomeColors.danger,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  unreadText: {
    color: HomeColors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  unreadPlaceholder: {
    width: 22,
    flexShrink: 0,
  },
});
