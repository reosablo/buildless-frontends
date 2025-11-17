import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { User } from "jsonplaceholder-types/types/user";
import type { Post } from "jsonplaceholder-types/types/post";

@customElement("app-root")
export class AppElement extends LitElement {
  static readonly #urlBase = "https://jsonplaceholder.typicode.com";

  @state()
  private accessor _users: User[] | undefined;
  @state()
  private accessor _loadingUsers = false;

  @state()
  private accessor _selectedUserId: number | undefined;

  @state()
  private accessor _posts: Post[] | undefined;
  @state()
  private accessor _loadingPosts = false;

  #usersController?: AbortController;
  #postsController?: AbortController;

  override connectedCallback() {
    super.connectedCallback();
    this.#fetchUsers();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#usersController?.abort();
    this.#postsController?.abort();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has("_selectedUserId")) {
      this.#fetchPosts();
    }
  }

  async #fetchUsers() {
    this._loadingUsers = true;
    this.#usersController?.abort();
    this.#usersController = new AbortController();
    try {
      const res = await fetch(
        `${AppElement.#urlBase}/users`,
        { signal: this.#usersController.signal },
      );
      this._users = await res.json();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
    } finally {
      this._loadingUsers = false;
    }
  }

  async #fetchPosts() {
    if (this._selectedUserId === undefined) {
      this._posts = undefined;
      return;
    }
    this._loadingPosts = true;
    this.#postsController?.abort();
    this.#postsController = new AbortController();
    try {
      const res = await fetch(
        `${AppElement.#urlBase}/posts?userId=${this._selectedUserId}`,
        { signal: this.#postsController.signal },
      );
      this._posts = await res.json();
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        throw err;
      }
    } finally {
      this._loadingPosts = false;
    }
  }

  #onUserChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value;
    this._selectedUserId = value ? Number(value) : undefined;
  }

  override render() {
    return html`
      <h1>Buildless Lit 3 app</h1>
      ${this._users
        ? html`
          <label>
            Select User:
            <select @change="${this.#onUserChange}">
              <option ?selected="${this._selectedUserId ===
                undefined}" hidden></option>
              ${this._users.map(
                (user) =>
                  html`
                    <option
                      value="${user.id}"
                      ?selected="${user.id === this._selectedUserId}"
                    >
                      @${user.username}: ${user.name}
                    </option>
                  `,
              )}
            </select>
          </label>
        `
        : this._loadingUsers
        ? html`
          <p>Loading Users...</p>
        `
        : null} ${this._posts
        ? html`
          <ul>
            ${this._posts.map(
              (post) =>
                html`
                  <li>${post.title}</li>
                `,
            )}
          </ul>
        `
        : this._loadingPosts
        ? html`
          <p>Loading Posts...</p>
        `
        : this._users
        ? html`
          <p>Select User to view posts</p>
        `
        : null}
      <p>
        Data Source:
        <a href="https://jsonplaceholder.typicode.com/" target="_blank">
          JSONPlaceholder
        </a>
      </p>
    `;
  }
}
