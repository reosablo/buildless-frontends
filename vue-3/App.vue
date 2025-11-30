<script setup lang="ts">
import type { Post } from "jsonplaceholder-types/types/post";
import type { User } from "jsonplaceholder-types/types/user";
import { onWatcherCleanup, reactive, ref, watchEffect } from "vue";

const urlBase = "https://jsonplaceholder.typicode.com";

const selectedUserId = ref<number>();
const posts = reactive<{
  value?: Post[];
  loading: boolean;
}>({ loading: false });
const users = reactive<{
  value?: User[];
  loading: boolean;
}>({ loading: false });

async function fetchUsers(signal: AbortSignal) {
  users.loading = true;
  try {
    const response = await fetch(`${urlBase}/users`, { signal });
    const data = await response.json();
    signal.throwIfAborted();
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
    const data = await response.json();
    signal.throwIfAborted();
    posts.value = data;
    posts.loading = false;
  } catch (error) {
    if (signal.aborted) return;
    posts.loading = false;
    throw error;
  }
}

watchEffect(function updateUsers() {
  const ctrl = new AbortController();
  onWatcherCleanup(() => ctrl.abort());
  fetchUsers(ctrl.signal);
});

watchEffect(function updatePosts() {
  if (selectedUserId.value === undefined) return;
  const ctrl = new AbortController();
  onWatcherCleanup(() => ctrl.abort());
  fetchPosts(selectedUserId.value, ctrl.signal);
});
</script>

<template>
  <h1>Buildless Vue 3 app</h1>
  <label v-if="users.value">
    Select User:
    <select v-model.number="selectedUserId">
      <option hidden selected></option>
      <option v-for="user in users.value" :key="user.id" :value="user.id">
        @{{ user.username }}: {{ user.name }}
      </option>
    </select>
  </label>
  <p v-else-if="users.loading">Loading Users...</p>
  <ul v-if="posts.value">
    <li v-for="post in posts.value" :key="post.id">{{ post.title }}</li>
  </ul>
  <p v-else-if="posts.loading">Loading Posts...</p>
  <p v-else-if="users.value">Select User to view posts</p>
  <p>
    Data Source:
    <a href="https://jsonplaceholder.typicode.com/" target="_blank">
      JSONPlaceholder
    </a>
  </p>
</template>
