// @ts-check
// deno-lint-ignore-file no-import-prefix

/**
 * @import { ShorthandsBundle } from "https://esm.sh/shiki@4.0.2/core"
 *
 * @typedef {ReturnType<typeof createHighlighter> extends Promise<infer T> ? T : never} Highlighter
 * @typedef {Highlighter extends ShorthandsBundle<infer T, never> ? T : never} Lang
 */

/** @type {Promise<Highlighter> | undefined} */
let highlighterPromise;

async function createHighlighter() {
  const [
    { createBundledHighlighter, createSingletonShorthands },
    { createJavaScriptRegexEngine },
  ] = await Promise.all([
    import("https://esm.sh/shiki@4.0.2/core"),
    import("https://esm.sh/shiki@4.0.2/engine/javascript"),
  ]);
  const bundledHighlighter = createBundledHighlighter({
    langs: {
      html: () => import("https://esm.sh/@shikijs/langs@4.0.2/html"),
      javascript: () =>
        import("https://esm.sh/@shikijs/langs@4.0.2/javascript"),
      svelte: () => import("https://esm.sh/@shikijs/langs@4.0.2/svelte"),
      tsx: () => import("https://esm.sh/@shikijs/langs@4.0.2/tsx"),
      typescript: () =>
        import("https://esm.sh/@shikijs/langs@4.0.2/typescript"),
    },
    themes: {
      nord: () => import("https://esm.sh/@shikijs/themes@4.0.2/nord"),
    },
    engine: () => createJavaScriptRegexEngine(),
  });
  return createSingletonShorthands(bundledHighlighter);
}

/**
 * @param {string} url
 * @param {Lang} lang
 * @param {AbortSignal} [signal]
 */
export async function fetchSourceHTML(url, lang, signal) {
  const [source, highlighter] = await Promise.all(
    [
      fetch(url, { signal }).then((res) => res.text()),
      highlighterPromise ??= createHighlighter(),
    ],
  );
  const html = await highlighter.codeToHtml(source, { lang, theme: "nord" });
  signal?.throwIfAborted();
  return html;
}

/** @param {AbortSignal} [signal] */
export async function fetchReadmeHTML(signal) {
  const [{ marked }, readmeMarkdown] = await Promise.all([
    import("https://esm.sh/*marked@17.0.0"),
    fetch("./README.md", { signal }).then((res) => res.text()),
  ]);
  const html = await marked.parse(readmeMarkdown);
  signal?.throwIfAborted();
  return html;
}
