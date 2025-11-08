/** @jsxImportSource hono/jsx */
/// <reference lib="DOM" />

import { useEffect, useState } from "hono/jsx";
import { createRoot } from "hono/jsx/dom/client";
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

const urlBase = "https://jsonplaceholder.typicode.com";

function useUsers() {
  const [users, setUsers] = useState<User[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const signal = ctrl.signal;

    setLoading(true);
    fetch(`${urlBase}/users`, { signal })
      .then(async (response) => {
        const data = await response.json();
        if (signal.aborted) return;
        setUsers(data);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, []);

  return [users, { loading }] as const;
}

function usePosts(userId: number | undefined) {
  const [posts, setPosts] = useState<Post[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId === undefined) return;

    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setLoading(true);
    fetch(`${urlBase}/posts?userId=${userId}`, { signal })
      .then(async (response) => {
        const data = await response.json();
        if (signal.aborted) return;
        setPosts(data);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      })
      .finally(() => setLoading(false));

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

  const handleChange = ({ currentTarget }: Event) => {
    if (!(currentTarget instanceof HTMLSelectElement)) return;
    setSelectedUserId(+currentTarget.value);
  };

  return (
    <>
      <h1>Buildless Hono 4 app</h1>
      {users !== undefined && (
            <label>
              Select User:
              <select onChange={handleChange}>
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
