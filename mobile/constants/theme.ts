/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Semantic surfaces for cards, lists, and chrome — use via `useUIPalette()`.
 * Keeps screens visually aligned without a separate design system package.
 */
export const UiPalette = {
  light: {
    groupedBackground: "#F2F2F7",
    card: "#FFFFFF",
    cardBorder: "rgba(60, 60, 67, 0.12)",
    tabBar: "#FBFBFD",
    tabBarBorder: "rgba(60, 60, 67, 0.18)",
    segmentTrack: "#E5E5EA",
    segmentActive: "#FFFFFF",
    heroTintWash: "rgba(10, 126, 164, 0.12)",
    danger: "#C62828",
    linkOnTint: "#FFFFFF",
  },
  dark: {
    groupedBackground: "#000000",
    card: "#1C1C1E",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    tabBar: "#161616",
    tabBarBorder: "rgba(255, 255, 255, 0.1)",
    segmentTrack: "#2C2C2E",
    segmentActive: "#3A3A3C",
    heroTintWash: "rgba(255, 255, 255, 0.08)",
    danger: "#EF5350",
    linkOnTint: "#11181C",
  },
} as const;

export type UiScheme = keyof typeof UiPalette;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
