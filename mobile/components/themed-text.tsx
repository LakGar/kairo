import { Text, StyleSheet, type TextProps } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "subtitle" | "link" | "muted" | "small";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...otherProps
}: ThemedTextProps) {
  const colorScheme = useColorScheme() ?? "light";

  const color =
    colorScheme === "dark"
      ? (darkColor ?? Colors.dark.text)
      : (lightColor ?? Colors.light.text);

  return (
    <Text
      style={[
        { color },
        type === "default" && styles.default,
        type === "title" && styles.title,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        type === "muted" && styles.muted,
        type === "small" && styles.small,
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    color: "#0A7EA4",
    fontWeight: "600",
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.65,
  },
  small: {
    fontSize: 12,
    lineHeight: 18,
  },
});
