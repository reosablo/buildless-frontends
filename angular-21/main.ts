import "@angular/compiler";

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
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

const urlBase = "https://jsonplaceholder.typicode.com";

@Injectable({ providedIn: "root" })
class UserService {
  getUsers() {
    return httpResource<User[]>(() => `${urlBase}/users`);
  }
}

@Injectable({ providedIn: "root" })
class PostService {
  getPosts(userIdSignal: Signal<string | undefined>) {
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

@Component({
  selector: "app-root",
  imports: [Field],
  template: `
    <h1>Buildless Angular 21 app</h1>
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

  protected readonly form = form(this.#formState);
  protected readonly users = inject(UserService).getUsers();
  protected readonly posts = inject(PostService).getPosts(
    computed(() => this.#formState().selectedUserId || undefined),
  );
}

await bootstrapApplication(App);
