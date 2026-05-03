import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, View } from "react-native";

const C = {
  textPrimary: "#F8FAFC",
  textMuted: "#9CA3AF",
  success: "#86EFAC",
};

type Props = {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function CreateEventToggleRow({
  label,
  value,
  onValueChange,
  icon = "ellipse-outline",
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={C.textMuted} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "rgba(255,255,255,0.15)", true: "rgba(134,239,172,0.45)" }}
        thumbColor={value ? C.success : "#f4f4f5"}
        ios_backgroundColor="rgba(255,255,255,0.15)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingVertical: 8,
    gap: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1,
  },
});
