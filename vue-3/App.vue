<script setup lang="ts">
import { onWatcherCleanup, ref, reactive, watchEffect } from "vue";

const urlBase = "https://jsonplaceholder.typicode.com";

const selectedUserId = ref();
const users = reactive({ value: undefined, loading: false });
const posts = reactive({ value: undefined, loading: false });

watchEffect(function fetchUsers() {
  users.loading = true;
  const controller = new AbortController();
  onWatcherCleanup(() => controller.abort());

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
});

watchEffect(function fetchPosts() {
  if (selectedUserId.value === undefined) return;
  posts.loading = true;
  const controller = new AbortController();
  onWatcherCleanup(() => controller.abort());

  fetch(`${urlBase}/posts?userId=${selectedUserId.value}`, {
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
