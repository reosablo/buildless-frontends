/** @jsxImportSource solid-js */

import {
  type Accessor,
  createResource,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { render } from "solid-js/web";
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

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
      const response = await fetch(`${urlBase}/posts?userId=${userId}`, {
        signal: ctrl.signal,
      });
      return await response.json() as Post[];
    },
  );
}

const App = () => {
  const [selectedUserId, setSelectedUserId] = createSignal<number>();
  const [users] = createUsersResource();
  const [posts] = createPostsResource(selectedUserId);

  return (
    <>
      <h1>Buildless SolidJS 1 app</h1>
      <Show
        when={users()}
        fallback={
          <Show when={users.loading}>
            <p>Loading Users...</p>
          </Show>
        }
      >
        {(users) => (
          <label>
            Select User:
            <select
              onChange={(e) => setSelectedUserId(+e.currentTarget.value)}
            >
              <For each={users()}>
                {(user) => (
                  <option value={user.id}>@{user.username}: {user.name}</option>
                )}
              </For>
            </select>
          </label>
        )}
      </Show>
      <Show
        when={posts()}
        fallback={
          <Show
            when={posts.loading}
            fallback={
              <Show when={users}>
                <p>Select User to view posts</p>
              </Show>
            }
          >
            <p>Loading Posts...</p>
          </Show>
        }
      >
        {(posts) => (
          <ul>
            <For each={posts()}>
              {(post) => <li>{post.title}</li>}
            </For>
          </ul>
        )}
      </Show>
      <p>
        Data Source:
        <a href="https://jsonplaceholder.typicode.com/" target="_blank">
          JSONPlaceholder
        </a>
      </p>
    </>
  );
};

render(() => <App />, document.body);
