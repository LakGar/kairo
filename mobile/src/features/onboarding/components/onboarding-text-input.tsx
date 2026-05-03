import { StyleSheet, Text, TextInput, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "ascii-capable";
};

export function OnboardingTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  autoCapitalize = "sentences",
  keyboardType = "default",
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={onboardingColors.textMuted}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error ? styles.inputError : null,
        ]}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: onboardingColors.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: onboardingColors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: onboardingColors.textPrimary,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "rgba(248,113,113,0.55)",
  },
  error: {
    color: onboardingColors.danger,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
