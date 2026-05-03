/**
 * Pending invites UI — belongs in **Notifications**, not on Home.
 * TODO: Mount this (or a variant) on `/(tabs)/notifications` when the inbox is wired.
 * Mock rows remain in `home.mock.ts` as `MOCK_INVITES` for that screen.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MockInvite } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  invites: MockInvite[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

export function InvitesCard({ invites, onAccept, onDecline }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pending invites</Text>
      <View style={styles.list}>
        {invites.map((inv) => (
          <View key={inv.id} style={styles.row}>
            <Text style={styles.inviteText} numberOfLines={2}>
              {inv.title}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => onAccept(inv.id)}
                style={({ pressed }) => [styles.accept, pressed && styles.pressed]}
              >
                <Text style={styles.acceptLabel}>Accept</Text>
              </Pressable>
              <Pressable
                onPress={() => onDecline(inv.id)}
                style={({ pressed }) => [styles.decline, pressed && styles.pressed]}
              >
                <Text style={styles.declineLabel}>Decline</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: HomeColors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    gap: 14,
  },
  title: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  list: {
    gap: 14,
  },
  row: {
    gap: 10,
  },
  inviteText: {
    color: HomeColors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  accept: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: HomeColors.cardLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  acceptLabel: {
    color: HomeColors.success,
    fontSize: 14,
    fontWeight: "800",
  },
  decline: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
  },
  declineLabel: {
    color: HomeColors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
