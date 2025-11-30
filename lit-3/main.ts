import type { Post } from "jsonplaceholder-types/types/post";
import type { User } from "jsonplaceholder-types/types/user";
import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("app-root")
export class AppElement extends LitElement {
  static readonly #urlBase = "https://jsonplaceholder.typicode.com";

  @state()
  private accessor _selectedUserId: number | undefined;

  @state()
  private accessor _users: User[] | undefined;
  @state()
  private accessor _loadingUsers = false;

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
    const selectedUserId = this._selectedUserId;
    if (changed.has("_selectedUserId") && selectedUserId !== undefined) {
      this.#fetchPosts(selectedUserId);
    }
  }

  async #fetchUsers() {
    this.#usersController?.abort();
    const ctrl = this.#usersController = new AbortController();

    this._loadingUsers = true;
    try {
      const res = await fetch(
        `${AppElement.#urlBase}/users`,
        { signal: ctrl.signal },
      );
      const users = await res.json() as User[];
      ctrl.signal.throwIfAborted();
      this._users = users;
      this._loadingUsers = false;
    } catch (error) {
      if (ctrl.signal.aborted) return;
      this._loadingUsers = false;
      throw error;
    }
  }

  async #fetchPosts(userId: number) {
    this.#postsController?.abort();
    const ctrl = this.#postsController = new AbortController();

    this._loadingPosts = true;
    try {
      const res = await fetch(
        `${AppElement.#urlBase}/posts?userId=${userId}`,
        { signal: ctrl.signal },
      );
      const posts = await res.json() as Post[];
      ctrl.signal.throwIfAborted();
      this._posts = posts;
      this._loadingPosts = false;
    } catch (error) {
      if (ctrl.signal.aborted) return;
      this._loadingPosts = false;
      throw error;
    }
  }

  override render() {
    return html`
      <h1>Buildless Lit 3 app</h1>
      ${this._users
        ? html`
          <label>
            Select User:
            <select @change="${(
              event: Event & { currentTarget: HTMLSelectElement },
            ) => {
              this._selectedUserId = +event.currentTarget.value;
            }}">
              <option selected hidden></option>
              ${this._users.map((user) =>
                html`
                  <option value="${user.id}">
                    @${user.username}: ${user.name}
                  </option>
                `
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
            ${this._posts.map((post) =>
              html`
                <li>${post.title}</li>
              `
            )}
          </ul>
        `
        : this._loadingPosts
        ? html`
          <p>Loading Posts...</p>
        `
        : this._users !== undefined
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
