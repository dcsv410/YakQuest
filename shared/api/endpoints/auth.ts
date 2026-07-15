import type { ApiClient } from "../../network";
import type {
  AuthResponseDTO,
  AuthUserDTO,
  ChangePasswordRequestDTO,
  DeleteAccountRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  MessageResponseDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
} from "../../dto";

export const authApi = {
  login(
    client: ApiClient,
    payload: LoginRequestDTO
  ): Promise<AuthResponseDTO> {
    return client.post<
      AuthResponseDTO,
      LoginRequestDTO
    >("/auth/login", payload);
  },

  register(
    client: ApiClient,
    payload: RegisterRequestDTO
  ): Promise<AuthResponseDTO> {
    return client.post<
      AuthResponseDTO,
      RegisterRequestDTO
    >("/auth/register", payload);
  },

  me(
    client: ApiClient
  ): Promise<AuthUserDTO> {
    return client.get<AuthUserDTO>(
      "/auth/me"
    );
  },

  changePassword(
    client: ApiClient,
    payload: ChangePasswordRequestDTO
  ): Promise<MessageResponseDTO> {
    return client.post<
      MessageResponseDTO,
      ChangePasswordRequestDTO
    >("/auth/change-password", payload);
  },

  forgotPassword(
    client: ApiClient,
    payload: ForgotPasswordRequestDTO
  ): Promise<MessageResponseDTO> {
    return client.post<
      MessageResponseDTO,
      ForgotPasswordRequestDTO
    >("/auth/forgot-password", payload);
  },

  resetPassword(
    client: ApiClient,
    payload: ResetPasswordRequestDTO
  ): Promise<MessageResponseDTO> {
    return client.post<
      MessageResponseDTO,
      ResetPasswordRequestDTO
    >("/auth/reset-password", payload);
  },

  deleteAccount(
    client: ApiClient,
    payload: DeleteAccountRequestDTO
  ): Promise<MessageResponseDTO> {
    return client.deleteWithBody<
      MessageResponseDTO,
      DeleteAccountRequestDTO
    >("/auth/account", payload);
  },
};