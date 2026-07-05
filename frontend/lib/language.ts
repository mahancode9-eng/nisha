export type Language = "fa";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "fa";
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
