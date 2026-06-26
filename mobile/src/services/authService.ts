import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

export const AUTH_TOKEN_KEY = "yakquest:authToken";
export const AUTH_USER_KEY = "yakquest:user";

export type AuthUser = {
  id: string;
  email: string;
  display_name?: string;
  is_admin: boolean;
  trust_score: number;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

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

  await AsyncStorage.setItem(
    AUTH_TOKEN_KEY,
    data.accessToken
  );

  await AsyncStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(data.user)
  );

  return data;
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
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();

  await AsyncStorage.setItem(
    AUTH_TOKEN_KEY,
    data.accessToken
  );

  await AsyncStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(data.user)
  );

  return data;
}

export async function logout() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(AUTH_USER_KEY);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}