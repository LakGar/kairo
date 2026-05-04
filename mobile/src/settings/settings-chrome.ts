import { useMemo } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";

/** Surfaces + text for settings stack (follows Appearance / system). */
export type SettingsChrome = {
  screen: string;
  card: string;
  cardBorder: string;
  muted: string;
  label: string;
  line: string;
  chevron: string;
  cryptoHint: string;
  hint: string;
  hintEmphasis: string;
  inactiveIcon: string;
  switchTrackOff: string;
  headerIcon: string;
  headerBackBtnBg: string;
  blurTint: "light" | "dark" | "default";
  inputFill: string;
  primaryBtnBg: string;
  primaryBtnText: string;
  errorBannerBg: string;
  errorBannerText: string;
  modalLink: string;
  destructive: string;
  profileAvatarFallback: string;
  /** Subtle grouped surface on the root screen (stats strip, profile cards). */
  sheetSurface: string;
};

const dark: SettingsChrome = {
  screen: "#000000",
  card: "#1C1C1E",
  cardBorder: "rgba(255,255,255,0.08)",
  muted: "rgba(255,255,255,0.45)",
  label: "rgba(255,255,255,0.92)",
  line: "rgba(255,255,255,0.08)",
  chevron: "rgba(255,255,255,0.35)",
  cryptoHint: "rgba(255,255,255,0.38)",
  hint: "rgba(255,255,255,0.38)",
  hintEmphasis: "rgba(255,255,255,0.55)",
  inactiveIcon: "rgba(255,255,255,0.25)",
  switchTrackOff: "#3A3A3C",
  headerIcon: "#FFFFFF",
  headerBackBtnBg: "rgba(255,255,255,0.12)",
  blurTint: "dark",
  inputFill: "rgba(255,255,255,0.06)",
  primaryBtnBg: "#FFFFFF",
  primaryBtnText: "#0B0F14",
  errorBannerBg: "rgba(239,68,68,0.15)",
  errorBannerText: "#FCA5A5",
  modalLink: "#0A84FF",
  destructive: "#FF453A",
  profileAvatarFallback: "rgba(255,255,255,0.1)",
  sheetSurface: "rgba(255,255,255,0.04)",
};

const light: SettingsChrome = {
  screen: "#FFFFFF",
  card: "#F2F2F7",
  cardBorder: "rgba(60, 60, 67, 0.12)",
  muted: "#6B7280",
  label: "#111827",
  line: "rgba(60, 60, 67, 0.12)",
  chevron: "rgba(0, 0, 0, 0.35)",
  cryptoHint: "rgba(0, 0, 0, 0.45)",
  hint: "rgba(0, 0, 0, 0.45)",
  hintEmphasis: "rgba(0, 0, 0, 0.72)",
  inactiveIcon: "rgba(0, 0, 0, 0.22)",
  switchTrackOff: "#E5E7EB",
  headerIcon: "#111827",
  headerBackBtnBg: "rgba(0, 0, 0, 0.06)",
  blurTint: "light",
  inputFill: "rgba(0, 0, 0, 0.04)",
  primaryBtnBg: "#111827",
  primaryBtnText: "#FFFFFF",
  errorBannerBg: "rgba(239,68,68,0.12)",
  errorBannerText: "#B91C1C",
  modalLink: "#2563EB",
  destructive: "#DC2626",
  profileAvatarFallback: "rgba(0, 0, 0, 0.06)",
  sheetSurface: "rgba(0, 0, 0, 0.04)",
};

export function useSettingsChrome(): SettingsChrome {
  const scheme = useColorScheme() ?? "light";
  return useMemo(
    () => (scheme === "dark" ? dark : light),
    [scheme],
  );
}
