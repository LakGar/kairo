import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

const C = {
  panel: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.10)",
  textPrimary: "#F8FAFC",
  textMuted: "#9CA3AF",
  danger: "#EF4444",
};

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  accessibilityLabel?: string;
};

export function CreateEventPillInput({
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType = "default",
  accessibilityLabel,
}: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        keyboardType={keyboardType}
        accessibilityLabel={accessibilityLabel ?? placeholder}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 56,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: C.panel,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: "500",
  },
  inputMultiline: {
    minHeight: 120,
    borderRadius: 28,
    paddingTop: 16,
    textAlignVertical: "top",
  },
  error: {
    color: C.danger,
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "500",
  },
});
