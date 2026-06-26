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