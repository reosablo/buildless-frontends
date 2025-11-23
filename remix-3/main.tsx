/** @jsxImportSource @remix-run/dom */

import { createRoot, type Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

function isAbortError(
  error: unknown,
): error is DOMException & { name: "AbortError" } {
  return error instanceof DOMException && error.name === "AbortError";
}

function App(this: Remix.Handle) {
  let selectedUserId: number | undefined;
  let users: User[] | undefined;
  let posts: Post[] | undefined;
  let loadingUsers = false;
  let loadingPosts = false;

  const fetchUsers: Remix.Task = async (signal) => {
    loadingUsers = true;
    try {
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/users",
        { signal },
      );
      users = await response.json() as User[];
      this.update();
    } catch (error) {
      if (!isAbortError(error)) {
        throw error;
      }
    } finally {
      loadingUsers = false;
    }
  };

  const fetchPosts: Remix.Task = async (signal) => {
    loadingPosts = true;
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?userId=${selectedUserId}`,
        { signal },
      );
      posts = await response.json() as Post[];
      this.update();
    } catch (error) {
      if (!isAbortError(error)) {
        throw error;
      }
    } finally {
      loadingPosts = false;
    }
  };

  const selectUserId = (id: number, signal: AbortSignal) => {
    selectedUserId = id;
    fetchPosts(signal);
    this.update();
  };

  this.queueTask(fetchUsers);

  return () => (
    <>
      <h1>Buildless Remix 3 app</h1>
      {users !== undefined && (
            <label>
              Select User:
              <select
                on={[
                  dom.change(({ currentTarget }, signal) => {
                    selectUserId(+currentTarget.value, signal);
                  }),
                ]}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    @{user.username}: {user.name}
                  </option>
                ))}
              </select>
            </label>
          ) ||
        loadingUsers && <p>Loading Users...</p>}
      {posts !== undefined && (
            <ul>
              {posts.map((post) => <li key={post.id}>{post.title}</li>)}
            </ul>
          ) ||
        loadingPosts && <p>Loading Posts...</p> ||
        users !== undefined && <p>Select User to view posts</p>}
    </>
  );
}

const root = createRoot(document.body);
root.render(<App />);
