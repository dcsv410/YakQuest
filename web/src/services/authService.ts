import { API_URL } from "../config";
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  DeleteAccountRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from "@yakquest/shared";

const AUTH_TOKEN_KEY =
  "yakquest:web:authToken";

const AUTH_USER_KEY =
  "yakquest:web:user";

const AUTH_EVENT_NAME =
  "yakquest-auth-change";

export function notifyAuthChanged() {
  window.dispatchEvent(
    new Event(AUTH_EVENT_NAME)
  );
}

export function listenForAuthChanges(
  callback: () => void
) {
  window.addEventListener(
    AUTH_EVENT_NAME,
    callback
  );

  return () => {
    window.removeEventListener(
      AUTH_EVENT_NAME,
      callback
    );
  };
}

export function getToken() {
  return localStorage.getItem(
    AUTH_TOKEN_KEY
  );
}

export function getStoredUser():
  | AuthUser
  | null {
  const raw = localStorage.getItem(
    AUTH_USER_KEY
  );

  return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
  return !!getToken();
}

function storeAuth(data: AuthResponse) {
  localStorage.setItem(
    AUTH_TOKEN_KEY,
    data.accessToken
  );

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(data.user)
  );

  notifyAuthChanged();
}

async function readApiError(
  response: Response,
  fallback: string
) {
  try {
    const data = await response.json();

    if (
      data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    // Use the fallback below.
  }

  return fallback;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const payload: LoginRequest = {
    email,
    password,
  };

  const response = await fetch(
    `${API_URL}/auth/login`,
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
        "Login failed."
      )
    );
  }

  const data: AuthResponse =
    await response.json();

  storeAuth(data);

  return data;
}

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

  storeAuth(data);

  return data;
}

export async function fetchMe():
  Promise<AuthUser> {
  const token = getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    logout();

    throw new Error(
      await readApiError(
        response,
        "Unable to load account."
      )
    );
  }

  const user = await response.json();

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user)
  );

  return user;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<MessageResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const payload: ChangePasswordRequest = {
    currentPassword,
    newPassword,
  };

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
      body: JSON.stringify(payload),
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

  return response.json();
}

export async function forgotPassword(
  email: string
): Promise<MessageResponse> {
  const payload: ForgotPasswordRequest = {
    email,
  };

  const response = await fetch(
    `${API_URL}/auth/forgot-password`,
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
      "Unable to request a password reset."
    );
  }

  return response.json();
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<MessageResponse> {
  const payload: ResetPasswordRequest = {
    token,
    newPassword,
  };

  const response = await fetch(
    `${API_URL}/auth/reset-password`,
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
        "Unable to reset password."
      )
    );
  }

  return response.json();
}

export async function deleteAccount(
  password: string
): Promise<MessageResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("Not logged in");
  }

  const payload: DeleteAccountRequest = {
    password,
    confirmation: "DELETE",
  };

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
      body: JSON.stringify(payload),
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

  logout();

  return data;
}

export function logout() {
  localStorage.removeItem(
    AUTH_TOKEN_KEY
  );

  localStorage.removeItem(
    AUTH_USER_KEY
  );

  notifyAuthChanged();
}