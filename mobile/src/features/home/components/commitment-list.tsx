import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FeatureEmptyState } from "@/src/components/feature-empty-state";
import { CommitmentListItem } from "@/src/features/home/components/commitment-list-item";
import type { MockCommitment } from "@/src/features/home/home.mock";
import type { HomePalette } from "@/src/features/home/home-tokens";
import { useHomeColors } from "@/src/features/home/home-theme";

type Props = {
  commitments: MockCommitment[];
  onOpenCommitment: (item: MockCommitment) => void;
  /** Shown as a second action when the list is empty (e.g. personal commitment onboarding). */
  onCreatePersonalCommitment?: () => void;
};

export function CommitmentList({
  commitments,
  onOpenCommitment,
  onCreatePersonalCommitment,
}: Props) {
  const router = useRouter();
  const colors = useHomeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your commitments</Text>
      {commitments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <FeatureEmptyState
            icon="flag-outline"
            title="No commitments yet"
            subtitle="Create or join an event to start building your score."
            compact
            primaryAction={{
              label: "Create event",
              onPress: () => router.push("/(tabs)/events/create" as Href),
            }}
            secondaryAction={{
              label: "Browse Discover",
              onPress: () => router.push("/(tabs)/(home)/index" as Href),
            }}
          />
          {onCreatePersonalCommitment ? (
            <Pressable onPress={onCreatePersonalCommitment} style={styles.personalLink}>
              <Text style={styles.personalLinkText}>Set a personal commitment</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          {commitments.map((item) => (
            <CommitmentListItem
              key={item.id}
              item={item}
              onPress={() => onOpenCommitment(item)}
            />
          ))}
        </View>
      )}
      <View style={styles.bottomDivider} />
    </View>
  );
}

function makeStyles(c: HomePalette) {
  return StyleSheet.create({
    section: {
      gap: 12,
    },
    emptyWrap: {
      gap: 4,
    },
    personalLink: {
      alignSelf: "center",
      paddingVertical: 8,
    },
    personalLinkText: {
      color: c.textMuted,
      fontSize: 14,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    sectionTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.4,
      paddingHorizontal: 2,
    },
    list: {
      gap: 0,
    },
    bottomDivider: {
      marginTop: 4,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      alignSelf: "stretch",
    },
  });
}
