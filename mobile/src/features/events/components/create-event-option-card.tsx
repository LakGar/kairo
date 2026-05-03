import { Pressable, StyleSheet, Text } from "react-native";

const C = {
  panel: "rgba(255,255,255,0.10)",
  panelStrong: "rgba(255,255,255,0.14)",
  border: "rgba(255,255,255,0.10)",
  borderActive: "rgba(255,255,255,0.35)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#9CA3AF",
};

type Props = {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function CreateEventOptionCard({
  title,
  subtitle,
  selected,
  onPress,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: C.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    gap: 4,
  },
  cardSelected: {
    backgroundColor: C.panelStrong,
    borderColor: C.borderActive,
  },
  pressed: { opacity: 0.92 },
  title: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
