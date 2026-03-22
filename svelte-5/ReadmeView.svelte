<script lang="ts">
  async function fetchReadmeHTML(signal?: AbortSignal) {
    const [{ marked }, readmeMarkdown] = await Promise.all([
      import("https://esm.sh/*marked@17.0.0"),
      fetch("README.md", { signal }).then((res) => res.text()),
    ]);
    const html = await marked.parse(readmeMarkdown);
    signal?.throwIfAborted();
    return html;
  }

  let readmeHTML = $state<string | undefined>(undefined);

  $effect(function updateReadmeHTML() {
    const ctrl = new AbortController();
    fetchReadmeHTML(ctrl.signal).then((html) => {
      readmeHTML = html;
    });
    return () => ctrl.abort();
  });
</script>

<section>{@html readmeHTML}</section>
