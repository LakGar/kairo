import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { CommitmentCard } from "@/src/features/home/components/commitment-card";
import type { MockCommitment } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  commitments: MockCommitment[];
  onOpenCommitment: (id: string) => void;
};

export function CommitmentsSection({ commitments, onOpenCommitment }: Props) {
  const { width: screenW } = useWindowDimensions();
  const cardWidth = useMemo(() => Math.min(280, screenW * 0.72), [screenW]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Your commitments</Text>
        <Text style={styles.sectionHint}>Swipe</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {commitments.map((c) => (
          <CommitmentCard
            key={c.id}
            item={c}
            width={cardWidth}
            onPress={() => onOpenCommitment(c.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    gap: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionHint: {
    color: HomeColors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  row: {
    paddingVertical: 4,
    paddingRight: 16,
  },
});
