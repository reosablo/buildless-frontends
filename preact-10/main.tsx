/** @jsxImportSource preact */

import {
  type ReadonlySignal,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import { render } from "preact";
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

const urlBase = "https://jsonplaceholder.typicode.com";

function useUsers() {
  const users = useSignal<User[] | undefined>(undefined);
  const loading = useSignal(false);

  useSignalEffect(function fetchUsers() {
    const ctrl = new AbortController();
    const signal = ctrl.signal;

    loading.value = true;
    fetch(`${urlBase}/users`, { signal })
      .then(async (response) => {
        const data = await response.json();
        if (signal.aborted) return;
        users.value = data;
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      })
      .finally(() => loading.value = false);

    return () => ctrl.abort();
  });

  return [users, { loading }] as const;
}

function usePosts(userId: ReadonlySignal<number | undefined>) {
  const posts = useSignal<Post[] | undefined>(undefined);
  const loading = useSignal(false);

  useSignalEffect(function fetchPosts() {
    if (userId.value === undefined) return;

    const ctrl = new AbortController();
    const signal = ctrl.signal;
    loading.value = true;
    fetch(`${urlBase}/posts?userId=${userId.value}`, { signal })
      .then(async (response) => {
        const data = await response.json();
        if (signal.aborted) return;
        posts.value = data;
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      })
      .finally(() => loading.value = false);

    return () => ctrl.abort();
  });

  return [posts, { loading }] as const;
}

function App() {
  const selectedUserId = useSignal<number | undefined>(undefined);
  const [users, { loading: loadingUsers }] = useUsers();
  const [posts, { loading: loadingPosts }] = usePosts(selectedUserId);

  return (
    <>
      <h1>Buildless Preact 10 app</h1>
      {users.value !== undefined && (
            <label>
              Select User:
              <select
                onChange={(event) =>
                  selectedUserId.value = +event.currentTarget.value}
              >
                <option hidden selected></option>
                {users.value.map((user) => (
                  <option key={user.id} value={user.id}>
                    @{user.username}: {user.name}
                  </option>
                ))}
              </select>
            </label>
          ) || loadingUsers.value && <p>Loading Users...</p>}
      {posts.value !== undefined && (
            <ul>
              {posts.value.map((post) => <li key={post.id}>{post.title}</li>)}
            </ul>
          ) ||
        loadingPosts.value && <p>Loading Posts...</p> ||
        users.value !== undefined && <p>Select User to view posts</p>}
      <p>
        Data Source:
        <a href="https://jsonplaceholder.typicode.com/" target="_blank">
          JSONPlaceholder
        </a>
      </p>
    </>
  );
}

render(<App />, document.body);
