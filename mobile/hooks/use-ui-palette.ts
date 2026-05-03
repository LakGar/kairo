import { useMemo } from "react";

import { UiPalette, type UiScheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useUIPalette() {
  const scheme = (useColorScheme() ?? "light") as UiScheme;
  return useMemo(() => UiPalette[scheme], [scheme]);
}
