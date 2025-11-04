import "@angular/compiler";

import { TitleCasePipe } from "@angular/common";
import { httpResource } from "@angular/common/http";
import {
  Component,
  computed,
  inject,
  Injectable,
  type Signal,
  signal,
} from "@angular/core";
import { Field, form } from "@angular/forms/signals";
import { bootstrapApplication } from "@angular/platform-browser";

@Injectable({ providedIn: "root" })
class AppService {
  static readonly #urlBase = "https://jsonplaceholder.typicode.com";

  getUsers() {
    return httpResource(() => `${AppService.#urlBase}/users`);
  }

  getPosts(userIdSignal: Signal<string | undefined>) {
    return httpResource(() => {
      const userId = userIdSignal();
      if (userId == undefined) return undefined;
      return {
        url: `${AppService.#urlBase}/posts`,
        params: { userId },
      };
    });
  }
}

@Component({
  selector: "app-root",
  imports: [Field, TitleCasePipe],
  template: `
    <h1>Buildless Angular 21 app</h1>
    @if (users.hasValue()) {
      <label>
        Select User:
        <select [field]="form.selectedUserId">
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
          <li>{{ post.title | titlecase }}</li>
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

  protected readonly form = form(this.#formState);
  protected readonly users = inject(AppService).getUsers();
  protected readonly posts = inject(AppService).getPosts(
    computed(() => this.#formState().selectedUserId || undefined),
  );
}

await bootstrapApplication(App);
