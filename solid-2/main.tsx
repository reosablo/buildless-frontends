/** @jsxImportSource solid-js */

import { render } from "@solidjs/web";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  isPending,
  onCleanup,
} from "solid-js";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.tsx": { lang: "tsx" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function SourceView(
  props: {
    url: keyof typeof sources;
    onLoadingChange?: (loading: boolean) => void;
  },
) {
  const html = createMemo(() => {
    const ctrl = new AbortController();
    onCleanup(() => ctrl.abort());
    return fetchSourceHTML(props.url, sources[props.url].lang, ctrl.signal);
  });

  createEffect(
    () => isPending(html),
    (loading) => {
      props.onLoadingChange?.(loading);
    },
  );

  return <section innerHTML={html()}></section>;
}

function SourcesView() {
  const [selectedSourceUrl, setSelectedSourceUrl] = createSignal<
    keyof typeof sources
  >("./index.html");
  const [loading, setLoading] = createSignal(false);

  return (
    <>
      <label>
        Source:
        <select
          onChange={function handleChange(event) {
            setSelectedSourceUrl(
              event.currentTarget.value as keyof typeof sources,
            );
          }}
        >
          <For each={Object.keys(sources)}>
            {(url) => <option value={url()}>{url()}</option>}
          </For>
        </select>
      </label>
      {loading() && <progress />}
      <SourceView url={selectedSourceUrl()} onLoadingChange={setLoading} />
    </>
  );
}

function ReadmeView() {
  const readmeHTML = createMemo(() => {
    const ctrl = new AbortController();
    onCleanup(() => ctrl.abort());
    return fetchReadmeHTML(ctrl.signal);
  });

  return <section innerHTML={readmeHTML()}></section>;
}

function App() {
  return (
    <>
      <ReadmeView />
      <SourcesView />
    </>
  );
}

render(() => <App />, document.body);
