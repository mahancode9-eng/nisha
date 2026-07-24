/**
 * Sanitize a string for safe injection into a <script> tag's text content.
 * Escapes characters that could break out of a script context.
 */
export function sanitizeScriptContent(value: string): string {
  return value
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027");
}
