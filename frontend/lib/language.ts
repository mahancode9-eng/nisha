export type Language = "fa" | "en";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "fa" || value === "en";
}

export function getLanguageInitializerScript(): string {
  return `(() => {
    try {
      document.documentElement.lang = "fa";
      document.documentElement.dir = "rtl";
    } catch {
      // Ignore
    }
  })();`;
}
