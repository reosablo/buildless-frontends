/** @jsxImportSource solid-js */

import type { Post } from "jsonplaceholder-types/types/post";
import type { User } from "jsonplaceholder-types/types/user";
import {
  type Accessor,
  createResource,
  createSignal,
  For,
  Match,
  onCleanup,
  Switch,
} from "solid-js";
import { render } from "solid-js/web";

const urlBase = "https://jsonplaceholder.typicode.com";

function createUsersResource() {
  return createResource(async function fetchUsers() {
    const ctrl = new AbortController();
    onCleanup(() => ctrl.abort());
    const response = await fetch(`${urlBase}/users`, { signal: ctrl.signal });
    return await response.json() as User[];
  });
}

function createPostsResource(userId: Accessor<number | undefined>) {
  return createResource(
    userId,
    async function fetchPosts(userId) {
      const ctrl = new AbortController();
      onCleanup(() => ctrl.abort());
      const response = await fetch(
        `${urlBase}/posts?userId=${userId}`,
        { signal: ctrl.signal },
      );
      return await response.json() as Post[];
    },
  );
}

function App() {
  const [selectedUserId, setSelectedUserId] = createSignal<number>();
  const [users] = createUsersResource();
  const [posts] = createPostsResource(selectedUserId);

  return (
    <>
      <h1>Buildless SolidJS 1 app</h1>
      <Switch>
        <Match when={users()}>
          {(users) => (
            <label>
              Select User:
              <select
                onChange={function handleChange(event) {
                  setSelectedUserId(+event.currentTarget.value);
                }}
              >
                <option hidden selected></option>
                <For each={users()}>
                  {(user) => (
                    <option value={user.id}>
                      @{user.username}: {user.name}
                    </option>
                  )}
                </For>
              </select>
            </label>
          )}
        </Match>
        <Match when={users.loading}>
          <p>Loading Users...</p>
        </Match>
      </Switch>
      <Switch>
        <Match when={posts()}>
          {(posts) => (
            <ul>
              <For each={posts()}>
                {(post) => <li>{post.title}</li>}
              </For>
            </ul>
          )}
        </Match>
        <Match when={posts.loading}>
          <p>Loading Posts...</p>
        </Match>
        <Match when={users()}>
          <p>Select User to view posts</p>
        </Match>
      </Switch>
      <p>
        Data Source:
        <a href="https://jsonplaceholder.typicode.com/" target="_blank">
          JSONPlaceholder
        </a>
      </p>
    </>
  );
}

render(() => <App />, document.body);
