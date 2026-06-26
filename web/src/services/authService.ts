import { API_URL } from "../config";

const AUTH_TOKEN_KEY = "yakquest:web:authToken";
const AUTH_USER_KEY = "yakquest:web:user";
const AUTH_EVENT_NAME = "yakquest-auth-change";

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function listenForAuthChanges(callback: () => void) {
  window.addEventListener(AUTH_EVENT_NAME, callback);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
  };
}

export type AuthUser = {
  id: string;
  email: string;
  display_name?: string | null;
  is_admin: boolean;
  trust_score: number;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

function storeAuth(data: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  notifyAuthChanged();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  storeAuth(data);
  return data;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      displayName,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  storeAuth(data);
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const token = getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    logout();
    throw new Error(await response.text());
  }

  const user = await response.json();
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();
}