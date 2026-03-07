// deno-lint-ignore-file no-import-prefix

import "@angular/compiler";

import { HttpClient, httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  inject,
  Injectable,
  resource,
  type Signal,
  signal,
} from "@angular/core";
import { Field, form } from "@angular/forms/signals";
import { bootstrapApplication } from "@angular/platform-browser";
import type {
  Post,
  User,
} from "https://esm.sh/*@untypeable/jsonplaceholder@1.0.2";
import { firstValueFrom, fromEvent, takeUntil } from "rxjs";

const urlBase = "https://jsonplaceholder.typicode.com";

@Injectable({ providedIn: "root" })
class UserService {
  getUsers() {
    return httpResource<User[]>(() => `${urlBase}/users`);
  }
}

@Injectable({ providedIn: "root" })
class PostService {
  getPosts(userIdSignal: Signal<number | undefined>) {
    return httpResource<Post[]>(() => {
      const userId = userIdSignal();
      if (userId == undefined) return undefined;
      return {
        url: `${urlBase}/posts`,
        params: { userId },
      };
    });
  }
}

@Injectable({ providedIn: "root" })
class ReadmeService {
  getReadmeHTML() {
    const httpClient = inject(HttpClient);

    return resource({
      loader: async ({ abortSignal }) => {
        const [{ marked }, readmeMarkdown] = await Promise.all([
          import("https://esm.sh/*marked@17.0.0"),
          firstValueFrom(
            httpClient
              .get("./README.md", { responseType: "text" })
              .pipe(takeUntil(fromEvent(abortSignal, "abort"))),
          ),
        ]);
        return marked.parse(readmeMarkdown);
      },
    });
  }
}

@Component({
  selector: "app-root",
  imports: [Field],
  template: `
    <section [innerHTML]="readmeHTML.value()"></section>
    @if (users.hasValue()) {
      <label>
        Select User:
        <select [field]="form.selectedUserId">
          <option hidden selected></option>
          @for (user of users.value(); track user.id) {
            <option value="{{ user.id }}">
              &#64;{{ user.username }}: {{ user.name }}
            </option>
          }
        </select>
      </label>
    } @else if (users.isLoading()) {
      <p>Loading Users...</p>
    }
    @if (posts.hasValue()) {
      <ul>
        @for (post of posts.value(); track post.id) {
          <li>{{ post.title }}</li>
        }
      </ul>
    } @else if (posts.isLoading()) {
      <p>Loading Posts...</p>
    } @else if (users.hasValue()) {
      <p>Select User to view posts</p>
    }
    <p>
      Data Source:
      <a href="https://jsonplaceholder.typicode.com/" target="_blank">
        JSONPlaceholder
      </a>
    </p>
  `,
})
class App {
  readonly #formState = signal({ selectedUserId: "" });
  readonly #selectedUserId = computed(() => {
    const userId = this.#formState().selectedUserId;
    if (userId === "") return undefined;
    return +userId;
  });

  protected readonly form = form(this.#formState);
  protected readonly users = inject(UserService).getUsers();
  protected readonly posts = inject(PostService).getPosts(
    this.#selectedUserId,
  );
  protected readonly readmeHTML = inject(ReadmeService).getReadmeHTML();
}

await bootstrapApplication(App);
