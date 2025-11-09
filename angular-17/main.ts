import "@angular/compiler";
import "zone.js";

import { AsyncPipe } from "@angular/common";
import { HttpClient, provideHttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injectable,
} from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { bootstrapApplication } from "@angular/platform-browser";
import type { Post } from "jsonplaceholder-types/types/post";
import type { User } from "jsonplaceholder-types/types/user";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  map,
  type Observable,
  share,
  startWith,
  switchMap,
  tap,
} from "rxjs";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-root",
  imports: [AsyncPipe, ReactiveFormsModule],
  template: `
    <h1>Buildless Angular 17 app</h1>
    @if (users$ | async; as users) {
      <label>
        Select User:
        <select [formControl]="formControl">
          <option hidden selected></option>
          @for (user of users; track user.id) {
            <option value="{{ user.id }}">
              &#64;{{ user.username }}: {{ user.name }}
            </option>
          }
        </select>
      </label>
    } @else if (loadingUsers$ | async) {
      <p>Loading Users...</p>
    }
    @if (posts$ | async; as posts) {
      <ul>
        @for (post of posts; track post.id) {
          <li>{{ post.title }}</li>
        }
      </ul>
    } @else if (loadingPosts$ | async) {
      <p>Loading Posts...</p>
    } @else if (!(user$ | async)) {
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
class AppComponent {
  protected readonly formControl = new FormControl("");
  protected readonly users$ = this.#getUsers();
  protected readonly posts$ = this.#getPosts(this.#getSelectedUserId());
  protected readonly loadingUsers$ = new BehaviorSubject(false);
  protected readonly loadingPosts$ = new BehaviorSubject(false);

  #getSelectedUserId() {
    return this.formControl.valueChanges.pipe(
      startWith(this.formControl.value),
      filter((id) => id !== null),
      filter((id) => id !== ""),
      map((id) => +id),
      share(),
    );
  }

  #getUsers() {
    const userService = inject(UserService);
    return userService.getUsers()
      .pipe(
        tap({
          subscribe: () => this.loadingUsers$.next(true),
          finalize: () => this.loadingUsers$.next(false),
        }),
        share(),
      );
  }

  #getPosts(selectedUserId$: Observable<number>) {
    const postService = inject(PostService);
    return selectedUserId$.pipe(
      distinctUntilChanged(),
      switchMap((id) =>
        postService.getPosts(id).pipe(tap({
          subscribe: () => this.loadingPosts$.next(true),
          finalize: () => this.loadingPosts$.next(false),
        }))
      ),
      share(),
    );
  }
}

await bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
});
