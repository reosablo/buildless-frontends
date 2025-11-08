import "@angular/compiler";
import "zone.js";

import { TitleCasePipe } from "@angular/common";
import { HttpClient, provideHttpClient } from "@angular/common/http";
import { Component, effect, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { bootstrapApplication } from "@angular/platform-browser";
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

const urlBase = "https://jsonplaceholder.typicode.com";

@Injectable({ providedIn: "root" })
class UserService {
  readonly #httpClient = inject(HttpClient);

  getUsers() {
    return this.#httpClient.get<User[]>(`${urlBase}/users`);
  }
}

@Injectable({ providedIn: "root" })
class PostService {
  readonly #httpClient = inject(HttpClient);

  getPosts(userId: number) {
    return this.#httpClient.get<Post[]>(`${urlBase}/posts`, {
      params: { userId },
    });
  }
}

@Component({
  standalone: true,
  selector: "app-root",
  imports: [TitleCasePipe],
  template: `
    <h1>Buildless Angular 17 app</h1>
    <label>
      Select User:
      <select (change)="selectedUserId.set($event.target.value)">
        <option hidden selected></option>
        @for (user of users(); track user.id) {
          <option value="{{ user.id }}">
            &#64;{{ user.username }}: {{ user.name }}
          </option>
        }
      </select>
    </label>
    <ul>
      @for (post of posts(); track post.id) {
        <li>{{ post.title | titlecase }}</li>
      }
    </ul>
    <p>
      Data Source:
      <a href="https://jsonplaceholder.typicode.com/" target="_blank">
        JSONPlaceholder
      </a>
    </p>
  `,
})
class AppComponent {
  readonly #postService = inject(PostService);

  protected readonly users = toSignal(inject(UserService).getUsers());
  protected readonly selectedUserId = signal<number | undefined>(undefined);
  protected readonly posts = signal<unknown>(undefined);

  constructor() {
    effect((onCleanup) => {
      const selectedUserId = this.selectedUserId();
      if (selectedUserId !== undefined) {
        const subscription = this.#postService
          .getPosts(selectedUserId)
          .subscribe((posts) => this.posts.set(posts));
        onCleanup(() => subscription.unsubscribe());
      }
    });
  }
}

await bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
});
