export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "nisha-theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: ThemeMode, systemTheme: ResolvedTheme = getSystemTheme()): ResolvedTheme {
  return theme === "system" ? systemTheme : theme;
}

export function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function getThemeInitializerScript(): string {
  return `(() => {
    try {
      const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
      const root = document.documentElement;
      const stored = localStorage.getItem(storageKey);
      const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
      const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const resolved = theme === "system" ? system : theme;
      root.dataset.theme = resolved;
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
    } catch {
      // Ignore storage or matchMedia failures and fall back to CSS defaults.
    }
  })();`;
}
