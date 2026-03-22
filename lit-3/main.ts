import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.ts": { lang: "typescript" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

@customElement("app-source")
export class SourceViewElement extends LitElement {
  @property()
  accessor url!: keyof typeof sources | "";

  @state()
  private accessor _sourceHTML: string | undefined;

  #abortController?: AbortController;

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("url")) {
      this.#updateSource();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  override render() {
    return html`
      <div>${unsafeHTML(this._sourceHTML)}</div>
    `;
  }

  async #updateSource() {
    if (this.url === "") return;
    this.#abortController?.abort();
    const ctrl = this.#abortController = new AbortController();

    this.dispatchEvent(new Event("app-loading"));
    try {
      this._sourceHTML = await fetchSourceHTML(
        this.url,
        sources[this.url].lang,
        ctrl.signal,
      );
      this.dispatchEvent(new Event("app-load"));
    } catch (error) {
      if (!ctrl.signal.aborted) throw error;
    }
  }
}

@customElement("app-sources")
export class SourcesViewElement extends LitElement {
  @state()
  private accessor _selectedSourceUrl: keyof typeof sources = "./index.html";

  @state()
  private accessor _loading: boolean = false;

  override render() {
    return html`
      <label>
        Source:
        <select @change="${(
          event: Event & { currentTarget: HTMLSelectElement },
        ) => {
          this._selectedSourceUrl = event.currentTarget
            .value as keyof typeof sources;
        }}">
          ${Object.keys(sources).map((url) =>
            html`
              <option value="${url}">${url}</option>
            `
          )}
        </select>
      </label>
      ${this._loading
        ? html`
          <progress />
        `
        : null}
      <app-source
        url="${this._selectedSourceUrl}"
        @app-loading="${() => {
          this._loading = true;
        }}"
        @app-load="${() => {
          this._loading = false;
        }}"
      ></app-source>
    `;
  }
}

@customElement("app-readme")
export class AppReadmeElement extends LitElement {
  @state()
  private accessor _readmeHTML: string | undefined;

  #abortController?: AbortController;

  override connectedCallback() {
    super.connectedCallback();
    this.#updateReadmeHTML();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  override render() {
    return html`
      <div>${unsafeHTML(this._readmeHTML)}</div>
    `;
  }

  async #updateReadmeHTML() {
    this.#abortController?.abort();
    const ctrl = this.#abortController = new AbortController();

    try {
      this._readmeHTML = await fetchReadmeHTML(ctrl.signal);
    } catch (error) {
      if (!ctrl.signal.aborted) throw error;
    }
  }
}

@customElement("app-root")
export class AppElement extends LitElement {
  override render() {
    return html`
      <app-readme></app-readme>
      <app-sources></app-sources>
    `;
  }
}
