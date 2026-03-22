// @ts-check

/** @import { PropType } from "vue" */
import { defineComponent, onWatcherCleanup, ref, watchEffect } from "vue";
import { createApp } from "vue/dist/vue.esm-bundler.js";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const html = String.raw;

/** @satisfies{{ [url: string]: { lang: string } }} */
const sources = /** @type { const } */ ({
  "./index.html": { lang: "html" },
  "./main.js": { lang: "javascript" },
  "./utils.js": { lang: "javascript" },
});

const SourceView = defineComponent({
  props: {
    url: {
      type: /** @type { PropType<keyof typeof sources> } */ (String),
      required: true,
    },
  },
  emits: {
    // deno-lint-ignore no-unused-vars
    loadingChange: /** @param { boolean } loading */ (loading) => true,
  },
  template: html`
    <div v-html="sourceHTML"></div>
  `,
  setup(props, context) {
    const sourceHTML = ref(/** @type { string | undefined } */ (undefined));

    watchEffect(() => {
      const ctrl = new AbortController();
      context.emit("loadingChange", true);
      fetchSourceHTML(props.url, sources[props.url].lang, ctrl.signal).then(
        (html) => {
          sourceHTML.value = html;
          context.emit("loadingChange", false);
        },
      );
      onWatcherCleanup(() => ctrl.abort());
    });

    return { sourceHTML };
  },
});

const SourcesView = defineComponent({
  components: { SourceView },
  template: html`
    <label>
      Source:
      <select v-model="selectedUrl">
        <option v-for="(lang, url) in sources" :key="url" :value="url">
          {{ url }}
        </option>
      </select>
    </label>
    <progress v-if="sourceLoading"></progress>
    <source-view :url="selectedUrl" @loading-change="sourceLoading = $event" />
  `,
  setup() {
    const selectedUrl = ref(
      /** @type {keyof typeof sources} */ ("./index.html"),
    );
    const sourceLoading = ref(false);
    return { selectedUrl, sources, sourceLoading };
  },
});

const ReadmeView = defineComponent({
  template: html`
    <section v-html="readmeHTML"></section>
  `,
  setup() {
    const readmeHTML = ref(/** @type { string | undefined } */ (undefined));

    watchEffect(() => {
      const ctrl = new AbortController();
      fetchReadmeHTML(ctrl.signal).then((html) => {
        readmeHTML.value = html;
      });
      onWatcherCleanup(() => ctrl.abort());
    });

    return { readmeHTML };
  },
});

const App = defineComponent({
  components: { ReadmeView, SourcesView },
  template: html`
    <readme-view />
    <sources-view />
  `,
  setup() {},
});

Object.assign(globalThis, {
  __VUE_OPTIONS_API__: true,
  __VUE_PROD_DEVTOOLS__: false,
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
});

createApp(App).mount(document.body);
