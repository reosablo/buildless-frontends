/** @jsxImportSource solid-js */
// deno-lint-ignore-file no-import-prefix

import { render } from "@solidjs/web";
import type {
  Post,
  User,
} from "https://esm.sh/*@untypeable/jsonplaceholder@1.0.2";
import {
  createMemo,
  createSignal,
  For,
  isPending,
  Loading,
  Match,
  onCleanup,
  Switch,
} from "solid-js";

const urlBase = "https://jsonplaceholder.typicode.com";

async function fetchUsers() {
  const ctrl = new AbortController();
  onCleanup(() => ctrl.abort());
  const response = await fetch(`${urlBase}/users`, { signal: ctrl.signal });
  return await response.json() as User[];
}

async function fetchPosts(userId: number) {
  const ctrl = new AbortController();
  onCleanup(() => ctrl.abort());
  const response = await fetch(
    `${urlBase}/posts?userId=${userId}`,
    { signal: ctrl.signal },
  );
  return await response.json() as Post[];
}

async function fetchReadmeHTML() {
  const ctrl = new AbortController();
  onCleanup(() => ctrl.abort());
  const [{ marked }, readmeMarkdown] = await Promise.all([
    import("https://esm.sh/*marked@17.0.0"),
    fetch("./README.md", { signal: ctrl.signal }).then((res) => res.text()),
  ]);
  return marked(readmeMarkdown);
}

function App() {
  const [selectedUserId, setSelectedUserId] = createSignal<number>();
  const users = createMemo(() => fetchUsers());
  const posts = createMemo(() => {
    const userId = selectedUserId();
    return userId !== undefined ? fetchPosts(userId) : [];
  });
  const readmeHTML = createMemo(() => fetchReadmeHTML());

  return (
    <>
      <section innerHTML={readmeHTML()}></section>
      <Loading fallback={<p>Loading Users...</p>}>
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
                <option value={user().id}>
                  @{user().username}: {user().name}
                </option>
              )}
            </For>
          </select>
        </label>
      </Loading>
      <Switch>
        <Match when={selectedUserId() !== undefined}>
          <Loading fallback={<p>Loading Posts...</p>}>
            <ul>
              <For each={posts()}>
                {(post) => <li>{post().title}</li>}
              </For>
            </ul>
          </Loading>
        </Match>
        <Match when={!isPending(users)}>
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
