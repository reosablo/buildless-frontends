import "@angular/compiler";

import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  linkedSignal,
  Output,
  resource,
  type Signal,
  signal,
} from "@angular/core";
import { Field, form } from "@angular/forms/signals";
import { bootstrapApplication, DomSanitizer } from "@angular/platform-browser";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.ts": { lang: "typescript" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

function sourceHTMLResource(url: Signal<keyof typeof sources | undefined>) {
  const domSanitizer = inject(DomSanitizer);

  return resource({
    params: () => ({ url: url() }),
    loader: async ({ params: { url }, abortSignal }) => {
      if (url === undefined) return undefined;
      const html = await fetchSourceHTML(url, sources[url].lang, abortSignal);
      return domSanitizer.bypassSecurityTrustHtml(html);
    },
  });
}

function readmeHTMLResource() {
  return resource({
    loader: ({ abortSignal }) => fetchReadmeHTML(abortSignal),
  });
}

@Component({
  selector: "app-source",
  template: `
    <div [innerHTML]="sourceHTML()"></div>
  `,
})
class SourceView {
  @Input({ required: true })
  set url(value: keyof typeof sources) {
    this.#url.set(value);
  }

  @Output()
  protected readonly loadingChange = new EventEmitter<boolean>();

  readonly #url = signal<keyof typeof sources | undefined>(undefined);
  readonly #sourceHTML = sourceHTMLResource(this.#url);

  protected readonly sourceHTML = linkedSignal({
    source: () => this.#sourceHTML.value(),
    computation: (current, previous) =>
      current !== undefined ? current : previous?.value,
  });

  constructor() {
    effect(() => {
      this.loadingChange.emit(this.#sourceHTML.isLoading());
    });
  }
}

@Component({
  selector: "app-sources",
  imports: [Field, SourceView],
  template: `
    <label>
      Source:
      <select [field]="form.sourceUrl">
        @for (url of sourceUrls; track url) {
          <option value="{{ url }}">{{ url }}</option>
        }
      </select>
    </label>
    @if (loading()) {
      <progress></progress>
    }
    <app-source
      [url]="selectedSourceUrl()"
      (loadingChange)="loading.set($event)"
    />
  `,
})
class SourcesView {
  readonly #formState = signal({
    sourceUrl: "./index.html" as keyof typeof sources,
  });
  protected readonly form = form(this.#formState);
  protected readonly selectedSourceUrl = computed(() =>
    this.#formState().sourceUrl
  );
  protected readonly loading = signal(false);
  protected readonly sourceUrls = Object.keys(
    sources,
  ) as (keyof typeof sources)[];
}

@Component({
  selector: "app-readme",
  template: `
    <section [innerHTML]="readmeHTML.value()"></section>
  `,
})
class ReadmeView {
  protected readonly readmeHTML = readmeHTMLResource();
}

@Component({
  selector: "app-root",
  imports: [ReadmeView, SourcesView],
  template: `
    <app-readme />
    <app-sources />
  `,
})
class App {}

await bootstrapApplication(App);
