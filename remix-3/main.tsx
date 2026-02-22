/** @jsxImportSource remix/component */

import { createRoot, type Handle } from "remix/component";
import type { Post } from "jsonplaceholder-types/types/post";
import type { User } from "jsonplaceholder-types/types/user";

function App(handle: Handle) {
  const urlBase = "https://jsonplaceholder.typicode.com";

  let users: User[] | undefined;
  let posts: Post[] | undefined;
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

  const selectUserId = (userId: number, signal: AbortSignal) => {
    fetchPosts(userId, signal);
  };

  handle.queueTask(() => {
    fetchUsers(handle.signal);
  });

  return () => (
    <>
      <h1>Buildless Remix 3 app</h1>
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
