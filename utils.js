// @ts-check
// deno-lint-ignore-file no-import-prefix

/**
 * @import { BundledLanguage } from "https://esm.sh/shiki@4.0.2"
 */

/**
 * @param {string} url
 * @param {BundledLanguage} lang
 * @param {AbortSignal} [signal]
 */
export async function fetchSourceHTML(url, lang, signal) {
  const [{ codeToHtml }, source] = await Promise.all([
    import("https://esm.sh/shiki@4.0.2"),
    fetch(url, { signal }).then((res) => res.text()),
  ]);
  const html = await codeToHtml(source, { lang, theme: "nord" });
  signal?.throwIfAborted();
  return html;
}

/** @param {AbortSignal} [signal] */
export async function fetchReadmeHTML(signal) {
  const [{ parse }, readmeMarkdown] = await Promise.all([
    import("https://esm.sh/*marked@17.0.0"),
    fetch("./README.md", { signal }).then((res) => res.text()),
  ]);
  const html = await parse(readmeMarkdown);
  signal?.throwIfAborted();
  return html;
}
