/** @jsxImportSource preact */

import {
  batch,
  type ReadonlySignal,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { render } from "preact";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.tsx": { lang: "tsx" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function useSourceHTML(url: ReadonlySignal<keyof typeof sources>) {
  const sourceHTML = useSignal<string | undefined>(undefined);
  const loading = useSignal(false);

  useSignalEffect(function updateSourceHTML() {
    const ctrl = new AbortController();
    loading.value = true;
    fetchSourceHTML(url.value, sources[url.value].lang, ctrl.signal)
      .then((html) => {
        batch(() => {
          sourceHTML.value = html;
          loading.value = false;
        });
      }, (error) => {
        if (ctrl.signal.aborted) return;
        loading.value = false;
        throw error;
      });
    return () => ctrl.abort();
  });

  return [sourceHTML, { loading }] as const;
}

function useReadmeHTML() {
  const readmeHTML = useSignal<string | undefined>(undefined);

  useSignalEffect(function updateReadmeHTML() {
    const ctrl = new AbortController();
    fetchReadmeHTML(ctrl.signal)
      .then((html) => {
        readmeHTML.value = html;
      }, (error) => {
        if (!ctrl.signal.aborted) throw error;
      });
    return () => ctrl.abort();
  });

  return [readmeHTML] as const;
}

function SourceView(
  props: {
    url: ReadonlySignal<keyof typeof sources>;
    onLoadingChange?: (event: boolean) => void;
  },
) {
  const [sourceHTML, { loading }] = useSourceHTML(props.url);

  useSignalEffect(() => {
    props.onLoadingChange?.(loading.value);
  });

  return (
    <div dangerouslySetInnerHTML={{ __html: sourceHTML.value ?? "" }}></div>
  );
}

function SourcesView() {
  const selectedSourceUrl = useSignal<keyof typeof sources>("./index.html");
  const loading = useSignal(false);

  return (
    <>
      <label>
        Source:
        <select
          onChange={function handleChange(event) {
            selectedSourceUrl.value = (event.currentTarget as HTMLSelectElement)
              .value as keyof typeof sources;
          }}
        >
          {Object.keys(sources).map((url) => (
            <option key={url} value={url}>{url}</option>
          ))}
        </select>
      </label>
      {loading.value && <progress />}
      <SourceView
        url={selectedSourceUrl}
        onLoadingChange={function handleLoadingChange(value) {
          loading.value = value;
        }}
      />
    </>
  );
}

function ReadmeView() {
  const [readmeHTML] = useReadmeHTML();

  return (
    <div dangerouslySetInnerHTML={{ __html: readmeHTML.value ?? "" }}></div>
  );
}

function App() {
  return (
    <>
      <ReadmeView />
      <SourcesView />
    </>
  );
}

render(<App />, document.body);
