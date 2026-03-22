<script lang="ts">
  const {
    url,
    onLoadingChange,
  }: {
    url: keyof typeof sources;
    onLoadingChange?: (loading: boolean) => void;
  } = $props();

  const sources = {
    "./index.html": { lang: "html" },
    "./App.svelte": { lang: "svelte" },
    "./ReadmeView.svelte": { lang: "svelte" },
    "./SourceView.svelte": { lang: "svelte" },
    "./SourcesView.svelte": { lang: "svelte" },
  } as const satisfies { [url: string]: { lang: string } };

  let highlighterPromise: ReturnType<typeof createHighlighter> | undefined;

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
        svelte: () => import("https://esm.sh/@shikijs/langs@4.0.2/svelte"),
      },
      themes: {
        nord: () => import("https://esm.sh/@shikijs/themes@4.0.2/nord"),
      },
      engine: () => createJavaScriptRegexEngine(),
    });
    return createSingletonShorthands(bundledHighlighter);
  }

  async function fetchSourceHTML(
    url: keyof typeof sources,
    signal?: AbortSignal,
  ) {
    const { lang } = sources[url];
    const [source, highlighter] = await Promise.all([
      fetch(url, { signal }).then((res) => res.text()),
      (highlighterPromise ??= createHighlighter()),
    ]);
    const html = await highlighter.codeToHtml(source, { lang, theme: "nord" });
    signal?.throwIfAborted();
    return html;
  }

  let sourceHTML = $state<string | undefined>(undefined);

  $effect(function updateSourceHTML() {
    const ctrl = new AbortController();
    onLoadingChange?.(true);
    fetchSourceHTML(url, ctrl.signal).then((html) => {
      sourceHTML = html;
      onLoadingChange?.(false);
    });
    return () => ctrl.abort();
  });
</script>

<section>{@html sourceHTML}</section>
