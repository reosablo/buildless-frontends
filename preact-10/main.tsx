/** @jsxImportSource preact */
// deno-lint-ignore-file no-import-prefix

import {
  batch,
  type ReadonlySignal,
  useSignal,
  useSignalEffect,
} from "@preact/signals";
import type {
  Post,
  User,
} from "https://esm.sh/*@untypeable/jsonplaceholder@1.0.2";
import { render } from "preact";

const urlBase = "https://jsonplaceholder.typicode.com";

function useUsers() {
  const users = useSignal<User[] | undefined>(undefined);
  const loading = useSignal(false);

  async function fetchUsers(signal: AbortSignal) {
    loading.value = true;
    try {
      const response = await fetch(`${urlBase}/users`, { signal });
      const data = await response.json() as User[];
      signal.throwIfAborted();
      batch(() => {
        users.value = data;
        loading.value = false;
      });
    } catch (error) {
      if (signal.aborted) return;
      loading.value = false;
      throw error;
    }
  }

  useSignalEffect(function updateUsers() {
    const ctrl = new AbortController();
    fetchUsers(ctrl.signal);
    return () => ctrl.abort();
  });

  return [users, { loading }] as const;
}

function usePosts(userId: ReadonlySignal<number | undefined>) {
  const posts = useSignal<Post[] | undefined>(undefined);
  const loading = useSignal(false);

  async function fetchPosts(userId: number, signal: AbortSignal) {
    loading.value = true;
    try {
      const response = await fetch(
        `${urlBase}/posts?userId=${userId}`,
        { signal },
      );
      const data = await response.json() as Post[];
      signal.throwIfAborted();
      batch(() => {
        posts.value = data;
        loading.value = false;
      });
    } catch (error) {
      if (signal.aborted) return;
      loading.value = false;
      throw error;
    }
  }

  useSignalEffect(function updatePosts() {
    if (userId.value === undefined) return;
    const ctrl = new AbortController();
    fetchPosts(userId.value, ctrl.signal);
    return () => ctrl.abort();
  });

  return [posts, { loading }] as const;
}

function useReadmeHTML() {
  const readmeHTML = useSignal<string | undefined>(undefined);

  async function fetchReadmeHTML(signal: AbortSignal) {
    try {
      const [{ marked }, readmeMarkdown] = await Promise.all([
        import("https://esm.sh/*marked@17.0.0"),
        fetch("./README.md", { signal }).then((res) => res.text()),
      ]);
      const html = await marked.parse(readmeMarkdown);
      signal.throwIfAborted();
      readmeHTML.value = html;
    } catch (error) {
      if (signal.aborted) return;
      throw error;
    }
  }

  useSignalEffect(function updateReadmeHTML() {
    const ctrl = new AbortController();
    fetchReadmeHTML(ctrl.signal);
    return () => ctrl.abort();
  });

  return [readmeHTML] as const;
}

function App() {
  const selectedUserId = useSignal<number | undefined>(undefined);
  const [users, { loading: loadingUsers }] = useUsers();
  const [posts, { loading: loadingPosts }] = usePosts(selectedUserId);
  const [readmeHTML] = useReadmeHTML();

  return (
    <>
      <section
        dangerouslySetInnerHTML={{ __html: readmeHTML.value ?? "" }}
      >
      </section>
      {users.value !== undefined && (
            <label>
              Select User:
              <select
                onChange={function handleChange(event) {
                  selectedUserId.value = +event.currentTarget.value;
                }}
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
