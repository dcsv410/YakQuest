import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from "@yakquest/shared";

export const AUTH_TOKEN_KEY = "yakquest:authToken";
export const AUTH_USER_KEY = "yakquest:user";

export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const payload: RegisterRequest = {
    email,
    password,
    displayName,
  };
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
  const payload: LoginRequest = {
    email,
    password,
  };
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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