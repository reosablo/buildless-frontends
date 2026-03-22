/** @jsxImportSource solid-js */

import {
  type Accessor,
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
} from "solid-js";
import { render } from "solid-js/web";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.tsx": { lang: "tsx" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function createSourceHTMLResource(url: Accessor<keyof typeof sources>) {
  return createResource(
    url,
    async function updateSourceHTML(url) {
      const ctrl = new AbortController();
      onCleanup(() => ctrl.abort());
      return await fetchSourceHTML(url, sources[url].lang, ctrl.signal);
    },
  );
}

function createReadmeHTMLResource() {
  return createResource(
    async function updateReadmeHTML() {
      const ctrl = new AbortController();
      onCleanup(() => ctrl.abort());
      return await fetchReadmeHTML(ctrl.signal);
    },
  );
}

function SourceView(
  props: {
    url: keyof typeof sources;
    onLoadingChange?: (loading: boolean) => void;
  },
) {
  const [sourceHTML] = createSourceHTMLResource(() => props.url);

  createEffect(() => {
    props.onLoadingChange?.(sourceHTML.loading);
  });

  return <section innerHTML={sourceHTML()}></section>;
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
            {(source) => <option value={source}>{source}</option>}
          </For>
        </select>
      </label>
      {loading() && <progress />}
      <SourceView
        url={selectedSourceUrl()}
        onLoadingChange={function handleOnLoadingChange(loading) {
          setLoading(loading);
        }}
      />
    </>
  );
}

function ReadmeView() {
  const [readmeHTML] = createReadmeHTMLResource();

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
