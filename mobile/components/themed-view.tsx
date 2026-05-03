import { View, type ViewProps } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const colorScheme = useColorScheme() ?? "light";

  const backgroundColor =
    colorScheme === "dark"
      ? (darkColor ?? Colors.dark.background)
      : (lightColor ?? Colors.light.background);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
