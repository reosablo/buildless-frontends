import "@angular/compiler";
import "zone.js";

import { AsyncPipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Injectable,
  Input,
  Output,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { bootstrapApplication, DomSanitizer } from "@angular/platform-browser";
import {
  BehaviorSubject,
  filter,
  finalize,
  from,
  map,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { fetchReadmeHTML, fetchSourceHTML } from "./utils.js";

const sources = {
  "./index.html": { lang: "html" },
  "./main.ts": { lang: "typescript" },
  "./utils.js": { lang: "javascript" },
} as const satisfies { [url: string]: { lang: string } };

@Injectable({ providedIn: "root" })
class SourceService {
  readonly #domSanitizer = inject(DomSanitizer);

  getSourceHTML(url: keyof typeof sources) {
    const ctrl = new AbortController();

    return from(fetchSourceHTML(url, sources[url].lang, ctrl.signal))
      .pipe(
        finalize(() => ctrl.abort()),
        map((html) => this.#domSanitizer.bypassSecurityTrustHtml(html)),
      );
  }
}

@Injectable({ providedIn: "root" })
class ReadmeService {
  getReadmeHTML() {
    const ctrl = new AbortController();

    return from(fetchReadmeHTML(ctrl.signal))
      .pipe(finalize(() => ctrl.abort()));
  }
}

@Component({
  standalone: true,
  selector: "app-source",
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [innerHTML]="sourceHTML$ | async"></div>
  `,
})
class SourceViewComponent {
  @Input({ required: true })
  set url(value: keyof typeof sources) {
    this.#url$.next(value);
  }

  @Output()
  protected readonly loadingChange = new EventEmitter<boolean>();

  readonly #sourceService = inject(SourceService);

  readonly #url$ = new BehaviorSubject<keyof typeof sources | undefined>(
    undefined,
  );
  readonly sourceHTML$ = this.#url$.pipe(
    filter((url) => url !== undefined),
    switchMap((url) =>
      this.#sourceService.getSourceHTML(url).pipe(
        tap({
          subscribe: () => this.loadingChange.emit(true),
          finalize: () => this.loadingChange.emit(false),
        }),
      )
    ),
  );
}

@Component({
  standalone: true,
  selector: "app-sources",
  imports: [AsyncPipe, ReactiveFormsModule, SourceViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label>
      Source:
      <select [formControl]="sourceUrlControl">
        @for (url of sourceUrls; track url) {
          <option value="{{ url }}">{{ url }}</option>
        }
      </select>
    </label>
    @if (loading$ | async) {
      <progress></progress>
    }
    <app-source
      [url]="selectedSourceUrl$ | async"
      (loadingChange)="loading$.next($event)"
    />
  `,
})
class SourcesViewComponent {
  protected readonly sourceUrlControl = new FormControl<keyof typeof sources>(
    "./index.html",
  );
  protected readonly selectedSourceUrl$ = this.sourceUrlControl.valueChanges
    .pipe(
      startWith(this.sourceUrlControl.value),
      filter((url) => url !== null),
    );
  protected readonly loading$ = new BehaviorSubject<boolean>(false);
  protected readonly sourceUrls = Object.keys(
    sources,
  ) as (keyof typeof sources)[];
}

@Component({
  standalone: true,
  selector: "app-readme",
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [innerHTML]="readmeHTML$ | async"></section>
  `,
})
class ReadmeViewComponent {
  protected readonly readmeHTML$ = inject(ReadmeService).getReadmeHTML();
}

@Component({
  standalone: true,
  selector: "app-root",
  imports: [ReadmeViewComponent, SourcesViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-readme></app-readme>
    <app-sources></app-sources>
  `,
})
class AppComponent {}

await bootstrapApplication(AppComponent);
