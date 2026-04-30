/** @jsxImportSource remix/ui */

import { createRoot, type Handle, on } from "remix/ui";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.tsx": { lang: "tsx" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function SourceView(
  handle: Handle<{
    url: keyof typeof sources;
    onLoadingChange?: (loading: boolean) => void;
  }>,
) {
  let sourceHTML: string | undefined;
  let previousUrl: keyof typeof sources | undefined;
  let abortController: AbortController | undefined;

  return () => {
    const { url, onLoadingChange } = handle.props;
    if (url !== previousUrl) {
      abortController?.abort();
      const ctrl = abortController = new AbortController();
      handle.queueTask(async () => {
        onLoadingChange?.(true);
        const signal = AbortSignal.any([ctrl.signal, handle.signal]);
        try {
          sourceHTML = await fetchSourceHTML(url, sources[url].lang, signal);
          handle.update();
        } catch (error) {
          if (!signal.aborted) throw error;
        } finally {
          if (!signal.aborted) onLoadingChange?.(false);
        }
      });
    }
    previousUrl = url;

    return <div innerHTML={sourceHTML}></div>;
  };
}

function SourcesView(handle: Handle) {
  let selectedSourceUrl: keyof typeof sources = "./index.html";
  let sourceLoading = false;

  return () => (
    <>
      <label>
        Source:
        <select
          mix={[
            on("change", function handleChange(e) {
              selectedSourceUrl = e.currentTarget.value as keyof typeof sources;
              handle.update();
            }),
          ]}
        >
          {Object.keys(sources).map((url) => (
            <option key={url} value={url}>{url}</option>
          ))}
        </select>
      </label>
      {sourceLoading && <progress />}
      <SourceView
        url={selectedSourceUrl}
        onLoadingChange={function handleLoadingChange(loading) {
          sourceLoading = loading;
          handle.update();
        }}
      />
    </>
  );
}

function ReadmeView(handle: Handle) {
  let readmeHTML: string | undefined;

  handle.queueTask(async (signal) => {
    try {
      readmeHTML = await fetchReadmeHTML(signal);
      handle.update();
    } catch (error) {
      if (!signal.aborted) throw error;
    }
  });

  return () => <div innerHTML={readmeHTML}></div>;
}

function App() {
  return () => (
    <>
      <ReadmeView />
      <SourcesView />
    </>
  );
}

createRoot(document.body).render(<App />);
