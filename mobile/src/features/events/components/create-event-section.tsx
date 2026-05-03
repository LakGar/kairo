import { StyleSheet, Text, View } from "react-native";

const C = {
  textPrimary: "#F8FAFC",
  textMuted: "#9CA3AF",
  textSecondary: "#CBD5E1",
};

type Props = {
  title: string;
  helperText?: string;
  children: React.ReactNode;
};

export function CreateEventSection({ title, helperText, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  title: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  helper: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
});
