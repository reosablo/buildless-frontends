/** @jsxImportSource react */

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.tsx": { lang: "tsx" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function useSourceHTML(url: keyof typeof sources) {
  const [sourceHTML, setSourceHTML] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(function updateSourceHTML() {
    const ctrl = new AbortController();
    setLoading(true);
    fetchSourceHTML(url, sources[url].lang, ctrl.signal)
      .then(setSourceHTML, (error) => {
        if (!ctrl.signal.aborted) throw error;
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [url]);

  return [sourceHTML, { loading }] as const;
}

function useReadmeHTML() {
  const [readmeHTML, setReadmeHTML] = useState<string | undefined>(undefined);

  useEffect(function updateReadmeHTML() {
    const ctrl = new AbortController();
    fetchReadmeHTML(ctrl.signal)
      .then(setReadmeHTML, (error) => {
        if (!ctrl.signal.aborted) throw error;
      });
    return () => ctrl.abort();
  }, []);

  return [readmeHTML] as const;
}

function SourceView(props: {
  url: keyof typeof sources;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [sourceHTML, { loading }] = useSourceHTML(props.url);

  useEffect(() => {
    props.onLoadingChange?.(loading);
  }, [loading, props.onLoadingChange]);

  return <div dangerouslySetInnerHTML={{ __html: sourceHTML ?? "" }}></div>;
}

function SourcesView() {
  const [selectedSourceUrl, setSelectedSourceUrl] = useState<
    keyof typeof sources
  >("./index.html");
  const [loading, setLoading] = useState(false);

  return (
    <>
      <label>
        Source:
        <select
          onChange={function handleChange(event) {
            setSelectedSourceUrl(
              (event.currentTarget as HTMLSelectElement)
                .value as keyof typeof sources,
            );
          }}
        >
          {Object.keys(sources).map((url) => (
            <option key={url} value={url}>{url}</option>
          ))}
        </select>
      </label>
      {loading && <progress />}
      <SourceView
        url={selectedSourceUrl}
        onLoadingChange={setLoading}
      />
    </>
  );
}

function ReadmeView() {
  const [readmeHTML] = useReadmeHTML();

  return <div dangerouslySetInnerHTML={{ __html: readmeHTML ?? "" }}></div>;
}

function App() {
  return (
    <>
      <ReadmeView />
      <SourcesView />
    </>
  );
}

createRoot(document.body).render(<App />);
