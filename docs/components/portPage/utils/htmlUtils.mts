import { normalizeText } from "../../../../shared/utils.mjs";

export function escapeAll(
  text: string,
  keepNewlines = false,
  noTrim = false
): string {
  let result = normalizeText(text);
  if (!noTrim) {
    result = result.trim();
  }
  if (!keepNewlines) {
    result = result.replace(/\n/g, " ");
  }
  return result.replace(/[<>"'`:{}]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function renderExternalLink(
  url: string,
  text?: string,
  code = false,
  translate: "yes" | "no" | null | undefined = "no"
): string {
  return `<a class="link" href="${escapeAll(
    url
  )}" target="_blank" rel="noreferrer"${
    translate != null ? ` translate="${translate}"` : ""
  }>${code ? '<code class="code">' : ""}${escapeAll(text || url)}${
    code ? "</code>" : ""
  }</a>`;
}
