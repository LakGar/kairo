import { StyleSheet, Text, View } from "react-native";

import { CommitmentListItem } from "@/src/features/home/components/commitment-list-item";
import type { MockCommitment } from "@/src/features/home/home.mock";
import { HomeColors } from "@/src/features/home/home-tokens";

type Props = {
  commitments: MockCommitment[];
  onOpenCommitment: (item: MockCommitment) => void;
};

export function CommitmentList({ commitments, onOpenCommitment }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your commitments</Text>
      <View style={styles.list}>
        {commitments.map((c) => (
          <CommitmentListItem key={c.id} item={c} onPress={() => onOpenCommitment(c)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: HomeColors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    paddingHorizontal: 2,
  },
  list: {
    gap: 12,
  },
});
