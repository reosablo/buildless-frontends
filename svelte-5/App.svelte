<script lang="ts">
  /// <reference types="svelte" />
  import type {
    Post,
    User,
  } from "https://esm.sh/*@untypeable/jsonplaceholder@1.0.2";

  const urlBase = "https://jsonplaceholder.typicode.com";

  let selectedUserId = $state<number | undefined>(undefined);
  const users = $state<{
    value?: User[];
    loading: boolean;
  }>({ loading: false });
  const posts = $state<{
    value?: Post[];
    loading: boolean;
  }>({ loading: false });
  let readmeHTML = $state<string | undefined>(undefined);

  async function fetchUsers(signal: AbortSignal) {
    users.loading = true;
    try {
      const response = await fetch(`${urlBase}/users`, { signal });
      const data = (await response.json()) as User[];
      users.value = data;
      users.loading = false;
    } catch (error) {
      if (signal.aborted) return;
      users.loading = false;
      throw error;
    }
  }

  async function fetchPosts(userId: number, signal: AbortSignal) {
    posts.loading = true;
    try {
      const response = await fetch(`${urlBase}/posts?userId=${userId}`, {
        signal,
      });
      const data = (await response.json()) as Post[];
      posts.value = data;
      posts.loading = false;
    } catch (error) {
      if (signal.aborted) return;
      posts.loading = false;
      throw error;
    }
  }

  async function fetchReadmeHTML(signal: AbortSignal) {
    try {
      const [{ marked }, readmeMarkdown] = await Promise.all([
        import("https://esm.sh/*marked@17.0.0"),
        fetch("./README.md", { signal }).then((res) => res.text()),
      ]);
      readmeHTML = marked(readmeMarkdown);
    } catch (error) {
      if (signal.aborted) return;
      throw error;
    }
  }

  $effect(function updateUsers() {
    const ctrl = new AbortController();
    fetchUsers(ctrl.signal);
    return () => ctrl.abort();
  });

  $effect(function updatePosts() {
    if (selectedUserId === undefined) return;
    const ctrl = new AbortController();
    fetchPosts(selectedUserId, ctrl.signal);
    return () => ctrl.abort();
  });

  $effect(function updateReadmeHTML() {
    const ctrl = new AbortController();
    fetchReadmeHTML(ctrl.signal);
    return () => ctrl.abort();
  });
</script>

<section>{@html readmeHTML}</section>

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
