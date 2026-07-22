export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  home_state: string;
  is_admin: boolean;
  trust_score: number;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type UpdateProfileRequest = {
  displayName: string;
  homeState: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type DeleteAccountRequest = {
  password: string;
  confirmation: "DELETE";
};

export type MessageResponse = {
  message: string;
};