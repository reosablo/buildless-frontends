/** @jsxImportSource hono/jsx */
// deno-lint-ignore-file no-import-prefix

import { useEffect, useState } from "hono/jsx";
import { createRoot } from "hono/jsx/dom/client";
import type {
  Post,
  User,
} from "https://esm.sh/*@untypeable/jsonplaceholder@1.0.2";

const urlBase = "https://jsonplaceholder.typicode.com";

function useUsers() {
  const [users, setUsers] = useState<User[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function fetchUsers(signal: AbortSignal) {
    setLoading(true);
    try {
      const response = await fetch(`${urlBase}/users`, { signal });
      const users = await response.json() as User[];
      signal.throwIfAborted();
      setUsers(users);
      setLoading(false);
    } catch (error) {
      if (signal.aborted) return;
      setLoading(false);
      throw error;
    }
  }

  useEffect(function updateUsers() {
    const ctrl = new AbortController();
    fetchUsers(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  return [users, { loading }] as const;
}

function usePosts(userId: number | undefined) {
  const [posts, setPosts] = useState<Post[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function fetchPosts(userId: number, signal: AbortSignal) {
    setLoading(true);
    try {
      const response = await fetch(
        `${urlBase}/posts?userId=${userId}`,
        { signal },
      );
      const posts = await response.json() as Post[];
      signal.throwIfAborted();
      setPosts(posts);
      setLoading(false);
    } catch (error) {
      if (signal.aborted) return;
      setLoading(false);
      throw error;
    }
  }

  useEffect(function updatePosts() {
    if (userId === undefined) return;
    const ctrl = new AbortController();
    fetchPosts(userId, ctrl.signal);
    return () => ctrl.abort();
  }, [userId]);

  return [posts, { loading }] as const;
}

function App() {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(
    undefined,
  );
  const [users, { loading: loadingUsers }] = useUsers();
  const [posts, { loading: loadingPosts }] = usePosts(selectedUserId);

  return (
    <>
      <h1>Buildless Hono 4 app</h1>
      {users !== undefined && (
            <label>
              Select User:
              <select
                onChange={function handleChange(event) {
                  setSelectedUserId(
                    +(event.currentTarget as HTMLSelectElement)
                      .value,
                  );
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
          ) || loadingUsers && <p>Loading Users...</p>}
      {posts !== undefined && (
            <ul>
              {posts.map((post) => <li key={post.id}>{post.title}</li>)}
            </ul>
          ) ||
        loadingPosts && <p>Loading Posts...</p> ||
        users !== undefined && <p>Select User to view posts</p>}
      <p>
        Data Source:
        <a href="https://jsonplaceholder.typicode.com/" target="_blank">
          JSONPlaceholder
        </a>
      </p>
    </>
  );
}

createRoot(document.body).render(<App />);
