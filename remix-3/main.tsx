/** @jsxImportSource remix/component */
// deno-lint-ignore-file no-import-prefix

import type {
  Post,
  User,
} from "https://esm.sh/*@untypeable/jsonplaceholder@1.0.2";
import { createRoot, type Handle } from "remix/component";

function App(handle: Handle) {
  const urlBase = "https://jsonplaceholder.typicode.com";

  let users: User[] | undefined;
  let posts: Post[] | undefined;
  let readmeHTML: string | undefined;
  let loadingUsers = false;
  let loadingPosts = false;

  const fetchUsers = async (signal: AbortSignal) => {
    loadingUsers = true;
    handle.update();
    try {
      const response = await fetch(`${urlBase}/users`, { signal });
      const data = (await response.json()) as User[];
      signal.throwIfAborted();
      users = data;
      loadingUsers = false;
      handle.update();
    } catch (error) {
      if (signal.aborted) return;
      loadingUsers = false;
      handle.update();
      throw error;
    }
  };

  const fetchPosts = async (userId: number, signal: AbortSignal) => {
    loadingPosts = true;
    handle.update();
    try {
      const response = await fetch(`${urlBase}/posts?userId=${userId}`, {
        signal,
      });
      const data = (await response.json()) as Post[];
      signal.throwIfAborted();
      posts = data;
      loadingPosts = false;
      handle.update();
    } catch (error) {
      if (signal.aborted) return;
      loadingPosts = false;
      handle.update();
      throw error;
    }
  };

  const fetchReadmeHTML = async (signal: AbortSignal) => {
    try {
      const [{ marked }, readmeMarkdown] = await Promise.all([
        import("https://esm.sh/*marked@17.0.0"),
        fetch("./README.md", { signal }).then((res) => res.text()),
      ]);
      const html = await marked(readmeMarkdown);
      signal.throwIfAborted();
      readmeHTML = html;
      handle.update();
    } catch (error) {
      if (signal.aborted) return;
      handle.update();
      throw error;
    }
  };

  const selectUserId = (userId: number, signal: AbortSignal) => {
    fetchPosts(userId, signal);
  };

  handle.queueTask(() => {
    fetchUsers(handle.signal);
    fetchReadmeHTML(handle.signal);
  });

  return () => (
    <>
      <section innerHTML={readmeHTML}></section>
      {(users !== undefined && (
        <label>
          Select User:
          <select
            on={{
              change(event, signal) {
                selectUserId(+event.currentTarget.value, signal);
              },
            }}
          >
            <option hidden selected></option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                @{user.username}: {user.name}
              </option>
            ))}
          </select>
        </label>
      )) ||
        (loadingUsers && <p>Loading Users...</p>)}
      {(posts !== undefined && (
        <ul>
          {posts.map((post) => <li key={post.id}>{post.title}</li>)}
        </ul>
      )) ||
        (loadingPosts && <p>Loading Posts...</p>) ||
        (users !== undefined && <p>Select User to view posts</p>)}
    </>
  );
}

createRoot(document.body).render(<App />);
