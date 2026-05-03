import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { ChatCategory } from "@/src/features/chat/chat.types";
import { HomeColors } from "@/src/features/home/home-tokens";

const CHIPS: { id: ChatCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "events", label: "Events" },
  { id: "teams", label: "Teams" },
  { id: "proof", label: "Proof" },
  { id: "dms", label: "DMs" },
  { id: "announcements", label: "Announcements" },
];

type Props = {
  selected: ChatCategory;
  onSelect: (id: ChatCategory) => void;
};

export function ChatCategoryChips({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CHIPS.map((chip) => {
          const active = selected === chip.id;
          return (
            <Pressable
              key={chip.id}
              onPress={() => onSelect(chip.id)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : styles.chipIdle,
                pressed && !active && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter ${chip.label}`}
            >
              <Text
                style={[styles.label, active ? styles.labelActive : styles.labelIdle]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: HomeColors.white,
    borderColor: HomeColors.white,
  },
  chipIdle: {
    backgroundColor: HomeColors.cardLight,
    borderColor: HomeColors.border,
  },
  chipPressed: {
    opacity: 0.88,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  labelActive: {
    color: HomeColors.black,
  },
  labelIdle: {
    color: HomeColors.textSecondary,
  },
});
