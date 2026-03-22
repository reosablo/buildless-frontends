<script lang="ts">
  const ReadmeViewPromise = Promise.all([
    import("svelte/compiler"),
    fetch("./ReadmeView.svelte").then((res) => res.text()),
  ]).then(async ([compiler, code]) => {
    const { js } = compiler.compile(code, { generate: "client" });
    const { default: ReadmeView } = (await import(
      URL.createObjectURL(new Blob([js.code], { type: "text/javascript" }))
    )) as typeof import("./ReadmeView.svelte");
    return ReadmeView;
  });

  const SourcesViewPromise = Promise.all([
    import("svelte/compiler"),
    fetch("./SourcesView.svelte").then((res) => res.text()),
  ]).then(async ([compiler, code]) => {
    const { js } = compiler.compile(code, { generate: "client" });
    const { default: SourcesView } = (await import(
      URL.createObjectURL(new Blob([js.code], { type: "text/javascript" }))
    )) as typeof import("./SourcesView.svelte");
    return SourcesView;
  });
</script>

{#await ReadmeViewPromise then ReadmeView}
  <ReadmeView />
{/await}

{#await SourcesViewPromise then SourcesView}
  <SourcesView />
{/await}
