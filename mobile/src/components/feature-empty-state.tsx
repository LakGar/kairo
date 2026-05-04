import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useHomeColors } from "@/src/features/home/home-theme";

export type FeatureEmptyStateColors = {
  textPrimary: string;
  textMuted: string;
  /** Optional icon tint; defaults to textMuted */
  icon?: string;
};

type Ion = ComponentProps<typeof Ionicons>["name"];

type Action = {
  label: string;
  onPress: () => void;
};

type Props = {
  /** When omitted, uses `useHomeColors()` (Home / Chat / etc.). */
  colors?: FeatureEmptyStateColors;
  /** Primary CTA fill/label; defaults to home contrast (e.g. dark shell needs light button). */
  primaryButtonColors?: { bg: string; label: string };
  icon?: Ion;
  title: string;
  subtitle?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
  /** Extra vertical padding for list / scroll regions */
  compact?: boolean;
  accessibilityLabel?: string;
};

/**
 * Shared empty state: icon ring, title, optional subtitle, optional actions.
 * Pass `colors` from Discover palette, notifications shell, or leave unset for home theme.
 */
export function FeatureEmptyState({
  colors: colorsProp,
  primaryButtonColors: primaryBtnProp,
  icon = "folder-open-outline",
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  compact = false,
  accessibilityLabel,
}: Props) {
  const home = useHomeColors();
  const colors = colorsProp ?? {
    textPrimary: home.textPrimary,
    textMuted: home.textMuted,
    icon: home.textMuted,
  };
  const iconColor = colors.icon ?? colors.textMuted;
  const primaryBtn = primaryBtnProp ?? { bg: home.textPrimary, label: home.bg };

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={[styles.iconRing, { borderColor: colors.textMuted }]}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
      {(primaryAction ?? secondaryAction) ? (
        <View style={styles.actions}>
          {primaryAction ? (
            <Pressable
              onPress={primaryAction.onPress}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: primaryBtn.bg, opacity: pressed ? 0.88 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={primaryAction.label}
            >
              <Text style={[styles.primaryLabel, { color: primaryBtn.label }]}>
                {primaryAction.label}
              </Text>
            </Pressable>
          ) : null}
          {secondaryAction ? (
            <Pressable
              onPress={secondaryAction.onPress}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
              accessibilityLabel={secondaryAction.label}
            >
              <Text style={[styles.secondaryLabel, { color: colors.textPrimary }]}>
                {secondaryAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  wrapCompact: {
    paddingVertical: 24,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.35,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  actions: {
    marginTop: 8,
    gap: 10,
    alignItems: "center",
    width: "100%",
    maxWidth: 280,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
