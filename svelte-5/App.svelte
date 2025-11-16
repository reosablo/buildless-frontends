<script lang="ts">
  import type { User } from "jsonplaceholder-types/types/user";
  import type { Post } from "jsonplaceholder-types/types/post";

  const urlBase = "https://jsonplaceholder.typicode.com";

  let selectedUserId = $state<number | undefined>(undefined);
  const users = $state<{ value: User[] | undefined; loading: boolean }>({
    value: undefined,
    loading: false,
  });
  const posts = $state<{ value: Post[] | undefined; loading: boolean }>({
    value: undefined,
    loading: false,
  });

  $effect(() => {
    users.loading = true;
    const controller = new AbortController();

    fetch(`${urlBase}/users`, { signal: controller.signal })
      .then(async (response) => {
        users.value = await response.json();
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      })
      .finally(() => {
        users.loading = false;
      });

    return () => controller.abort();
  });

  $effect(() => {
    if (selectedUserId === undefined) {
      posts.value = undefined;
      return;
    }
    posts.loading = true;
    const controller = new AbortController();

    fetch(`${urlBase}/posts?userId=${selectedUserId}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        posts.value = await response.json();
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      })
      .finally(() => {
        posts.loading = false;
      });

    return () => controller.abort();
  });
</script>

<h1>Buildless Svelte 5 app</h1>

{#if users.value}
  <label>
    Select User:
    <select bind:value={selectedUserId}>
      <option hidden selected value={undefined}></option>
      {#each users.value as user (user.id)}
        <option value={user.id}>
          @{user.username}: {user.name}
        </option>
      {/each}
    </select>
  </label>
{:else if users.loading}
  <p>Loading Users...</p>
{/if}

{#if posts.value}
  <ul>
    {#each posts.value as post (post.id)}
      <li>{post.title}</li>
    {/each}
  </ul>
{:else if posts.loading}
  <p>Loading Posts...</p>
{:else if users.value}
  <p>Select User to view posts</p>
{/if}

<p>
  Data Source:
  <a href="https://jsonplaceholder.typicode.com/" target="_blank">
    JSONPlaceholder
  </a>
</p>
