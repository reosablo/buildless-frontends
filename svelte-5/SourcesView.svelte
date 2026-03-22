<script lang="ts">
  const SourceViewPromise = Promise.all([
    import("svelte/compiler"),
    fetch("./SourceView.svelte").then((res) => res.text()),
  ]).then(async ([compiler, code]) => {
    const { js } = compiler.compile(code, { generate: "client" });
    const { default: SourceView } = (await import(
      URL.createObjectURL(new Blob([js.code], { type: "text/javascript" }))
    )) as typeof import("./SourceView.svelte");
    return SourceView;
  });

  const sources = {
    "./index.html": { lang: "html" },
    "./App.svelte": { lang: "svelte" },
    "./ReadmeView.svelte": { lang: "svelte" },
    "./SourceView.svelte": { lang: "svelte" },
    "./SourcesView.svelte": { lang: "svelte" },
  } as const satisfies { [url: string]: { lang: string } };

  let selectedSourceUrl = $state<keyof typeof sources>("./index.html");
  let sourceLoading = $state(false);
</script>

<label>
  Source:
  <select bind:value={selectedSourceUrl}>
    {#each Object.keys(sources) as url}
      <option value={url}>{url}</option>
    {/each}
  </select>
</label>

{#await SourceViewPromise then SourceView}
  {#if sourceLoading}
    <progress></progress>
  {/if}
  <SourceView
    url={selectedSourceUrl}
    onLoadingChange={(loading) => (sourceLoading = loading)}
  />
{/await}
