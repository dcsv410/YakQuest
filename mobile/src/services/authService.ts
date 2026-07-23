import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from "@yakquest/shared";

export const AUTH_TOKEN_KEY = "yakquest:authToken";
export const AUTH_USER_KEY = "yakquest:user";

async function readApiError(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();

    if (
      data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    // Use fallback.
  }

  return fallback;
}

export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  const payload: RegisterRequest = {
    email,
    password,
  };

  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "Registration failed."
      )
    );
  }

  const data: AuthResponse =
    await response.json();

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

export async function updateProfile(
  displayName: string,
  homeState: string
): Promise<AuthUser> {
  const token = await getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const payload: UpdateProfileRequest = {
    displayName,
    homeState,
  };

  const response = await fetch(
    `${API_URL}/auth/profile`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "Unable to update profile."
      )
    );
  }

  const user: AuthUser =
    await response.json();

  await AsyncStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user)
  );

  return user;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const response = await fetch(
    `${API_URL}/auth/change-password`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "Unable to change password."
      )
    );
  }

  const data = await response.json();

  return data.message;
}


export async function forgotPassword(
  email: string
): Promise<string> {
  const response = await fetch(
    `${API_URL}/auth/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to request a password reset."
    );
  }

  const data = await response.json();

  return data.message;
}


export async function deleteAccount(
  password: string
): Promise<string> {
  const token = await getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const response = await fetch(
    `${API_URL}/auth/account`,
    {
      method: "DELETE",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify({
        password,
        confirmation: "DELETE",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readApiError(
        response,
        "Unable to delete account."
      )
    );
  }

  const data = await response.json();

  await logout();

  return data.message;
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