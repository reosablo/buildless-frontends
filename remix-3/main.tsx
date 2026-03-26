/** @jsxImportSource remix/component */

import {
  addEventListeners,
  createRoot,
  type Handle,
  on,
  type TypedEventTarget,
} from "remix/component";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.tsx": { lang: "tsx" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function SourceView(
  handle: Handle,
  setup?: TypedEventTarget<{ loadingChange: CustomEvent<boolean> }>,
) {
  let sourceHTML: string | undefined;
  let previousUrl: keyof typeof sources | undefined;
  let abortController: AbortController | undefined;

  return (props: { url: keyof typeof sources }) => {
    if (props.url !== previousUrl) {
      abortController?.abort();
      const ctrl = abortController = new AbortController();
      handle.queueTask(async () => {
        const signal = AbortSignal.any([ctrl.signal, handle.signal]);
        setup?.dispatchEvent(
          new CustomEvent("loadingChange", { detail: true }),
        );

        try {
          sourceHTML = await fetchSourceHTML(
            props.url,
            sources[props.url].lang,
            signal,
          );
          handle.update();
          setup?.dispatchEvent(
            new CustomEvent("loadingChange", { detail: false }),
          );
        } catch (error) {
          if (!signal.aborted) throw error;
        }
      });
    }
    previousUrl = props.url;

    return <div innerHTML={sourceHTML}></div>;
  };
}

function SourcesView(handle: Handle) {
  const sourceViewEvents = new EventTarget() as NonNullable<
    Parameters<typeof SourceView>[1]
  >;
  let selectedSourceUrl: keyof typeof sources = "./index.html";
  let sourceLoading = false;

  addEventListeners(sourceViewEvents, handle.signal, {
    loadingChange: (event) => {
      sourceLoading = event.detail;
      handle.update();
    },
  });

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
      <SourceView url={selectedSourceUrl} setup={sourceViewEvents} />
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
